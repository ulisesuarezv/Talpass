import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

type Messages = Record<string, unknown>;

/**
 * ⚠️ DEMO (rama demo/hindi): `de` solo traduce lo que ve una ETT. Lo demás
 * cae al inglés, mezclando `en.json` por debajo de `de.json`.
 */
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const current = out[key];
    out[key] =
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
        ? merge(current as Messages, value as Messages)
        : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages =
    locale === 'de'
      ? merge(
          (await import('../../messages/en.json')).default,
          (await import('../../messages/de.json')).default,
        )
      : (await import(`../../messages/${locale}.json`)).default;

  return { locale, messages };
});
