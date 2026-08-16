import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Cliente de Supabase con `service_role`. **Se salta la RLS entera** (ADR-19):
 * no hay política que lo pare, porque el rol la ignora por atributo.
 *
 * Nace en la fase 4 y solo para lo que la RLS no puede resolver por diseño:
 *
 * | Uso                            | Por qué no basta la sesión del usuario     |
 * | ------------------------------ | ------------------------------------------ |
 * | `document_access_log` (insert) | La tabla no tiene INSERT para NADIE. Si un |
 * |                                | documento se pudiera abrir sin dejar       |
 * |                                | rastro, el registro no valdría como prueba |
 * | `email_log` (insert)           | Igual: es traza del servidor, no del actor |
 *
 * Reglas, sin excepción:
 *   · Solo servidor. `server-only` lo hace fallar en el build si alguien lo
 *     importa desde un Client Component.
 *   · La clave nunca lleva prefijo `NEXT_PUBLIC_`.
 *   · Nunca se usa "porque es más cómodo que escribir la política". Si una
 *     lectura o escritura del backoffice funciona con la sesión del admin, va
 *     con la sesión del admin: así la RLS sigue siendo la que decide y los
 *     tests de seguridad siguen probando algo.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl(),
    env.supabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
