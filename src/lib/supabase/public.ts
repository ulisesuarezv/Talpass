import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Cliente de Supabase para SERVIDOR **sin cookies** (ADR-11, ADR-22).
 *
 * Es el único que puede usarse desde una ruta pública. `lib/supabase/server`
 * lee cookies y eso convierte la página en dinámica: se cae del CDN, sube el
 * TTFB en móvil con 4G y desaparece el ISR del que vive el SEO. Este cliente no
 * toca `cookies()` ni `headers()`, así que una página que solo lo use se
 * prerenderiza.
 *
 * Va con la anon key y **respeta la RLS**: llega exactamente a lo que llega un
 * visitante sin cuenta — catálogos, ETTs aprobadas y vacantes `published`. No
 * es una puerta de servicio: la seudonimización y los estados los sigue
 * decidiendo la base de datos, no este fichero.
 *
 * | Cliente                 | Dónde                                   |
 * | ----------------------- | --------------------------------------- |
 * | `lib/supabase/public`   | rutas públicas y estáticas (este)       |
 * | `lib/supabase/server`   | SOLO `(private)`: lee cookies           |
 * | `lib/supabase/client`   | navegador                               |
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
    {
      auth: {
        // Sin sesión que persistir ni que refrescar: no hay usuario detrás de
        // una página prerenderizada, y cualquier intento de guardarla acabaría
        // buscando un almacenamiento que en servidor no existe.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
