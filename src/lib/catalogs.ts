import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * Lectura de catálogos (ADR-07).
 *
 * Nacionalidades y países salen de `countries` + `country_translations`, nunca
 * de una lista escrita en el código. Abrir un país es insertar filas, y ningún
 * componente se entera.
 *
 * ⚠️ Solo desde áreas privadas: usa el cliente de servidor, que lee cookies.
 * Cuando la fase 3 necesite catálogos en una página pública, hará falta un
 * cliente sin cookies (ADR-11).
 */

export type CountryOption = {
  code: string;
  name: string;
  isActive: boolean;
};

export async function listCountries(locale: string): Promise<CountryOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('countries')
    .select('code, is_active, sort_order, country_translations(locale, name)')
    .order('sort_order');

  if (error) throw new Error(`Catálogo de países: ${error.message}`);

  return (data ?? [])
    .map((row) => {
      const translations = row.country_translations ?? [];
      const match =
        translations.find((t) => t.locale === locale) ?? translations[0];

      return {
        code: row.code,
        // Sin traducción, el código ISO antes que una cadena vacía: un
        // desplegable en blanco es peor que uno feo.
        name: match?.name ?? row.code,
        isActive: row.is_active,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
