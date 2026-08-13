import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/lib/env';

/**
 * Cliente de Supabase para el NAVEGADOR (Client Components).
 * Usa la anon key y respeta RLS. Nunca se usa en servidor.
 */
export function createClient() {
  return createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
}
