import { Link } from 'wouter';
import { ArrowUpRight, Compass } from 'lucide-react';
import { useLanguage } from '@/i18n/language';
import { usePageMeta } from '@/lib/page-meta';

/**
 * Shown for an unknown URL, and for a catalog category the API does not know.
 * A dead end is recoverable here rather than a full stop: every route out is
 * one tap away.
 */
export function NotFoundBody({ heading, body }: { heading?: string; body?: string } = {}) {
  const { t } = useLanguage();
  usePageMeta(t('Page not found', 'الصفحة غير موجودة'));

  const routes = [
    { href: '/catalog', label: t('Browse the catalog', 'تصفّح الكتالوج') },
    { href: '/referral', label: t('Refer a patient', 'إحالة مريض') },
    { href: '/outcomes', label: t('Clinical outcomes', 'النتائج السريرية') },
    { href: '/contact', label: t('Contact the clinic', 'تواصل مع العيادة') },
  ];

  return <main id="main" className="page-in mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center lg:py-32" data-testid="page-not-found">
    <div className="grid size-16 place-items-center rounded-full bg-[hsl(var(--secondary)/.12)] text-[hsl(var(--secondary))]"><Compass size={28} /></div>
    <h1 className="mt-7 font-serif text-6xl leading-[.92] tracking-[-.03em]">{heading ?? t('This page moved on.', 'هذه الصفحة لم تعد هنا.')}</h1>
    <p className="mt-6 max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">{body ?? t('The link may be out of date. Everything on the site is a step away from here.', 'قد يكون الرابط قديماً. كل ما في الموقع على بُعد خطوة من هنا.')}</p>
    <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
      {routes.map(route => <Link key={route.href} href={route.href} data-testid={`link-notfound-${route.href.replace('/', '')}`}
        className="flex items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 text-sm font-bold transition hover:-translate-y-0.5 hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary))]">
        {route.label}<ArrowUpRight size={16} />
      </Link>)}
    </div>
  </main>;
}

export default NotFoundBody;
