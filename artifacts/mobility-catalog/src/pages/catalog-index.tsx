import { useGetSolutions, getGetSolutionsQueryKey } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/language';
import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { SolutionExplorer } from '@/components/catalog/solution-explorer';

/** The whole catalog in one place, searchable and filterable. */
export function CatalogIndexBody() {
  const { t } = useLanguage();
  const query = useGetSolutions({ query: { queryKey: getGetSolutionsQueryKey(), staleTime: 300000 } });

  return <main className="page-in mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20">
    <Breadcrumbs items={[{ label: t('Home', 'الرئيسية'), href: '/' }, { label: t('Catalog', 'الكتالوج') }]} />
    <header className="grid items-end gap-8 border-b border-[hsl(var(--border))] pb-12 md:grid-cols-[1fr_1fr]">
      <div>
        <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--secondary))]"><span className="h-px w-7 bg-[hsl(var(--accent))]" />{t('Every solution', 'كل الحلول')}</div>
        <h1 className="font-serif text-6xl leading-[.9] tracking-[-.04em] md:text-7xl">{t('The full catalog.', 'الكتالوج الكامل.')}</h1>
      </div>
      <p className="max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">{t('Search by device or need, then narrow by clinical area and feature. Every result links to the full detail page.', 'ابحث حسب الجهاز أو الحاجة، ثم ضيّق النتائج حسب المجال السريري والخصائص. كل نتيجة تقودك إلى صفحة التفاصيل الكاملة.')}</p>
    </header>
    <section className="py-12">
      {query.isLoading
        ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-80 rounded-[1.5rem]" />)}</div>
        : query.isError
          ? <div className="rounded-2xl border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.08)] p-8 text-center" data-testid="error-state"><p className="font-serif text-2xl">{t('The clinical line paused.', 'توقف الخط السريري مؤقتاً.')}</p><button type="button" onClick={() => query.refetch()} className="mt-5 rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-retry">{t('Try again', 'حاول مرة أخرى')}</button></div>
          : <SolutionExplorer solutions={query.data ?? []} basePath="/catalog" />}
    </section>
  </main>;
}
