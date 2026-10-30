/**
 * Identidad de marca. Nombre y dominio definitivos desde 2026-08-13 (ADR-12):
 * **Talpass**, en `talpass.eu`. Se mantiene fuera de los componentes de todos
 * modos: la marca se cambia aquí y en las variables de entorno, nunca en el JSX.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Talpass',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;

// La bandera es necesaria, pero un preview o un host local nunca se indexa.
const hostname = new URL(siteConfig.url).hostname;
export const indexingAllowed =
  process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' &&
  process.env.NODE_ENV === 'production' &&
  (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production') &&
  !['localhost', '127.0.0.1', '[::1]'].includes(hostname);
