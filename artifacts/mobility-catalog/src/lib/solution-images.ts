/**
 * Resolves a solution's photography from `attached_assets/solutions/`.
 *
 * Photos are discovered at build time by filename, so adding one needs no code
 * change: drop a file named after the solution's `imageKey` into that folder
 * and it appears on the site.
 *
 *   smart-knee.jpg                       one photo
 *   smart-knee-1.jpg, smart-knee-2.jpg   several, shown in filename order
 *
 * The first image is used on cards and as the detail page's main image; any
 * others become a thumbnail gallery. A solution with no matching file falls
 * back to a placeholder labelled "photo pending", so the layout holds and the
 * gap stays visible.
 *
 * `imageKey` values in use: smart-knee, carbon-foot, socket, bionic-hand,
 * digital-scan, passive-limb, spinal-brace, carbon-afo, kafo, insole,
 * diabetic-care.
 */
const files = import.meta.glob<string>(
  '../../../../attached_assets/solutions/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, import: 'default' },
);

const registry = new Map<string, string[]>();

for (const path of Object.keys(files).sort()) {
  const filename = path.split('/').pop() ?? '';
  // "smart-knee-2.jpg" and "smart-knee.jpg" both belong to "smart-knee"
  const imageKey = filename.replace(/\.[^.]+$/, '').replace(/-\d+$/, '');
  const existing = registry.get(imageKey);
  if (existing) existing.push(files[path]);
  else registry.set(imageKey, [files[path]]);
}

/** Every image for a solution, in filename order. Empty when none is supplied. */
export function resolveSolutionImages(imageKey: string): string[] {
  return registry.get(imageKey) ?? [];
}

/** The single image used on cards and previews. */
export function resolveSolutionImage(imageKey: string): string | null {
  return resolveSolutionImages(imageKey)[0] ?? null;
}
