'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/**
 * Estado de error de todo el árbol de idioma. Fase C2: antes de esta fase **no
 * había ni un `error.tsx` en toda la aplicación**, así que un fallo del
 * servidor en cualquier pantalla enseñaba la página de error genérica de
 * Next.js —en inglés, sin cabecera, sin pie y sin forma de volver—. En un
 * producto cuyo problema es que podría parecer un fraude, ese es exactamente el
 * peor momento para que el sitio deje de parecerse a sí mismo.
 *
 * Tiene que ser Client Component: es el contrato de `error.tsx` de Next, y
 * `reset()` es una función que solo existe en el cliente. Cuelga de
 * `[locale]/layout.tsx`, así que conserva cabecera, pie y el proveedor de
 * `next-intl` — de ahí que pueda usar `useTranslations`.
 *
 * **El copy dice tres cosas y las tres importan:** que no es culpa suya, que no
 * ha perdido nada de lo que había subido, y qué hacer ahora. Un «Ha ocurrido un
 * error inesperado» no dice ninguna de las tres.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Common.error');
  const locale = useLocale();

  useEffect(() => {
    // El error no se muestra en crudo al candidato —no le sirve de nada y puede
    // filtrar rutas o nombres internos—, pero sí tiene que quedar en la consola
    // del navegador para quien esté depurando.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-5 px-4 py-16 sm:py-24">
      <h1 className="type-h1">{t('title')}</h1>

      <p className="type-body text-muted-foreground">{t('description')}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          {t('retry')}
        </Button>
        {/* `<a>` pelado y no el `Link` de `@/i18n/navigation`: en una
            pantalla de error, recargar entero es lo que hay que hacer —
            navegar por cliente reutiliza el mismo árbol de React que acaba de
            romperse—. Y de paso este fichero deja de arrastrar el router de
            `next-intl` al paquete de TODAS las páginas, que es de lo que iba
            media fase (ADR-40). */}
        <Button asChild size="lg" variant="outline">
          <a href={`/${locale}`}>{t('home')}</a>
        </Button>
      </div>

      {/* El `digest` es el identificador que Next escribe también en el log del
          servidor. Enseñarlo es lo que permite que alguien lo copie en un
          correo y que se pueda cruzar con el log; sin él, un informe de fallo
          es «no me iba». */}
      {error.digest ? (
        <p className="type-meta text-muted-foreground">
          {t('reference', { digest: error.digest })}
        </p>
      ) : null}
    </div>
  );
}
