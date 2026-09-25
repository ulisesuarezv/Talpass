import 'server-only';

import { cache } from 'react';

import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import { listPublishedJobs, type JobSummary } from '@/lib/jobs';
import { listOpportunities, type Opportunity } from '@/lib/opportunities';
import type { Href } from '@/lib/seo';

/**
 * Landings programáticas (ADR-11, ADR-23, enmendada por ADR-50).
 *
 * El motor de tráfico de un job board no es la portada: son las páginas de
 * long-tail —"trabajo en Alemania", "trabajo en Berlín", "logística en
 * Alemania", "trabajo con alojamiento en Alemania"— enlazadas con las vacantes
 * en los dos sentidos.
 *
 * **Una landing existe si tiene contenido**, y hay dos fuentes de contenido:
 *
 * 1. **Vacantes vivas**, que es la regla original de ADR-23 y sostiene las
 *    cuatro familias: país, país + sector, país + alojamiento y ciudad.
 * 2. **Un perfil de mercado** (ADR-30), y **solo para país + sector**: los
 *    cinco perfiles de `lib/opportunities.ts` tienen cifras fechadas, jornada,
 *    turnos, idioma y texto editorial largo, que es exactamente lo que a una
 *    landing vacía le falta. Es la enmienda que ADR-23 ya tenía anotada y que
 *    ADR-50 cierra: sin ella los diez 301 de ADR-49 y los cinco enlaces de las
 *    tarjetas acaban en 404 mientras no haya vacantes.
 *
 * Lo que **no** cambia: el producto cartesiano de catálogos sigue prohibido.
 * Los perfiles son cinco y contarlos es la contención (ADR-30), no un límite
 * escrito en el código. Las landings de país, de ciudad y de alojamiento siguen
 * derivando solo de vacantes: un perfil describe un sector, no una ciudad.
 */

export type LandingKind = 'country' | 'sector' | 'housing' | 'city';

export type Landing = {
  kind: LandingKind;
  /** Ruta interna de `pathnames`, la que entiende `getPathname`. */
  pathname:
    | '/work/[country]'
    | '/work/[country]/[sector]'
    | '/work/[country]/with-housing'
    | '/work/city/[city]';
  /** Segmentos de URL por idioma: `es → { country: 'alemania' }`. */
  paramsByLocale: Record<Locale, Record<string, string>>;
  /** Lo que se pone en el `h1`, por idioma. */
  placeByLocale: Record<Locale, string>;
  sectorByLocale: Record<Locale, string> | null;
  jobs: JobSummary[];
};

/**
 * Las vacantes se leen una sola vez por idioma y render. `cache` no cruza
 * páginas del build, pero evita que una landing consulte lo mismo dos veces.
 */
const jobsFor = cache((locale: string) => listPublishedJobs(locale));

function group<K extends string>(
  jobs: JobSummary[],
  key: (job: JobSummary) => K | null,
): Map<K, JobSummary[]> {
  const groups = new Map<K, JobSummary[]>();

  for (const job of jobs) {
    const value = key(job);
    if (value === null) continue;

    const bucket = groups.get(value);
    if (bucket) bucket.push(job);
    else groups.set(value, [job]);
  }

  return groups;
}

/** Identidad de una landing de país + sector, para no duplicar una URL. */
function sectorKey(params: Record<string, string>): string {
  return `${params.country}/${params.sector}`;
}

function localeMap<T>(build: (locale: Locale) => T): Record<Locale, T> {
  return Object.fromEntries(locales.map((l) => [l, build(l)])) as Record<
    Locale,
    T
  >;
}

/**
 * Todas las landings vivas. Basta leer las vacantes en un idioma: cada
 * `JobSummary` trae ya el nombre y el slug de su país y de su sector en TODOS
 * los idiomas, porque la landing es la misma entidad en `es` y en `en` y lo
 * único que cambia es la URL.
 */
