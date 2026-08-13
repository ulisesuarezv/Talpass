# PROMPT — Fase 0 · Fundaciones

> Pegar en una sesión nueva y limpia, dentro de `/Users/ulises/Desktop/EttRecruiter`.

---

Eres el desarrollador de este proyecto. Antes de escribir una sola línea, lee `CLAUDE.md`, `docs/00-PROJECT.md` (sobre todo los ADR) y la ficha de la Fase 0 en `docs/02-ROADMAP.md`.

Tu tarea es **únicamente la Fase 0: fundaciones**. El repositorio está vacío salvo por documentación, `.gitignore` y `.env.local` (ya contiene las credenciales de Supabase; no las pidas ni las imprimas).

## Alcance

**1. Scaffolding**

- Next.js con App Router y TypeScript, en la **última versión estable**. Verifica la versión y la API actual con la skill `vercel:nextjs` o context7 antes de escribir configuración — no asumas de memoria.
- Tailwind CSS + shadcn/ui inicializado con un tema neutro y sobrio (ADR-10).
- ESLint + Prettier. `pnpm` como gestor si está disponible; si no, `npm`.
- Carpeta `src/`.

**2. i18n (ADR-01, ADR-12)** — la parte más delicada de esta fase

- `next-intl` con routing `/[locale]`, locales `es` (por defecto) y `en`.
- **Pathnames localizados**: `/es/ofertas` y `/en/jobs`. Deja el mapa de rutas centralizado para que añadir `pt`, `de` o `nl` sea añadir entradas, nunca tocar componentes.
- Archivos de mensajes en `messages/es.json` y `messages/en.json`. Cero texto hardcodeado, incluido el nombre de la marca: `EttRecruiter` es **provisional** y debe salir de configuración/i18n, no estar escrito en componentes.
- Selector de idioma que preserva la ruta actual.

**3. Supabase (ADR-09)**

- `@supabase/ssr` con dos clientes: navegador y servidor.
- Sin schema, sin tablas, sin auth UI. Solo la conexión, verificada. El proyecto está en región europea (ADR-09), ya confirmado.
- **Comprueba que la `anon key` del `.env.local` es aceptada.** Una petición de sondeo devolvió `UNAUTHORIZED_INVALID_API_KEY_TYPE`, lo que sugiere que el proyecto podría estar usando el sistema nuevo de API keys (`sb_publishable_…` / `sb_secret_…`) en lugar de las JWT legacy. Si las legacy no funcionan, **detente y avisa a Ulises** para que copie las nuevas del dashboard. No inventes claves ni desactives comprobaciones.

**4. Middleware — condición crítica (ADR-11)**

- El middleware de sesión de Supabase debe tener un `matcher` que cubra **exclusivamente** `/cuenta`, `/agency` y `/admin` (y sus equivalentes localizados).
- Las rutas públicas (`/`, listados, detalle de vacante, landings) **no pasan por el middleware y no leen la sesión en servidor**. Esto es innegociable: tocar cookies las vuelve dinámicas, mata ISR y el caché de CDN, y con ello el SEO, que es el canal principal de captación.
- Ten en cuenta que el middleware de i18n y el de sesión deben componerse sin que el de sesión se filtre a rutas públicas.

**5. Estructura y convenciones**

- Estructura de carpetas preparada para las fases siguientes: público, `/cuenta` (candidato), `/agency` (ETT), `/admin`.
- Layout base mobile-first, con una home mínima de marcador de posición.
- Anota las convenciones que establezcas en un `docs/03-CONVENTIONS.md` breve (naming, organización, patrón de componentes servidor/cliente).

**6. Despliegue**

- Inicializa git y haz el primer commit.
- Despliegue en Vercel. Si la CLI de Vercel no está instalada, pide a Ulises que ejecute `npm i -g vercel && vercel login` y espera; no intentes rodearlo.
- Variables de entorno replicadas en Vercel.

## Fuera de alcance — no lo hagas

Schema de base de datos, RLS, migraciones, autenticación de usuarios, pantallas de registro, vacantes, cualquier CRUD. Si te surge la tentación, anótalo y sigue.

## Verificación antes de cerrar

1. `/es` y `/en` responden y el cambio de idioma conserva la ruta.
2. Las rutas localizadas funcionan (`/es/ofertas` ↔ `/en/jobs`).
3. La conexión a Supabase está probada desde servidor.
4. **Demuestra** que una ruta pública se renderiza estáticamente y no pasa por el middleware (salida de `next build` o cabeceras de caché). Si sale dinámica, la fase no está hecha.
5. `next build` limpio, sin errores de tipos.
6. Despliegue accesible por URL.

## Al terminar

- Marca la Fase 0 como ✅ en `docs/02-ROADMAP.md`.
- Si tomaste alguna decisión de arquitectura no prevista, añádela como ADR en `docs/00-PROJECT.md`.
- Resume en 10 líneas qué quedó montado y qué debe saber la sesión de la Fase 1.
