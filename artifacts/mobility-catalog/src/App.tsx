import { type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateReferral, useGetCatalogCategory, useGetCatalogOverview, useGetLocations, useGetSolutions, useHealthCheck, getGetCatalogCategoryQueryKey, getGetCatalogOverviewQueryKey, getGetLocationsQueryKey, getGetSolutionsQueryKey, getHealthCheckQueryKey } from '@workspace/api-client-react';
import { Activity, ArrowRight, ArrowUpRight, Check, ChevronRight, Clock3, FileText, HeartPulse, Languages, Mail, MapPin, Menu, MessageCircle, Phone, Play, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider, useLanguage } from '@/i18n/language';
import NotFound from '@/pages/not-found';
import { Route, Switch, Link, useLocation, useParams, useSearch, Router as WouterRouter } from 'wouter';
import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { SolutionExplorer } from '@/components/catalog/solution-explorer';
import { SolutionImage } from '@/components/catalog/solution-image';
import { CatalogIndexBody } from '@/pages/catalog-index';
import { SolutionDetailBody } from '@/pages/solution-detail';
import mafazLogo from '@assets/Screenshot_2025-10-02_120532-removebg-preview_1786537533167.png';
import heroFitting from '@assets/mafaz-hero-fitting.jpg';

const queryClient = new QueryClient();

/**
 * Hands a URL to the browser's external handler.
 *
 * A synthetic anchor click is used rather than window.open: with `noopener`,
 * window.open always returns null by spec, so any "did it open?" check falls
 * through to a top-level navigation, which sandboxed frames block outright for
 * mailto. Clicking an anchor inside the user's own gesture works in both.
 */
function openExternal(url: string, newTab: boolean) {
  const anchor = document.createElement('a');
  anchor.href = url;
  if (newTab) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function CopyButton({ text }: { text: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  return <button type="button" data-testid="button-copy-referral"
    onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
    }}
    className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-xs font-bold transition hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]">
    {copied ? t('Copied', 'تم النسخ') : t('Copy referral text', 'انسخ نص الإحالة')}
  </button>;
}

function scrollToCatalog(event: { preventDefault: () => void }) {
  event.preventDefault();
  const target = document.getElementById('catalog');
  if (!target) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

function BrandMark() {
  const { t } = useLanguage();
  return <img src={mafazLogo} alt={t('Mafaz Prosthetics & Assistive Devices', 'مفاز للأطراف الاصطناعية والأجهزة المساندة')} className="size-11 object-contain" />;
}

function BrandLockup({ serifClass = 'text-[23px]' }: { serifClass?: string }) {
  const { t } = useLanguage();
  return <span className="min-w-0">
    <span className={`block font-serif leading-none tracking-tight text-[hsl(var(--foreground))] ${serifClass}`}>Mafaz <i className="not-italic text-[hsl(var(--secondary))]">Mobility</i></span>
    <span className="mt-1 block max-w-[220px] truncate text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">{t('Prosthetics & assistive devices', 'مفاز للأطراف الاصطناعية والأجهزة المساندة')}</span>
  </span>;
}

function StatusPill() {
  const { t } = useLanguage();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60000, retry: false } });
  const online = health.isSuccess && health.data?.status === 'ok';
  return <div className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))] sm:flex" data-testid="status-connection">
    <span className={`size-1.5 rounded-full ${health.isLoading ? 'bg-[hsl(var(--accent))]' : online ? 'bg-[hsl(var(--secondary))]' : 'bg-[hsl(var(--accent))]'}`} />
    {health.isLoading ? t('Connecting', 'جارٍ الاتصال') : online ? t('Clinical line open', 'الخط السريري مفتوح') : t('Line available', 'الخط متاح')}
  </div>;
}

