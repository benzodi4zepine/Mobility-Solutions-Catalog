import { resolveSolutionImage } from '@/lib/solution-images';
import { useLanguage } from '@/i18n/language';

/**
 * A solution's photograph, or a styled placeholder when the clinic has not
 * supplied one yet. The placeholder is deliberately labelled so a missing
 * photo reads as pending rather than as the finished design.
 */
export function SolutionImage({ imageKey, title, accent = 'teal', large = false }: { imageKey: string; title: string; accent?: string; large?: boolean }) {
  const { t } = useLanguage();
  const src = resolveSolutionImage(imageKey);
  const sizing = large ? 'min-h-[340px]' : 'min-h-[185px]';

  if (src) {
    return <img src={src} alt={title} loading="lazy" width={800} height={600} className={`w-full rounded-[1.4rem] object-cover ${large ? 'aspect-[16/10]' : 'aspect-[4/3]'}`} data-testid={`image-product-${imageKey}`} />;
  }

  return <div className={`product-art product-art-${accent} relative overflow-hidden rounded-[1.4rem] ${sizing}`} data-testid={`image-product-${imageKey}`} role="img" aria-label={t(`Photograph pending for ${title}`, `الصورة قيد الإعداد لـ ${title}`)}>
    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 25% 20%, hsl(var(--card)/.8) 0 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
    <div className="absolute -right-8 -top-12 size-44 rounded-full border border-[hsl(var(--card)/.3)]" /><div className="absolute -right-1 -top-5 size-24 rounded-full border border-[hsl(var(--card)/.3)]" />
    <div className="absolute bottom-8 left-[21%] h-[76%] w-[28%] -rotate-[13deg] rounded-[55%_45%_35%_45%] border-[10px] border-[hsl(var(--card)/.85)] bg-[hsl(var(--foreground)/.2)] shadow-2xl" />
    <div className="absolute bottom-[10%] right-[20%] h-[12%] w-[40%] -rotate-[8deg] rounded-[45%] bg-[hsl(var(--card)/.88)]" />
    <div className="absolute bottom-[18%] left-[43%] size-4 rounded-full bg-[hsl(var(--accent))] shadow-[0_0_0_5px_hsl(var(--card)/.2)]" />
    <span className="absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-[.2em] text-[hsl(var(--card)/.72)]">{t('photo pending', 'صورة قيد الإعداد')}</span>
  </div>;
}
