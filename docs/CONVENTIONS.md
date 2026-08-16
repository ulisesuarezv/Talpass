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
          [slug]/               # detalle de vacante, con JobPosting
        work/                   # landings programáticas (ADR-23)
          [country]/            # /es/trabajo/alemania
            [sector]/           # /es/trabajo/alemania/logistica
            with-housing/       # /es/trabajo/alemania/con-alojamiento
          city/[city]/          # /es/trabajo/ciudad/berlin
      (auth)/                   # ← estático y noindex: no lee sesión al render
        login/ signup/ check-email/
        forgot-password/ reset-password/
      (private)/                # ← dinámico, noindex, pasa por sesión
        layout.tsx              # force-dynamic + robots noindex
        onboarding/             # /es/completar-perfil · /en/onboarding
        account/                # /es/cuenta · /en/account
        agency/
        admin/                  # cola de revisión
          [candidateId]/        # ficha del candidato (fase 4)
    api/
      auth/callback/route.ts    # canje del enlace de correo, fuera de i18n
      documents/[id]/route.ts   # ÚNICO sitio que firma un documento privado
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
    catalogs.ts                 # países, sectores, idiomas (sin cookies)
    jobs.ts                     # lectura pública de vacantes
    landings.ts                 # landings programáticas (ADR-23)
    seo.ts                      # canónica, hreflang y Open Graph
    slug.ts                     # slug desde un nombre traducido
    email/
      send.ts                   # ÚNICO punto de envío propio (ADR-26)
      verification.ts           # el aviso de aprobado/rechazado
    admin/
      review.ts                 # lecturas del backoffice
      actions.ts                # aprobar / rechazar
      rejection-reasons.ts      # lista cerrada de motivos (ADR-27)
    supabase/
      client.ts                 # navegador
      public.ts                 # servidor SIN cookies (rutas públicas)
      server.ts                 # servidor (SOLO en área privada)
      admin.ts                  # service_role: SE SALTA LA RLS (fase 4)
      session.ts                # refresco de sesión en el proxy
  proxy.ts                      # Next 16: sustituye a middleware.ts
