import type { Locale } from '@/i18n/routing';
import type { LocalizedHref } from '@/lib/seo';

/**
 * Versión de cada texto legal.
 *
 * Un consentimiento sin versión no vale como prueba: lo que hay que poder
 * demostrar es qué decía el texto que aceptó esa persona, y los textos cambian.
 * Cuando se reescriba uno, se sube su versión aquí y se vuelve a pedir; las
 * filas antiguas quedan como estaban, que es justo su función.
 *
 * Se versionan por fecha y no con un número correlativo para que la fila diga
 * a simple vista de cuándo es el texto.
 *
 * **2026-08-19 — la fecha sube de `2026-08-14` a hoy, y no es un ajuste
 * cosmético.** Hasta hoy estas cuatro líneas versionaban documentos que no
 * existían en el repositorio: se pedía un consentimiento sobre un texto que
 * nadie podía leer (hallazgo 3 de la auditoría del 2026-08-18). Los textos se
 * publican hoy por primera vez, así que la versión es la de hoy. Qué pasa con
 * las filas ya escritas con la versión vieja está decidido y razonado en
 * ADR-34.
 */
export const CONSENT_VERSIONS = {
  terms: '2026-08-19',
  privacy: '2026-08-19',
  data_sharing: '2026-08-19',
  audio_sharing: '2026-08-19',
} as const;

/**
 * La versión que viaja en los metadatos del registro. Los cuatro textos se
 * publican a la vez, así que hoy es una sola; si algún día divergen, este
 * fichero es el único sitio donde hay que separarlas.
 */
export const SIGNUP_CONSENT_VERSION = CONSENT_VERSIONS.terms;

export type ConsentType = keyof typeof CONSENT_VERSIONS;

/** Los que se piden al registrarse y no se pueden retirar sin borrar la cuenta. */
export const REQUIRED_CONSENTS = [
  'terms',
  'privacy',
  'data_sharing',
] as const satisfies readonly ConsentType[];

/** Los que el candidato puede conceder y retirar cuando quiera (ADR-18). */
export const OPTIONAL_CONSENTS = [
  'audio_sharing',
] as const satisfies readonly ConsentType[];

// ---------------------------------------------------------------------------
// Los documentos publicados y sus direcciones (ADR-33)
// ---------------------------------------------------------------------------

/**
 * Los documentos legales publicados, en el orden en que se listan.
 *
 * Son los cuatro de `CONSENT_VERSIONS` **más el Impressum**, que no es un
 * consentimiento: es la identificación del responsable que exige el §5 DDG y
 * que existe aunque nadie se registre. Por eso esta lista y la de versiones no
 * son la misma, y el tipo lo dice.
 */
export const LEGAL_DOCUMENTS = [
  'impressum',
  'privacy',
  'terms',
  'data_sharing',
  'audio_sharing',
] as const;

export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];

/** Los que tienen versión porque se consienten. El Impressum no. */
export function documentVersion(document: LegalDocument): string | null {
  return document === 'impressum' ? null : CONSENT_VERSIONS[document];
}

/**
 * El segmento de URL de cada documento, por idioma.
 *
 * Cambia entero de idioma, igual que en las landings (ADR-23): la URL la lee
 * una persona, y `/en/legal/datos-y-agencias` no la lee nadie. Es la razón de
 * que la ruta sea `/legal/[documento]` y el segmento un parámetro — ver ADR-33.
 *
 * `impressum` es la excepción y se llama igual en los dos: es el término
 * reconocible del documento que exige el §5 DDG, y traducirlo lo haría menos
 * localizable, no más.
 */
export const LEGAL_SLUGS: Record<LegalDocument, Record<Locale, string>> = {
  impressum: { es: 'impressum', en: 'impressum' },
  privacy: { es: 'privacidad', en: 'privacy' },
  terms: { es: 'terminos', en: 'terms' },
  data_sharing: { es: 'datos-y-agencias', en: 'data-and-agencies' },
  audio_sharing: { es: 'audio-en-ingles', en: 'english-audio' },
};

/** El documento al que apunta un segmento, o `null` si no existe ninguno. */
export function documentFromSlug(
  locale: Locale,
  slug: string,
): LegalDocument | null {
  return (
    LEGAL_DOCUMENTS.find(
      (document) => LEGAL_SLUGS[document][locale] === slug,
    ) ?? null
  );
}

/**
 * La dirección de un documento, en la forma que entienden `Link` y `seoMetadata`.
 *
 * Devuelve una función de idioma y no una ruta fija porque **el parámetro
 * también cambia de idioma**: reutilizar el segmento del idioma actual para el
 * `hreflang` produciría `/en/legal/privacidad`, que no existe, y Google
 * descartaría el emparejamiento entero (ver `lib/seo.ts`).
 */
export function legalHref(document: LegalDocument): LocalizedHref {
  return (locale: Locale) => legalLink(document, locale);
}

/**
 * La misma dirección ya resuelta para un idioma, que es lo que acepta `Link`.
 * `legalHref` es para `seoMetadata`, que necesita construir las dos; esta es
 * para pintar un enlace en la página que se está renderizando.
 */
export function legalLink(document: LegalDocument, locale: Locale) {
  return {
    pathname: '/legal/[document]' as const,
    params: { document: LEGAL_SLUGS[document][locale] },
  };
}
