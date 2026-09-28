/**
 * Auto-crops a product shot to its subject and encodes it to WebP.
  * Usage: node scripts/crop-solution-photo.mjs <src> <out> [aspectW:aspectH] [maxEdge] [quality]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const [src, out, aspect = '4:5', maxEdge = '1400', quality = '0.85'] = process.argv.slice(2);
const [aw, ah] = aspect.split(':').map(Number);

const browser = await chromium.launch();
const page = await browser.newPage();
const dataUri = `data:image/jpeg;base64,${(await readFile(src)).toString('base64')}`;

const result = await page.evaluate(async ({ dataUri, aw, ah, maxEdge, quality }) => {
  const img = new Image();
  img.src = dataUri;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;

  const probe = document.createElement('canvas');
  probe.width = W; probe.height = H;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  pctx.drawImage(img, 0, 0);
  const { data } = pctx.getImageData(0, 0, W, H);

  // The backdrop is a soft neutral grey; the device is saturated colour with
  // black strapping. Neutral-vs-saturated separates them far more reliably
  // than distance from a sampled background tone, which the backdrop's own
  // gradient defeats.
  const corner = (x, y) => { const i = (y * W + x) * 4; return (data[i] + data[i + 1] + data[i + 2]) / 3; };
  const bgLum = (corner(2, 2) + corner(W - 3, 2) + corner(2, H - 3) + corner(W - 3, H - 3)) / 4;

  const cols = new Int32Array(W), rows = new Int32Array(H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = (r + g + b) / 3;
      if (sat > 28 || lum < bgLum - 55) { cols[x]++; rows[y]++; }
    }
  }
  // a column/row counts as subject only once enough of it qualifies, so dust
  // and sensor noise cannot drag the box out to the frame edge
  const colMin = Math.max(4, Math.round(H * 0.004));
  const rowMin = Math.max(4, Math.round(W * 0.004));
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let x = 0; x < W; x++) if (cols[x] >= colMin) { if (x < minX) minX = x; maxX = x; }
  for (let y = 0; y < H; y++) if (rows[y] >= rowMin) { if (y < minY) minY = y; maxY = y; }

  let bw = maxX - minX + 1, bh = maxY - minY + 1;
  const pad = Math.round(Math.max(bw, bh) * 0.07);
  let x0 = minX - pad, y0 = minY - pad, x1 = maxX + pad, y1 = maxY + pad;
  bw = x1 - x0; bh = y1 - y0;

  // grow the short side to the requested aspect, around the subject's centre
  const want = aw / ah;
  const have = bw / bh;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (have < want) { const nw = bh * want; x0 = cx - nw / 2; x1 = cx + nw / 2; bw = nw; }
  else { const nh = bw / want; y0 = cy - nh / 2; y1 = cy + nh / 2; bh = nh; }

  const scale = Math.min(1, maxEdge / Math.max(bw, bh));
  const cw = Math.round(bw * scale), ch = Math.round(bh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';       // any part of the crop that falls outside the photo stays white
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, x0, y0, bw, bh, 0, 0, cw, ch);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
  const buf = new Uint8Array(await blob.arrayBuffer());
  return { W, H, subject: [minX, minY, maxX, maxY], cw, ch, bytes: Array.from(buf) };
}, { dataUri, aw, ah, maxEdge: Number(maxEdge), quality: Number(quality) });

if (result.error) { console.error(src, result.error); process.exit(1); }
await writeFile(out, Buffer.from(result.bytes));
console.log(`${src} ${result.W}x${result.H} subject=[${result.subject}] -> ${out} ${result.cw}x${result.ch} ${(result.bytes.length / 1024).toFixed(0)} KB`);
await browser.close();
