import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  AgreementFloor,
  MarketDisclosure,
} from '@/components/opportunities/market-disclosure';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import { SignupCta } from '@/components/jobs/signup-cta';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { listOpportunities } from '@/lib/opportunities';
import { seoMetadata } from '@/lib/seo';

/**
 * Listado de perfiles de mercado (fase 4b, ADR-30).
 *
 * Estática y revalidada cada hora, como el resto de rutas públicas: no lee
 * sesión, ni cookies, ni `searchParams` (ADR-11, ADR-13). Y **sin una sola
 * línea de `JobPosting`**: es lo que separa esta sección de `/ofertas`, y es el
 * interruptor que decide si Google la juzga como oferta de empleo o como
 * contenido ordinario.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Opportunities' });

  return seoMetadata({
    locale,
    href: '/opportunities',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function OpportunitiesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Opportunities');
  const opportunities = await listOpportunities(locale);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="type-h1">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      <MarketDisclosure />

      <div className="flex flex-col gap-3">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.sector} opportunity={opportunity} />
        ))}
      </div>

      <AgreementFloor />

      <section className="flex flex-col gap-3">
        <h2 className="type-h2">{t('ask.title')}</h2>
        <p className="type-body text-muted-foreground">{t('ask.intro')}</p>
        <ul className="flex list-disc flex-col gap-2 pl-5 type-body text-muted-foreground">
          {(t.raw('ask.items') as string[]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="type-body">
        <Link href="/jobs" className="type-link">
          {t('disclosure.jobs')}
        </Link>
      </p>

      <SignupCta variant="opportunities" />
    </div>
  );
}
