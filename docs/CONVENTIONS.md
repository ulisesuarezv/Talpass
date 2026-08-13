# Convenciones de código

> Acordadas en la fase 0. Si algo aquí molesta, se cambia aquí primero y luego en el código.

## Estructura

```
src/
  app/
    layout.tsx                  # vacío a propósito: solo devuelve children
    not-found.tsx               # 404 fuera del árbol de idioma
    globals.css                 # tokens de shadcn (tema neutro, ADR-10)
    [locale]/
      layout.tsx                # <html lang>, fuentes, header, footer, provider
      not-found.tsx             # 404 dentro de un idioma
      (public)/                 # ← estático, cacheado, indexable
        page.tsx                # home
        jobs/                   # /es/ofertas · /en/jobs
      (private)/                # ← dinámico, noindex, pasa por sesión
        layout.tsx              # force-dynamic + robots noindex
        account/                # /es/cuenta · /en/account
        agency/
        admin/
  components/
    ui/                         # shadcn — no se editan a mano salvo necesidad
    *.tsx                       # componentes propios, kebab-case
  config/
    site.ts                     # marca y dominio (provisionales, ADR-12)
  i18n/
    routing.ts                  # idiomas + mapa de pathnames  ← única fuente de verdad
    navigation.ts               # Link / redirect / useRouter conscientes del idioma
    request.ts                  # carga de mensajes por petición
    protected-routes.ts         # qué áreas leen sesión
  lib/
    env.ts                      # variables de entorno con fallo explícito
    supabase/
      client.ts                 # navegador
      server.ts                 # servidor (SOLO en área privada)
      session.ts                # refresco de sesión en el proxy
  proxy.ts                      # Next 16: sustituye a middleware.ts
messages/
  es.json · en.json             # namespaces por pantalla
scripts/
  check-supabase.mjs
```

`(public)` y `(private)` son grupos de rutas: **no aparecen en la URL**. Existen para
que la frontera de caché y de indexación sea visible en el árbol de ficheros, no un
detalle escondido en cada página.

## Rutas e i18n

- **Ruta interna en inglés, ruta externa traducida.** La carpeta se llama `jobs`;
  el usuario ve `/es/ofertas` y `/en/jobs`. El mapa está en `src/i18n/routing.ts`.
- **Añadir un idioma** = añadirlo a `locales`, crear `messages/<code>.json` y añadir
  su entrada a cada ruta de `pathnames`. Ningún componente se toca.
- **Nunca** `next/link` ni `redirect`/`useRouter` de `next/navigation`: usa los de
  `@/i18n/navigation`. ESLint lo bloquea.
- **Cero texto en componentes**, incluida la marca. El copy va en `messages/`; el
  nombre de la marca en `siteConfig.name`, y se inyecta como `{brand}`.
- Namespace de mensajes = pantalla o componente (`Home`, `Jobs`, `Nav`).

## Servidor y cliente

- Por defecto, **Server Component**. `'use client'` solo cuando hace falta estado,
  efectos o eventos, y lo más abajo posible en el árbol.
- Traducciones: `getTranslations()` en servidor, `useTranslations()` en cliente.
- En páginas públicas, llamar a `setRequestLocale(locale)` antes de traducir: sin eso
  la página se vuelve dinámica.

## La regla que no se salta (ADR-11, ADR-13)

**Una ruta pública nunca lee la sesión.** Ni `createClient()` de
`lib/supabase/server`, ni `cookies()`, ni `headers()`. Leerlas la vuelve dinámica y
deja de servirse desde el CDN, que es de donde vive el SEO.

Cómo se comprueba en cualquier momento:

```bash
pnpm build          # /es, /en, /es/jobs, /en/jobs deben salir como ● (SSG)
                    # /[locale]/account|agency|admin deben salir como ƒ
```

```bash
pnpm build && pnpm start -p 3210
curl -sI localhost:3210/es      | grep -i 'x-nextjs-cache\|cache-control'   # HIT, s-maxage
curl -sI localhost:3210/es/cuenta | grep -i 'x-ett-session-checked'         # 1
curl -sI localhost:3210/es      | grep -i 'x-ett-session-checked'           # vacío ← obligatorio
```

Si una ruta pública devuelve `x-ett-session-checked`, algo se ha filtrado y el SEO
está roto aunque la página se vea bien.

El estado de login en zonas públicas se resuelve **en cliente**, con
`lib/supabase/client`.

## Estilo

- Prettier manda (`pnpm format`). Comillas simples, punto y coma, 80 columnas.
- Ficheros y carpetas en `kebab-case`; componentes en `PascalCase`.
- Exportaciones nombradas para componentes; `export default` solo donde Next lo exige
  (páginas, layouts, proxy).
- Tailwind: clases ordenadas por `prettier-plugin-tailwindcss`. Nada de CSS suelto
  salvo tokens en `globals.css`.
- Comentarios: solo para explicar **por qué**, nunca qué hace la línea de abajo.

## Comandos

| Comando | Para qué |
|---|---|
| `pnpm dev` | desarrollo |
| `pnpm build` | build de producción (y prueba del ADR-11) |
| `pnpm typecheck` | tipos |
| `pnpm lint` / `lint:fix` | ESLint |
| `pnpm format` / `format:check` | Prettier |
| `pnpm check:supabase` | conexión a Supabase, sin imprimir claves |
