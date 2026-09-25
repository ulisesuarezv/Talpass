import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Las URLs de la sección `/oportunidades`, retirada el 2026-09-25 (ADR-49).
 *
 * La lista está congelada a propósito y no sale de `pathnames`: esas rutas ya
 * **no existen** en el mapa de enrutado (`src/i18n/routing.ts`), que es
 * justamente lo que permite que el redirect las atienda. Añadir un idioma no
 * añade filas aquí — `pt` nunca tuvo `/oportunidades` que retirar.
 *
 * - El listado va al listado: `/es/oportunidades` → `/es/ofertas`, que es donde
 *   están ahora los cinco perfiles.
 * - Cada ficha va a **su** landing de país + sector, no al listado: los
 *   segmentos son idénticos (ADR-30 los eligió así), así que el destino es el
 *   equivalente concreto y no un *soft 404* a una página genérica.
 */
const RETIRED_OPPORTUNITIES = [
  { locale: 'es', from: 'oportunidades', list: 'ofertas', landing: 'trabajo' },
  { locale: 'en', from: 'opportunities', list: 'jobs', landing: 'work' },
] as const;

const nextConfig: NextConfig = {
  typedRoutes: true,

  /**
   * 301 permanente, no el 308 de `permanent: true`.
   *
   * `redirects()` se resuelve **antes que el proxy** y antes del sistema de
   * ficheros (orden de ejecución de Next 16), así que no atraviesa
   * `updateSession` ni vuelve dinámica ninguna ruta: en Vercel son reglas de
   * enrutado del borde, no una función. Resolverlo en `src/proxy.ts` habría
   * metido doce comparaciones de cadena en **todas** las peticiones del sitio
   * —el `matcher` es amplio por i18n (ADR-13)— para atender a doce URLs
   * muertas.
   *
   * El código se fija a mano porque `permanent: true` emite 308 y lo que ADR-30
   * prometió —y lo que la documentación de Google usa como ejemplo canónico de
   * traslado permanente— es un 301. Los dos son permanentes para el índice; la
   * diferencia de 308 es que preserva el método, y aquí solo hay GET.
   */
  redirects: async () =>
    RETIRED_OPPORTUNITIES.flatMap(({ locale, from, list, landing }) => [
      {
        source: `/${locale}/${from}`,
        destination: `/${locale}/${list}`,
        statusCode: 301,
      },
      {
        source: `/${locale}/${from}/:country/:sector`,
        destination: `/${locale}/${landing}/:country/:sector`,
        statusCode: 301,
      },
    ]),

  experimental: {
    serverActions: {
      // El candidato sube su DNI fotografiado con el móvil y el catálogo acepta
      // hasta 10 MB por archivo (`document_types.max_size_bytes`). El límite
      // por defecto de una Server Action es 1 MB, así que sin esto la foto se
      // rechaza antes de que ninguna validación llegue a mirarla.
      // El margen sobre 10 MB es para lo que añade `multipart/form-data`.
      bodySizeLimit: '11mb',
    },
  },
};

export default withNextIntl(nextConfig);
