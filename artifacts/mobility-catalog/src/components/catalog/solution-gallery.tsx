import { useState } from 'react';
import { resolveSolutionImages } from '@/lib/solution-images';
import { useLanguage } from '@/i18n/language';
import { SolutionImage } from './solution-image';

/**
 * Main product image with a thumbnail strip when a solution has more than one
 * photograph. Falls back to the shared placeholder when none are supplied.
 */
export function SolutionGallery({ imageKey, title }: { imageKey: string; title: string }) {
  const { t } = useLanguage();
  const images = resolveSolutionImages(imageKey);
  const [active, setActive] = useState(0);

  if (images.length === 0) return <SolutionImage imageKey={imageKey} title={title} large />;

  return <div data-testid={`gallery-${imageKey}`}>
    <img src={images[Math.min(active, images.length - 1)]} alt={images.length > 1 ? t(`${title} — view ${active + 1} of ${images.length}`, `${title} — صورة ${active + 1} من ${images.length}`) : title}
      width={1000} height={1000} className="aspect-square w-full rounded-[1.4rem] bg-[hsl(var(--muted)/.4)] object-contain" data-testid={`image-product-${imageKey}`} />
    {images.length > 1 && <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label={t('Product images', 'صور المنتج')}>
      {images.map((src, index) => <button key={src} type="button" onClick={() => setActive(index)} aria-current={index === active}
        data-testid={`thumb-${imageKey}-${index}`}
        className={`size-20 overflow-hidden rounded-xl border-2 bg-[hsl(var(--muted)/.4)] transition ${index === active ? 'border-[hsl(var(--secondary))]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--secondary)/.5)]'}`}>
        <img src={src} alt={t(`Show view ${index + 1}`, `اعرض الصورة ${index + 1}`)} width={160} height={160} loading="lazy" className="size-full object-contain" />
      </button>)}
    </div>}
  </div>;
}
