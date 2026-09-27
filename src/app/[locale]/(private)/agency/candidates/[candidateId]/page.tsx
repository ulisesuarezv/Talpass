import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { formatActivity, formatExperience } from '@/components/agency/format';
import { Stamps } from '@/components/agency/stamps';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getPoolCandidate } from '@/lib/agency/pool';
import { getAgencyTranslations } from '@/lib/agency/translations';
import { requireArea } from '@/lib/auth/session';
import { listCountries, listSectors } from '@/lib/catalogs';

type Params = Promise<{ locale: string; candidateId: string }>;

/** Un uuid mal formado no llega a Postgres: sería un error 500, no un «no está». */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getAgencyTranslations(locale as Locale);
  return { title: t('meta.pool', { brand: siteConfig.name }) };
}

/**
 * La ficha seudonimizada de un candidato de la bolsa (ADR-03, ADR-52).
 *
 * Todo lo que pinta sale de `candidate_directory`: la ETT no tiene otra puerta.
 * Por eso la ficha termina diciendo qué NO ve, en vez de dejar que lo adivine:
 * para una agencia, saber que el resto existe y está custodiado es parte de
 * lo que la hace confiar en la bolsa.
 */
export default async function AgencyCandidatePage({
  params,
}: {
  params: Params;
}) {
  const { locale, candidateId } = await params;

  await requireArea('/agency', locale);

  const [t, candidate, countries, sectors] = await Promise.all([
    getAgencyTranslations(locale as Locale),
    UUID.test(candidateId) ? getPoolCandidate(candidateId) : null,
    listCountries(locale),
    listSectors(locale),
  ]);

  const back = (
    <Link
      href="/agency"
      className="inline-flex min-h-11 items-center gap-1.5 type-meta text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      {t('candidate.back')}
    </Link>
  );

  // No está, o ya no está: pausó el perfil, dejó de estar verificado, o el id
  // no existe. La página lo dice igual en los tres casos — distinguirlos le
  // contaría a la ETT algo del candidato que la bolsa no le cuenta.
  if (!candidate) {
    return (
      <div className="container-page flex max-w-2xl flex-col gap-3 py-8">
        {back}
        <h1 className="type-h1">{t('candidate.notFound.title')}</h1>
        <p className="type-body text-muted-foreground">
          {t('candidate.notFound.body')}
        </p>
      </div>
    );
  }

  const countryName = (code: string | null) =>
    code ? (countries.find((c) => c.code === code)?.name ?? code) : null;
  const sectorName = (slug: string) =>
    sectors.find((s) => s.slug === slug)?.name ?? slug;
  const yesNo = (value: boolean) => (value ? t('yes') : t('no'));

  const facts: [string, ReactNode][] = [
    [t('candidate.facts.age'), candidate.age ?? '—'],
    [
      t('candidate.facts.livesIn'),
      [candidate.city, countryName(candidate.countryCode)]
        .filter(Boolean)
        .join(', ') || '—',
    ],
    [
      t('candidate.facts.nationality'),
      countryName(candidate.nationalityCode) ?? '—',
    ],
    [
      t('candidate.facts.english'),
      candidate.englishLevel ? t(`levels.${candidate.englishLevel}`) : '—',
    ],
    [t('candidate.facts.drivingLicense'), yesNo(candidate.hasDrivingLicense)],
    [t('candidate.facts.workedAbroad'), yesNo(candidate.workedInNlDe)],
    [t('candidate.facts.housing'), yesNo(candidate.needsHousing)],
    [t('candidate.facts.transport'), yesNo(candidate.needsTransport)],
    [
      t('candidate.facts.lastActive'),
      formatActivity(t, candidate.lastActivityAt) ?? '—',
    ],
  ];

  return (
    <div className="container-page flex flex-col gap-6 py-6 sm:py-8">
      {back}

      <header className="flex flex-col gap-2">
        <h1 className="type-h1">{candidate.displayName}</h1>
        <p className="type-body text-muted-foreground">
          {[
            candidate.age != null
              ? t('card.age', { age: candidate.age })
              : null,
            candidate.englishLevel
              ? t('englishLevel', {
                  level: t(`levels.${candidate.englishLevel}`),
                })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-10">
        <div className="flex flex-col gap-8">
          {candidate.sectors.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="type-h4">{t('candidate.sectors')}</h2>
              <ul className="flex flex-wrap gap-2">
                {candidate.sectors.map((sector) => (
                  <li
                    key={sector.slug}
                    className="rounded-full bg-brand-soft px-3 py-1 type-meta"
                  >
                    <span className="font-medium">
                      {sectorName(sector.slug)}
                    </span>{' '}
                    · {formatExperience(t, sector.months)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <h2 className="type-h4">{t('candidate.experience')}</h2>
            {candidate.workExperience ? (
              <>
                <blockquote className="border-l-2 border-brand/60 pl-4 type-body">
                  {candidate.workExperience}
                </blockquote>
                <p className="type-caption text-muted-foreground">
                  {t('candidate.experienceNote')}
                </p>
              </>
            ) : (
              <p className="type-body text-muted-foreground">
                {t('candidate.noExperience')}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="type-h4">{t('candidate.facts.title')}</h2>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <dt className="fact-label">{label}</dt>
                  <dd className="fact-value">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="type-h4">
              {t('candidate.verified.title', { brand: siteConfig.name })}
            </h2>
            <Stamps stamps={candidate.stamps} t={t} />
            <p className="type-caption text-muted-foreground">
              {t('candidate.verified.body', { brand: siteConfig.name })}
            </p>
          </section>

          <section className="flex flex-col gap-2 rounded-xl bg-muted p-4">
            <h2 className="type-h4">{t('candidate.private.title')}</h2>
            <ul className="flex list-disc flex-col gap-1 pl-4 type-caption text-muted-foreground">
              {(t.raw('candidate.private.items') as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
