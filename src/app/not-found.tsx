import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';

import './globals.css';

/**
 * 404 fuera del árbol de idioma (rutas que el proxy no llega a reescribir).
 * Como el layout raíz está vacío, aquí hay que emitir `<html>` a mano.
 * Cae al idioma por defecto: no hay URL de la que deducir otro.
 */
export default async function GlobalNotFound() {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: 'NotFound',
  });

  return (
    <html lang={routing.defaultLocale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-24">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
          <a href={`/${routing.defaultLocale}`} className="text-sm underline">
            {t('back')}
          </a>
        </main>
      </body>
    </html>
  );
}
