#!/usr/bin/env node
/**
 * Generates the favicon, the home-screen icon and the social share card from
 * the Mafaz logo, so the three of them stay in step with the brand.
 *
 * The logo carries a vertical "MaFaZ Co. Ltd." wordmark down its right edge,
 * which turns to mush below about 64px, so the icons crop to the figure group.
 * The share card shows the logo whole, at close to its native size.
 *
 * Usage: node scripts/generate-brand-assets.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const assets = path.join(repoRoot, 'attached_assets');
const publicDir = path.join(repoRoot, 'artifacts/mobility-catalog/public');

const LOGO_W = 334, LOGO_H = 314;
const FIGURES_W = 262; // logo minus the vertical wordmark

const dataUri = async (file, mime) =>
  `data:${mime};base64,${(await readFile(file)).toString('base64')}`;

const logo = await dataUri(path.join(assets, 'mafaz-logo.png'), 'image/png');

/** The logo with its vertical wordmark cropped away, scaled to a given height. */
const figures = (height) => {
  const scale = height / LOGO_H;
  return `<div style="width:${FIGURES_W * scale}px;height:${height}px;overflow:hidden">
    <img src="${logo}" style="width:${LOGO_W * scale}px;height:${height}px;display:block">
  </div>`;
};

const page = (w, h, body, bg = 'transparent') => `<!doctype html><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;background:${bg};overflow:hidden}
  body{display:flex;font-family:'DejaVu Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
</style>${body}`;

const CREAM = 'hsl(45 24% 96%)';
const INK = 'hsl(240 3% 25%)';
const BLUE = 'hsl(204 100% 38%)';

const browser = await chromium.launch();

async function shoot(html, { width, height, out, type = 'png', omitBackground = false, quality }) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.waitForTimeout(150);
  await p.screenshot({ path: out, type, omitBackground, ...(quality ? { quality } : {}) });
  await p.close();
  console.log(`  ${path.basename(out)}  ${width}x${height}`);
}

// --- favicon: transparent, cropped to the figures, edge-to-edge for legibility
await shoot(
  page(64, 64, `<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center">${figures(60)}</div>`),
  { width: 64, height: 64, out: path.join(publicDir, 'favicon-64.png'), omitBackground: true },
);
await shoot(
  page(32, 32, `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center">${figures(30)}</div>`),
  { width: 32, height: 32, out: path.join(publicDir, 'favicon-32.png'), omitBackground: true },
);

// --- home-screen icon: iOS composites transparency onto black, so paint a ground
await shoot(
  page(180, 180, `<div style="width:180px;height:180px;background:${CREAM};display:flex;align-items:center;justify-content:center">${figures(136)}</div>`),
  { width: 180, height: 180, out: path.join(publicDir, 'apple-touch-icon.png') },
);

// --- share card: the logo itself, which is what a shared link should show
const share = page(1200, 630, `
<div style="width:1200px;height:630px;background:${CREAM};display:flex;align-items:center;justify-content:center">
  <img src="${logo}" style="height:340px;width:auto;display:block">
</div>`);
await shoot(share, { width: 1200, height: 630, out: path.join(publicDir, 'og-share.jpg'), type: 'jpeg', quality: 90 });

await browser.close();
console.log('Brand assets written to artifacts/mobility-catalog/public/');
