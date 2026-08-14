import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Cliente de Supabase para SERVIDOR (Server Components de área privada,
 * Server Actions y Route Handlers). Usa la anon key y respeta RLS.
 *
 * ⚠️ REGLA DE ORO (ADR-11)
 * Llamar a esto lee cookies, y leer cookies convierte la ruta en dinámica:
 * adiós ISR, adiós caché de CDN, TTFB arriba en móvil y ante Googlebot.
 * Por eso SOLO puede usarse bajo `/[locale]/(private)/…`.
 * En una ruta pública, jamás. El estado de login público se resuelve en cliente.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Un Server Component no puede escribir cookies. No pasa nada:
            // el refresco de sesión lo hace el proxy antes de llegar aquí.
          }
        },
      },
    },
  );
}
