/**
 * Acceso a variables de entorno con fallo temprano y explícito.
 * Un `undefined` silencioso aquí se convierte en un 401 incomprensible tres
 * capas más abajo.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa .env.local (local) o el proyecto en Vercel (desplegado).`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: () =>
    required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  /** Solo en servidor. Nunca importar desde un Client Component. */
  supabaseServiceRoleKey: () =>
    required(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};
