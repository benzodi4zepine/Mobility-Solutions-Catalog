import { Router, type IRouter } from "express";
import { db, referralsTable } from "@workspace/db";
import { sendReferralEmail } from "../lib/mailer";
import {
  CreateReferralBody,
  CreateReferralResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/referrals", async (req, res) => {
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