/**
 * Checks an uploaded photograph before it is attached to an email.
 *
 * The browser re-encodes whatever the sender picked into a small JPEG before
 * it is sent, which keeps the payload sane and strips EXIF along the way. But
 * anyone can post to this endpoint directly without going near the form, so
 * none of that can be assumed here: this looks at the actual bytes rather than
 * at anything the caller claims about them.
 */

/** Roughly 2MB decoded, which a re-encoded phone photo comes nowhere near. */
const MAX_BYTES = 2_000_000;

export type PhotoCheck =
  | { ok: true; base64: string; bytes: number }
  | { ok: false; reason: string };

export function checkPhoto(value: unknown): PhotoCheck {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, reason: "empty" };
  }

  // A data-URI prefix is accepted and dropped rather than rejected; it is the
  // shape a browser hands you and an easy thing to send by accident.
  const base64 = value.replace(/^data:image\/[a-z+]+;base64,/, "").trim();

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { ok: false, reason: "not-base64" };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(Buffer.from(base64, "base64"));
  } catch {
    return { ok: false, reason: "undecodable" };
  }

  if (bytes.length > MAX_BYTES) return { ok: false, reason: "too-large" };
  if (bytes.length < 128) return { ok: false, reason: "too-small" };

  // JPEG magic number: FF D8 FF. The form only ever produces JPEG, so anything
  // else did not come from the form and is not attached to a clinic's email.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    return { ok: false, reason: "not-a-jpeg" };
  }

  return { ok: true, base64, bytes: bytes.length };
}
