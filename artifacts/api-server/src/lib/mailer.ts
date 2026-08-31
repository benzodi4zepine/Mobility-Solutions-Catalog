import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

/**
 * Sends referrals to the clinic by email.
 *
 * Configured entirely from the environment so no address or credential lives
 * in the repository:
 *
 *   SMTP_URL         smtps://user:pass@smtp.example.com:465   (simplest)
 *   or SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 *   REFERRAL_INBOX   where referrals are delivered
 *   MAIL_FROM        envelope sender, defaults to the inbox address
 *
 * With nothing configured, sending is skipped and reported as undelivered, so
 * the site can steer the referrer to WhatsApp rather than silently losing a
 * referral.
 */
let cached: Transporter | null | undefined;

function buildTransport(): Transporter | null {
  const url = process.env["SMTP_URL"];
  if (url) return nodemailer.createTransport(url);

  const host = process.env["SMTP_HOST"];
  if (!host) return null;

  const port = Number(process.env["SMTP_PORT"] ?? 587);
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

function getTransport(): Transporter | null {
  if (cached === undefined) {
    cached = buildTransport();
    if (!cached) {
      logger.warn(
        "SMTP is not configured (set SMTP_URL or SMTP_HOST); referrals will be recorded but not emailed",
      );
    }
  }
  return cached;
}

export function referralInbox(): string {
  return process.env["REFERRAL_INBOX"] ?? "info@mafazmedical.com";
}

export async function sendReferralEmail(
  subject: string,
  text: string,
  replyTo?: string,
): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: process.env["MAIL_FROM"] ?? referralInbox(),
      to: referralInbox(),
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (err) {
    logger.error({ err }, "Referral email could not be sent");
    return false;
  }
}