function Header() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, t, toggleLang } = useLanguage();
  const nav = [
    { href: '/', label: t('Solutions', 'الحلول') },
    { href: '/catalog', label: t('Catalog', 'الكتالوج') },
    { href: '/outcomes', label: t('Clinical outcomes', 'النتائج السريرية') },
    { href: '/referral', label: t('Refer a patient', 'إحالة مريض') },
    { href: '/contact', label: t('Contact', 'تواصل معنا') },
  ];
  return <header className="relative z-40 border-b border-[hsl(var(--border)/.72)] bg-[hsl(var(--background)/.92)] backdrop-blur-md">
    <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-5 lg:px-10">
      <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
        <BrandMark />
        <BrandLockup />
      </Link>
      <nav className="hidden items-center gap-7 lg:flex" aria-label={t('Primary navigation', 'التنقل الرئيسي')}>
        {nav.map(item => <Link key={item.href} href={item.href} className={`group text-[13px] font-semibold tracking-[-.01em] transition-colors hover:text-[hsl(var(--secondary))] ${location === item.href ? 'text-[hsl(var(--secondary))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`link-nav-${item.href.replace('/', '') || 'home'}`}>
          <span>{item.label}</span>
          {location === item.href && <span className="mx-auto mt-1 block h-px w-5 bg-[hsl(var(--accent))]" />}
        </Link>)}
      </nav>
      <div className="flex items-center gap-3">
        <StatusPill />
        <button type="button" onClick={toggleLang} className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]" data-testid="button-language-toggle" aria-label={t('Switch to Arabic', 'التبديل إلى الإنجليزية')}>
          <Languages size={14} /> {lang === 'en' ? 'عربي' : 'EN'}
        </button>
        <button type="button" className="grid size-10 place-items-center rounded-full border border-[hsl(var(--border))] lg:hidden" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" aria-label={menuOpen ? t('Close menu', 'إغلاق القائمة') : t('Open menu', 'فتح القائمة')} aria-expanded={menuOpen}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
    </div>
    {menuOpen && <nav className="border-t border-[hsl(var(--border))] px-5 py-3 lg:hidden" aria-label={t('Mobile navigation', 'تنقل الجوال')}>
      {nav.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-[hsl(var(--border)/.55)] py-4 text-sm font-semibold" data-testid={`link-mobile-${item.href.replace('/', '') || 'home'}`}>{item.label}<ChevronRight size={16} className="rtl:rotate-180" /></Link>)}
    </nav>}
  </header>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="noise min-h-[100dvh]"><Header />{children}<Footer /></div>;
}

function Footer() {
  const { t } = useLanguage();
  return <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/.28)]">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
      <div><div className="mb-4 flex items-center gap-3"><BrandMark /><BrandLockup serifClass="text-xl" /></div><p className="max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('Clinical mobility, made personal.', 'حلول الحركة، مصمّمة لك.')}</p></div>
      <div><p className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--secondary))]">{t('Explore', 'استكشف')}</p><div className="flex flex-col gap-3 text-sm"><Link href="/" data-testid="link-footer-solutions">{t('Solutions', 'الحلول')}</Link><Link href="/catalog" data-testid="link-footer-catalog">{t('Catalog', 'الكتالوج')}</Link><Link href="/outcomes" data-testid="link-footer-outcomes">{t('Outcomes', 'النتائج')}</Link><Link href="/referral" data-testid="link-footer-referral">{t('Refer a patient', 'إحالة مريض')}</Link><Link href="/contact" data-testid="link-footer-contact">{t('Contact', 'تواصل معنا')}</Link></div></div>
      <div><p className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--secondary))]">{t('Clinical team', 'الفريق السريري')}</p><div className="flex flex-col gap-3 text-sm text-[hsl(var(--muted-foreground))]"><span>{t('Amman, Jordan · Alrazi Street', 'عمّان، الأردن · شارع الرازي')}</span><a href="tel:+962795185080" className="transition hover:text-[hsl(var(--secondary))]" dir="ltr">+962 79 518 5080</a><a href="mailto:info@mafazmedical.com" className="transition hover:text-[hsl(var(--secondary))]" dir="ltr" data-testid="link-footer-email">info@mafazmedical.com</a><span>{t('Saturday–Thursday · 08:00 — 16:00', 'السبت–الخميس · ٠٨:٠٠ — ١٦:٠٠')}</span></div></div>
      <div><p className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--secondary))]">MAFAZ / 01</p><p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('A considered path forward for every body.', 'مسار مدروس للأمام، لكل جسد.')}</p></div>
    </div>
    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-[hsl(var(--border))] px-5 py-5 text-[11px] text-[hsl(var(--muted-foreground))] sm:flex-row lg:px-10"><span>© 2026 Mafaz Mobility</span><span>{t('Orthotics · Prosthetics · Clinical support', 'أجهزة تقويمية · أطراف اصطناعية · دعم سريري')}</span></div>
  </footer>;
}

function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-3" data-testid="loading-state">{Array.from({ length: lines }).map((_, i) => <div key={i} className={`shimmer h-4 rounded-full ${i === 0 ? 'w-2/3' : i === lines - 1 ? 'w-1/2' : 'w-full'}`} />)}</div>;
}

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return <div className="rounded-2xl border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.08)] p-8 text-center" data-testid="error-state"><p className="font-serif text-2xl">{t('The clinical line paused.', 'توقف الخط السريري مؤقتاً.')}</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{t('Please try again — your path is still here.', 'يرجى المحاولة مرة أخرى — مسارك ما زال هنا.')}</p><button type="button" onClick={onRetry} className="mt-5 rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-retry">{t('Try again', 'حاول مرة أخرى')}</button></div>;
}

function HeroArt() {
  const { t } = useLanguage();
  return <figure className="relative mx-auto w-full max-w-[480px] lg:ms-auto">
    <div className="absolute -inset-2 rounded-[2.1rem] bg-[hsl(var(--secondary)/.1)]" aria-hidden="true" />
    <div className="absolute -right-3 -top-4 size-24 rounded-full border-[14px] border-[hsl(var(--secondary)/.16)]" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-[1.9rem] bg-[hsl(var(--muted))] shadow-[0_24px_80px_hsl(var(--primary)/.18)]">
      <img src={heroFitting} alt={t('A clinician fitting a carbon-fibre myoelectric arm and bionic hand with a patient', 'أخصائي يركّب ذراعاً كهربائية من ألياف الكربون ويداً بيونية لأحد المراجعين')} width={1200} height={1800} loading="eager" className="aspect-[4/5] w-full object-cover" data-testid="image-hero" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary)/.42)] via-transparent to-transparent" aria-hidden="true" />
    </div>
    <div className="absolute bottom-[7%] right-[5%] flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.95)] px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] shadow-lg backdrop-blur">
      <span className="size-2 rounded-full bg-[hsl(var(--secondary))]" /> {t('responsive fit', 'ملاءمة متجاوبة')}
    </div>
    <div className="absolute left-[4%] top-[18%] max-w-[145px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.92)] p-3 shadow-lg backdrop-blur">
      <span className="block font-mono text-[10px] text-[hsl(var(--secondary))]">01 / 03</span>
      <span className="mt-2 block text-xs font-semibold leading-4">{t('Movement, measured differently.', 'حركة تُقاس بطريقة مختلفة.')}</span>
    </div>
  </figure>;
}

function SectionEyebrow({ children }: { children: ReactNode }) { return <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--secondary))]"><span className="h-px w-7 bg-[hsl(var(--accent))]" />{children}</div>; }

function Home() {
  const { t } = useLanguage();
  const query = useGetCatalogOverview({ query: { queryKey: getGetCatalogOverviewQueryKey(), staleTime: 300000 } });
  const overview = query.data;
  return <Shell><main className="page-in">
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.04fr_.96fr] lg:px-10 lg:pb-28 lg:pt-24">
      <div className="rise"><SectionEyebrow>{t('Mobility, in its next chapter', 'الحركة، في فصلها القادم')}</SectionEyebrow><h1 className="max-w-[680px] text-balance font-serif text-[clamp(3.6rem,8vw,7.4rem)] leading-[.88] tracking-[-.045em] text-[hsl(var(--primary))]">{t('Move toward ', 'تحرّك نحو ')}<i className="text-[hsl(var(--secondary))]">{t('more.', 'المزيد.')}</i></h1><p className="mt-8 max-w-[520px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">{t('Digital mobility solutions that give clinicians clarity, and people the confidence to take the next step.', 'حلول رقمية تمنح المختصين الوضوح، وتمنح الأشخاص الثقة لاتخاذ الخطوة التالية.')}</p><div className="mt-9 flex flex-wrap gap-3"><a href="#catalog" onClick={scrollToCatalog} className="group flex items-center gap-3 rounded-full bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5" data-testid="link-explore-catalog">{t('Explore solutions', 'استكشف الحلول')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180" /></a><Link href="/referral" className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-6 py-3.5 text-sm font-bold transition hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]" data-testid="link-hero-referral">{t('Start a referral', 'ابدأ إحالة')} <ArrowUpRight size={16} /></Link></div><div className="mt-10 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><ShieldCheck size={17} className="text-[hsl(var(--secondary))]" /> {t('Designed with clinical teams', 'صُمّمت مع الفرق السريرية')}</div></div>
      <HeroArt />
    </section>
    <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)]"><div className="mx-auto grid max-w-7xl divide-y divide-[hsl(var(--border))] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">{(overview?.metrics ?? []).map((metric, i) => <div key={i} className="flex items-center gap-4 py-7 sm:justify-center sm:py-9" data-testid={`metric-${i}`}><span className="font-serif text-4xl text-[hsl(var(--primary))]" dir="ltr">{metric.value}</span><span className="max-w-[130px] text-xs leading-4 text-[hsl(var(--muted-foreground))]">{t(metric.label, metric.labelArabic)}</span></div>)}</div></section>
    <section id="catalog" className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><SectionEyebrow>{t('Find your fit', 'اعثر على الحل المناسب')}</SectionEyebrow><h2 className="max-w-xl font-serif text-5xl leading-[.95] tracking-[-.035em] md:text-6xl">{t('A clearer route to ', 'طريق أوضح نحو ')}<i className="text-[hsl(var(--secondary))]">{t('better movement.', 'حركة أفضل.')}</i></h2></div><p className="max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('Browse by clinical need. Each solution is a starting point for a more informed conversation.', 'تصفّح حسب الحاجة السريرية. كل حل هو نقطة انطلاق لمحادثة أكثر وضوحاً.')}</p></div>{query.isLoading ? <div className="mt-12 grid gap-5 md:grid-cols-2"><div className="shimmer h-64 rounded-[1.4rem]" /><div className="shimmer h-64 rounded-[1.4rem]" /></div> : query.isError ? <div className="mt-12"><ErrorBlock onRetry={() => query.refetch()} /></div> : <div className="mt-12 grid gap-5 md:grid-cols-2">{overview?.categories.map((cat, i) => <Link key={cat.slug} href={`/catalog/${cat.slug}`} className={`group relative min-h-[280px] overflow-hidden rounded-[1.5rem] p-7 transition duration-500 hover:-translate-y-1 hover:shadow-xl ${i === 0 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]'}`} data-testid={`card-category-${cat.slug}`}><div className="absolute -right-12 -top-12 size-48 rounded-full border border-current opacity-15 transition duration-500 group-hover:scale-125" /><div className="absolute bottom-[-45px] right-[-15px] size-44 rounded-full border-[22px] border-current opacity-10" /><div className="relative flex h-full flex-col justify-between"><div className="flex items-start justify-between"><span className="rounded-full border border-current/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[.15em]">{t(`${cat.solutionCount} solutions`, `${cat.solutionCount} حلول`)}</span><ArrowUpRight size={20} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><div><h3 className="font-serif text-4xl">{t(cat.title, cat.titleArabic)}</h3><p dir="auto" className="mt-4 max-w-sm text-sm leading-6 opacity-75">{cat.description}</p></div></div></Link>)}</div>}</section>
    <section className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.75fr_1.25fr] lg:px-10 lg:py-24"><div><SectionEyebrow><span className="text-[hsl(var(--accent))]">{t('Selected solutions', 'حلول مختارة')}</span></SectionEyebrow><h2 className="font-serif text-5xl leading-[.94] md:text-6xl">{t('Small changes.', 'تغييرات صغيرة.')}<br /><i className="text-[hsl(var(--secondary))]">{t('Real distance.', 'مسافة حقيقية.')}</i></h2><p className="mt-6 max-w-sm text-sm leading-6 opacity-65">{t('Meet the tools clinicians return to when the goal is not just function, but freedom.', 'تعرّف على الأدوات التي يعود إليها المختصون حين يكون الهدف ليس الوظيفة فحسب، بل الحرية.')}</p><Link href="/outcomes" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--accent))]" data-testid="link-outcomes-home">{t('See clinical outcomes', 'اطّلع على النتائج السريرية')} <ArrowRight size={16} className="rtl:rotate-180" /></Link></div><div className="grid gap-5 sm:grid-cols-2">{overview?.featuredSolutions.slice(0, 4).map((solution, i) => <Link key={solution.id} href={`/catalog/${solution.categorySlug}/${solution.id}`} className={`group ${i === 0 ? 'sm:col-span-2' : ''}`} data-testid={`card-featured-${solution.id}`}><div className="overflow-hidden rounded-[1.3rem] bg-[hsl(var(--card)/.1)] p-2 transition group-hover:bg-[hsl(var(--card)/.18)]"><SolutionImage imageKey={solution.imageKey} title={t(solution.title, solution.titleArabic)} accent={i % 2 ? 'coral' : 'teal'} large={i === 0} /><div className="flex items-start justify-between gap-3 px-2 pb-2 pt-4"><div><h3 className="font-serif text-2xl">{t(solution.title, solution.titleArabic)}</h3></div><ArrowUpRight size={18} className="mt-1 text-[hsl(var(--accent))]" /></div></div></Link>)}</div></div></section>
    <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-20 sm:flex-row sm:items-center lg:px-10"><div><SectionEyebrow>{t('One conversation away', 'محادثة واحدة تفصلك')}</SectionEyebrow><h2 className="max-w-2xl font-serif text-4xl leading-tight md:text-5xl">{t('Have a person in mind? ', 'هل لديك شخص في بالك؟ ')}<i className="text-[hsl(var(--secondary))]">{t('Let’s begin there.', 'لنبدأ من هناك.')}</i></h2></div><Link href="/referral" className="group flex shrink-0 items-center gap-3 rounded-full bg-[hsl(var(--accent))] px-6 py-4 text-sm font-bold transition hover:-translate-y-0.5" data-testid="link-referral-cta">{t('Make a referral', 'قدّم إحالة')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180" /></Link></section>
  </main></Shell>;
}

function CategoryPage() {
  const { t } = useLanguage();
  const { slug = '' } = useParams<{ slug: string }>();
  const query = useGetCatalogCategory(slug, { query: { enabled: !!slug, queryKey: getGetCatalogCategoryQueryKey(slug), staleTime: 300000 } });
  const category = query.data;
  return <Shell><main className="page-in mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20">
    <Breadcrumbs items={[{ label: t('Home', 'الرئيسية'), href: '/' }, { label: t('Catalog', 'الكتالوج'), href: '/catalog' }, { label: category ? t(category.title, category.titleArabic) : slug }]} />
    {query.isLoading ? <><div className="shimmer h-16 w-2/3 rounded-xl" /><div className="mt-5"><LoadingBlock /></div></> : query.isError || !category ? <ErrorBlock onRetry={() => query.refetch()} /> : <>
      <section className="grid items-end gap-8 border-b border-[hsl(var(--border))] pb-14 md:grid-cols-[1fr_1fr]">
        <div><SectionEyebrow>{t('Catalog', 'الكتالوج')} / {category.slug}</SectionEyebrow><h1 className="font-serif text-6xl leading-[.9] tracking-[-.04em] md:text-8xl">{t(category.title, category.titleArabic)}</h1></div>
        <p dir="auto" className="max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">{category.description}</p>
      </section>
      <section className="grid gap-12 py-16 lg:grid-cols-[1fr_280px]">
        <SolutionExplorer solutions={category.solutions} basePath={`/catalog/${category.slug}`} />
        <aside className="h-fit rounded-[1.4rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 lg:sticky lg:top-24">
          <div className="mb-7 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[hsl(var(--secondary)/.12)] text-[hsl(var(--secondary))]"><Stethoscope size={17} /></span><div><p className="text-sm font-bold">{t('Our workflow', 'منهجية العمل')}</p></div></div>
          <ol className="space-y-6">{category.workflow.map((step, i) => <li key={step} dir="auto" className="relative flex gap-3 text-sm leading-5 text-[hsl(var(--muted-foreground))]"><span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-[hsl(var(--primary-foreground))]">{String(i + 1).padStart(2, '0')}</span><span>{step}</span>{i < category.workflow.length - 1 && <span className="absolute left-3 top-6 h-7 w-px bg-[hsl(var(--border))] rtl:left-auto rtl:right-3" />}</li>)}</ol>
          <Link href="/referral" className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--accent))] px-4 py-3 text-xs font-bold" data-testid="link-category-referral">{t('Talk to the team', 'تحدّث مع الفريق')} <ArrowUpRight size={14} /></Link>
        </aside>
      </section>
    </>}
  </main></Shell>;
}

