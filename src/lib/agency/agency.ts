import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type CurrentAgency = {
  id: string;
  name: string;
  countryCode: string;
};

/**
 * La agencia de la persona que ha entrado, con su sesión. `agencies_member_read`
 * solo le deja leer la suya, así que no hace falta filtrar por nada más que
 * por ella misma.
 *
 * Devuelve `null` si el perfil es `agency_member` pero no pertenece a ninguna
 * agencia: pasa entre que el admin promociona la cuenta y la da de alta en su
 * ETT, y la página lo dice en vez de enseñar una bolsa que no podría usar.
 */
export async function getCurrentAgency(
  userId: string,
): Promise<CurrentAgency | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agency_members')
    .select('agencies!inner(id, name, country_code)')
    .eq('profile_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Agencia actual: ${error.message}`);
  if (!data) return null;

  return {
    id: data.agencies.id,
    name: data.agencies.name,
    countryCode: data.agencies.country_code,
  };
}
