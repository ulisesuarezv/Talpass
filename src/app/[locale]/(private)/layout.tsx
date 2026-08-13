import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Áreas privadas: `/cuenta`, `/agency`, `/admin` (ADR-11).
 *
 * - `noindex`: no aportan SEO y no deben aparecer en el índice.
 * - `force-dynamic`: nunca se cachean. Es lo contrario de lo público, y esa
 *   asimetría es la decisión de fondo de esta fase.
 *
 * La protección real por rol llega en la fase 2; aquí solo queda fijada la
 * frontera de caché y de indexación.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return children;
}