function CatalogIndex() { return <Shell><CatalogIndexBody /></Shell>; }

function SolutionDetail() { return <Shell><SolutionDetailBody /></Shell>; }

function Outcomes() {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<'before' | 'after'>('after');
  return <Shell><main className="page-in">
    <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 lg:px-10 lg:pb-24 lg:pt-24"><div className="grid items-end gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><SectionEyebrow>{t('Evidence in motion', 'الدليل أثناء الحركة')}</SectionEyebrow><h1 className="font-serif text-6xl leading-[.88] tracking-[-.04em] md:text-8xl">{t('Outcomes', 'نتائج')}<br /><i className="text-[hsl(var(--secondary))]">{t('you can feel.', 'يمكنك الإحساس بها.')}</i></h1></div><p className="max-w-lg text-lg leading-8 text-[hsl(var(--muted-foreground))]">{t('A clinical presentation of what happens when a solution is tuned to the person wearing it — not just the diagnosis.', 'عرض سريري لما يحدث عندما يُضبط الحل على الشخص الذي يرتديه — لا على التشخيص وحده.')}</p></div></section>
    <section className="bg-[hsl(var(--primary))] px-5 py-12 text-[hsl(var(--primary-foreground))] lg:px-10 lg:py-16"><div className="mx-auto max-w-7xl"><div className="relative overflow-hidden rounded-[1.5rem] bg-[hsl(var(--secondary)/.18)]"><div className="grid min-h-[410px] lg:grid-cols-[1.35fr_.65fr]"><div className="relative flex items-end p-7 sm:p-12"><div className={`absolute inset-0 transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-70'}`} style={{ background: 'radial-gradient(ellipse at 48% 30%, hsl(var(--secondary)/.5), transparent 55%), linear-gradient(125deg, hsl(var(--primary)), hsl(var(--secondary)/.3))' }} /><div className="relative z-10"><span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary-foreground)/.2)] px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em]"><span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" /> {t('Case study', 'دراسة حالة')} / 04:12</span><h2 className="max-w-lg font-serif text-5xl leading-[.9] md:text-6xl">{t('A steadier', 'نوع أكثر ثباتاً')}<br /><i>{t('kind of strong.', 'من القوة.')}</i></h2><p className="mt-5 max-w-sm text-sm leading-6 opacity-65">{t('Below-knee prosthetic alignment for an active adult returning to uneven terrain.', 'ضبط طرف اصطناعي تحت الركبة لشخص نشط يعود إلى التضاريس غير المستوية.')}</p></div><button type="button" onClick={() => setPlaying(!playing)} className="absolute right-7 top-7 z-10 grid size-14 place-items-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] transition hover:scale-105" data-testid="button-play-case-study" aria-label={playing ? t('Pause case study', 'إيقاف دراسة الحالة') : t('Play case study', 'تشغيل دراسة الحالة')}>{playing ? <span className="flex gap-1"><span className="h-4 w-1 bg-current" /><span className="h-4 w-1 bg-current" /></span> : <Play size={19} fill="currentColor" />}</button></div><div className="relative border-t border-[hsl(var(--primary-foreground)/.13)] bg-[hsl(var(--primary)/.4)] p-7 sm:p-10 lg:border-l lg:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">{t('Measured shift', 'تغيّر مُقاس')}</p><div className="mt-10 space-y-8"><div><p className="font-serif text-5xl" dir="ltr">−18%</p><p className="mt-1 text-xs opacity-55">{t('stance asymmetry', 'عدم تناظر الوقوف')}</p></div><div><p className="font-serif text-5xl" dir="ltr">+24°</p><p className="mt-1 text-xs opacity-55">{t('comfortable flexion', 'انثناء مريح')}</p></div><div><p className="font-serif text-5xl" dir="ltr">6 wks</p><p className="mt-1 text-xs opacity-55">{t('to confident terrain', 'للوصول إلى تضاريس بثقة')}</p></div></div></div></div></div><div className="mt-5 flex items-center justify-between text-xs opacity-55"><span>{t('Leila M. · 38 · Dubai', 'ليلى م. · ٣٨ · دبي')}</span><span>{playing ? t('Presentation playing', 'العرض قيد التشغيل') : t('Press play to view presentation', 'اضغط تشغيل لعرض العرض التقديمي')}</span></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><SectionEyebrow>{t('Before / after', 'قبل / بعد')}</SectionEyebrow><h2 className="font-serif text-5xl leading-[.92]">{t('The difference', 'الفرق')}<br /><i className="text-[hsl(var(--secondary))]">{t('is in the detail.', 'في التفاصيل.')}</i></h2><p className="mt-6 max-w-xs text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('Gait is a conversation between the body, the device, and the ground. We listen to all three.', 'المشية حوار بين الجسد والجهاز والأرض. نحن نُصغي إلى الثلاثة.')}</p><div className="mt-8 inline-flex rounded-full border border-[hsl(var(--border))] p-1"><button type="button" onClick={() => setView('before')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'before' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''}`} data-testid="button-gait-before">{t('Before', 'قبل')}</button><button type="button" onClick={() => setView('after')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'after' ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]' : ''}`} data-testid="button-gait-after">{t('After', 'بعد')}</button></div></div><div className="rounded-[1.5rem] bg-[hsl(var(--muted)/.5)] p-4 sm:p-8"><div className="flex h-[250px] items-center justify-center overflow-hidden rounded-[1.1rem] bg-[hsl(var(--card))]"><div className={`gait-figure relative h-44 w-36 transition duration-500 ${view === 'before' ? 'opacity-55 grayscale' : ''}`}><span className="absolute left-1/2 top-0 size-11 -translate-x-1/2 rounded-full bg-[hsl(var(--primary))]" /><span className="absolute left-1/2 top-10 h-24 w-8 -translate-x-1/2 rounded-[50%] bg-[hsl(var(--secondary))]" /><span className={`absolute left-[38%] top-[118px] h-24 w-4 origin-top rounded-full bg-[hsl(var(--primary))] ${view === 'before' ? '-rotate-[20deg]' : '-rotate-[7deg]'}`} /><span className={`absolute left-[55%] top-[118px] h-24 w-4 origin-top rounded-full bg-[hsl(var(--primary))] ${view === 'before' ? 'rotate-[28deg]' : 'rotate-[7deg]'}`} /><span className="absolute bottom-0 left-2 h-2 w-32 rounded-full bg-[hsl(var(--accent)/.5)]" /></div></div><div className="grid gap-4 border-t border-[hsl(var(--border))] pt-6 sm:grid-cols-3"><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">{t('Cadence', 'الإيقاع')}</p><p className="mt-2 text-xl font-bold">{view === 'after' ? '108' : '91'} <span className="text-xs font-normal">{t('steps/min', 'خطوة/دقيقة')}</span></p></div><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">{t('Load balance', 'توازن الحمل')}</p><p className="mt-2 text-xl font-bold" dir="ltr">{view === 'after' ? '48 / 52' : '63 / 37'}</p></div><div><p className="font-mono text-[10px] uppercase tracking-[.12em] text-[hsl(var(--muted-foreground))]">{t('Confidence', 'الثقة')}</p><p className="mt-2 text-xl font-bold">{view === 'after' ? t('High', 'عالية') : t('Guarded', 'حذرة')}</p></div></div></div></div></section>
    <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--muted)/.28)]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-3 lg:px-10"><div><HeartPulse className="text-[hsl(var(--secondary))]" size={23} /><h3 className="mt-5 font-serif text-3xl">{t('Human first', 'الإنسان أولاً')}</h3><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('A device is only successful when it disappears into the person’s day.', 'لا ينجح الجهاز إلا حين يذوب في يوم الشخص.')}</p></div><div><Activity className="text-[hsl(var(--accent))]" size={23} /><h3 className="mt-5 font-serif text-3xl">{t('Evidence led', 'مبني على الدليل')}</h3><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('Each adjustment has a reason, a measure, and a clinician behind it.', 'لكل تعديل سبب ومقياس ومختص خلفه.')}</p></div><div><Sparkles className="text-[hsl(var(--secondary))]" size={23} /><h3 className="mt-5 font-serif text-3xl">{t('Always evolving', 'في تطوّر دائم')}</h3><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('The best fit is not a moment. It is a relationship that keeps learning.', 'أفضل ملاءمة ليست لحظة، بل علاقة تتعلّم باستمرار.')}</p></div></div></section>
  </main></Shell>;
}

