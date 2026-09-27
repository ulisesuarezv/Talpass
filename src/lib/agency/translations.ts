import 'server-only';

import { createTranslator } from 'next-intl';

import type { Locale } from '@/i18n/routing';

/**
 * El copy del portal de agencia vive en `messages/agency/`, no en
 * `messages/<locale>.json`, por lo mismo que la home y los legales (ADR-33,
 * ADR-37): ese fichero viaja entero en el HTML de **todas** las páginas, y
 * nadie que busca trabajo necesita cargar las pantallas de una ETT. El portal
 * es Server Components entero, así que esto no llega nunca al navegador.
 */
export async function getAgencyTranslations(locale: Locale) {
  const messages = (await import(`../../../messages/agency/${locale}.json`))
    .default;

  return createTranslator({ locale, messages, namespace: 'Agency' });
}

export type AgencyTranslator = Awaited<
  ReturnType<typeof getAgencyTranslations>
>;
