import 'server-only';

import { createTranslator } from 'next-intl';

import type { Locale } from '@/i18n/routing';

/**
 * El copy de la home: se carga aquí y no desde `messages/<locale>.json`, por el
 * mismo motivo medido que los textos legales (ADR-33, ampliado en ADR-37).
 *
 * `NextIntlClientProvider` serializa el fichero de mensajes **entero** en el
 * HTML de **todas** las páginas. La fase C1 llevó el namespace `Home` de 546 B
 * a 3,8 KB —contenido que responde por qué esto no es un fraude, y que hay que
 * escribir—, y esos 3,8 KB viajaban también a `/es/ofertas`, a cada oportunidad
 * y a cada landing, donde nadie los pinta. Medido: las seis páginas perdían de
 * 2 a 3 puntos de Lighthouse móvil, incluidas las que la fase no tocaba. El
 * presupuesto de velocidad es puerta dura (ADR-10), así que el copy sale del
 * payload del cliente.
 *
 * La home es un Server Component entero: nada de esto necesita llegar al
 * navegador. `createTranslator` da el mismo `t` que `getTranslations` —ICU,
 * plurales y `t.raw` incluidos—, así que la página no cambia por esto.
 *
 * Que los dos idiomas no diverjan lo comprueba el mismo `parity.mjs`, al que se
 * le pasa este par de ficheros igual que al de `messages/` y al de los legales.
 */
export async function getHomeTranslations(locale: Locale) {
  const messages = (await import(`../../messages/home/${locale}.json`)).default;

  return createTranslator({ locale, messages, namespace: 'Home' });
}
