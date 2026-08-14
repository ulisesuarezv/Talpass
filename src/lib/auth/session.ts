import 'server-only';

import { redirectAndStop } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

import { ROLE_HOME, roleCanEnter, type PrivateArea } from './roles';

/**
 * Puerta de entrada de las áreas privadas.
 *
 * ⚠️ Solo bajo `src/app/[locale]/(private)/…` (ADR-11). Lee cookies, y eso
 * vuelve dinámica la ruta: en una página pública destruiría el caché de CDN.
 */

type Profile = Database['public']['Tables']['profiles']['Row'];

export type Session = {
  userId: string;
  email: string;
  profile: Profile;
};

/**
 * Exige sesión y rol para el área pedida. Nunca lanza un error visible: o
 * devuelve la sesión, o redirige a donde esa persona sí puede estar.
 */
export async function requireArea(
  area: PrivateArea,
  locale: string,
): Promise<Session> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectAndStop({ href: '/login', locale });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Sesión válida y sin perfil: el disparador de alta no llegó a correr. No se
  // improvisa una fila aquí — se manda a empezar de nuevo, que es lo único
  // honesto que se puede hacer sin inventarse datos de una persona.
  if (!profile) {
    redirectAndStop({ href: '/login', locale });
  }

  if (!roleCanEnter(profile.role, area)) {
    redirectAndStop({ href: ROLE_HOME[profile.role], locale });
  }

  return { userId: user.id, email: user.email ?? profile.email, profile };
}

/**
 * Como `requireArea`, pero además exige que el onboarding esté terminado.
 * Terminado significa exactamente una cosa: existe la fila de `candidates`.
 */
export async function requireCandidate(locale: string) {
  const session = await requireArea('/account', locale);
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('profile_id', session.userId)
    .maybeSingle();

  if (!candidate) {
    redirectAndStop({ href: '/onboarding', locale });
  }

  return { ...session, candidate };
}
