#!/usr/bin/env node
/**
 * Writes sitemap.xml, points robots.txt at it, and makes the share tags in the
 * built index.html absolute.
 *
 * All three need the site's own origin: a sitemap must list absolute URLs, and
 * WhatsApp, Facebook and X all refuse a relative og:image, which is why the
 * link preview shows no logo until this runs. So the origin comes from
 * SITE_URL, and with nothing set this exits quietly rather than baking in a
 * guess that would be wrong everywhere.
 *
 *   SITE_URL=https://mafazmedical.com node scripts/generate-sitemap.mjs
 *
 * Run it after the client build, against dist/public. The route list mirrors
 * the router in App.tsx; the per-solution pages are read from the catalog the
 * API serves, so adding a solution adds its page here with no edit.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const dist = path.resolve(repoRoot, 'artifacts/mobility-catalog/dist/public');

const raw = process.env['SITE_URL']?.trim();
if (!raw) {
  console.log('SITE_URL is not set — skipping sitemap.xml and the absolute share tags.');
  console.log('Set it to the live origin (e.g. SITE_URL=https://mafazmedical.com) and run this again.');
  process.exit(0);
}

let origin;
try {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('not http(s)');
  origin = url.origin;
} catch {
  console.error(`SITE_URL is not a usable URL: ${raw}`);
  process.exit(1);
}

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error(`No build found at ${dist} — run the client build first.`);
  process.exit(1);
}

/** Static routes, in the order the router declares them. */
const staticRoutes = ['/', '/catalog', '/referral', '/contact'];

// Read the catalog straight from the server's route module rather than a second
// copy, so the sitemap cannot drift from what the site actually serves.
const catalogSource = await readFile(
  path.resolve(repoRoot, 'artifacts/api-server/src/routes/catalog.ts'),
  'utf8',
);
const categorySlugs = [...catalogSource.matchAll(/slug:\s*"([a-z-]+)"/g)].map(m => m[1]);
const solutionIds = [...catalogSource.matchAll(/^\s{4}id:\s*"([a-z0-9-]+)",$/gm)].map(m => m[1]);

if (!categorySlugs.length || !solutionIds.length) {
  console.error('Could not read categories or solutions out of catalog.ts — not writing a partial sitemap.');
  process.exit(1);
}

// Every solution's detail page lives under its category, so pair them up the
// way the API does: prosthetics first, then orthotics.
const categoryOf = new Map();
for (const slug of categorySlugs) {
  const block = catalogSource.split(`${slug === 'prosthetics' ? 'prostheticSolutions' : 'orthoticSolutions'} = [`)[1];
  if (!block) continue;
  for (const m of block.split('\n];')[0].matchAll(/^\s{4}id:\s*"([a-z0-9-]+)",$/gm)) categoryOf.set(m[1], slug);
}

const routes = [
  ...staticRoutes,
  ...categorySlugs.map(slug => `/catalog/${slug}`),
  ...solutionIds.filter(id => categoryOf.has(id)).map(id => `/catalog/${categoryOf.get(id)}/${id}`),
];

const today = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(route => [
    '  <url>',
    `    <loc>${origin}${route}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    // The home page and the catalog are the entry points; detail pages matter
    // less to a crawler's budget than they do to a visitor who is already here.
    `    <priority>${route === '/' ? '1.0' : route.split('/').length > 3 ? '0.6' : '0.8'}</priority>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n');

await writeFile(path.join(dist, 'sitemap.xml'), sitemap);

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
await writeFile(path.join(dist, 'robots.txt'), robots);

// Relative share tags resolve against the crawler, not the site, so rewrite
// them; og:url and the canonical link can only be written once the origin is
// known, which is here.
const indexPath = path.join(dist, 'index.html');
let html = await readFile(indexPath, 'utf8');
html = html.replaceAll('content="/og-share.jpg"', `content="${origin}/og-share.jpg"`);
if (!html.includes('property="og:url"')) {
  html = html.replace(
    '<meta property="og:type" content="website" />',
    `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${origin}/" />\n    <link rel="canonical" href="${origin}/" />`,
  );
}
await writeFile(indexPath, html);

console.log(`Wrote sitemap.xml with ${routes.length} URLs, robots.txt, and absolute share tags for ${origin}`);
