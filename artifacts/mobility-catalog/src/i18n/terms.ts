/**
 * Arabic for the short clinical labels — the sub-category each solution sits in
 * and the tags on its card.
 *
 * These are single words and phrases rather than prose, so they live here as a
 * lookup instead of a field on every record: they repeat across the catalog,
 * and a filter chip has to read the same on a card, on a detail page and in the
 * filter list. Anything not listed falls through unchanged, which is what
 * should happen for a product or brand name such as RevoFit or BEBIONIC.
 */
const TERMS: Record<string, string> = {
  // Clinical areas
  'Lower limb': 'الطرف السفلي',
  'Upper limb': 'الطرف العلوي',
  'Socket technology': 'تقنيات الحاضنة',
  'Spinal & trunk': 'العمود الفقري والجذع',
  'Foot orthotics': 'أجهزة القدم',

  // Tags
  Microprocessor: 'معالج دقيق',
  'Above knee': 'فوق الركبة',
  'Below knee': 'تحت الركبة',
  Adaptive: 'متكيّف',
  'Energy return': 'ارتداد الطاقة',
  Carbon: 'كربون',
  Suspension: 'تعليق',
  Myoelectric: 'كهربائي عضلي',
  Bionic: 'إلكتروني',
  Mechanical: 'ميكانيكي',
  Cosmetic: 'تجميلي',
  Custom: 'حسب القياس',
  Scoliosis: 'الجنف',
  'Post-surgical': 'ما بعد الجراحة',
  Gait: 'المشية',
  Thermoplastic: 'بلاستيك حراري',
  Articulated: 'مفصلي',
  Alignment: 'المحاذاة',
  Stability: 'الثبات',
  'Knee joints': 'مفاصل الركبة',
  'Pelvic section': 'جزء حوضي',
  'Pressure care': 'العناية بالضغط',
  Comfort: 'الراحة',
  'Diabetic care': 'العناية بالسكري',
  Offloading: 'تخفيف الضغط',
  Protection: 'الحماية',
  // AFO, DAFO, KAFO, HKAFO, RevoFit, RevoLock and BOA are left as they are:
  // the clinic and its referrers use the Latin abbreviations in both languages.
};

/** The Arabic for a clinical label, or the label itself when there is none. */
export function termArabic(label: string): string {
  return TERMS[label] ?? label;
}
