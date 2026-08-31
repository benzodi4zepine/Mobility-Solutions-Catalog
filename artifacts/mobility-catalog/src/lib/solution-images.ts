/**
 * Maps a solution's `imageKey` to its photography.
 *
 * The first image is used on cards and as the detail page's main image; any
 * further images appear as a gallery beneath it. Anything not listed falls back
 * to a styled placeholder, so the layout never collapses and a missing photo
 * reads as pending rather than broken.
 *
 * To add photos: drop the files in `attached_assets/solutions/`, import them
 * here, and list them under the solution's imageKey. For example:
 *
 *   import smartKnee1 from '@assets/solutions/smart-knee-1.jpg';
 *   import smartKnee2 from '@assets/solutions/smart-knee-2.jpg';
 *   const registry = { 'smart-knee': [smartKnee1, smartKnee2] };
 *
 * Known keys: smart-knee, carbon-foot, socket, bionic-hand, digital-scan,
 * passive-limb, spinal-brace, carbon-afo, kafo, insole, diabetic-care.
 */
const registry: Partial<Record<string, string[]>> = {
  // Awaiting photography from the clinic.
};

/** Every image for a solution, in display order. Empty when none is supplied. */
export function resolveSolutionImages(imageKey: string): string[] {
  return registry[imageKey] ?? [];
}

/** The single image used on cards and previews. */
export function resolveSolutionImage(imageKey: string): string | null {
  return resolveSolutionImages(imageKey)[0] ?? null;
}
