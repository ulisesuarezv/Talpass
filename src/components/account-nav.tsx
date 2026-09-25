'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { signOutAction } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/client';

/**
 * "Entrar" o "Mi cuenta", según haya sesión.
 *
 * Se resuelve EN CLIENTE y esto no es negociable (ADR-11): la cabecera la usa
 * también la home y el listado de vacantes, y leer la sesión en servidor allí
 * las volvería dinámicas, las sacaría del CDN y se llevaría por delante el
 * canal de captación entero.
 *
 * El coste es que durante el primer pintado no se sabe si hay sesión. Se
 * resuelve reservando el hueco en lugar de saltar de un estado a otro: sin
 * esto, la cabecera daría un tirón en cuanto responde Supabase.
 */
export function AccountNav() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data }) => setSignedIn(Boolean(data.user)))
      .catch(() => setSignedIn(false));

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setSignedIn(Boolean(session?.user)),
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  // El hueco reservado mide lo que mide el botón de «Entrar», que es el estado
  // que ve todo el que llega de Google: 32 px de alto y ~72 de ancho. Va el
  // último de la fila de la cabecera justamente para que su cambio de ancho no
  // empuje a nadie (ver `site-header.tsx`).
  if (signedIn === null) {
    return <span aria-hidden className="block h-8 w-[4.5rem]" />;
  }

  // La única pieza con forma de botón de toda la cabecera, y desde que la
  // cabecera es petróleo (2026-09-25) va en naranja pleno: en pastilla blanca
  // sobre un fondo casi blanco no se veía, y Ulises lo dijo con esas palabras.
  //
  // ⚠️ Es el segundo naranja de la primera pantalla, junto al «Ver ofertas»
  // del hero. Se acepta a sabiendas: son la misma acción en dos alturas
  // distintas —entrar— y el CTA del hero sigue siendo cuatro veces más grande.
  // Si algún día compiten de verdad, este se va a blanco con tinta del hero,
  // que es el par de al lado en el comprobador.
  //
  // Contraste: `--brand-accent-ink` sobre `--brand-accent` (6,30) y el propio
  // naranja como interfaz sobre `--hero` (5,19), los dos ya medidos.
  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex h-8 shrink-0 items-center rounded-full bg-brand-accent px-3.5 type-meta font-semibold text-brand-accent-ink transition-colors hover:bg-brand-accent-hover"
      >
        {t('login')}
      </Link>
    );
  }

  // Con la sesión abierta esto deja de ser una llamada a la acción y vuelve a
  // ser cromo: dos enlaces de texto. Además son dos piezas, y a 375 px en
  // español no caben como pastillas sin partir la fila.
  return (
    <div className="flex shrink-0 items-center gap-3 type-meta">
      <Link
        href="/account"
        className="font-medium text-hero-foreground transition-colors hover:text-brand-accent-bright"
      >
        {t('account')}
      </Link>

      {/* `flex` en el formulario: un `<form>` es bloque, y sin esto el botón
          «Salir» caía media línea por debajo de los demás enlaces de la
          cabecera. Se veía a 1280 en la captura de esta fase. */}
      <form action={signOutAction} className="flex items-center">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="text-hero-muted transition-colors hover:text-hero-foreground"
        >
          {t('logout')}
        </button>
      </form>
    </div>
  );
}
