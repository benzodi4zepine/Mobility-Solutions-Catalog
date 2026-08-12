import { Router, type IRouter } from "express";
import { db, referralsTable } from "@workspace/db";
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

  await db.insert(referralsTable).values({
    id,
    ...parsed.data,
    createdAt: receivedAt,
  });

  req.log.info({ referralId: id }, "Referral received");

  res.status(201).json(
    CreateReferralResponse.parse({
      id,
      status: "received",
      message: "Referral received. Our clinical team will be in touch shortly.",
      receivedAt,
    }),
  );
});

export default router;