function Field({ label, children, required = false }: { label: string; children: ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 flex items-baseline gap-1 text-xs font-bold">{label}{required && <b className="text-[hsl(var(--accent))]">*</b>}</span>{children}</label>;
}

const inputClass = "w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.65)] focus:border-[hsl(var(--secondary))] focus:ring-2 focus:ring-[hsl(var(--secondary)/.12)]";

type ReferralPayload = {
  referrerName: string; organization: string; phone: string; email?: string;
  patientName: string; patientAge?: number;
  areaOfNeed: 'prosthetics' | 'orthotics' | 'other';
  clinicalNotes: string; preferredContact: 'phone' | 'whatsapp' | 'email';
};

function Referral() {
  const { t } = useLanguage();
  const params = new URLSearchParams(useSearch());
  const fromSolution = params.get('solution');
  const fromArea = params.get('area');
  const defaultArea = fromArea === 'orthotics' || fromArea === 'other' ? fromArea : 'prosthetics';
  const solutions = useGetSolutions({ query: { queryKey: getGetSolutionsQueryKey(), staleTime: 300000, enabled: Boolean(fromSolution) } });
  const referredSolution = fromSolution ? solutions.data?.find(item => item.id === fromSolution) : undefined;
  const locations = useGetLocations({ query: { queryKey: getGetLocationsQueryKey(), staleTime: 300000 } });
  const clinic = locations.data?.find(location => location.isPrimary) ?? locations.data?.[0];
  const mutation = useCreateReferral();
  const [sent, setSent] = useState<{ channel: 'whatsapp' | 'email'; url: string; body: string } | null>(null);
  const [error, setError] = useState('');

  const collect = (form: HTMLFormElement): ReferralPayload => {
    const data = new FormData(form);
    const age = data.get('patientAge');
    return {
      referrerName: String(data.get('referrerName') || ''),
      organization: String(data.get('organization') || ''),
      phone: String(data.get('phone') || ''),
      email: String(data.get('email') || '') || undefined,
      patientName: String(data.get('patientName') || ''),
      patientAge: age ? Number(age) : undefined,
      areaOfNeed: String(data.get('areaOfNeed') || 'other') as ReferralPayload['areaOfNeed'],
      clinicalNotes: String(data.get('clinicalNotes') || ''),
      preferredContact: String(data.get('preferredContact') || 'phone') as ReferralPayload['preferredContact'],
    };
  };

  /** Plain-text summary the clinical team receives in WhatsApp or email. */
  const compose = (payload: ReferralPayload) => [
    t('New referral via the Mafaz website', 'إحالة جديدة عبر موقع مفاز'),
    '',
    `${t('Referrer', 'المُحيل')}: ${payload.referrerName}`,
    `${t('Organization', 'الجهة')}: ${payload.organization}`,
    `${t('Phone', 'الهاتف')}: ${payload.phone}`,
    payload.email ? `${t('Email', 'البريد الإلكتروني')}: ${payload.email}` : null,
    `${t('Preferred contact', 'طريقة التواصل المفضلة')}: ${payload.preferredContact}`,
    '',
    `${t('Patient', 'المريض')}: ${payload.patientName}`,
    payload.patientAge ? `${t('Age', 'العمر')}: ${payload.patientAge}` : null,
    `${t('Area of need', 'مجال الاحتياج')}: ${payload.areaOfNeed}`,
    referredSolution ? `${t('Regarding', 'بخصوص')}: ${referredSolution.title}` : null,
    '',
    `${t('Notes', 'ملاحظات')}: ${payload.clinicalNotes}`,
  ].filter(Boolean).join('\n');

  const handoff = (form: HTMLFormElement, channel: 'whatsapp' | 'email') => {
    setError('');
    if (!form.reportValidity()) return;
    const payload = collect(form);
    const body = compose(payload);
    const number = clinic?.whatsapp?.replace(/\D/g, '');
    const address = clinic?.email;

    if (channel === 'whatsapp' && !number) { setError(t('The WhatsApp line is unavailable right now. Please call the clinic instead.', 'خط واتساب غير متاح حالياً. يرجى الاتصال بالعيادة.')); return; }
    if (channel === 'email' && !address) { setError(t('The email address is unavailable right now. Please call the clinic instead.', 'البريد الإلكتروني غير متاح حالياً. يرجى الاتصال بالعيادة.')); return; }

    const url = channel === 'whatsapp'
      ? `https://wa.me/${number}?text=${encodeURIComponent(body)}`
      : `mailto:${address}?subject=${encodeURIComponent(t('Patient referral', 'إحالة مريض'))}&body=${encodeURIComponent(body)}`;

    // Keep a record for the clinic, but never let it block reaching a human.
    mutation.mutate({ data: payload }, { onError: () => undefined });

    openExternal(url, channel === 'whatsapp');
    setSent({ channel, url, body });
  };

  if (sent) return <Shell><main className="page-in mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center lg:py-28">
    <div className="grid size-20 place-items-center rounded-full bg-[hsl(var(--secondary)/.14)] text-[hsl(var(--secondary))]"><Check size={34} /></div>
    <SectionEyebrow>{t('Almost there', 'أوشكت على الانتهاء')}</SectionEyebrow>
    <h1 className="font-serif text-6xl leading-[.9]">{t('One last tap.', 'نقرة أخيرة.')}</h1>
    <p className="mt-6 max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">
      {sent.channel === 'whatsapp'
        ? t('We opened WhatsApp with your referral ready to go. Press send there and the clinical team will have it.', 'فتحنا واتساب وإحالتك جاهزة للإرسال. اضغط إرسال هناك ليصل الطلب إلى الفريق السريري.')
        : t('We opened your email app with the referral ready to go. Press send there and the clinical team will have it.', 'فتحنا تطبيق البريد وإحالتك جاهزة للإرسال. اضغط إرسال هناك ليصل الطلب إلى الفريق السريري.')}
    </p>
    <a href={sent.url} target={sent.channel === 'whatsapp' ? '_blank' : undefined} rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="link-retry-handoff">
      {sent.channel === 'whatsapp' ? <MessageCircle size={16} /> : <Mail size={16} />}
      {sent.channel === 'whatsapp' ? t('Open WhatsApp again', 'افتح واتساب مرة أخرى') : t('Open email again', 'افتح البريد مرة أخرى')}
    </a>

    <section className="mt-12 w-full rounded-[1.4rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)] p-5 text-start sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">{t('Nothing opened?', 'لم يُفتح شيء؟')}</p>
        <CopyButton text={sent.body} />
      </div>
      <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{t('Some browsers block apps from opening automatically. Copy the referral below and send it to us however suits you.', 'تمنع بعض المتصفحات فتح التطبيقات تلقائياً. انسخ الإحالة أدناه وأرسلها إلينا بالطريقة التي تناسبك.')}</p>
      <textarea readOnly value={sent.body} rows={11} dir="auto" data-testid="textarea-referral-text" className="mt-4 w-full resize-y rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 font-mono text-[11px] leading-5 outline-none" />
      <div className="mt-4 flex flex-wrap gap-3">
        {clinic?.whatsapp && <a href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-2.5 text-xs font-bold" data-testid="link-confirm-whatsapp"><MessageCircle size={14} /> {clinic.phone}</a>}
        {clinic?.email && <a href={`mailto:${clinic.email}`} dir="ltr" className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-2.5 text-xs font-bold" data-testid="link-confirm-email"><Mail size={14} /> {clinic.email}</a>}
      </div>
    </section>

    <Link href="/" className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--secondary))]" data-testid="link-referral-home">{t('Return to Mafaz', 'العودة إلى مفاز')} <ArrowRight size={16} className="rtl:rotate-180" /></Link>
  </main></Shell>;

  return <Shell><main className="page-in mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div className="lg:pt-8"><SectionEyebrow>{t('Private clinical line', 'خط سريري خاص')}</SectionEyebrow><h1 className="font-serif text-6xl leading-[.88] tracking-[-.04em] md:text-7xl">{t('Let’s make', 'لنضع')}<br /><i className="text-[hsl(var(--secondary))]">{t('a plan.', 'خطة.')}</i></h1><p className="mt-7 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">{t('A few details help us prepare the right first conversation. No referral jargon required.', 'بعض التفاصيل تساعدنا على تحضير المحادثة الأولى المناسبة. لا حاجة للمصطلحات المعقدة.')}</p><div className="mt-10 space-y-4 border-t border-[hsl(var(--border))] pt-6 text-xs text-[hsl(var(--muted-foreground))]"><div className="flex gap-3"><ShieldCheck size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><span>{t('Your details go straight to the clinical team on WhatsApp or by email — you press send yourself.', 'تصل بياناتك مباشرة إلى الفريق السريري عبر واتساب أو البريد — أنت من يضغط إرسال.')}</span></div><div className="flex gap-3"><Clock3 size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><span>{t('Most referrals receive a response within one working day.', 'تتلقى معظم الإحالات رداً خلال يوم عمل واحد.')}</span></div>{clinic?.email && <div className="flex gap-3"><Mail size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><a href={`mailto:${clinic.email}`} className="hover:text-[hsl(var(--secondary))]" dir="ltr" data-testid="link-referral-email">{clinic.email}</a></div>}</div></div><form onSubmit={event => { event.preventDefault(); handoff(event.currentTarget, 'whatsapp'); }} className="rounded-[1.6rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.68)] p-5 shadow-[0_20px_60px_hsl(var(--primary)/.05)] sm:p-8" data-testid="form-referral"><div className="mb-8 flex items-center justify-between border-b border-[hsl(var(--border))] pb-5"><div><h2 className="font-serif text-3xl">{t('Referral details', 'بيانات الإحالة')}</h2>{referredSolution && <p className="mt-2 text-xs text-[hsl(var(--secondary))]" data-testid="text-referral-context">{t('Regarding', 'بخصوص')}: {t(referredSolution.title, referredSolution.titleArabic)}</p>}</div><FileText className="text-[hsl(var(--secondary))]" size={22} /></div><div className="grid gap-5 sm:grid-cols-2"><Field label={t('Your name', 'اسمك')} required><input name="referrerName" required minLength={2} className={inputClass} placeholder={t('Dr. / Ms. / Mr.', 'د. / السيدة / السيد')} data-testid="input-referrer-name" /></Field><Field label={t('Organization', 'الجهة')} required><input name="organization" required minLength={2} className={inputClass} placeholder={t('Clinic or therapy centre', 'عيادة أو مركز علاجي')} data-testid="input-organization" /></Field><Field label={t('Phone', 'الهاتف')} required><input name="phone" required minLength={5} type="tel" dir="ltr" className={inputClass} placeholder="+962 79 000 0000" data-testid="input-phone" /></Field><Field label={t('Email', 'البريد الإلكتروني')}><input name="email" type="email" dir="ltr" className={inputClass} placeholder="name@clinic.com" data-testid="input-email" /></Field><Field label={t('Patient name', 'اسم المريض')} required><input name="patientName" required minLength={2} className={inputClass} placeholder={t('Full name', 'الاسم الكامل')} data-testid="input-patient-name" /></Field><Field label={t('Patient age', 'العمر')}><input name="patientAge" type="number" min="0" max="120" className={inputClass} placeholder={t('Optional', 'اختياري')} data-testid="input-patient-age" /></Field></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label={t('Area of need', 'مجال الاحتياج')} required><select name="areaOfNeed" required key={defaultArea} defaultValue={defaultArea} className={inputClass} data-testid="select-area"><option value="prosthetics">{t('Prosthetics', 'الأطراف الاصطناعية')}</option><option value="orthotics">{t('Orthotics', 'الأجهزة التقويمية')}</option><option value="other">{t('Other', 'أخرى')}</option></select></Field><Field label={t('Preferred contact', 'طريقة التواصل المفضلة')} required><select name="preferredContact" required defaultValue="phone" className={inputClass} data-testid="select-contact"><option value="phone">{t('Phone', 'الهاتف')}</option><option value="whatsapp">{t('WhatsApp', 'واتساب')}</option><option value="email">{t('Email', 'البريد الإلكتروني')}</option></select></Field></div><div className="mt-6"><Field label={t('What would help us understand?', 'ما الذي يساعدنا على الفهم؟')} required><textarea name="clinicalNotes" required minLength={10} rows={5} className={inputClass} placeholder={t('A short note about the clinical context, goals, or timing...', 'ملاحظة قصيرة عن السياق السريري أو الأهداف أو التوقيت...')} data-testid="input-clinical-notes" /></Field></div>{error && <p className="mt-5 rounded-xl bg-[hsl(var(--accent)/.12)] px-4 py-3 text-sm text-[hsl(var(--foreground))]" role="alert" data-testid="error-referral">{error}</p>}<button type="submit" className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-4 text-sm font-bold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5" data-testid="button-submit-referral"><MessageCircle size={16} /> {t('Send on WhatsApp', 'أرسل عبر واتساب')}</button><button type="button" onClick={event => handoff(event.currentTarget.form as HTMLFormElement, 'email')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))] px-6 py-4 text-sm font-bold transition hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]" data-testid="button-submit-referral-email"><Mail size={16} /> {t('Send by email instead', 'أرسل عبر البريد الإلكتروني')}</button><p className="mt-4 text-center text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">{t('This opens WhatsApp or your email app with the referral filled in. You press send.', 'يفتح هذا واتساب أو تطبيق البريد مع تعبئة الإحالة. أنت من يضغط إرسال.')}</p></form></div></main></Shell>;
}