content/
  jobs/*.json                   # vacantes reales, una por fichero (ADR-28)
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
`lib/supabase/server`, ni `cookies()`, ni `headers()`, ni `searchParams`, ni
`useSearchParams`. Cualquiera de ellas la vuelve dinámica y deja de servirse
desde el CDN, que es de donde vive el SEO.

### Qué cliente de Supabase desde dónde (ADR-22)

| Fichero               | Lee cookies | Se puede usar desde                                  |
| --------------------- | ----------- | ---------------------------------------------------- |
| `lib/supabase/public` | **No**      | rutas públicas, `sitemap.ts`, catálogos — y privadas |
| `lib/supabase/server` | Sí          | **solo** `(private)` y Server Actions                |
| `lib/supabase/client` | —           | navegador                                            |
| `lib/supabase/admin`  | —           | **solo** lo que ninguna política puede hacer         |

`admin.ts` nace en la fase 4 y usa `service_role`, que **se salta la RLS entera
por atributo del rol**. Hoy tiene exactamente dos usos, y los dos son tablas sin
INSERT para nadie: `document_access_log` y `email_log`. Si una operación del
backoffice funciona con la sesión del admin, va con la sesión del admin — así la
RLS sigue decidiendo y la batería de seguridad sigue probando el camino real.

La regla corta: **si el fichero lo puede importar una ruta pública, no puede
tocar `cookies()`.** Por eso `lib/catalogs.ts`, `lib/jobs.ts` y `lib/landings.ts`
van todos por el cliente público. El de servidor lleva el aviso en su cabecera.

Cómo se comprueba en cualquier momento:

```bash
pnpm build:local    # públicas ● (SSG) — home, /jobs, /jobs/[slug], /work/**
                    # /[locale]/account|agency|admin|onboarding deben salir ƒ
```

```bash
pnpm build:local && pnpm start:local -p 3210
curl -sI localhost:3210/es               | grep -i 'x-nextjs-cache'          # HIT
curl -sI localhost:3210/es/ofertas       | grep -i 'x-nextjs-cache'          # HIT
curl -sI localhost:3210/es/trabajo/alemania | grep -i 'x-nextjs-cache'       # HIT
curl -sI localhost:3210/es/cuenta        | grep -i 'x-ett-session-checked'   # 1
curl -sI localhost:3210/es               | grep -i 'x-ett-session-checked'   # vacío ← obligatorio
```

Si una ruta pública devuelve `x-ett-session-checked`, algo se ha filtrado y el SEO
está roto aunque la página se vea bien.

**Y una trampa que ya mordió una vez:** que la ruta salga `●` no basta. Si dentro
hay un `Suspense` cuyo contenido depende de `useSearchParams`, Next prerenderiza
la página pero deja ese subárbol para el cliente, y el HTML sale vacío por
dentro. Se comprueba mirando el HTML, no la letra del build:

```bash
curl -s localhost:3210/es/ofertas | grep -o 'href="/es/ofertas/[^"]*"' | sort -u | wc -l
```

**Antes de creerte el resultado, asegúrate de que respondes al servidor que
crees.** En la fase 4 se perdió un buen rato investigando un "listado al que le
falta una vacante" que era un `next start` viejo pegado al puerto 3210 sirviendo
un build anterior — `pkill -f "next start"` no lo mató. La secuencia fiable es:

```bash
lsof -ti tcp:3210 | xargs -r kill -9    # y comprobar que el puerto queda libre
rm -rf .next && pnpm build:local        # con el servidor ya parado
```

Y para comparar HTML servido contra HTML construido, mira el fichero
(`.next/server/app/es/jobs.html`) **con el servidor parado**: un servidor vivo
reescribe esos ficheros al revalidar.

El estado de login en zonas públicas se resuelve **en cliente**, con
`lib/supabase/client`. Lo hace `components/account-nav.tsx`, que es el único
sitio de la cabecera que sabe si hay sesión.

## Autenticación y roles (fase 2)

- **Tres grupos de rutas, tres comportamientos.** `(public)` es estático e
  indexable; `(auth)` es estático y `noindex` —no lee sesión al renderizar, así
  que el formulario de entrada también llega desde el CDN—; `(private)` es
  dinámico, `noindex` y pasa por el proxy de sesión.
- **Una sola puerta:** `requireArea('/account' | '/agency' | '/admin' |
'/onboarding', locale)` en `lib/auth/session.ts`. Devuelve la sesión o
  redirige; **nunca enseña un error**. Un candidato que abre `/agency` sale
  hacia `/cuenta`, no hacia un 403. El mapa de rol → área está en
  `lib/auth/roles.ts` y es el único sitio donde se decide.
- **`requireCandidate()`** añade la condición de tener el onboarding terminado,
  que significa exactamente una cosa: existe la fila de `candidates`.
- **Cero texto en las Server Actions.** Devuelven **claves** de traducción
  (`{ ok: false, error: 'invalidCredentials' }`) y el componente las resuelve.
  Un mensaje de error es copy como cualquier otro (ADR-01), y los códigos de
  Supabase se mapean por `error.code`, nunca por el texto del mensaje.
- **`redirectAndStop`** en lugar de `redirect` en código de servidor: es el
  mismo, tipado como `never`. Sin él, cada guarda arrastra un `!` detrás, y un
  `!` de más en el código que decide quién entra dónde es lo último que
  interesa tener.
- **Las URLs de retorno de los correos** se declaran en `supabase/config.toml`
  (`additional_redirect_urls`) **y en el panel del proyecto de producción**. Sin
  esa lista, GoTrue ignora el `emailRedirectTo` de la aplicación y manda a la
  home: el registro parece funcionar y la sesión no se canjea nunca.

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

| Comando                     | Para qué                                           |
| --------------------------- | -------------------------------------------------- |
| `pnpm db:start` / `db:stop` | levantar y parar la base local (Docker)            |
| `pnpm db:reset`             | recrear el schema local entero desde cero          |
| `pnpm db:types`             | regenerar `src/lib/supabase/database.types.ts`     |
| `pnpm db:push:prod`         | aplicar a producción migraciones ya validadas      |
| `pnpm seed:demo [--reset]`  | sembrar admin, 2 ETTs, 4 candidatos y 5 vacantes   |
| `pnpm job:publish <fich>`   | publicar una vacante real en local                 |
| `pnpm job:publish:prod`     | …y en producción, tecleando `produccion`           |
| `pnpm test:security`        | la batería de seguridad                            |
| `pnpm test:security:drill`  | el simulacro: rompe políticas y exige que se cacen |

## Local para trabajar, remoto solo para producción (ADR-17)

**Todo el desarrollo, las semillas y los tests corren contra la base local.** El
proyecto Supabase remoto es producción: solo recibe migraciones ya validadas.

```bash
pnpm db:start                       # levanta Postgres, Auth, Storage y Mailpit
cp .env.test.example .env.test      # una sola vez
pnpm dev:local                      # Next apuntando a la base local
```

Hay **dos ficheros de entorno y no se mezclan**:

| Fichero      | A dónde apunta | Quién lo lee                                                |
| ------------ | -------------- | ----------------------------------------------------------- |
| `.env.test`  | base local     | `dev:local`, `build:local`, `start:local`, semillas y tests |
| `.env.local` | **producción** | `pnpm dev`, `check:supabase` y los scripts de producción    |

`.env.test.example` está en el repositorio con todos los valores: los de
`supabase start` son fijos y públicos en cualquier máquina, así que no hay nada
que ocultar. El llavero de cifrado que lleva es solo para datos de
demostración; no se reutiliza en ningún otro sitio.

`pnpm dev` sin sufijo sigue apuntando a producción a propósito, para mirar cómo
va lo desplegado. **Para trabajar, `dev:local`.**

Los correos de confirmación y de recuperación no salen a internet en local: los
recoge **Mailpit en http://127.0.0.1:54324**, que es donde se prueba el flujo
completo de alta.

### Subir a producción

```bash
pnpm db:reset && pnpm test:security && pnpm test:security:drill   # primero, en local
pnpm db:push:prod                                                  # y pide confirmación
```

`db:push:prod` no es `supabase db push` a secas: hay un paso delante que dice a
dónde apunta y exige teclear `produccion`. El camino cómodo tiene que ser el
local y el destructivo tiene que costar un gesto — la fase 1 acabó reseteando
la base de producción justamente porque los dos se parecían demasiado.

Necesita `supabase login` (o `SUPABASE_ACCESS_TOKEN`) en la máquina.

`node --env-file=.env.local scripts/check-prod-rls.mts` comprueba, sin escribir
nada, que producción no se ha quedado con una tabla sin RLS o sin políticas.

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

`scripts/clean-prod-demo.mts` es la excepción y no lleva la comprobación: su
trabajo es precisamente tocar el destino remoto. Lo que lo hace seguro es que
solo sabe **borrar**, y solo lo que `seed-demo.mts` sabe crear — la constante
`DEMO`, toda en dominios `.test`. No acepta listas por parámetro, no borra por
patrón y comprueba al terminar que los catálogos siguen en pie.

## Publicar una vacante real (fase 4, ADR-28)

Una vacante es **un fichero JSON en `content/jobs/`** y un comando. No hay
pantalla: el CRUD autoservicio es de la fase 6 y lo usará la ETT.

```bash
pnpm job:publish content/jobs/almacen-nuremberg.json        # base local
pnpm job:publish:prod content/jobs/almacen-nuremberg.json   # PRODUCCIÓN
```

- **Local por defecto.** La variante `:prod` exige teclear `produccion`, igual
  que `db:push:prod`.
- **Idempotente**: la clave es el `slug`. Relanzarlo con la misma oferta la
  actualiza; no la duplica. Corregir una errata es editar el fichero y repetir.
- Exige traducción en **todos los idiomas activos** del catálogo. Media
  traducción rompe el `hreflang` recíproco (ADR-23).
- La **ETT se da de alta desde el mismo fichero**, por su `slug`. En producción
  no hay ninguna, y una vacante sin ETT no existe.

Fichero completo, con todo lo que acepta (`content/jobs/ejemplo-almacen-nuremberg.json`
está en el repositorio como plantilla):

```json
{
  "slug": "almacen-nuremberg-turnos",
  "status": "published",
  "agency": {
    "slug": "franken-personal",
    "name": "Franken Personal GmbH",
    "countryCode": "DE",
    "registrationType": "handelsregister",
    "registrationNumber": "HRB 987654 N",
    "descriptions": { "es": "ETT de Baviera…", "en": "Bavarian agency…" }
  },
  "countryCode": "DE",
  "city": "Núremberg",
  "sector": "warehouse",
  "clientCompanyName": "Logistikzentrum Nürnberg",
  "showClientCompany": false,
  "salary": { "min": 14, "max": 15.5, "currency": "EUR", "period": "hour" },
  "shifts": ["morning", "afternoon"],
  "weeklyHours": 40,
  "requiredLanguage": { "code": "en", "level": "a2" },
  "requiresDrivingLicense": false,
  "housing": { "provided": true, "price": 300, "currency": "EUR" },
  "transportProvided": true,
  "minContractMonths": 6,
  "startDate": "2026-10-01",
  "translations": {
    "es": {
      "title": "Mozo/a de almacén en Núremberg — turnos de mañana y tarde",
      "description": "Centro logístico a las afueras de Núremberg…",
      "tasks": "Preparar pedidos con terminal de radiofrecuencia…",
      "requirements": "Ciudadanía de la UE. Inglés básico…",
      "benefits": "Alojamiento compartido a 300 € al mes…"
    },
    "en": {
      "title": "Warehouse operative in Nuremberg — morning and afternoon shifts",
      "description": "Logistics centre on the outskirts of Nuremberg…",
      "tasks": "Pick orders with a handheld scanner…",
      "requirements": "EU citizenship. Basic English…",
      "benefits": "Shared housing at €300 a month…"
    }
  }
}
```

`sector`, `registrationType`, `countryCode` y `requiredLanguage.code` son slugs
o códigos **del catálogo**: si no existen, el script aborta diciendo cuál falta.
`tasks`, `requirements` y `benefits` son opcionales, pero son lo que hace que la
vacante se lea como una oferta y no como una ficha.

> **Una ciudad o un sector nuevos exigen redesplegar.** Las landings son
> estáticas y se derivan de las vacantes vivas (ADR-23): hasta el siguiente
> `pnpm exec vercel --prod`, la landing de esa ciudad devuelve 404 aunque la
> vacante ya esté publicada y visible en su URL y en el listado. El script lo
> recuerda al terminar.

## Mandar un correo desde la aplicación (fase 4, ADR-26)

Todo envío propio pasa por `src/lib/email/send.ts`. **No se manda correo desde
ningún otro sitio**, y quien lo dispare tiene que asumir tres cosas:

- `sendEmail` **no lanza**: devuelve `{ ok }`. Un fallo de correo no puede
  tumbar la operación que lo dispara.
- Deja fila en `email_log` siempre, `sent` o `failed` con el motivo.
- Asunto y cuerpo llegan **ya traducidos**, en el idioma del destinatario.

En local no sale nada a internet: con `EMAIL_DEV_INBOX_URL` se entrega en
**Mailpit (http://127.0.0.1:54324)**, el mismo buzón donde ya se leen los
correos de Supabase Auth.

> **Lo que `.env.test` no declara, se hereda de `.env.local` —que es
> producción.** `dev:local` mete `.env.test` en el entorno, pero Next sigue
> leyendo `.env.local` para el resto. Probando la fase 4, una ejecución local
> cogió la clave real de Resend y mandó un correo de verdad. Por eso
> `.env.test` declara `RESEND_API_KEY=` vacía. Al añadir una variable de
> producción, **añádela vacía a `.env.test` en la misma tacada**.

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
