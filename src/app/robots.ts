import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';
import { PROTECTED_EXTERNAL_PREFIXES } from '@/i18n/protected-routes';

/**
 * Bloqueo de indexación mientras el sitio son marcadores de posición.
 *
 * La decisión se toma con una única variable explícita y NO se deriva de
 * `VERCEL_ENV` ni del host: en cuanto talpass.eu se conecte en Vercel, un
 * criterio basado en el dominio levantaría el bloqueo por su cuenta y Google
 * indexaría páginas vacías. Sacar basura del índice cuesta meses.
 *
 * Se abre en la fase 3, cuando existan vacantes reales y sitemap, poniendo
 * NEXT_PUBLIC_ALLOW_INDEXING=true en el entorno de producción y solo ahí.
 */
export const dynamic = 'force-static';

const indexingAllowed = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Las áreas privadas siguen fuera del índice aunque se abra el sitio.
        // Salen del mismo mapa de rutas que el proxy: añadir `pt` no obliga a
        // acordarse de tocar este fichero.
        disallow: [...PROTECTED_EXTERNAL_PREFIXES],
      },
    ],
    // Solo se anuncia con la bandera encendida: apuntar a un sitemap desde un
    // `Disallow: /` es pedirle a Google que rastree lo que se le acaba de
    // prohibir.
    sitemap: new URL('/sitemap.xml', siteConfig.url).toString(),
  };
}
