import { existsSync } from "node:fs";
import path from "node:path";
import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ["GET", "POST"],
  }),
);

// Rate limiting keys on the client address, which is only meaningful when the
// proxy in front of the app is trusted.
app.set("trust proxy", 1);
// The enquiry form can carry a photograph, which the browser shrinks to a few
// hundred KB before sending. The 100KB default rejected those outright, so the
// picture never reached the mailer. 4MB leaves room for the 2MB ceiling the
// photo check enforces, once base64 has added its third.
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

/**
 * Serve the built website from the same origin as the API.
 *
 * Without this the server answers /api and nothing else, so a deployment has
 * no page to serve and, worse, the page it is served from elsewhere cannot
 * reach /api at all - referrals fail before the mailer is ever consulted.
 *
 * Set CLIENT_DIST to override where the build is read from.
 */
const clientDist =
  process.env["CLIENT_DIST"] ??
  path.resolve(import.meta.dirname, "../../mobility-catalog/dist/public");

if (existsSync(path.join(clientDist, "index.html"))) {
  // Asset filenames carry a content hash, so they can be cached hard.
  app.use(
    "/assets",
    express.static(path.join(clientDist, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(express.static(clientDist, { index: false, maxAge: "1h" }));

  // Client-side routes such as /catalog/prosthetics have no file of their own,
  // so anything that is not an API call falls through to the app shell. A
  // missing /api route must still 404 rather than return HTML.
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"), {
      headers: { "Cache-Control": "no-cache" },
    });
  });

  logger.info({ clientDist }, "Serving the built site alongside the API");
} else {
  logger.warn(
    { clientDist },
    "No client build found; serving the API only. Run the mobility-catalog build first.",
  );
}

// Errors that escape a route must still answer JSON on the API, and must not
// leak internals to the client.
app.use(((err, req, res, _next) => {
  req.log?.error({ err }, "Unhandled error");
  if (res.headersSent) return;
  // A body that is too large is the client's to fix, and saying so is more use
  // than a blanket 500 - that is how an oversized photograph looked like the
  // server falling over.
  const status = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode;
  if (status === 413) {
    res.status(413).json({ error: "That attachment is too large. Please send a smaller picture." });
    return;
  }
  res.status(500).json({ error: "Something went wrong. Please try again." });
}) satisfies ErrorRequestHandler);

export default app;
