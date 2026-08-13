import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';

/**
 * Refresco de la sesión de Supabase en el proxy.
 *
 * Se ejecuta ÚNICAMENTE en las áreas privadas (ver `i18n/protected-routes.ts`).
 * Recibe la respuesta que ya produjo el proxy de i18n y le añade las cookies
 * renovadas, en lugar de crear una respuesta nueva: así no se pierde el rewrite
 * de pathname localizado que next-intl acaba de aplicar.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const supabase = createServerClient(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Obligatorio y en esta posición: valida el token contra Supabase y dispara
  // el refresco si toca. No sustituir por `getSession()`, que se fía de la
  // cookie sin verificarla.
  await supabase.auth.getUser();

  // Marca de comprobación. Sirve para demostrar desde fuera qué rutas pasan por
  // sesión y cuáles no (ADR-11): las públicas nunca deben llevar esta cabecera.
  response.headers.set('x-ett-session-checked', '1');

  return response;
}
