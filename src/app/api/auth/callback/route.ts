import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';

/**
 * Aterrizaje de los enlaces que Supabase manda por correo: confirmación de la
 * cuenta y recuperación de contraseña.
 *
 * Vive bajo `/api` a propósito. El `matcher` del proxy excluye ese prefijo, así
 * que esta ruta no atraviesa i18n ni el refresco de sesión: canjea el código,
 * escribe las cookies y redirige. Meterla en el árbol `/[locale]` obligaría al
 * proxy a tocar cookies en una ruta más, y cada ruta que las toca es una que
 * deja de poder cachearse (ADR-11).
 */

/** Solo se acepta un destino interno del propio sitio. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return `/${routing.defaultLocale}`;
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get('next'));
  const code = searchParams.get('code');

  if (!code) {
    const error = searchParams.get('error_description') ?? 'link_invalid';
    return NextResponse.redirect(
      `${origin}${next}?${new URLSearchParams({ authError: error })}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}${next}?${new URLSearchParams({ authError: error.message })}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
