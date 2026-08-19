import 'server-only';

import { cache } from 'react';

import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import { listCountries, listSectors } from '@/lib/catalogs';
import type { Href } from '@/lib/seo';

/**
 * Oportunidades de mercado (fase 4b, ADR-30).
 *
 * **Una oportunidad NUNCA es una fila en `jobs`.** No es una restricción de
 * estilo: si viviera en esa tabla, el listado de vacantes, el sitemap, el
 * marcado `JobPosting`, las landings de ADR-23 y —en la fase 5— el botón de
 * aplicar la tratarían automáticamente como una vacante real, y una sola
 * bandera olvidada publicaría exactamente lo que esta fase existe para no
 * publicar. Aquí el error es estructuralmente imposible: no hay tabla, no hay
 * migración y no hay ningún camino desde este fichero hasta `jobs`.
 *
 * Lo que sí describen estos perfiles es cierto y está fechado: sale de
 * `docs/investigacion/ofertas-mercado.md` (14 ofertas reales analizadas el
 * 2026-08-16) y del convenio de la Zeitarbeit. No hay una empresa detrás, no
 * hay fecha de incorporación y no se puede aplicar.
 *
 * ## Por qué no son ficheros en `content/opportunities/`
 *
 * ADR-28 publica las vacantes por fichero + script porque una vacante es **dato
 * que un operador publica sin desplegar**: entra, se corrige y caduca al ritmo
 * de la ETT. Una oportunidad es lo contrario —contenido editorial del sitio,
 * cinco perfiles que cambian cuando cambia el convenio— así que viaja con el
 * código y se revisa en el diff. Montarle un cargador de ficheros y un script
 * de publicación sería ceremonia sin nadie que la use, y el `import` de un
 * módulo tipado da algo que el JSON no da: si alguien escribe un sector que no
 * existe, el build se para.
 *
 * El copy no está aquí: vive en `messages/<locale>.json`, bajo
 * `Opportunities.profiles.<sector>`, como el resto del texto del sitio.
 */

export type Shift = 'morning' | 'afternoon' | 'night' | 'rotating';

/**
 * De dónde sale la franja salarial, y se dice en la página.
 *
 * - `observed`: **rango observado puro** (ADR-31, 2026-08-19). Los dos
 *   extremos salen de ofertas concretas de `docs/investigacion/ofertas-mercado.md`,
 *   y el comentario de cada perfil dice de cuáles. Se abandonó la fórmula
 *   mixta «suelo del convenio + techo observado»: mezclaba un dato legal con
 *   uno medido bajo una sola etiqueta que afirmaba una procedencia que la
 *   cifra no tenía (hallazgos R1 y R2 de la auditoría del 2026-08-18). El
 *   suelo del convenio no se va de la página: vive en `Opportunities.agreement`,
 *   que es su sitio, y manda por encima de lo medido.
 * - `agreement`: no hay rango en la muestra para ese sector, así que se publica
 *   **solo el suelo del convenio**, que es un hecho legal y aplica a todo el
 *   trabajo por ETT. Inventar el techo sería exactamente lo que esta fase
 *   existe para no hacer.
 */
export type SalaryBasis = 'observed' | 'agreement';

/** Qué se sabe de un extra (alojamiento, transporte) en este perfil. */
export type PerkAvailability = 'sometimes' | 'undocumented';

export type OpportunityProfile = {
  /** Slug del sector en el catálogo (ADR-07). Es la clave del copy y de la URL. */
  sector: string;
  countryCode: string;
  salary: {
    min: number;
    /** `null` cuando la base es el convenio: hay suelo, no hay techo observado. */
    max: number | null;
    currency: string;
    period: 'hour';
    basis: SalaryBasis;
  };
  weeklyHours: { min: number; max: number } | null;
  shifts: Shift[];
  /**
   * Nivel de alemán típico según la muestra, o `null` si no lo documenta.
   *
   * `null` significa "no lo sabemos", **no** "no hace falta alemán". Es la
   * diferencia entre informar y prometer, y la muestra no da para prometer:
   * 11 de 14 ofertas exigen alemán y solo 3 lo miden con la escala MCER.
   */
  germanLevel: 'a2' | 'b1' | null;
  housing: PerkAvailability;
  transport: PerkAvailability;
};

/**
 * Los perfiles publicados. **Cinco, y la contención es el punto:** con el
 * contenido que da la investigación, multiplicar ciudad × sector hasta cincuenta
 * páginas las convierte en *doorway pages*, que sí es un problema de calidad.
 *
 * Cada uno es un sector del catálogo, y solo hay uno por sector: es lo que hace
 * que la URL sea idéntica a la de su landing y que el 301 del día que se
 * retiren sea mecánico (ADR-30).
 *
 * Lo que NO está aquí y se anotó: el mecanizado CNC, que es la franja mejor
 * documentada de la investigación (21–25 €/h). No tiene sector en el catálogo
 * —`metalworking` es un alta propuesta en `§3.1` del informe— y sin sector no
 * puede haber landing equivalente a la que redirigir. Entra el día que entre el
 * catálogo, no antes.
 */
