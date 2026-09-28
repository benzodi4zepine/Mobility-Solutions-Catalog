import type { RequestHandler } from "express";

/**
 * A small fixed-window limiter for endpoints with a real-world cost.
 *
 * The referral endpoint sends an email to the clinic, so without a limit
 * anyone can loop requests and flood the inbox. Counters live in memory, so a
 * horizontally scaled deployment limits per instance rather than globally -
 * enough to stop casual abuse, and no infrastructure to run. Swap in a shared
 * store if the deployment ever needs a hard global ceiling.
 */
export function rateLimit({
  windowMs,
  max,
  message,
}: {
  windowMs: number;
  max: number;
  message: string;
}): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const now = Date.now();

    // Opportunistic sweep so the map cannot grow without bound.
    if (hits.size > 5000) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }

    // Deliberately not req.ip. With `trust proxy` set to one hop, Express reads
    // the entry to the LEFT of the one our own proxy appended, and that entry is
    // whatever the caller sent - so rotating a fake X-Forwarded-For gives an
    // unlimited number of buckets and the inbox can still be flooded. The last
    // entry is the address our proxy actually saw, which a caller cannot forge.
    const forwarded = req.headers["x-forwarded-for"];
    const chain = Array.isArray(forwarded) ? forwarded.join(",") : forwarded;
    const lastHop = chain?.split(",").pop()?.trim();
    const key = lastHop || req.socket.remoteAddress || req.ip || "unknown";
    const entry = hits.get(key);

    if (entry && entry.resetAt > now && entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      req.log?.warn({ ip: key }, "Rate limit reached");
      res.status(429).json({ error: message });
      return;
    }

    // Count the request only once it is answered, and only when the answer says
    // the work was done. A referrer who mistypes and gets a 400 has cost the
    // clinic nothing, and locking them out of their own correction is how a
    // single typo turns into a lost referral. Whole clinics also share one
    // egress address, so every wasted slot is shared too.
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      const current = hits.get(key);
      if (!current || current.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
      else current.count += 1;
    });

    next();
  };
}
