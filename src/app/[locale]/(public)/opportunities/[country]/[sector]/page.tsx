import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

import { SignupCta } from '@/components/jobs/signup-cta';
import { formatMarketSalary } from '@/components/opportunities/format-market-salary';
import {
  AgreementFloor,
  MarketDisclosure,
} from '@/components/opportunities/market-disclosure';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  AGREEMENT_FLOOR,
  getOpportunity,
  listOpportunities,
  opportunityHref,
} from '@/lib/opportunities';
import { seoMetadata } from '@/lib/seo';

/**
 * Perfil de mercado: `/es/oportunidades/alemania/almacen`.
 *
 * **Cero `JobPosting`.** No es un descuido ni una simplificación: el marcado es
 * una declaración legible por máquina de que ese empleo existe y está abierto, y
 * ponerlo aquí arriesga una acción manual por *job posting spam* en el canal del
 * que depende toda la estrategia de SEO (fase 4b, regla 1). Sin él, la página es
 * contenido ordinario y Google la juzga por su calidad, que es lo que se busca.
 *
 * `dynamicParams = false` como en las landings: los perfiles son cinco y están
 * en el código, así que lo que no se ha generado no existe.
 */
export const revalidate = 3600;
export const dynamicParams = false;

type Params = { locale: Locale; country: string; sector: string };

/**
 * Sustituye `{clave}` en una línea de copy.
 *
 * Hace falta porque `tasks`, `requirements` y `conditions` son **listas**, y de
 * una lista next-intl solo devuelve el valor crudo: `t.raw` no interpola. La
 * alternativa era escribir el suelo del convenio dentro del texto traducido, y
 * entonces la cifra caduca en septiembre sin que nadie se entere. Así vive en
 * un solo sitio, `AGREEMENT_FLOOR`.
 */
function fill(line: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    line,
  );
}

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const opportunities = await listOpportunities(params.locale as Locale);

  return opportunities.map(
    (opportunity) => opportunity.paramsByLocale[params.locale as Locale],
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, country, sector } = await params;
  const opportunity = await getOpportunity(locale, { country, sector });

  if (!opportunity) return {};

  const t = await getTranslations({ locale, namespace: 'Opportunities' });

  return seoMetadata({
    locale,
    href: opportunityHref(opportunity),
    title: t('detail.metaTitle', {
      sector: t(`profiles.${opportunity.sector}.title`),
      country: opportunity.countryName,
    }),
    description: t(`profiles.${opportunity.sector}.summary`),
  });
}

export default async function OpportunityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, country, sector } = await params;
  setRequestLocale(locale);

  const opportunity = await getOpportunity(locale, { country, sector });
  if (!opportunity) notFound();

  const t = await getTranslations('Opportunities');
  const tJobs = await getTranslations('Jobs');
  const format = await getFormatter();

  const profile = `profiles.${opportunity.sector}`;
  const cities = t(`${profile}.cities`);

  const money = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: AGREEMENT_FLOOR.currency,
      maximumFractionDigits: 2,
    });

  const conditionValues = {
    floor: money(AGREEMENT_FLOOR.amount),
    floorDate: format.dateTime(new Date(AGREEMENT_FLOOR.since), {
      dateStyle: 'long',
    }),
  };

  const sections = [
    { key: 'tasks', items: t.raw(`${profile}.tasks`) as string[] },
    {
      key: 'requirements',
      items: t.raw(`${profile}.requirements`) as string[],
    },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {t('detail.eyebrow')}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {t(`${profile}.title`)}
        </h1>
        <p className="text-muted-foreground">
          {[t(`${profile}.region`), opportunity.countryName]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="text-lg font-semibold">
          {formatMarketSalary(opportunity, t, tJobs, format)}
        </p>
        <p className="text-xs text-muted-foreground">
          {opportunity.salary.basis === 'observed'
            ? t('facts.basisObserved')
            : t('facts.basisAgreement')}
        </p>
      </header>

      <MarketDisclosure />

      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-3">
        <Fact label={t('facts.weeklyHoursLabel')}>
          {opportunity.weeklyHours === null
            ? t('facts.unknown')
            : opportunity.weeklyHours.min === opportunity.weeklyHours.max
              ? t('facts.weeklyHours', {
                  hours: format.number(opportunity.weeklyHours.min),
                })
              : t('facts.weeklyHoursRange', {
                  min: format.number(opportunity.weeklyHours.min),
                  max: format.number(opportunity.weeklyHours.max),
                })}
        </Fact>

        <Fact label={t('facts.languageLabel')}>
          {opportunity.germanLevel
            ? t('facts.languageLevel', {
                level: opportunity.germanLevel.toUpperCase(),
              })
            : t('facts.unknown')}
        </Fact>

        <Fact label={t('facts.housingLabel')}>
          {opportunity.housing === 'sometimes'
            ? t('facts.perkSometimes')
            : t('facts.perkUndocumented')}
        </Fact>

        <Fact label={t('facts.transportLabel')}>
          {opportunity.transport === 'sometimes'
            ? t('facts.perkSometimes')
            : t('facts.perkUndocumented')}
        </Fact>

        <Fact label={t('facts.shiftsLabel')}>
          <span className="flex flex-wrap gap-1">
            {opportunity.shifts.map((shift) => (
              <Badge key={shift} variant="outline">
                {tJobs(`shifts.${shift}`)}
              </Badge>
            ))}
          </span>
        </Fact>

        {cities ? <Fact label={t('card.regionLabel')}>{cities}</Fact> : null}
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {t('detail.sections.intro')}
        </h2>
        <p className="text-sm text-muted-foreground">{t(`${profile}.intro`)}</p>
      </section>

      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t(`detail.sections.${section.key}`)}
          </h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {t('detail.sections.conditions')}
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
          {(t.raw(`${profile}.conditions`) as string[]).map((item) => (
            <li key={item}>{fill(item, conditionValues)}</li>
          ))}
        </ul>
      </section>

      <AgreementFloor />

      <SignupCta variant="opportunities" />

      <Separator />

      <p className="text-sm">
        <Link href="/opportunities" className="underline underline-offset-4">
          {t('detail.back')}
        </Link>
      </p>
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