export const OPPORTUNITY_PROFILES: readonly OpportunityProfile[] = [
  {
    // Rango observado puro (ADR-31): 15,69 – 17,50. Suelo = R2, R4 y R5, las
    // tres con Staplerschein, que arrancan las tres en 15,69. Techo = R4 y R5
    // (17,50); R2 se queda en 16,21. Informe §1 (fichas de Randstad) y §2.1,
    // tabla de rangos observados. **No se usa la regla 3 del informe
    // (15,50–18,00): es una franja para redactar anuncios, no una medición**,
    // y publicarla bajo la etiqueta «observado» fue el hallazgo R1.
    sector: 'warehouse',
    countryCode: 'DE',
    salary: {
      min: 15.69,
      max: 17.5,
      currency: 'EUR',
      period: 'hour',
      basis: 'observed',
    },
    weeklyHours: { min: 40, max: 40 },
    shifts: ['rotating', 'night'],
    germanLevel: 'a2',
    // ⚠️ La muestra dice alojamiento 0/14 y transporte 0/14, y 14/14 callan
    // (informe §0, §1 y §2.6). Publicar 'sometimes' es una decisión de Ulises
    // del 2026-08-19 —reclamo temporal para captar las primeras 30 personas—,
    // no un descuido: hallazgo R3 de la auditoría, pendiente de revisar.
    housing: 'sometimes',
    transport: 'sometimes',
  },
  {
    // Rango observado puro (ADR-31): 15,69 – 17,50. Las seis ofertas del bloque
    // de almacén y logística son R2, R4, R5, T1, T2 y T3, y solo las tres de
    // Randstad dan cifra: R2 15,69–16,21, R4 y R5 15,69–17,50 (informe §1).
    // Coincide con `warehouse` porque salen de las mismas tres ofertas.
    // El suelo era el del convenio (15,33) bajo etiqueta de observado, que es
    // justo lo que ADR-31 prohibe: el mínimo tiene que estar medido.
    sector: 'logistics',
    countryCode: 'DE',
    salary: {
      min: 15.69,
      max: 17.5,
      currency: 'EUR',
      period: 'hour',
      basis: 'observed',
    },
    weeklyHours: { min: 40, max: 40 },
    shifts: ['morning', 'afternoon', 'night', 'rotating'],
    germanLevel: 'a2',
    // ⚠️ La muestra dice alojamiento 0/14 y transporte 0/14, y 14/14 callan
    // (informe §0, §1 y §2.6). Publicar 'sometimes' es una decisión de Ulises
    // del 2026-08-19 —reclamo temporal para captar las primeras 30 personas—,
    // no un descuido: hallazgo R3 de la auditoría, pendiente de revisar.
    housing: 'sometimes',
    transport: 'sometimes',
  },
  {
    // Rango observado puro (ADR-31): 14,96 – 16,50, que es R3 (Dresde),
    // la única oferta de producción sin cualificar con cifra (informe §1 y
    // §2.1). **R1 (Hamburgo, 19,31 – 24,85) queda fuera a propósito**: es
    // Vollkonti con aptitud médica y cliente industrial grande, otra franja
    // (§2.1, regla 4), y se publica aparte en `production.intro`. El techo
    // anterior de 17,00 salía de la regla 2 de redacción y no se observó en
    // ninguna oferta: hallazgo R2 de la auditoría.
    //
    // ⚠️ El mínimo de 14,96 era el suelo del convenio hasta el 2026-09-01;
    // ese día el suelo legal pasa a 15,33 y esta página enseñará un mínimo
    // medido por debajo del suelo vigente. No es falso —está fechado— pero
    // `production.conditions[0]` lo dice expresamente. Revisar el 2026-09-01.
    sector: 'production',
    countryCode: 'DE',
    salary: {
      min: 14.96,
      max: 16.5,
      currency: 'EUR',
      period: 'hour',
      basis: 'observed',
    },
    weeklyHours: { min: 35, max: 40 },
    shifts: ['morning', 'afternoon', 'rotating'],
    germanLevel: 'a2',
    // ⚠️ La muestra dice alojamiento 0/14 y transporte 0/14, y 14/14 callan
    // (informe §0, §1 y §2.6). Publicar 'sometimes' es una decisión de Ulises
    // del 2026-08-19 —reclamo temporal para captar las primeras 30 personas—,
    // no un descuido: hallazgo R3 de la auditoría, pendiente de revisar.
    housing: 'sometimes',
    transport: 'sometimes',
  },
  {
    // Sin rango en la muestra: estos sectores no se anuncian en los portales
    // domésticos de Randstad, Adecco y Tempton (§3.1 del informe). Lo que sí es
    // cierto es el suelo del convenio, porque se contrata por ETT.
    sector: 'meat-processing',
    countryCode: 'DE',
    salary: {
      min: 15.33,
      max: null,
      currency: 'EUR',
      period: 'hour',
      basis: 'agreement',
    },
    weeklyHours: null,
    shifts: ['morning', 'afternoon', 'rotating'],
    germanLevel: null,
    housing: 'undocumented',
    transport: 'undocumented',
  },
  {
    sector: 'agriculture',
    countryCode: 'DE',
    salary: {
      min: 15.33,
      max: null,
      currency: 'EUR',
      period: 'hour',
      basis: 'agreement',
    },
    weeklyHours: null,
    shifts: ['morning', 'afternoon'],
    germanLevel: null,
    housing: 'undocumented',
    transport: 'undocumented',
  },
] as const;

