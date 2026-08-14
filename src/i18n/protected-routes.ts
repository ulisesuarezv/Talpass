import { locales, pathnames } from './routing';

/**
 * Las ÚNICAS áreas que leen la sesión (ADR-11, ADR-13).
 *
 * Todo lo demás — home, listados, detalle de vacante, landings — es público,
 * no toca cookies y se sirve estático desde el CDN. Añadir aquí una ruta
 * pública por descuido rompe el SEO sin romper ningún test.
 */
export const PROTECTED_INTERNAL_ROUTES = [
  '/onboarding',
  '/account',
  '/agency',
  '/admin',
] as const satisfies ReadonlyArray<keyof typeof pathnames>;

/**
 * Prefijos externos protegidos, derivados del mapa de rutas.
 * Con `es`+`en` son: /es/cuenta, /en/account, /es/agency, /en/agency, …
 * Al añadir `pt`, `/pt/conta` aparece sola.
 */
const protectedPrefixes: string[] = PROTECTED_INTERNAL_ROUTES.flatMap(
  (internal) => {
    const entry = pathnames[internal];
    return locales.map((locale) =>
      typeof entry === 'string'
        ? `/${locale}${entry}`
        : `/${locale}${entry[locale]}`,
    );
  },
);

/** Sin prefijo de idioma: `/cuenta`, `/agency`… antes de que i18n redirija. */
const unprefixedProtectedPrefixes: string[] = [
  ...new Set(
    PROTECTED_INTERNAL_ROUTES.flatMap((internal) => {
      const entry = pathnames[internal];
      return typeof entry === 'string'
        ? [entry]
        : locales.map((locale) => entry[locale]);
    }),
  ),
];

const allPrefixes = [...protectedPrefixes, ...unprefixedProtectedPrefixes];

/** ¿Esta URL entra en un área privada? Coincide el prefijo exacto o un hijo. */
export function isProtectedPathname(pathname: string): boolean {
  return allPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Expuesto solo para inspección y tests. */
export const PROTECTED_EXTERNAL_PREFIXES = allPrefixes;
