import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typedRoutes: true,

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
