/**
 * Validación compartida entre el formulario y la Server Action.
 *
 * No devuelve textos: devuelve CLAVES de traducción. Un mensaje de error es
 * copy como cualquier otro y no puede nacer en el servidor en un solo idioma
 * (ADR-01). La clave se resuelve en el componente, que sí sabe en qué idioma
 * está.
 */

export type FieldErrors = Record<string, string>;

export type Validated<T> =
  { ok: true; value: T } | { ok: false; fieldErrors: FieldErrors };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;

export function isEmail(value: string): boolean {
  return EMAIL.test(value);
}

export function isStrongEnough(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH;
}

/** Texto de un `FormData`, ya recortado. Cadena vacía = ausente. */
export function text(form: FormData, name: string): string {
  const raw = form.get(name);
  return typeof raw === 'string' ? raw.trim() : '';
}

export function checkbox(form: FormData, name: string): boolean {
  return form.get(name) === 'on' || form.get(name) === 'true';
}

/**
 * Fecha `YYYY-MM-DD` con edad mínima. Se comprueba aquí y no solo con el
 * `max` del `<input type="date">`: el atributo es una ayuda al usuario, no
 * una barrera.
 */
export function isValidBirthDate(value: string, minAge = 16): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  if (date.toISOString().slice(0, 10) !== value) return false;

  const limit = new Date();
  limit.setUTCFullYear(limit.getUTCFullYear() - minAge);

  return date <= limit && date > new Date('1930-01-01T00:00:00Z');
}

export const ENGLISH_LEVELS = [
  'a1',
  'a2',
  'b1',
  'b2',
  'c1',
  'c2',
  'native',
] as const;

export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

export function isEnglishLevel(value: string): value is EnglishLevel {
  return (ENGLISH_LEVELS as readonly string[]).includes(value);
}

export function isCountryCode(value: string, catalog: string[]): boolean {
  return catalog.includes(value);
}
