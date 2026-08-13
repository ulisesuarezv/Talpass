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
