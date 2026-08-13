/**
 * Identidad de marca. Provisional por decisión explícita (ADR-12): el nombre y
 * el dominio van a cambiar, así que no se escriben en ningún componente.
 *
 * Cuando se decida el nombre definitivo, se cambia `NEXT_PUBLIC_SITE_NAME` en
 * Vercel y en `.env.local`. Cero ficheros tocados.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'EttRecruiter',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;
