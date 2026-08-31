/**
 * Maps a solution's `imageKey` to a real photograph.
 *
 * To add a product photo: drop the file in `attached_assets/solutions/`, import
 * it here, and add it to the registry under the solution's imageKey. Anything
 * not listed falls back to a styled placeholder, so the layout never collapses
 * and a missing photo is obvious rather than broken.
 *
 * Known keys: smart-knee, carbon-foot, socket, bionic-hand, digital-scan,
 * passive-limb, spinal-brace, carbon-afo, kafo, insole, diabetic-care.
 *
 * Example:
 *   import smartKnee from '@assets/solutions/smart-knee.jpg';
 *   const registry = { 'smart-knee': smartKnee };
 */
const registry: Partial<Record<string, string>> = {
  // Awaiting photography from the clinic.
};

export function resolveSolutionImage(imageKey: string): string | null {
  return registry[imageKey] ?? null;
}
