import { Router, type IRouter } from "express";
import { db, referralsTable } from "@workspace/db";
import { sendReferralEmail } from "../lib/mailer";
import { rateLimit } from "../lib/rate-limit";
import {
  CreateReferralBody,
  CreateReferralResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const referralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    "Too many referrals from this connection. Please wait a few minutes, or call the clinic.",
});

router.post("/referrals", referralLimiter, async (req, res) => {
  // Bots fill every field they find; a real person never sees this one.
  if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
    req.log.warn("Referral rejected: honeypot filled");
    res.status(201).json({
      id: "REF-00000000",
      status: "received",
      message: "Referral received.",
      receivedAt: new Date().toISOString(),
      delivered: true,
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
  // delivery below is what actually reaches a person.
  try {
    await db.insert(referralsTable).values({ id, ...referral, createdAt: receivedAt });
  } catch (err) {
    req.log.error({ err, referralId: id }, "Referral could not be stored");
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
  ].filter(Boolean);

  const delivered = await sendReferralEmail(
    `New referral ${id} - ${referral.patientName}`,
    lines.join("\n"),
    referral.email,
  );

  req.log.info({ referralId: id, delivered }, "Referral received");

  res.status(201).json(
    CreateReferralResponse.parse({
      id,
      status: delivered ? "sent" : "received",
      message: delivered
        ? "Referral sent to the clinical team. They will be in touch shortly."
        : "Referral recorded. Please also send it on WhatsApp so the team sees it right away.",
      receivedAt,
      delivered,
    }),
  );
});

export default router;