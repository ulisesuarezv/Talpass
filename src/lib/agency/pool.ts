import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Lecturas de la bolsa para el portal de agencia (fase 7, adelantada por
 * ADR-52).
 *
 * **La única puerta es `candidate_directory`.** La ETT no tiene ni una política
 * sobre `candidates`, `profiles` ni `candidate_private`, así que aunque este
 * fichero pidiera el apellido, la base no se lo daría: la seudonimización vive
 * en la vista y en la RLS, no aquí (ADR-03). Todo va con la sesión de la
 * agencia y nunca con `service_role`, para que lo que se prueba en
 * `test:security` sea el camino real.
 */

type LanguageLevel = Database['public']['Enums']['language_level'];
type DirectoryRow = Database['public']['Views']['candidate_directory']['Row'];

/** De menos a más. El filtro de inglés es «este nivel o superior». */
export const ENGLISH_LEVELS = [
  'a1',
  'a2',
  'b1',
  'b2',
  'c1',
  'c2',
  'native',
] as const satisfies readonly LanguageLevel[];

export type PoolSector = { slug: string; months: number };

export type PoolCandidate = {
  id: string;
  displayName: string;
  age: number | null;
  city: string | null;
  countryCode: string | null;
  nationalityCode: string | null;
  englishLevel: LanguageLevel | null;
  workExperience: string | null;
  sectors: PoolSector[];
  hasDrivingLicense: boolean;
  workedInNlDe: boolean;
  needsHousing: boolean;
  needsTransport: boolean;
  lastActivityAt: string | null;
  stamps: {
    identity: boolean;
    drivingLicense: boolean;
    taxId: boolean;
    cv: boolean;
    audio: boolean;
  };
};

export type PoolFilters = {
  sector?: string;
  english?: LanguageLevel;
  license?: boolean;
  audio?: boolean;
  /** Código del país donde ya vive: el de la propia agencia. */
  livesIn?: string;
  noHousing?: boolean;
};

/**
 * Los filtros llegan de la URL (formulario GET, sin JavaScript) y se validan
 * aquí: un valor que no está en la lista se ignora en vez de romper la página.
 */
export function parsePoolFilters(
  params: Record<string, string | string[] | undefined>,
  sectorSlugs: readonly string[],
  agencyCountry: string,
): PoolFilters {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const sector = one('sector');
  const english = one('english');

  return {
    sector: sector && sectorSlugs.includes(sector) ? sector : undefined,
    english: ENGLISH_LEVELS.find((level) => level === english),
    license: one('license') === '1',
    audio: one('audio') === '1',
    livesIn: one('here') === '1' ? agencyCountry : undefined,
    noHousing: one('housing') === 'no',
  };
}

function toCandidate(row: DirectoryRow): PoolCandidate {
  const sectors = Array.isArray(row.sectors)
    ? (row.sectors as { slug?: string; months_experience?: number }[]).map(
        (s) => ({ slug: s.slug ?? '', months: s.months_experience ?? 0 }),
      )
    : [];

  return {
    id: row.candidate_id ?? '',
    displayName: row.display_name ?? '',
    age: row.age,
    city: row.current_city,
    countryCode: row.current_country_code,
    nationalityCode: row.nationality_code,
    englishLevel: row.english_level,
    workExperience: row.work_experience,
    sectors,
    hasDrivingLicense: row.has_driving_license ?? false,
    workedInNlDe: row.worked_in_nl_de ?? false,
    needsHousing: row.needs_housing ?? false,
    needsTransport: row.needs_transport ?? false,
    lastActivityAt: row.last_activity_at,
    stamps: {
      identity: row.identity_verified ?? false,
      drivingLicense: row.driving_license_verified ?? false,
      taxId: row.tax_id_verified ?? false,
      cv: row.has_cv ?? false,
      audio: row.has_audio ?? false,
    },
  };
}

/**
 * La bolsa filtrada, **el que más recientemente ha dado señales de vida
 * primero**: a una ETT le sirve antes alguien activo ayer que alguien que se
 * registró hace un mes y no ha vuelto.
 */
export async function listPool(filters: PoolFilters): Promise<PoolCandidate[]> {
  const supabase = await createClient();

  let query = supabase
    .from('candidate_directory')
    .select('*')
    .order('last_activity_at', { ascending: false, nullsFirst: false });

  if (filters.sector) {
    // `sectors` es jsonb: un array de objetos se manda serializado, porque
    // `supabase-js` convierte un array suelto en la sintaxis de array de
    // Postgres (`{…}`) y la columna la rechaza como JSON inválido.
    query = query.contains(
      'sectors',
      JSON.stringify([{ slug: filters.sector }]),
    );
  }
  if (filters.english) {
    const from = ENGLISH_LEVELS.indexOf(filters.english);
    query = query.in('english_level', ENGLISH_LEVELS.slice(from));
  }
  if (filters.license) query = query.eq('driving_license_verified', true);
  if (filters.audio) query = query.eq('has_audio', true);
  if (filters.livesIn) {
    query = query.eq('current_country_code', filters.livesIn);
  }
  if (filters.noHousing) query = query.eq('needs_housing', false);

  const { data, error } = await query;
  if (error) throw new Error(`Bolsa: ${error.message}`);

  return (data ?? []).map(toCandidate);
}

/** Un candidato de la bolsa, o `null` si no está (o esta ETT no puede verlo). */
export async function getPoolCandidate(
  id: string,
): Promise<PoolCandidate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('candidate_directory')
    .select('*')
    .eq('candidate_id', id)
    .maybeSingle();

  if (error) throw new Error(`Ficha de la bolsa: ${error.message}`);

  return data ? toCandidate(data) : null;
}
