import 'server-only';

import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import { createPublicClient } from '@/lib/supabase/public';
import { slugify } from '@/lib/slug';

/**
 * Lectura de catálogos (ADR-07).
 *
 * Países, sectores e idiomas salen de sus tablas y de sus `*_translations`,
 * nunca de una lista escrita en el código. Abrir un país es insertar filas, y
 * ningún componente se entera.
 *
 * Usa el cliente **sin cookies** (ADR-22): los catálogos son lectura anónima
 * por RLS, así que sirven igual a una página pública prerenderizada y al
 * formulario de onboarding. Antes usaba el cliente de servidor y por eso no se
 * podía llamar desde una ruta pública sin volverla dinámica.
 */

export type CatalogOption = {
  /** Identificador estable: código ISO en países e idiomas, uuid en sectores. */
  id: string;
  /** Etiqueta ya traducida al idioma pedido. */
  name: string;
  /** Etiqueta por idioma, para construir slugs y `hreflang`. */
  names: Record<Locale, string>;
  /** Slug por idioma, derivado del nombre traducido. */
  slugs: Record<Locale, string>;
};

export type CountryOption = CatalogOption & {
  code: string;
  isActive: boolean;
};

type TranslationRow = { locale: string; name: string };

/**
 * Un catálogo sin traducción en el idioma pedido cae al primer idioma que
 * tenga, y en último extremo a su propio código: un desplegable en blanco es
 * peor que uno feo, y una URL vacía rompe el enrutado.
 */
function byLocale(
  translations: TranslationRow[] | null,
  fallback: string,
): Record<Locale, string> {
  const rows = translations ?? [];
  const first = rows[0]?.name ?? fallback;

  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      rows.find((row) => row.locale === locale)?.name ?? first,
    ]),
  ) as Record<Locale, string>;
}

function toSlugs(names: Record<Locale, string>): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, slugify(names[locale])]),
  ) as Record<Locale, string>;
}

export async function listCountries(locale: string): Promise<CountryOption[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('countries')
    .select('code, is_active, sort_order, country_translations(locale, name)')
    .order('sort_order');

  if (error) throw new Error(`Catálogo de países: ${error.message}`);

  return (data ?? [])
    .map((row) => {
      const names = byLocale(row.country_translations, row.code);

      return {
        id: row.code,
        code: row.code,
        isActive: row.is_active,
        name: names[locale as Locale] ?? row.code,
        names,
        slugs: toSlugs(names),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function listSectors(locale: string): Promise<CatalogOption[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('sectors')
    .select(
      'id, slug, is_active, sort_order, sector_translations(locale, name)',
    )
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw new Error(`Catálogo de sectores: ${error.message}`);

  return (data ?? [])
    .map((row) => {
      const names = byLocale(row.sector_translations, row.slug);

      return {
        id: row.id,
        name: names[locale as Locale] ?? row.slug,
        names,
        slugs: toSlugs(names),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function listLanguages(locale: string): Promise<CatalogOption[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('languages')
    .select('code, is_active, sort_order, language_translations(locale, name)')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw new Error(`Catálogo de idiomas: ${error.message}`);

  return (data ?? [])
    .map((row) => {
      const names = byLocale(row.language_translations, row.code);

      return {
        id: row.code,
        name: names[locale as Locale] ?? row.code,
        names,
        slugs: toSlugs(names),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
