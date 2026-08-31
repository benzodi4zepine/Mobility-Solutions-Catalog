import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ArrowUpRight, Search, X } from 'lucide-react';
import type { Solution } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/language';
import { SolutionImage } from './solution-image';

/** Everything a visitor typed or picked, mirrored in the URL so results are shareable. */
type Filters = { q: string; categories: string[]; tags: string[] };

function readFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  return { q: params.get('q') ?? '', categories: params.getAll('cat'), tags: params.getAll('tag') };
}

function writeFilters(basePath: string, filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  filters.categories.forEach(value => params.append('cat', value));
  filters.tags.forEach(value => params.append('tag', value));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function matches(solution: Solution, needle: string): boolean {
  if (!needle) return true;
  const haystack = [solution.title, solution.titleArabic, solution.description, solution.descriptionArabic ?? '', solution.category, ...solution.tags].join(' ').toLowerCase();
  return haystack.includes(needle);
}

function Chip({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: React.ReactNode; testId: string }) {
  return <button type="button" onClick={onClick} aria-pressed={active} data-testid={testId}
    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${active ? 'border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]'}`}>
    {children}
  </button>;
}

/**
 * Search and faceted filtering over a set of solutions. Used both for the whole
 * catalog and for a single category, so the two behave identically.
 */
export function SolutionExplorer({ solutions, basePath }: { solutions: Solution[]; basePath: string }) {
  const { t } = useLanguage();
  const search = useSearch();
  const [, navigate] = useLocation();
  const filters = useMemo(() => readFilters(search), [search]);
  const [draft, setDraft] = useState(filters.q);

  // Keep the box in step when the URL changes from outside (back button, a cleared pill).
  useEffect(() => { setDraft(filters.q); }, [filters.q]);

  // Debounce typing so a search does not push a history entry per keystroke.
  useEffect(() => {
    if (draft === filters.q) return;
    const timer = setTimeout(() => navigate(writeFilters(basePath, { ...filters, q: draft }), { replace: true }), 250);
    return () => clearTimeout(timer);
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (next: Partial<Filters>) => navigate(writeFilters(basePath, { ...filters, ...next }), { replace: true });
  const toggle = (key: 'categories' | 'tags', value: string) => {
    const current = filters[key];
    apply({ [key]: current.includes(value) ? current.filter(item => item !== value) : [...current, value] } as Partial<Filters>);
  };

  const allCategories = useMemo(() => [...new Set(solutions.map(s => s.category))].sort(), [solutions]);
  const allTags = useMemo(() => [...new Set(solutions.flatMap(s => s.tags))].sort(), [solutions]);
  const needle = filters.q.trim().toLowerCase();
  const results = useMemo(() => solutions.filter(s =>
    (!filters.categories.length || filters.categories.includes(s.category)) &&
    (!filters.tags.length || s.tags.some(tag => filters.tags.includes(tag))) &&
    matches(s, needle)
  ), [solutions, filters.categories, filters.tags, needle]);

  const activePills = [
    ...filters.categories.map(value => ({ key: `cat:${value}`, label: value, clear: () => toggle('categories', value) })),
    ...filters.tags.map(value => ({ key: `tag:${value}`, label: value, clear: () => toggle('tags', value) })),
  ];
  const hasFilters = activePills.length > 0 || Boolean(needle);

  return <div>
    <div className="flex flex-col gap-5 rounded-[1.4rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)] p-5 sm:p-6">
      <label className="relative block">
        <span className="sr-only">{t('Search solutions', 'ابحث في الحلول')}</span>
        <Search size={16} className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] start-4" aria-hidden="true" />
        <input value={draft} onChange={event => setDraft(event.target.value)} type="search" data-testid="input-catalog-search"
          placeholder={t('Search by device, need, or tag…', 'ابحث حسب الجهاز أو الحاجة أو الوسم…')}
          className="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:border-[hsl(var(--secondary))] focus:ring-2 focus:ring-[hsl(var(--secondary)/.12)] ps-11 pe-4" />
      </label>
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--secondary))]">{t('Clinical area', 'المجال السريري')}</p>
        <div className="flex flex-wrap gap-2">{allCategories.map(category => <Chip key={category} active={filters.categories.includes(category)} onClick={() => toggle('categories', category)} testId={`filter-category-${category}`}>{category}</Chip>)}</div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--secondary))]">{t('Features', 'الخصائص')}</p>
        <div className="flex flex-wrap gap-2">{allTags.map(tag => <Chip key={tag} active={filters.tags.includes(tag)} onClick={() => toggle('tags', tag)} testId={`filter-tag-${tag}`}>{tag}</Chip>)}</div>
      </div>
    </div>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[hsl(var(--muted-foreground))]" data-testid="text-result-count" aria-live="polite">
        {t(`Showing ${results.length} of ${solutions.length}`, `عرض ${results.length} من ${solutions.length}`)}
      </p>
      {hasFilters && <div className="flex flex-wrap items-center gap-2">
        {activePills.map(pill => <button key={pill.key} type="button" onClick={pill.clear} data-testid={`pill-clear-${pill.label}`}
          className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--accent)/.18)]">
          {pill.label}<X size={12} aria-hidden="true" /><span className="sr-only">{t('Remove filter', 'إزالة عامل التصفية')}</span>
        </button>)}
        <button type="button" onClick={() => navigate(basePath, { replace: true })} data-testid="button-clear-filters" className="text-[11px] font-bold text-[hsl(var(--secondary))] underline-offset-4 hover:underline">{t('Clear all', 'مسح الكل')}</button>
      </div>}
    </div>

    {results.length === 0
      ? <div className="mt-8 rounded-[1.4rem] border border-dashed border-[hsl(var(--border))] p-12 text-center" data-testid="empty-state">
          <p className="font-serif text-3xl">{t('Nothing matches yet.', 'لا توجد نتائج بعد.')}</p>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{t('Try a different word, or clear the filters to see the whole catalog.', 'جرّب كلمة أخرى، أو امسح عوامل التصفية لعرض الكتالوج كاملاً.')}</p>
          <button type="button" onClick={() => navigate(basePath, { replace: true })} className="mt-6 rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-empty-clear">{t('Clear filters', 'مسح عوامل التصفية')}</button>
        </div>
      : <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((solution, i) => <article key={solution.id} className="group flex flex-col rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition hover:-translate-y-1 hover:shadow-xl" data-testid={`solution-${solution.id}`}>
            <Link href={`/catalog/${solution.categorySlug}/${solution.id}`} className="flex flex-1 flex-col" data-testid={`card-solution-${solution.id}`}>
              <SolutionImage imageKey={solution.imageKey} title={t(solution.title, solution.titleArabic)} accent={i % 2 ? 'coral' : 'teal'} />
              <div className="flex flex-1 flex-col p-3">
                <p dir="auto" className="text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--secondary))]">{solution.category}</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight">{t(solution.title, solution.titleArabic)}</h3>
                <p dir="auto" className="mt-3 flex-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t(solution.description, solution.descriptionArabic || solution.description)}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[hsl(var(--secondary))]">{t('View details', 'عرض التفاصيل')} <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5" /></span>
              </div>
            </Link>
            <Link href={`/referral?solution=${encodeURIComponent(solution.id)}&area=${encodeURIComponent(solution.categorySlug)}`} className="mx-3 mb-2 mt-1 text-xs font-bold text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--secondary))]" data-testid={`link-solution-referral-${solution.id}`}>{t('Discuss this solution', 'ناقش هذا الحل')}</Link>
          </article>)}
        </div>}
  </div>;
}
