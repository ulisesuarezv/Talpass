import type { ReactNode } from 'react';

/**
 * Layout raíz deliberadamente vacío.
 *
 * El `<html>` y el `<body>` viven en `[locale]/layout.tsx`, porque el atributo
 * `lang` depende del idioma de la URL y debe ser correcto para SEO y lectores
 * de pantalla. Este fichero solo existe porque Next lo exige.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
