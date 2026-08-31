import { Link } from 'wouter';
import { useLanguage } from '@/i18n/language';

export type Crumb = { label: string; href?: string };

/** Trail of ancestors for catalog pages. Separator mirrors in RTL via the flex direction. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = useLanguage();
  return <nav aria-label={t('Breadcrumb', 'مسار التنقل')} className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]" data-testid="breadcrumbs">
    {items.map((item, i) => <span key={`${item.label}-${i}`} className="flex items-center gap-2">
      {i > 0 && <span aria-hidden="true" className="opacity-45">/</span>}
      {item.href
        ? <Link href={item.href} className="transition-colors hover:text-[hsl(var(--secondary))]">{item.label}</Link>
        : <span className="font-semibold text-[hsl(var(--foreground))]" aria-current="page">{item.label}</span>}
    </span>)}
  </nav>;
}
