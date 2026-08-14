import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Cliente de Supabase para el NAVEGADOR (Client Components).
 * Usa la anon key y respeta RLS. Nunca se usa en servidor.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
  );
}
