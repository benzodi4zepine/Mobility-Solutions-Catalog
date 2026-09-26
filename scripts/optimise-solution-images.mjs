#!/usr/bin/env node
/**
 * Re-encodes solution photography to a sensible delivery size.
 *
 * The detail page shows an image at roughly 660px, so 1400px covers a 2x
 * display with room to spare; anything beyond that is bytes a visitor pays for
 * and never sees. Files already smaller than the target are left alone, and a
 * re-encode is only kept when it actually saves space.
 *
 * Usage: node scripts/optimise-solution-images.mjs [maxEdge] [quality]
 */
import { readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const MAX_EDGE = Number(process.argv[2] ?? 1400);
const QUALITY = Number(process.argv[3] ?? 0.85);
const dir = path.resolve(import.meta.dirname, '..', 'attached_assets', 'solutions');

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const files = [];
for await (const entry of glob('*.{jpg,jpeg,png,webp}', { cwd: dir })) files.push(entry);
files.sort();

const browser = await chromium.launch();
const page = await browser.newPage();

for (const file of files) {
  const source = path.join(dir, file);
  const ext = path.extname(file).toLowerCase();
  const before = (await stat(source)).size;
  const dataUri = `data:${MIME[ext]};base64,${(await readFile(source)).toString('base64')}`;

  const result = await page.evaluate(async ({ dataUri, MAX_EDGE, QUALITY }) => {
    const img = new Image();
    img.src = dataUri;
    await img.decode();
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    // product shots arrive on white; keep that rather than letting it go transparent
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', QUALITY));
    const buf = new Uint8Array(await blob.arrayBuffer());
    return { w, h, ow: img.naturalWidth, oh: img.naturalHeight, bytes: Array.from(buf) };
  }, { dataUri, MAX_EDGE, QUALITY });

  const out = Buffer.from(result.bytes);
  const target = path.join(dir, `${path.basename(file, ext)}.webp`);
  const saved = before - out.length;

  if (saved <= 0) {
    console.log(`  ${file}  ${result.ow}x${result.oh}  ${(before / 1024).toFixed(0)} KB — already lean, left alone`);
    continue;
  }
  await writeFile(target, out);
  if (target !== source) await unlink(source);
  console.log(`  ${file} -> ${path.basename(target)}  ${result.ow}x${result.oh} -> ${result.w}x${result.h}  ${(before / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB  (-${Math.round((saved / before) * 100)}%)`);
}

await browser.close();
