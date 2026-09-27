import { ChevronDownIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { PoolCard } from '@/components/agency/pool-card';
import { PoolFiltersForm } from '@/components/agency/pool-filters';
import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';
import { getCurrentAgency } from '@/lib/agency/agency';
import { listPool, parsePoolFilters } from '@/lib/agency/pool';
import { getAgencyTranslations } from '@/lib/agency/translations';
import { requireArea } from '@/lib/auth/session';
import { listCountries, listSectors } from '@/lib/catalogs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getAgencyTranslations(locale as Locale);
  return { title: t('meta.pool', { brand: siteConfig.name }) };
}

/**
 * La bolsa: la pantalla de entrada de una ETT (fase 7, adelantada por ADR-52).
 *
 * Es lo primero que se le enseña a una agencia porque es lo que no tiene en
 * ningún otro sitio: candidatos ya verificados, con los papeles comprobados y
 * su inglés grabado, sin tener que pedir un solo documento para decidir si le
 * interesan.
 */
export default async function AgencyPoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;

  // Un candidato que abra esta URL no ve un error: sale hacia su propia área.
  const session = await requireArea('/agency', locale);

  const [t, agency, sectors, countries] = await Promise.all([
    getAgencyTranslations(locale as Locale),
    getCurrentAgency(session.userId),
    listSectors(locale),
    listCountries(locale),
  ]);

  if (!agency) {
    return (
      <div className="container-page flex max-w-2xl flex-col gap-3 py-12">
        <h1 className="type-h1">{t('noAgency.title')}</h1>
        <p className="type-body text-muted-foreground">
          {t('noAgency.body', { brand: siteConfig.name })}
        </p>
      </div>
    );
  }

  const filters = parsePoolFilters(
    await searchParams,
    sectors.map((sector) => sector.slug),
    agency.countryCode,
  );
  const pool = await listPool(filters);

  const countryNames = new Map(countries.map((c) => [c.code, c.name]));
  const sectorNames = new Map(sectors.map((s) => [s.slug, s.name]));
  const countryName = (code: string | null) =>
    code ? (countryNames.get(code) ?? code) : null;
  const sectorName = (slug: string) => sectorNames.get(slug) ?? slug;

  const activeFilters = Object.values(filters).filter(Boolean).length;

  const filtersProps = {
    filters,
    sectors,
    countryName: countryName(agency.countryCode) ?? agency.countryCode,
    t,
  };

  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <header className="flex max-w-2xl flex-col gap-2">
        <p className="type-eyebrow">
          {t('pool.eyebrow', { agency: agency.name })}
        </p>
        <h1 className="type-h1">{t('pool.title')}</h1>
        <p className="type-body text-muted-foreground">{t('pool.intro')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-10">
        {/* En móvil los filtros van plegados: la lista es lo que se viene a
            ver, y desplegarlos es un toque. `<details>` nativo, sin JS. Si
            hay filtros puestos, llega abierto para que se vea por qué la
            lista es más corta. */}
        <details
          open={activeFilters > 0}
          className="group rounded-xl border bg-card p-4 lg:hidden"
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 type-meta font-medium [&::-webkit-details-marker]:hidden">
            <span>
              {t('pool.filters.title')}
              {activeFilters > 0 ? ` · ${activeFilters}` : null}
            </span>
            <ChevronDownIcon
              aria-hidden
              className="size-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="pt-3">
            <PoolFiltersForm idPrefix="pool-m" {...filtersProps} />
          </div>
        </details>

        <aside className="hidden lg:block">
          <h2 className="mb-3 type-h4">{t('pool.filters.title')}</h2>
          <PoolFiltersForm idPrefix="pool-d" {...filtersProps} />
        </aside>

        <section className="flex flex-col gap-3" aria-live="polite">
          <p className="type-meta font-medium">
            {t('pool.results', { count: pool.length })}
          </p>

          {pool.length === 0 ? (
            <p className="rounded-xl border bg-card p-5 type-body text-muted-foreground">
              {t('pool.empty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pool.map((candidate) => (
                <li key={candidate.id}>
                  <PoolCard
                    candidate={candidate}
                    t={t}
                    countryName={countryName}
                    sectorName={sectorName}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