/** La fecha de consulta del informe, que se enseña en la página. */
export const OPPORTUNITY_SOURCE_DATE = '2026-08-16';

/** La subida del convenio de la Zeitarbeit que ya está anunciada. */
export const AGREEMENT_FLOOR = {
  amount: 15.33,
  currency: 'EUR',
  since: '2026-09-01',
} as const;

export type Opportunity = OpportunityProfile & {
  /** Nombre traducido del sector y del país, ya en el idioma pedido. */
  sectorName: string;
  countryName: string;
  /**
   * Segmentos de URL por idioma. Son **exactamente** los de la landing de
   * país + sector: `{ country: 'alemania', sector: 'almacen' }`.
   */
  paramsByLocale: Record<Locale, { country: string; sector: string }>;
};

function localeMap<T>(build: (locale: Locale) => T): Record<Locale, T> {
  return Object.fromEntries(locales.map((l) => [l, build(l)])) as Record<
    Locale,
    T
  >;
}

/**
 * Los perfiles resueltos contra el catálogo, en el idioma pedido.
 *
 * Los slugs **se derivan del catálogo, no se escriben a mano** (ADR-23). Es lo
 * que garantiza que `/es/oportunidades/alemania/almacen` y la landing
 * `/es/trabajo/alemania/almacen` compartan segmentos hasta el último carácter:
 * no hay dos listas que mantener sincronizadas, hay una.
 */
export const listOpportunities = cache(
  async (locale: Locale): Promise<Opportunity[]> => {
    const [countries, sectors] = await Promise.all([
      listCountries(locale),
      listSectors(locale),
    ]);

    return OPPORTUNITY_PROFILES.map((profile) => {
      const country = countries.find((c) => c.code === profile.countryCode);
      // Se empareja por el slug de catálogo, que es la fila; no por el nombre
      // traducido, que es copy y se puede reescribir sin migración.
      const sector = sectors.find((s) => s.slug === profile.sector);

      // Se rompe el build en vez de servir una página a medias: una oportunidad
      // cuyo sector ya no existe en el catálogo tampoco tendría landing a la
      // que redirigir el día que se retire (ADR-30).
      if (!country) {
        throw new Error(
          `Oportunidad "${profile.sector}": el país ${profile.countryCode} no está en el catálogo de países.`,
        );
      }
      if (!sector) {
        throw new Error(
          `Oportunidad "${profile.sector}": ese sector no está activo en el catálogo de sectores.`,
        );
      }

      return {
        ...profile,
        sectorName: sector.name,
        countryName: country.name,
        paramsByLocale: localeMap((l) => ({
          country: country.slugs[l],
          sector: sector.slugs[l],
        })),
      };
    });
  },
);

export async function getOpportunity(
  locale: Locale,
  params: { country: string; sector: string },
): Promise<Opportunity | null> {
  const opportunities = await listOpportunities(locale);

  return (
    opportunities.find(
      (opportunity) =>
        opportunity.paramsByLocale[locale].country === params.country &&
        opportunity.paramsByLocale[locale].sector === params.sector,
    ) ?? null
  );
}

/**
 * Ruta de la oportunidad **en función del idioma**.
 *
 * No es un lujo: los segmentos cambian enteros de idioma
 * (`alemania/almacen` ↔ `germany/warehouse`), así que reutilizar los del idioma
 * actual para el `hreflang` produce `/en/opportunities/alemania/almacen`, una
 * URL que no existe, y Google descarta el emparejamiento entero. Es el fallo
 * que ya costó una vez en las landings (ADR-23).
 */
export function opportunityHref(
  opportunity: Opportunity,
): (locale: Locale) => Href {
  return (locale) =>
    ({
      pathname: '/opportunities/[country]/[sector]',
      params: opportunity.paramsByLocale[locale],
    }) as Href;
}

/**
 * La landing a la que esta oportunidad redirigirá con un 301 el día que se
 * retire (ADR-30). Mismos params, otra ruta: por eso el 301 es mecánico y no
 * hay que mantener una tabla de equivalencias a mano.
 */
export function opportunityRetirementHref(
  opportunity: Opportunity,
): (locale: Locale) => Href {
  return (locale) =>
    ({
      pathname: '/work/[country]/[sector]',
      params: opportunity.paramsByLocale[locale],
    }) as Href;
}
