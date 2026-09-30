import { type Transporter } from "nodemailer";
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
 *
 * Note on what `true` means: it means the relay accepted the message, which is
 * as much as SMTP can tell us. A message the relay accepts can still be
 * rejected or spam-filed later by the receiving side — see the MAIL_FROM
 * warning below, which is the usual cause.
 */
let cached: Transporter | null | undefined;

/**
 * Environment variables set to an empty string are treated as unset. A blank
 * value in a hosting dashboard is easy to create and otherwise produces a
 * confusing failure: an empty REFERRAL_INBOX sends to nobody, and an empty
 * SMTP_PORT becomes port 0, which silently falls back to 587.
 */
function env(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value.trim() === "" ? undefined : value.trim();
}

/**
 * nodemailer is kept out of the bundle (see build.mjs), so it is resolved at
 * runtime. Importing it lazily means a deploy that ships the bundle without it
 * loses email only - with a top-level import the whole site fails to boot, and
 * a catalog nobody can read is a far worse outcome than a referral form that
 * falls back to WhatsApp.
 */
async function buildTransport(): Promise<Transporter | null> {
  const url = env("SMTP_URL");
  const host = env("SMTP_HOST");
  if (!url && !host) return null;

  const nodemailer = (await import("nodemailer")).default;

  // A stalled relay must not hold a referral open: nodemailer's own socket
  // default is ten minutes, long enough that the visitor gives up first.
  const timeouts = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

  if (url) return nodemailer.createTransport(url, timeouts);
  if (!host) return null;

  const port = Number(env("SMTP_PORT") ?? 587);
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  if (user && !pass) {
    logger.warn("SMTP_USER is set but SMTP_PASS is not; connecting unauthenticated, which most relays refuse");
  }
  return nodemailer.createTransport({
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
    ...timeouts,
  });
}

async function getTransport(): Promise<Transporter | null> {
  if (cached === undefined) {
    try {
      cached = await buildTransport();
    } catch (err) {
      // A malformed SMTP_URL throws here. Cache the failure so every later
      // referral takes the honest undelivered path instead of erroring.
      cached = null;
      logger.error({ err }, "SMTP configuration is invalid; referrals will not be emailed");
      return null;
    }
    if (!cached) {
      logger.warn(
        "SMTP is not configured (set SMTP_URL or SMTP_HOST); referrals will be recorded but not emailed",
      );
    } else if (!env("MAIL_FROM")) {
      logger.warn(
        "MAIL_FROM is not set, so referrals are sent from the same address they are sent to. " +
          "Unless the relay is authorised for that domain this fails SPF/DKIM and the mail is " +
          "spam-filed or bounced after the relay has already accepted it. Set MAIL_FROM to an " +
          "address the relay is allowed to send as.",
      );
    }
  }
  return cached;
}

export function referralInbox(): string {
  return env("REFERRAL_INBOX") ?? "info@mafazmedical.com";
}

export type Attachment = { filename: string; content: string };

export async function sendReferralEmail(
  subject: string,
  text: string,
  replyTo?: string,
  attachments?: Attachment[],
): Promise<boolean> {
  let transport: Transporter | null;
  try {
    transport = await getTransport();
  } catch (err) {
    logger.error({ err }, "Referral email could not be sent");
    return false;
  }
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: env("MAIL_FROM") ?? referralInbox(),
      to: referralInbox(),
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
      ...(attachments && attachments.length
        ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content, encoding: "base64" })) }
        : {}),
    });
    return true;
  } catch (err) {
    logger.error({ err }, "Referral email could not be sent");
    return false;
  }
}
