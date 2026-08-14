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
