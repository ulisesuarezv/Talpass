import type { Database } from '@/lib/supabase/database.types';
import type { pathnames } from '@/i18n/routing';

export type UserRole = Database['public']['Enums']['user_role'];

/**
 * A dónde pertenece cada rol.
 *
 * Un candidato que abre `/agency` no ve un 403: va a su sitio. La alternativa
 * —una página de error— haría que un enlace viejo o un marcador guardado
 * parecieran una avería del producto.
 */
export const ROLE_HOME = {
  candidate: '/account',
  agency_member: '/agency',
  admin: '/admin',
} as const satisfies Record<UserRole, keyof typeof pathnames>;

/** Áreas privadas y quién entra en cada una. */
export const AREA_ROLES = {
  '/onboarding': ['candidate'],
  '/account': ['candidate'],
  '/agency': ['agency_member'],
  '/admin': ['admin'],
} as const satisfies Partial<Record<keyof typeof pathnames, UserRole[]>>;

export type PrivateArea = keyof typeof AREA_ROLES;

export function roleCanEnter(role: UserRole, area: PrivateArea): boolean {
  return (AREA_ROLES[area] as readonly UserRole[]).includes(role);
}
