import { Router, type IRouter } from "express";
import { db, referralsTable } from "@workspace/db";
import { sendReferralEmail } from "../lib/mailer";
import { rateLimit } from "../lib/rate-limit";
import {
  CreateReferralBody,
  CreateReferralResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Only accepted referrals count, so this is ten real submissions rather than
// ten attempts. A busy clinic sending several at once stays under it; a script
// looping on the inbox does not.
const referralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    "Too many referrals from this connection. Please wait a few minutes, or call the clinic.",
});

router.post("/referrals", referralLimiter, async (req, res) => {
  // Bots fill every field they find; a real person never sees this one.
  //
  // But a password manager or form-filling extension can reach it, so this must
  // never report delivery: a person who trips the trap is told plainly that it
  // was not sent and is given the WhatsApp and copy fallbacks, exactly as if
  // the mail relay were down. A bot gets a 201 and goes away either way.
  if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
    req.log.warn("Referral rejected: honeypot filled");
    res.status(201).json({
      id: `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: "received",
      message:
        "We could not put this through automatically. Please send it on WhatsApp, or copy it below and email the clinic.",
      receivedAt: new Date().toISOString(),
      delivered: false,
    });
    return;
  }

  const parsed = CreateReferralBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Please check the referral details and try again." });
    return;
  }

  const id = `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const receivedAt = new Date();
  const referral = parsed.data;

  // Record it, but a database problem must never cost the clinic a referral -
  // delivery below is what actually reaches a person. Whether the write landed
  // decides what we are entitled to tell the referrer afterwards.
  let stored = false;
  try {
    await db.insert(referralsTable).values({ id, ...referral, createdAt: receivedAt });
    stored = true;
  } catch (err) {
    // Only the reason, never the error object: a failed insert carries the
    // patient's name, phone and clinical notes in its message and parameters,
    // and those belong in the clinic's records, not in platform logs.
    req.log.error(
      { referralId: id, reason: err instanceof Error ? err.message.slice(0, 200) : "unknown" },
      "Referral could not be stored",
    );
  }

  const lines = [
    `Referral ${id} via the Mafaz website`,
    "",
    `Referrer: ${referral.referrerName}`,
    `Organization: ${referral.organization}`,
    `Phone: ${referral.phone}`,
    referral.email ? `Email: ${referral.email}` : null,
    `Preferred contact: ${referral.preferredContact}`,
    "",
    `Patient: ${referral.patientName}`,
    referral.patientAge ? `Age: ${referral.patientAge}` : null,
    `Area of need: ${referral.areaOfNeed}`,
    "",
    `Notes: ${referral.clinicalNotes}`,
    "",
    `Received: ${receivedAt.toISOString()}`,
    // Drop only the omitted optional fields. filter(Boolean) would take the ""
    // spacers with them and the clinic would read one dense block.
  ].filter(line => line !== null);

  // Only a well-formed address becomes the Reply-To. Anything else would be
  // dropped or mangled by the mail library, costing the clinic the one-click
  // reply without saying so; the address is in the body either way.
  const replyTo =
    referral.email && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(referral.email) ? referral.email : undefined;

  const delivered = await sendReferralEmail(
    `New referral ${id} - ${referral.patientName}`,
    lines.join("\n"),
    replyTo,
  );

  req.log.info({ referralId: id, delivered, stored }, "Referral received");

  // Say only what is true. When the email went out the clinic has it. When it
  // did not but the write landed, there is at least a record to recover. When
  // neither worked, the referrer's own copy is the only one that exists, and
  // they need to be told that rather than reassured.
  const message = delivered
    ? "Referral sent to the clinical team. They will be in touch shortly."
    : stored
      ? "Referral recorded. Please also send it on WhatsApp so the team sees it right away."
      : "We could not deliver or record this referral. Please send it on WhatsApp, or copy it below and email the clinic.";

  res.status(201).json(
    CreateReferralResponse.parse({
      id,
      status: delivered ? "sent" : "received",
      message,
      receivedAt,
      delivered,
    }),
  );
});

export default router;