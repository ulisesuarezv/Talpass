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

## Base de datos (fase 1)

```
supabase/
  config.toml
  migrations/                 # única fuente de verdad del schema
scripts/
  lib/supabase.mts            # clientes admin / anon / login para scripts
  seed-demo.mts               # datos de demostración, idempotente
tests/
  security/
    harness.mts               # aserciones, sin dependencias externas
    run.mts                   # la batería
    drill.mts                 # rompe políticas a propósito y exige el rojo
src/lib/crypto/sensitive.ts   # cifrado de IBAN e identificadores (ADR-15)
```

**Nada se toca a mano en el panel de Supabase.** Todo cambio de schema es una
migración nueva. Si algo existe solo en el panel, no existe: el siguiente
`db reset` se lo lleva por delante y nadie se entera hasta producción.

| Comando                    | Para qué                                           |
| -------------------------- | -------------------------------------------------- |
| `pnpm db:push:prod`        | aplicar a producción migraciones ya validadas      |
| `pnpm db:reset`            | recrear el schema entero desde cero                |
| `pnpm seed:demo [--reset]` | sembrar admin, 2 ETTs, 4 candidatos y 5 vacantes   |
| `pnpm test:security`       | la batería de seguridad                            |
| `pnpm test:security:drill` | el simulacro: rompe políticas y exige que se cacen |

Los tres últimos leen `.env.local` y necesitan `SUPABASE_SERVICE_ROLE_KEY`, las
claves de cifrado y `SUPABASE_DB_URL` (esta última solo el simulacro).

### `seed:demo` y el simulacro solo apuntan a local (ADR-17)

Ambos llaman a `assertLocalTarget()` antes de escribir nada. La comprobación
mira el **host real** de `NEXT_PUBLIC_SUPABASE_URL` y de `SUPABASE_DB_URL`, y
aborta si cualquiera de los dos no es `localhost` / `127.0.0.1`.

Se mira el host de la base de datos y no el dominio del sitio a propósito: la
primera versión de esta comprobación miraba `NEXT_PUBLIC_SITE_URL`, que no
tiene ninguna relación con a qué Postgres se conecta el script. Parecía una
protección, no lo era, y la fase 1 sembró candidatos falsos en producción.

La salida de emergencia existe pero es incómoda a propósito —
`TALPASS_ALLOW_PRODUCTION_WRITES=si-se-lo-que-hago-y-es-produccion` — y **nunca
se escribe en un `.env`**: se teclea en la línea de esa ejecución concreta, o
deja de ser una decisión consciente.

### Catálogo o código

Antes de escribir un `if country === 'DE'`, para. Lo que varía por país es una
fila (ADR-07): países, sectores, tipos de documento, requisitos por país,
identificadores fiscales, registros mercantiles e idiomas están en tablas de
catálogo con sus `*_translations`. Abrir los Países Bajos es un `update` y unos
`insert`, no un despliegue.

### Los tests de seguridad no son opcionales

`pnpm test:security` levanta clientes autenticados **de verdad** —login real,
JWT real, la misma API que usa la aplicación— como candidato, como ETT, como
admin y como anónimo, y comprueba 56 cosas que no deben poder hacerse. Se
ejecuta después de tocar cualquier migración, política, disparador o vista.

**Y `pnpm test:security:drill` después de tocar RLS.** Unos tests que nadie ha
visto fallar solo demuestran que el código se ejecuta. El simulacro rompe tres
políticas de una en una, exige que la batería se ponga roja y las restaura. Si
un simulacro sale verde, falta un test: escríbelo antes de seguir.

Al añadir una tabla:

1. `enable row level security` **en la misma migración que la crea**. Una tabla
   con RLS y sin políticas no devuelve nada, que es el fallo correcto; una sin
   RLS lo devuelve todo a cualquiera con la anon key.
2. Escribe sus políticas siguiendo la matriz de `docs/01-DATA-MODEL.md`.
3. Ejecuta la batería: la comprobación de `rls_audit()` falla sola si te has
   dejado la RLS o las políticas.

### Funciones SECURITY DEFINER

Se saltan la RLS por definición, así que son la fuga más fácil de escribir. Las
del esquema `app` siguen tres reglas sin excepción:

- **No aceptan parámetros que decidan de quién se habla.** La identidad sale
  siempre de `auth.uid()`. Un `is_admin(p_user uuid)` sería preguntar por
  terceros.
- **Devuelven booleano o un id propio.** Nunca filas. Una función definer que
  devuelve datos es una fuga con otro nombre.
- **`set search_path = ''`** y todo cualificado, para que nadie anteponga un
  esquema propio y suplante a `public.profiles`.

## Estilo

- Prettier manda (`pnpm format`). Comillas simples, punto y coma, 80 columnas.
- Ficheros y carpetas en `kebab-case`; componentes en `PascalCase`.
- Exportaciones nombradas para componentes; `export default` solo donde Next lo exige
  (páginas, layouts, proxy).
- Tailwind: clases ordenadas por `prettier-plugin-tailwindcss`. Nada de CSS suelto
  salvo tokens en `globals.css`.
- Comentarios: solo para explicar **por qué**, nunca qué hace la línea de abajo.

## Comandos

| Comando                          | Para qué                                  |
| -------------------------------- | ----------------------------------------- |
| `pnpm dev`                       | desarrollo                                |
| `pnpm build`                     | build de producción (y prueba del ADR-11) |
| `pnpm typecheck`                 | tipos                                     |
| `pnpm lint` / `lint:fix`         | ESLint                                    |
| `pnpm format` / `format:check`   | Prettier                                  |
| `pnpm check:supabase`            | conexión a Supabase, sin imprimir claves  |
| `pnpm db:reset` / `db:push:prod` | migraciones                               |
| `pnpm seed:demo`                 | datos de demostración                     |
| `pnpm test:security`             | batería de seguridad (RLS)                |
| `pnpm test:security:drill`       | simulacro de brecha                       |
