import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { CreateReferralBody, CreateReferralResponse } from "@workspace/api-zod";
import { referralsTable, rateLimitTable } from "./schema";
import { sendReferralEmail, type MailEnv } from "./mailer";
import type { Env } from "./index";

const WINDOW_MS = 15 * 60 * 1000;
/** Accepted referrals only, so a referrer who mistypes is never locked out. */
const MAX_PER_WINDOW = 10;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const newId = () => `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

/**
 * A salted hash of the caller's address.
 *
 * On Workers the address comes from CF-Connecting-IP, which Cloudflare sets and
 * overwrites on every request - unlike X-Forwarded-For behind a Node proxy, a
 * caller cannot forge it to get themselves a fresh quota. Hashing keeps the
 * counter working while leaving no record of who visited.
 */
async function callerKey(request: Request, salt: string): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${ip}`),
  );
  return [...new Uint8Array(digest)].slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function handleReferral(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Please check the referral details and try again." }, 400);
  }

  const db = drizzle(env.DB);

  // Bots fill every field they find; a real person never sees this one. But a
  // password manager can reach it, so this must never report delivery: a person
  // who trips it is told plainly it was not sent and gets the WhatsApp and copy
  // fallbacks, exactly as if the mail API were down.
  const trap = (body as { website?: unknown })?.website;
  if (typeof trap === "string" && trap.trim() !== "") {
    return json({
      id: newId(),
      status: "received",
      message:
        "We could not put this through automatically. Please send it on WhatsApp, or copy it below and email the clinic.",
      receivedAt: new Date().toISOString(),
      delivered: false,
    }, 201);
  }

  const parsed = CreateReferralBody.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Please check the referral details and try again." }, 400);
  }

  const key = await callerKey(request, env.RATE_LIMIT_SALT ?? "mafaz");
  const now = Date.now();

  const existing = await db.select().from(rateLimitTable)
    .where(eq(rateLimitTable.key, key)).limit(1);
  const entry = existing[0];
  if (entry && entry.resetAt > now && entry.count >= MAX_PER_WINDOW) {
    return new Response(JSON.stringify({
      error:
        "Too many referrals from this connection. Please wait a few minutes, or call the clinic.",
    }), {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.ceil((entry.resetAt - now) / 1000)),
      },
    });
  }

  const id = newId();
  const receivedAt = new Date();
  const referral = parsed.data;

  // Record it, but a database problem must never cost the clinic a referral -
  // delivery below is what actually reaches a person. Whether the write landed
  // decides what we are entitled to tell the referrer afterwards.
  let stored = false;
  try {
    await db.insert(referralsTable).values({
      id,
      referrerName: referral.referrerName,
      organization: referral.organization,
      phone: referral.phone,
      email: referral.email ?? null,
      patientName: referral.patientName,
      patientAge: referral.patientAge ?? null,
      areaOfNeed: referral.areaOfNeed,
      clinicalNotes: referral.clinicalNotes,
      preferredContact: referral.preferredContact,
      createdAt: receivedAt.toISOString(),
    });
    stored = true;
  } catch (err) {
    // Only the reason, never the error object: a failed insert carries the
    // patient's name, phone and clinical notes in its message and parameters.
    console.error("referral not stored", id, err instanceof Error ? err.name : "unknown");
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
  ].filter((line) => line !== null);

  // Only a well-formed address becomes the Reply-To; anything else would cost
  // the clinic its one-click reply without saying so.
  const replyTo =
    referral.email && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(referral.email)
      ? referral.email
      : undefined;

  const { delivered, reason } = await sendReferralEmail(
    env as MailEnv,
    `New referral ${id} - ${referral.patientName}`,
    lines.join("\n"),
    replyTo,
  );
  if (!delivered) console.error("referral not emailed", id, reason ?? "unknown");

  // Count it only now, and only because it was accepted.
  try {
    if (entry && entry.resetAt > now) {
      await db.update(rateLimitTable)
        .set({ count: entry.count + 1 })
        .where(eq(rateLimitTable.key, key));
    } else {
      await db.insert(rateLimitTable)
        .values({ key, count: 1, resetAt: now + WINDOW_MS })
        .onConflictDoUpdate({
          target: rateLimitTable.key,
          set: { count: 1, resetAt: now + WINDOW_MS },
        });
    }
  } catch (err) {
    // A counter that cannot be written is not worth failing a referral over.
    console.error("rate limit not recorded", err instanceof Error ? err.name : "unknown");
  }

  // Say only what is true. When the email went out the clinic has it. When it
  // did not but the write landed, there is at least a record to recover. When
  // neither worked, the referrer's own copy is the only one that exists.
  const message = delivered
    ? "Referral sent to the clinical team. They will be in touch shortly."
    : stored
      ? "Referral recorded. Please also send it on WhatsApp so the team sees it right away."
      : "We could not deliver or record this referral. Please send it on WhatsApp, or copy it below and email the clinic.";

  return json(CreateReferralResponse.parse({
    id,
    status: delivered ? "sent" : "received",
    message,
    receivedAt,
    delivered,
  }), 201);
}
