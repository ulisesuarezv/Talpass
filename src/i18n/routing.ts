import { defineRouting } from 'next-intl/routing';

/**
 * Fuente única de verdad del enrutado internacional (ADR-01, ADR-12).
 *
 * Añadir un idioma = añadir el código a `locales`, crear `messages/<code>.json`
 * y añadir su entrada a cada ruta de `pathnames`. Ningún componente cambia.
 */

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

/**
 * Etiqueta nativa de cada idioma, para el selector.
 * No va en `messages/` a propósito: un idioma siempre se nombra en sí mismo
 * ("Deutsch", no "Alemán"), así que no es texto traducible.
 */
export const localeLabels: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

/**
 * El mismo idioma en dos letras, para la cabecera.
 *
 * Va aquí y no en `messages/` por lo mismo que `localeLabels`: es el código del
 * idioma, no copy — no se traduce, es igual en todos los idiomas, y el día que
 * se abra `pt` se añade en la misma línea que el resto de su entrada.
 */
export const localeShortLabels: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
};

/**
 * Mapa centralizado de rutas.
 *
 * Clave  = ruta interna (nombre de carpeta en `src/app/[locale]/`), siempre en inglés.
 * Valor  = ruta externa por idioma, la que ve el usuario y la que indexa Google.
 *
 * Abrir `pt`/`de`/`nl` es añadir una clave por idioma aquí, nada más.
 */
export const pathnames = {
  '/': '/',

  // Público
  '/jobs': {
    es: '/ofertas',
    en: '/jobs',
  },
  '/jobs/[slug]': {
    es: '/ofertas/[slug]',
    en: '/jobs/[slug]',
  },

  // Oportunidades de mercado (fase 4b, ADR-30). Sección propia y separada de
  // `/jobs`: no son vacantes, no llevan `JobPosting` y no se puede aplicar a
  // ellas. Los segmentos son EXACTAMENTE los de la landing de país+sector, para
  // que el día que se retiren cada URL tenga su equivalente concreto al que
  // redirigir con un 301 — ver ADR-30.
  '/opportunities': {
    es: '/oportunidades',
    en: '/opportunities',
  },
  '/opportunities/[country]/[sector]': {
    es: '/oportunidades/[country]/[sector]',
    en: '/opportunities/[country]/[sector]',
  },

  // Landings programáticas (ADR-23). Los segmentos dinámicos se rellenan con
  // slugs derivados del nombre TRADUCIDO del catálogo, así que la URL cambia
  // entera de idioma: /es/trabajo/alemania/logistica ↔ /en/work/germany/logistics.
  '/work/[country]': {
    es: '/trabajo/[country]',
    en: '/work/[country]',
  },
  '/work/[country]/[sector]': {
    es: '/trabajo/[country]/[sector]',
    en: '/work/[country]/[sector]',
  },
  // Segmento fijo delante del dinámico: Next resuelve antes lo estático, así
  // que `/trabajo/ciudad/berlin` nunca se confunde con un país llamado "ciudad".
  '/work/[country]/with-housing': {
    es: '/trabajo/[country]/con-alojamiento',
    en: '/work/[country]/with-housing',
  },
  '/work/city/[city]': {
    es: '/trabajo/ciudad/[city]',
    en: '/work/city/[city]',
  },

  // Textos legales (ADR-33). Públicas y estáticas como el resto de `(public)`:
  // el consentimiento del registro apunta a ellas, así que tienen que poder
  // leerse sin sesión, sin JavaScript y desde el CDN. El documento va como
  // parámetro y su segmento cambia entero de idioma — el mapa está en
  // `src/config/legal.ts`, que es donde vive la lista de documentos.
  '/legal': {
    es: '/legal',
    en: '/legal',
  },
  '/legal/[document]': {
    es: '/legal/[document]',
    en: '/legal/[document]',
  },

  // Autenticación. No leen sesión al renderizar: son páginas estáticas con un
  // formulario en cliente, así que no entran en `protected-routes.ts`.
  '/login': {
    es: '/entrar',
    en: '/login',
  },
  '/signup': {
    es: '/registro',
    en: '/signup',
  },
  '/check-email': {
    es: '/revisa-tu-correo',
    en: '/check-email',
  },
  '/forgot-password': {
    es: '/recuperar-acceso',
    en: '/forgot-password',
  },
  '/reset-password': {
    es: '/nueva-contrasena',
    en: '/reset-password',
  },

  // Privado — ver `protected-routes.ts`
  '/onboarding': {
    es: '/completar-perfil',
    en: '/onboarding',
  },
  '/account': {
    es: '/cuenta',
    en: '/account',
  },
  '/agency': {
    es: '/agency',
    en: '/agency',
  },
  '/admin': {
    es: '/admin',
    en: '/admin',
  },
  // La ficha de un candidato en el backoffice. No se traduce el segmento: es
  // una pantalla interna de una sola persona, y su URL no la ve nadie más.
  '/admin/[candidateId]': {
    es: '/admin/[candidateId]',
    en: '/admin/[candidateId]',
  },
} as const;

export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames,

  // Siempre prefijo de idioma: una URL, un idioma, sin ambigüedad para el crawler.
  localePrefix: 'always',

  // Sin cookie de idioma y sin negociación por cabecera en las rutas públicas.
  // Una cookie `Set-Cookie` en la respuesta impide que el CDN cachee la página,
  // que es exactamente lo que ADR-11 prohíbe. El idioma vive en la URL.
  localeCookie: false,
  localeDetection: false,
});
