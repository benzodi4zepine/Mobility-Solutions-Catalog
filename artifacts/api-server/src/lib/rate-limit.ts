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

    const key = req.ip ?? "unknown";
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      req.log?.warn({ ip: key }, "Rate limit reached");
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}
