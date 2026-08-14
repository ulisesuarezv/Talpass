/**
 * Identidad de marca. Nombre y dominio definitivos desde 2026-08-13 (ADR-12):
 * **Talpass**, en `talpass.eu`. Se mantiene fuera de los componentes de todos
 * modos: la marca se cambia aquí y en las variables de entorno, nunca en el JSX.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Talpass',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;