function Contact() {
  const { t } = useLanguage();
  const query = useGetLocations({ query: { queryKey: getGetLocationsQueryKey(), staleTime: 300000 } });
  const locations = query.data ?? [];
  return <Shell><main className="page-in mx-auto max-w-7xl px-5 py-14 lg:px-10 lg:py-20"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><SectionEyebrow>{t('Come closer', 'اقترب')}</SectionEyebrow><h1 className="font-serif text-7xl leading-[.86] tracking-[-.04em]">{t('Find your', 'اعثر على')}<br /><i className="text-[hsl(var(--secondary))]">{t('way in.', 'طريقك إلينا.')}</i></h1><p className="mt-7 max-w-sm text-base leading-7 text-[hsl(var(--muted-foreground))]">{t('Bring your questions, your current device, or simply the wish to move with more ease.', 'أحضر أسئلتك أو جهازك الحالي، أو ببساطة رغبتك في حركة أسهل.')}</p><div className="mt-10 grid size-36 place-items-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="grid size-24 grid-cols-7 grid-rows-7 gap-1 opacity-70" aria-hidden="true">{Array.from({ length: 49 }, (_, i) => <span key={i} className={`${(i * 17 + 3) % 5 < 2 || [0,1,2,7,9,14,21,28,35,42,43,44,45,46,47,48].includes(i) ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`} />)}</div></div><p className="mt-3 text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">{t('Scan to share Mafaz', 'امسح لمشاركة مفاز')}</p></div><div>{query.isLoading ? <div className="space-y-5"><div className="shimmer h-64 rounded-[1.5rem]" /><div className="shimmer h-64 rounded-[1.5rem]" /></div> : query.isError ? <ErrorBlock onRetry={() => query.refetch()} /> : <div className="space-y-5">{locations.map(location => <article key={location.id} className="rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8" data-testid={`card-location-${location.id}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[hsl(var(--secondary))]">{location.isPrimary && <><span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" /> {t('Primary clinic', 'العيادة الرئيسية')}</>}</span><h2 className="font-serif text-4xl">{t(location.name, location.nameArabic)}</h2></div><MapPin className="text-[hsl(var(--accent))]" size={22} /></div><div className="mt-7 grid gap-5 text-sm text-[hsl(var(--muted-foreground))] sm:grid-cols-2"><div className="flex gap-3"><MapPin size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><span>{t(location.address, 'شارع الرازي، عمّان، الأردن')}</span></div><div className="flex gap-3"><Clock3 size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><span>{t(location.hours, 'السبت–الخميس · ٠٨:٠٠–١٦:٠٠')}</span></div><div className="flex gap-3"><Phone size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><a href={`tel:${location.phone}`} dir="ltr" className="hover:text-[hsl(var(--secondary))]" data-testid={`link-phone-${location.id}`}>{location.phone}</a></div><div className="flex gap-3"><MessageCircle size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><a href={`https://wa.me/${location.whatsapp.replace(/\D/g, '')}`} className="hover:text-[hsl(var(--secondary))]" data-testid={`link-whatsapp-${location.id}`}>{t('WhatsApp', 'واتساب')}</a></div>{location.email && <div className="flex gap-3"><Mail size={17} className="shrink-0 text-[hsl(var(--secondary))]" /><a href={`mailto:${location.email}`} dir="ltr" className="hover:text-[hsl(var(--secondary))]" data-testid={`link-email-${location.id}`}>{location.email}</a></div>}</div><a href={location.mapUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-2.5 text-xs font-bold transition hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]" data-testid={`link-map-${location.id}`}>{t('Open in maps', 'افتح في الخرائط')} <ArrowUpRight size={14} /></a></article>)}</div>}</div></div><div className="mt-20 border-t border-[hsl(var(--border))] pt-8"><p className="text-sm text-[hsl(var(--muted-foreground))]">{t('Prefer a direct conversation?', 'تفضّل محادثة مباشرة؟')} <a className="font-bold text-[hsl(var(--secondary))]" href="tel:+962795185080" dir="ltr" data-testid="link-contact-phone">+962 79 518 5080</a></p></div></main></Shell>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/catalog" component={CatalogIndex} /><Route path="/catalog/:slug/:solutionId" component={SolutionDetail} /><Route path="/catalog/:slug" component={CategoryPage} /><Route path="/outcomes" component={Outcomes} /><Route path="/referral" component={Referral} /><Route path="/contact" component={Contact} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><LanguageProvider><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></LanguageProvider></QueryClientProvider>;
}

export default App;
