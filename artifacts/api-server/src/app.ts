import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
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
app.use(cors());
app.use(express.json());
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

export default app;