export const listLandings = cache(async (): Promise<Landing[]> => {
  const jobs = await jobsFor(locales[0]);
  const landings: Landing[] = [];

  for (const [, inCountry] of group(jobs, (job) => job.countryCode)) {
    const country = inCountry[0];
    const countryParams = localeMap((l) => ({
      country: country.countrySlugs[l],
    }));
    const countryNames = localeMap((l) => country.countryNames[l]);

    landings.push({
      kind: 'country',
      pathname: '/work/[country]',
      paramsByLocale: countryParams,
      placeByLocale: countryNames,
      sectorByLocale: null,
      jobs: inCountry,
    });

    const withHousing = inCountry.filter((job) => job.housingProvided);
    if (withHousing.length > 0) {
      landings.push({
        kind: 'housing',
        pathname: '/work/[country]/with-housing',
        paramsByLocale: countryParams,
        placeByLocale: countryNames,
        sectorByLocale: null,
        jobs: withHousing,
      });
    }

    for (const [, inSector] of group(inCountry, (job) => job.sectorId)) {
      const sector = inSector[0];

      landings.push({
        kind: 'sector',
        pathname: '/work/[country]/[sector]',
        paramsByLocale: localeMap((l) => ({
          country: country.countrySlugs[l],
          sector: sector.sectorSlugs[l],
        })),
        placeByLocale: countryNames,
        sectorByLocale: localeMap((l) => sector.sectorNames[l]),
        jobs: inSector,
      });
    }
  }

  // Landings de perfil de mercado (ADR-50). Van DESPUÉS del bucle de vacantes
  // a propósito: si el par país + sector ya existe porque hay una vacante viva,
  // manda esa landing —con su lista de vacantes— y el perfil se pinta debajo,
  // en su propio bloque. Nunca hay dos landings para la misma URL.
  const existing = new Set(
    landings
      .filter((landing) => landing.kind === 'sector')
      .map((landing) => sectorKey(landing.paramsByLocale[locales[0]])),
  );

  // Los cinco perfiles en los dos idiomas: la URL sí viaja dentro de cada
  // `Opportunity` (`paramsByLocale`), pero el nombre traducido del país y del
  // sector no, y el `h1` y el `hreflang` los necesitan en todos los idiomas.
  const profilesByLocale = Object.fromEntries(
    await Promise.all(
      locales.map(async (locale) => [
        locale,
        new Map(
          (await listOpportunities(locale)).map((profile) => [
            profile.sector,
            profile,
          ]),
        ),
      ]),
    ),
  ) as Record<Locale, Map<string, Opportunity>>;

  for (const profile of profilesByLocale[locales[0]].values()) {
    if (existing.has(sectorKey(profile.paramsByLocale[locales[0]]))) continue;

    const inLocale = (locale: Locale) =>
      profilesByLocale[locale].get(profile.sector) ?? profile;

    landings.push({
      kind: 'sector',
      pathname: '/work/[country]/[sector]',
      paramsByLocale: localeMap((l) => ({ ...profile.paramsByLocale[l] })),
      placeByLocale: localeMap((l) => inLocale(l).countryName),
      sectorByLocale: localeMap((l) => inLocale(l).sectorName),
      jobs: [],
    });
  }

  for (const [citySlug, inCity] of group(jobs, (job) => job.citySlug)) {
    const city = inCity[0].city ?? citySlug;

    landings.push({
      kind: 'city',
      pathname: '/work/city/[city]',
      paramsByLocale: localeMap(() => ({ city: citySlug })),
      // El nombre de una ciudad es un dato de la vacante, no un catálogo
      // traducido: se muestra tal cual lo escribió la ETT en los dos idiomas.
      placeByLocale: localeMap(() => city),
      sectorByLocale: null,
      jobs: inCity,
    });
  }

  return landings;
});

type Resolved = { landing: Landing; jobs: JobSummary[] } | null;

/**
 * Resuelve una URL de landing en el idioma pedido.
 *
 * Devuelve `null` si esa combinación no existe —y entonces la página hace 404—,
 * **pero existir ya no es lo mismo que tener vacantes** (ADR-50): una landing de
 * país + sector con perfil de mercado resuelve con `jobs: []`, y la página pinta
 * el perfil. Quien lea `jobs.length === 0` como "esto no existe" reintroduce los
 * 404 que ADR-49 dejó abiertos.
 */
export async function resolveLanding(
  kind: LandingKind,
  locale: Locale,
  params: Record<string, string>,
): Promise<Resolved> {
  const landings = await listLandings();

  const landing = landings.find(
    (candidate) =>
      candidate.kind === kind &&
      Object.entries(params).every(
        ([key, value]) => candidate.paramsByLocale[locale][key] === value,
      ),
  );

  if (!landing) return null;

  // Se vuelven a leer las vacantes en el idioma de la página: la lista de
  // `listLandings` está traducida al idioma por defecto.
  const jobs = await jobsFor(locale);
  const ids = new Set(landing.jobs.map((job) => job.id));

  return { landing, jobs: jobs.filter((job) => ids.has(job.id)) };
}

/**
 * Ruta de la landing **en función del idioma**.
 *
 * Es lo que hace que el `hreflang` y el sitemap apunten a `/en/work/germany` y
 * no a `/en/work/alemania`: en una landing el slug es parte de la traducción,
 * así que no se puede reutilizar el del idioma actual para el otro.
 */
export function landingHref(landing: Landing): (locale: Locale) => Href {
  return (locale) =>
    ({
      pathname: landing.pathname,
      params: landing.paramsByLocale[locale],
    }) as Href;
}

/** Params de `generateStaticParams`, ya en el idioma de la ruta. */
export async function landingParams(
  kind: LandingKind,
  locale: Locale,
): Promise<Record<string, string>[]> {
  const landings = await listLandings();

  return landings
    .filter((landing) => landing.kind === kind)
    .map((landing) => landing.paramsByLocale[locale]);
}
