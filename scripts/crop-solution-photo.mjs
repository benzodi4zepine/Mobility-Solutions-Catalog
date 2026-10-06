/**
 * Auto-crops a product shot to its subject and encodes it to WebP.
  * Usage: node scripts/crop-solution-photo.mjs <src> <out> [aspectW:aspectH] [maxEdge] [quality]
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

// --keep-alpha leaves a cut-out's transparency alone instead of flattening it
// onto the backdrop, so the card's own background shows through and follows
// the light and dark themes. Detection still runs on a white-flattened copy.
const argv = process.argv.slice(2);
const keepAlpha = argv.includes('--keep-alpha');
const [src, out, aspect = '4:5', maxEdge = '1400', quality = '0.85'] = argv.filter((a) => !a.startsWith('--'));
const [aw, ah] = aspect.split(':').map(Number);

const browser = await chromium.launch();
const page = await browser.newPage();
// Infer the type from the extension rather than claiming JPEG for everything:
// a mislabelled data URI is at the mercy of the browser's content sniffing,
// which is not a thing to leave a build depending on.
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };
const ext = path.extname(src).toLowerCase();
const mime = MIME[ext];
if (!mime) {
  console.error(`Unsupported input type "${ext}" for ${src}`);
  process.exit(1);
}
const dataUri = `data:${mime};base64,${(await readFile(src)).toString('base64')}`;

const result = await page.evaluate(async ({ dataUri, aw, ah, maxEdge, quality, keepAlpha }) => {
  const img = new Image();
  img.src = dataUri;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;

  const probe = document.createElement('canvas');
  probe.width = W; probe.height = H;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  // Flatten onto white first. A transparent pixel reads as rgb(0,0,0), so a
  // cut-out PNG or WebP would otherwise have its backdrop sampled as black -
  // filling the frame black and, worse, counting every transparent pixel as
  // subject because it is darker than the backdrop. Compositing first makes a
  // cut-out behave exactly like the same product shot on a white sweep.
  pctx.fillStyle = '#ffffff';
  pctx.fillRect(0, 0, W, H);
  pctx.drawImage(img, 0, 0);
  const { data } = pctx.getImageData(0, 0, W, H);

  // The backdrop is a soft neutral grey; the device is saturated colour with
  // black strapping. Neutral-vs-saturated separates them far more reliably
  // than distance from a sampled background tone, which the backdrop's own
  // gradient defeats.
  // Average a small patch at each corner rather than a single pixel, so one
  // noisy pixel cannot define the backdrop.
  const cornerRgb = (cx0, cy0) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = cy0; y < cy0 + 8; y++) {
      for (let x = cx0; x < cx0 + 8; x++) {
        const i = (y * W + x) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
    }
    return [r / n, g / n, b / n];
  };
  const corners = [cornerRgb(2, 2), cornerRgb(W - 11, 2), cornerRgb(2, H - 11), cornerRgb(W - 11, H - 11)];
  const bgRgb = corners
    .reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0])
    .map((v) => Math.round(v / corners.length));
  const bgLum = (bgRgb[0] + bgRgb[1] + bgRgb[2]) / 3;

  // a column/row counts as subject only once enough of it qualifies, so dust
  // and sensor noise cannot drag the box out to the frame edge
  const colMin = Math.max(4, Math.round(H * 0.004));
  const rowMin = Math.max(4, Math.round(W * 0.004));
  const findBox = (satMin, lumDrop) => {
    const cols = new Int32Array(W), rows = new Int32Array(H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        const lum = (r + g + b) / 3;
        if (sat > satMin || lum < bgLum - lumDrop) { cols[x]++; rows[y]++; }
      }
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let x = 0; x < W; x++) if (cols[x] >= colMin) { if (x < x0) x0 = x; x1 = x; }
    for (let y = 0; y < H; y++) if (rows[y] >= rowMin) { if (y < y0) y0 = y; y1 = y; }
    return [x0, y0, x1, y1];
  };

  // The strict pass: neutral-vs-saturated, which separates a coloured device
  // from a grey sweep far better than distance from a sampled tone.
  let [minX, minY, maxX, maxY] = findBox(28, 55);
  // But a pale translucent liner on a white sweep is neither saturated nor
  // dark, and the strict pass finds only the printing on its side - cropping
  // the ends of the device clean off. When the box it returns is too small to
  // be the product the photograph is of, fall back to a pass that keys on any
  // departure from the backdrop at all. The column and row minimums still
  // keep dust and noise out of it.
  const area = (maxX - minX + 1) * (maxY - minY + 1);
  if (!(area > 0) || area < W * H * 0.12) {
    const [gx0, gy0, gx1, gy1] = findBox(10, 8);
    const gentle = (gx1 - gx0 + 1) * (gy1 - gy0 + 1);
    if (gx1 > gx0 && gy1 > gy0 && gentle > area) [minX, minY, maxX, maxY] = [gx0, gy0, gx1, gy1];
  }

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

  // Growing the short side can run the window off the photo, which leaves a
  // band of flat backdrop down one edge. Taking a smaller window that still
  // fits is better: it is all real photograph, and the subject only loses the
  // breathing room the 7% pad added. Shrink to fit, keeping the aspect, and
  // slide back inside the frame. Only when the subject itself is wider or
  // taller than the window does this give up and let the fill show.
  const shrink = Math.min(1, W / bw, H / bh);
  if (shrink < 1) {
    const fw = bw * shrink, fh = bh * shrink;
    const fx = Math.min(Math.max(cx - fw / 2, 0), W - fw);
    const fy = Math.min(Math.max(cy - fh / 2, 0), H - fh);
    const holdsSubject = fx <= minX && fy <= minY && fx + fw >= maxX + 1 && fy + fh >= maxY + 1;
    if (holdsSubject) { x0 = fx; y0 = fy; bw = fw; bh = fh; }
  }

  const scale = Math.min(1, maxEdge / Math.max(bw, bh));
  const cw = Math.round(bw * scale), ch = Math.round(bh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  // Fill with the photo's own backdrop, not pure white. A tall narrow shot
  // cannot reach 4:5 without the crop running off the sides, and white padding
  // against a studio backdrop that is a shade warmer leaves a visible seam down
  // the edge of the card. A cut-out kept transparent gets no fill at all.
  if (!keepAlpha) {
    ctx.fillStyle = `rgb(${bgRgb[0]}, ${bgRgb[1]}, ${bgRgb[2]})`;
    ctx.fillRect(0, 0, cw, ch);
  }
  ctx.drawImage(img, x0, y0, bw, bh, 0, 0, cw, ch);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
  const buf = new Uint8Array(await blob.arrayBuffer());
  return { W, H, subject: [minX, minY, maxX, maxY], cw, ch, bytes: Array.from(buf) };
}, { dataUri, aw, ah, maxEdge: Number(maxEdge), quality: Number(quality), keepAlpha });

if (result.error) { console.error(src, result.error); process.exit(1); }
await writeFile(out, Buffer.from(result.bytes));
console.log(`${src} ${result.W}x${result.H} subject=[${result.subject}] -> ${out} ${result.cw}x${result.ch} ${(result.bytes.length / 1024).toFixed(0)} KB`);
await browser.close();
