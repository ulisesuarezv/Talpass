import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

import { isProtectedPathname } from '@/i18n/protected-routes';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/session';

/**
 * Proxy único de la aplicación (Next 16 sustituyó `middleware.ts` por `proxy.ts`).
 *
 * Se componen dos responsabilidades con alcances DISTINTOS a propósito (ADR-13):
 *
 *  1. i18n — corre en todo el sitio. Es obligatorio: sin él `/es/ofertas` no se
 *     reescribe a la ruta interna `/es/jobs`. No lee ni escribe cookies
 *     (`localeCookie: false`), así que no impide el caché de CDN.
 *
 *  2. Sesión de Supabase — corre SOLO en `/cuenta`, `/agency` y `/admin` y sus
 *     hijos, en cualquier idioma. Toca cookies, y eso volvería dinámica y no
 *     cacheable cualquier ruta pública que lo atravesara: exactamente lo que
 *     ADR-11 declara innegociable, porque el SEO es el canal de captación.
 */

const handleI18n = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);

  // i18n ha decidido redirigir (p. ej. `/` → `/es`). No hay sesión que refrescar
  // sobre una respuesta que el navegador va a descartar.
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  if (!isProtectedPathname(request.nextUrl.pathname)) {
    return response;
  }

  return updateSession(request, response);
}

export const config = {
  /**
   * Cubre todo salvo API, internos de Next/Vercel y ficheros con extensión.
   * Este alcance amplio es el de i18n; el de sesión lo acota
   * `isProtectedPathname`, no este matcher, porque Next solo admite un proxy.
   */
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
