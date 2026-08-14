import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Alta, entrada y recuperación de contraseña.
 *
 * Grupo propio, ni `(public)` ni `(private)`, porque no son ninguna de las dos
 * cosas: no aportan SEO —de ahí el `noindex`— pero tampoco leen la sesión al
 * renderizar, así que siguen siendo estáticas y llegan al móvil desde el CDN.
 * Toda la lógica vive en el formulario, que es cliente, y en Server Actions.
 *
 * Esa es la razón de que no aparezcan en `i18n/protected-routes.ts`: si lo
 * hicieran, el proxy tocaría cookies aquí sin necesidad.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:py-16">
      {children}
    </div>
  );
}
