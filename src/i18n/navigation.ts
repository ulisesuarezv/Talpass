import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/**
 * Navegación consciente del idioma y de los pathnames localizados.
 *
 * Usa SIEMPRE estos `Link`, `redirect`, `useRouter` y `usePathname` en lugar de
 * los de `next/link` y `next/navigation`: son los que traducen `/jobs` a
 * `/es/ofertas` o `/en/jobs` según el idioma activo.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * `redirect` tipado como `never`.
 *
 * En tiempo de ejecución `redirect` lanza `NEXT_REDIRECT` y nada de lo que
 * venga después se ejecuta, pero su firma no lo dice. Sin esto, cada guarda de
 * sesión obliga a un `!` o a un `return` inútil detrás — y un `!` de más en el
 * código que decide quién entra dónde es justo lo que no interesa tener.
 */
export function redirectAndStop(...args: Parameters<typeof redirect>): never {
  redirect(...args);
  throw new Error('unreachable: redirect() should have thrown');
}
