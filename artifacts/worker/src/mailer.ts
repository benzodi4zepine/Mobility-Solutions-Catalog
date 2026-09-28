/**
 * Sends referrals to the clinic over an HTTP email API.
 *
 * Workers run in V8 isolates with no raw TCP sockets, and SMTP needs one for
 * its handshake, so nodemailer cannot run here at all - this is not a
 * configuration difference from the Express server, it is the reason this file
 * exists. Resend is spoken over plain HTTPS, which a Worker can do.
 *
 *   RESEND_API_KEY   secret; with none set, sending is skipped and reported
 *   MAIL_FROM        the address to send AS - must be a domain verified with
 *                    Resend, which is why it is mafazmobilitysolutions.com and
 *                    not the clinic's own mailbox
 *   REFERRAL_INBOX   where referrals are delivered
 *
 * `true` means Resend accepted the message. That is as much as any mail API can
 * tell us; delivery to the inbox happens afterwards and out of our sight.
 */
export type MailEnv = {
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  REFERRAL_INBOX?: string;
  /**
   * Where to POST the message. Defaults to Resend and should stay unset in
   * production; it exists so the mail path can be pointed at a local sink and
   * the exact request the clinic's relay will receive can be inspected, rather
   * than assumed. This path has failed silently before - it is worth being able
   * to look at it.
   */
  MAIL_API_URL?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Empty strings are treated as unset; a blank dashboard field is easy to make. */
function env(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value.trim();
}

export function referralInbox(e: MailEnv): string {
  return env(e.REFERRAL_INBOX) ?? "info@mafazmedical.com";
}

export async function sendReferralEmail(
  e: MailEnv,
  subject: string,
  text: string,
  replyTo?: string,
): Promise<{ delivered: boolean; reason?: string }> {
  const key = env(e.RESEND_API_KEY);
  if (!key) return { delivered: false, reason: "no-api-key" };

  const from = env(e.MAIL_FROM);
  if (!from) return { delivered: false, reason: "no-mail-from" };

  try {
    const response = await fetch(env(e.MAIL_API_URL) ?? RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [referralInbox(e)],
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      // A hanging mail API must not hold the referrer's request open; the page
      // falls back to WhatsApp far sooner than they would wait.
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) return { delivered: true };
    // The body can name the cause (an unverified domain, a bad key). Keep it
    // short and out of the visitor's view - it is for the clinic's logs.
    return { delivered: false, reason: `resend-${response.status}` };
  } catch (err) {
    return { delivered: false, reason: err instanceof Error ? err.name : "send-failed" };
  }
}
