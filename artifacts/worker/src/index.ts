import {
  allSolutions,
  catalogCategory,
  catalogOverview,
  clinicLocations,
} from "@workspace/catalog";
import {
  GetCatalogCategoryResponse,
  GetCatalogOverviewResponse,
  GetLocationsResponse,
  GetSolutionsResponse,
} from "@workspace/api-zod";
import { handleReferral } from "./referrals";

/**
 * The whole site, as one Worker.
 *
 * Cloudflare serves the built client from the `ASSETS` binding and calls this
 * only for what the assets do not cover, so the page and the API share an
 * origin - which is what lets the referral form POST to a relative /api path
 * with no CORS involved at all.
 */
export type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  DB: D1Database;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  REFERRAL_INBOX?: string;
  MAIL_API_URL?: string;
  RATE_LIMIT_SALT?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * Let the edge hold the catalog rather than re-running this, but only just.
 *
 * The page's JavaScript is content-hashed and replaced the moment a deploy
 * lands; this JSON is not, so for as long as a client may serve a stale copy
 * the two can disagree. They did: a 24-hour stale-while-revalidate window had
 * browsers pairing the new bundle with a day-old catalog, drawing cards for
 * solutions that no longer existed and a "photo pending" placeholder for every
 * image key the new bundle had never heard of.
 *
 * So the window is now minutes, not a day. The catalog is a few kilobytes and
 * the worker is cheap; a deploy being visibly wrong is not.
 */
const CATALOG_CACHE = "public, max-age=60, stale-while-revalidate=60";

const cached = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": CATALOG_CACHE },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (request.method === "POST" && path === "/api/referrals") {
      return handleReferral(request, env);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      if (path === "/api/healthz") return json({ status: "ok" });

      if (path === "/api/catalog/overview") {
        return cached(GetCatalogOverviewResponse.parse(catalogOverview()));
      }

      if (path === "/api/catalog/solutions") {
        return cached(GetSolutionsResponse.parse(allSolutions()));
      }

      if (path === "/api/locations") {
        return cached(GetLocationsResponse.parse(clinicLocations()));
      }

      const category = path.match(/^\/api\/catalog\/categories\/([^/]+)$/);
      if (category) {
        const data = catalogCategory(decodeURIComponent(category[1]));
        if (!data) return json({ error: "Category not found" }, 404);
        return cached(GetCatalogCategoryResponse.parse(data));
      }
    }

    return json({ error: "Not found" }, 404);
  },
};
