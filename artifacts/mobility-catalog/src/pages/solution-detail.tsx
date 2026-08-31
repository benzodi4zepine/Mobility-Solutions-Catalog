import { useParams, Link } from 'wouter';
import { ArrowUpRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { useGetCatalogCategory, useGetLocations, useGetSolutions, getGetCatalogCategoryQueryKey, getGetLocationsQueryKey, getGetSolutionsQueryKey } from '@workspace/api-client-react';
import type { Product, Solution } from '@workspace/api-client-react';
import { useLanguage } from '@/i18n/language';
import { usePageMeta } from '@/lib/page-meta';
import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { SolutionImage } from '@/components/catalog/solution-image';
import { SolutionGallery } from '@/components/catalog/solution-gallery';

/**
 * Shown where the clinic has not yet supplied clinical content. Specifications,
 * indications and candidacy criteria are never generated - they carry clinical
 * weight and must come from the team.
 */
function AwaitingContent({ heading, body, testId }: { heading: string; body: string; testId: string }) {
  return <div className="rounded-[1.2rem] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] p-6" data-testid={testId}>
    <p className="text-sm font-bold">{heading}</p>
    <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{body}</p>
  </div>;
}

export function SolutionDetailBody() {
  const { t } = useLanguage();
  const { slug = '', solutionId = '' } = useParams<{ slug: string; solutionId: string }>();
  const query = useGetCatalogCategory(slug, { query: { enabled: !!slug, queryKey: getGetCatalogCategoryQueryKey(slug), staleTime: 300000 } });
  const locations = useGetLocations({ query: { queryKey: getGetLocationsQueryKey(), staleTime: 300000 } });
  const allSolutions = useGetSolutions({ query: { queryKey: getGetSolutionsQueryKey(), staleTime: 300000 } });

  const category = query.data;
  const solution = category?.solutions.find((item: Solution) => item.id === solutionId);

  usePageMeta(solution ? t(solution.title, solution.titleArabic) : '', solution?.description);

  if (query.isLoading) return <main id="main" className="page-in mx-auto max-w-7xl px-5 py-20 lg:px-10"><div className="shimmer h-16 w-2/3 rounded-xl" /><div className="mt-8 shimmer h-80 rounded-[1.5rem]" /></main>;

  if (!solution || !category) return <main id="main" className="page-in mx-auto max-w-3xl px-5 py-24 text-center lg:py-32" data-testid="solution-not-found">
    <h1 className="font-serif text-5xl leading-[.95]">{t('We could not find that solution.', 'لم نتمكن من العثور على هذا الحل.')}</h1>
    <p className="mt-5 text-sm text-[hsl(var(--muted-foreground))]">{t('It may have been renamed or moved. The full catalog is a good place to start.', 'ربما تغيّر اسمه أو مكانه. الكتالوج الكامل نقطة بداية جيدة.')}</p>
    <Link href="/catalog" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="link-back-to-catalog">{t('Browse the catalog', 'تصفّح الكتالوج')} <ArrowUpRight size={16} /></Link>
  </main>;

  const title = t(solution.title, solution.titleArabic);
  const pool: Solution[] = allSolutions.data ?? category.solutions;
  const related = pool
    .filter((item: Solution) => item.id !== solution.id)
    .map((item: Solution) => ({ item, score: (item.category === solution.category ? 2 : 0) + item.tags.filter(tag => solution.tags.includes(tag)).length }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(entry => entry.item);
  const whatsapp = locations.data?.find(location => location.isPrimary)?.whatsapp ?? locations.data?.[0]?.whatsapp;
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(t(`Hello Mafaz, I would like to ask about: ${solution.title}`, `مرحباً مفاز، أود الاستفسار عن: ${solution.titleArabic}`))}` : null;

  return <main id="main" className="page-in mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20">
    <Breadcrumbs items={[
      { label: t('Home', 'الرئيسية'), href: '/' },
      { label: t('Catalog', 'الكتالوج'), href: '/catalog' },
      { label: t(category.title, category.titleArabic), href: `/catalog/${category.slug}` },
      { label: title },
    ]} />

    <section className="grid gap-10 border-b border-[hsl(var(--border))] pb-14 lg:grid-cols-[1fr_1fr] lg:items-start">
      <SolutionGallery imageKey={solution.imageKey} title={title} />
      <div>
        <p dir="auto" className="text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--secondary))]">{solution.category}</p>
        <h1 className="mt-3 font-serif text-5xl leading-[.92] tracking-[-.03em] md:text-6xl" data-testid="text-solution-title">{title}</h1>
        {solution.brand && <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{t('Brand', 'العلامة التجارية')}: {solution.brand}</p>}
        <div className="mt-5 flex flex-wrap gap-2">{solution.tags.map(tag => <span key={tag} className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]">{tag}</span>)}</div>
        <p dir="auto" className="mt-6 text-base leading-7 text-[hsl(var(--muted-foreground))]">{t(solution.description, solution.descriptionArabic || solution.description)}</p>
        {solution.longDescription && <p dir="auto" className="mt-4 text-base leading-7 text-[hsl(var(--muted-foreground))]">{t(solution.longDescription, solution.longDescriptionArabic || solution.longDescription)}</p>}
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href={`/referral?solution=${encodeURIComponent(solution.id)}&area=${encodeURIComponent(category.slug)}`} className="flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5" data-testid="link-detail-referral">{t('Refer a patient', 'إحالة مريض')} <ArrowUpRight size={16} /></Link>
          {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-6 py-3.5 text-sm font-bold transition hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]" data-testid="link-detail-whatsapp"><MessageCircle size={16} /> {t('Ask about this device', 'اسأل عن هذا الجهاز')}</a>}
        </div>
      </div>
    </section>

    {solution.products.length > 0 && <section className="border-b border-[hsl(var(--border))] py-14" data-testid="section-products">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-3xl">{t('Models we fit', 'الموديلات التي نركّبها')}</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{t(`${solution.products.length} available`, `${solution.products.length} متوفّر`)}</p>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {solution.products.map((product: Product) => <article key={product.id} className="flex flex-col rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3" data-testid={`product-${product.id}`}>
          <SolutionImage imageKey={product.imageKey} title={t(product.name, product.nameArabic || product.name)} />
          <div className="flex flex-1 flex-col p-3">
            {product.brand && <p dir="auto" className="text-[10px] font-bold uppercase tracking-[.14em] text-[hsl(var(--secondary))]">{product.brand}</p>}
            <h3 dir="auto" className="mt-2 font-serif text-2xl leading-tight">{t(product.name, product.nameArabic || product.name)}</h3>
            {product.description && <p dir="auto" className="mt-3 flex-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t(product.description, product.descriptionArabic || product.description)}</p>}
            {product.tags && product.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{product.tags.map(tag => <span key={tag} dir="auto" className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]">{tag}</span>)}</div>}
            {whatsappHref && <a href={`${whatsappHref.split('?')[0]}?text=${encodeURIComponent(t(`Hello Mafaz, I would like to ask about: ${product.name}`, `مرحباً مفاز، أود الاستفسار عن: ${product.nameArabic || product.name}`))}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[hsl(var(--secondary))]" data-testid={`link-product-ask-${product.id}`}>{t('Ask about this model', 'اسأل عن هذا الموديل')} <ArrowUpRight size={14} /></a>}
          </div>
        </article>)}
      </div>
    </section>}

    <section className="grid gap-10 py-14 lg:grid-cols-[1fr_320px]">
      <div className="space-y-10">
        <div>
          <h2 className="font-serif text-3xl">{t('Who it is for', 'لمن هذا الحل')}</h2>
          <div className="mt-5">
            {solution.indications?.length
              ? <ul className="space-y-3">{solution.indications.map(item => <li key={item} dir="auto" className="flex gap-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[hsl(var(--secondary))]" />{item}</li>)}</ul>
              : <AwaitingContent testId="content-pending-indications"
                  heading={t('Candidacy is assessed in clinic.', 'يُقيَّم مدى الملاءمة في العيادة.')}
                  body={t('Whether this device suits a particular person depends on a clinical assessment. Speak with the team and they will talk it through.', 'تعتمد ملاءمة هذا الجهاز لشخص بعينه على تقييم سريري. تحدّث مع الفريق وسيشرحون لك التفاصيل.')} />}
          </div>
        </div>
        <div>
          <h2 className="font-serif text-3xl">{t('Specifications', 'المواصفات')}</h2>
          <div className="mt-5">
            {solution.specs?.length
              ? <dl className="divide-y divide-[hsl(var(--border))] rounded-[1.2rem] border border-[hsl(var(--border))]">{solution.specs.map(spec => <div key={spec.label} className="flex flex-wrap justify-between gap-3 px-5 py-4 text-sm"><dt className="font-semibold">{t(spec.label, spec.labelArabic || spec.label)}</dt><dd className="text-[hsl(var(--muted-foreground))]">{t(spec.value, spec.valueArabic || spec.value)}</dd></div>)}</dl>
              : <AwaitingContent testId="content-pending-specs"
                  heading={t('Full specifications are being prepared.', 'يجري إعداد المواصفات الكاملة.')}
                  body={t('Componentry, materials and activity levels vary by configuration. The clinical team can share the exact specification for a given fitting.', 'تختلف المكوّنات والمواد ومستويات النشاط حسب التهيئة. يمكن للفريق السريري مشاركة المواصفات الدقيقة لكل حالة.')} />}
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-[1.4rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 lg:sticky lg:top-24">
        <p className="text-sm font-bold">{t('How fitting works', 'كيف تتم عملية التركيب')}</p>
        <ol className="mt-6 space-y-6">{category.workflow.map((step: string, i: number) => <li key={step} dir="auto" className="relative flex gap-3 text-sm leading-5 text-[hsl(var(--muted-foreground))]"><span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-[hsl(var(--primary-foreground))]">{String(i + 1).padStart(2, '0')}</span><span>{step}</span></li>)}</ol>
      </aside>
    </section>

    {related.length > 0 && <section className="border-t border-[hsl(var(--border))] py-14">
      <h2 className="font-serif text-3xl">{t('Related solutions', 'حلول ذات صلة')}</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((item: Solution, i: number) => <Link key={item.id} href={`/catalog/${item.categorySlug}/${item.id}`} className="group flex flex-col rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition hover:-translate-y-1 hover:shadow-xl" data-testid={`card-related-${item.id}`}>
          <SolutionImage imageKey={item.imageKey} title={t(item.title, item.titleArabic)} accent={i % 2 ? 'coral' : 'teal'} />
          <div className="p-3"><h3 className="font-serif text-2xl leading-tight">{t(item.title, item.titleArabic)}</h3><span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[hsl(var(--secondary))]">{t('View details', 'عرض التفاصيل')} <ArrowUpRight size={14} /></span></div>
        </Link>)}
      </div>
    </section>}
  </main>;
}
