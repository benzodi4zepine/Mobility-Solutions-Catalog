#!/usr/bin/env node
/**
 * Builds a single self-contained HTML preview of the mobility catalog.
 *
 * The Vite bundle, the stylesheet and every referenced asset are inlined into
 * one file, and the API calls the app makes at runtime are answered from a
 * snapshot captured off a running API server. The result is a static page that
 * behaves like the real app without needing the API server or a database.
 *
 * Usage:
 *   1. start the API server (PORT=5000)
 *   2. BASE_PATH=/ PORT=5173 pnpm --filter @workspace/mobility-catalog run build
 *   3. node scripts/build-preview.mjs [outFile] [apiBase]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const distDir = path.join(repoRoot, 'artifacts/mobility-catalog/dist/public');
const outFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(distDir, 'preview.html');
const apiBase = process.argv[3] ?? 'http://127.0.0.1:5000/api';

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** Endpoints the app calls on load, keyed by the path the client requests. */
const SNAPSHOT_PATHS = [
  '/healthz',
  '/catalog/overview',
  '/catalog/categories/prosthetics',
  '/catalog/categories/orthotics',
  '/catalog/solutions',
  '/locations',
];

async function captureSnapshot() {
  const snapshot = {};
  for (const p of SNAPSHOT_PATHS) {
    const res = await fetch(`${apiBase}${p}`);
    if (!res.ok) throw new Error(`GET ${apiBase}${p} → ${res.status}`);
    snapshot[`/api${p}`] = await res.json();
  }
  return snapshot;
}

async function inlineAssets(code) {
  const assetsDir = path.join(distDir, 'assets');
  const files = await readdir(assetsDir);
  let out = code;
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const mime = MIME[ext];
    if (!mime) continue;
    const data = await readFile(path.join(assetsDir, file));
    const dataUri = `data:${mime};base64,${data.toString('base64')}`;
    out = out.split(`/assets/${file}`).join(dataUri);
  }
  return out;
}

const html = await readFile(path.join(distDir, 'index.html'), 'utf8');
const cssHref = html.match(/href="([^"]*\/assets\/[^"]+\.css)"/)?.[1];
const jsSrc = html.match(/src="([^"]*\/assets\/[^"]+\.js)"/)?.[1];
if (!cssHref || !jsSrc) throw new Error('Could not find built CSS/JS in index.html');

const distPath = (href) => path.join(distDir, href.replace(/^\/+/, ''));
const css = await inlineAssets(await readFile(distPath(cssHref), 'utf8'));
const js = await inlineAssets(await readFile(distPath(jsSrc), 'utf8'));
const snapshot = await captureSnapshot();

const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Mafaz Mobility Catalog';
const fontLinks = [...html.matchAll(/<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>/g)]
  .map((m) => m[0])
  .join('\n    ');

// Static hosting has no API server behind it, so answer the app's own calls
// from the snapshot and acknowledge referral submissions locally.
const shim = `
(() => {
  // The app routes on pathname; a static host may serve this page from a
  // sub-path, so normalise to the root the router expects before it boots.
  if (location.protocol !== 'file:' && location.pathname !== '/') {
    try { history.replaceState(null, '', '/' + location.search + location.hash); } catch {}
  }
  const snapshot = ${JSON.stringify(snapshot)};
  const json = (body, status) => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const pathname = url.startsWith('/') ? url.split('?')[0] : (() => {
      try { return new URL(url, location.href).pathname; } catch { return url; }
    })();
    if (!pathname.startsWith('/api/')) return realFetch(input, init);
    if (method === 'POST' && pathname === '/api/referrals') {
      const id = 'REF-' + Math.abs(Date.now() % 0xffffffff).toString(16).toUpperCase().padStart(8, '0');
      return Promise.resolve(json({
        id,
        status: 'received',
        message: 'Preview mode — this referral was not sent.',
        receivedAt: new Date().toISOString(),
        delivered: false,
      }, 201));
    }
    if (pathname in snapshot) return Promise.resolve(json(snapshot[pathname], 200));
    return Promise.resolve(json({ error: 'Not available in the static preview.' }, 404));
  };
})();
`;

const escape = (code) => code.replaceAll('</script', '<\\/script');

// The artifact host supplies a document skeleton, but this file is also opened
// directly from disk — without a charset the Arabic content renders as mojibake.
const page = `<meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    ${fontLinks}
    <style>${css}</style>
    <div id="root"></div>
    <script>${escape(shim)}</script>
    <script type="module">${escape(js)}</script>
`;

await writeFile(outFile, page, 'utf8');
console.log(`Wrote ${outFile} (${(Buffer.byteLength(page) / 1024).toFixed(0)} KB)`);
