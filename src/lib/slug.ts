/**
 * Slug para URL a partir de un texto ya traducido.
 *
 * Se normaliza a NFD y se retiran las marcas diacríticas: `Logística` →
 * `logistica`, `Berlín` → `berlin`. La `ñ` cae en `n` por el mismo camino, que
 * es lo que hace todo el mundo en una URL española.
 *
 * Los slugs de las landings **se derivan del nombre traducido**, no se guardan:
 * así abrir un idioma sigue siendo insertar filas en `*_translations` (ADR-07)
 * y nadie tiene que acordarse de rellenar una columna de slug por idioma.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
