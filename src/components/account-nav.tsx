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

  if (signedIn === null) {
    return <span aria-hidden className="h-5 w-16" />;
  }

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t('login')}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/account"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t('account')}
      </Link>

      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('logout')}
        </button>
      </form>
    </div>
  );
}
