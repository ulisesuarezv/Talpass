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
 */
export const CONSENT_VERSIONS = {
  terms: '2026-08-14',
  privacy: '2026-08-14',
  data_sharing: '2026-08-14',
  audio_sharing: '2026-08-14',
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
