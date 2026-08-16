# Roadmap por fases

> Cada fase está pensada para caber en **una sesión de trabajo con contexto limpio**.
> Regla de oro: se abre sesión nueva por fase, se leen `docs/00`, `docs/01` y la ficha de la fase, y se cierra con el entregable verificado.

**Estado global:** ⬜ no empezada · 🟡 en curso · ✅ cerrada

| #   | Fase                              | Entregable verificable                     | Estado |
| --- | --------------------------------- | ------------------------------------------ | ------ |
| 0   | Fundaciones                       | App desplegada, `/es` y `/en` vivos        | ✅     |
| 1   | Datos y seguridad                 | Schema + RLS probada con tests             | ✅     |
| 2   | Auth y onboarding candidato       | Registro real end-to-end                   | ✅     |
| 3   | Vacantes públicas + SEO           | Vacante indexable en Google Jobs           | 🟡     |
| 4   | Verificación + backoffice         | Documento subido → aprobado por admin      | 🟡     |
| 5   | Aplicaciones                      | Candidato verificado aplica y ve su estado | ⬜     |
| 6   | Portal ETT                        | ETT gestiona vacantes y aplicaciones       | ⬜     |
| 7   | Bolsa + consentimiento documental | Flujo completo de desbloqueo con log       | ⬜     |
| 8   | Emails y automatismos             | Cron de inactividad funcionando            | ⬜     |
| 9   | GDPR y legal                      | Export y borrado de datos operativos       | ⬜     |
| 10  | Hardening y lanzamiento           | Auditoría pasada, listo para captar        | ⬜     |

---

## Fase 0 · Fundaciones

Next.js App Router + TypeScript · Tailwind + shadcn/ui · **routing `/[locale]`** con `es` y `en` (ADR-01) · proyecto Supabase en región EU (ADR-09) · variables de entorno · deploy en Vercel · convenciones de carpetas y estilo de código.

**Hecho cuando:** la app está desplegada, `/es` y `/en` responden, el cambio de idioma funciona, y la conexión a Supabase está verificada.

### ✅ Cerrada

Desplegada en **https://ettrecruiter.vercel.app**. Next 16.3 · next-intl 4.13 · Tailwind 4 · shadcn/ui (preset Nova, base `neutral`) · pnpm.

Verificado en producción:

| Ruta                       | Resultado                                                    |
| -------------------------- | ------------------------------------------------------------ |
| `/`                        | 307 → `/es`                                                  |
| `/es`, `/en`               | 200, `x-vercel-cache: HIT`, servidas desde `fra1`            |
| `/es/ofertas` ↔ `/en/jobs` | 200 en cada idioma; el pathname cruzado redirige al correcto |
| `/es/cuenta`, `/en/admin`  | 200, `no-store`, `x-ett-session-checked: 1`                  |
| rutas públicas             | **sin** `x-ett-session-checked` y **sin** `Set-Cookie`       |
| `next build`               | públicas `●` (SSG), privadas `ƒ`; tipos y lint limpios       |
| `pnpm check:supabase`      | anon key válida contra el proyecto EU                        |

Decisiones nuevas: **ADR-13** (un proxy, dos alcances) y **ADR-14** (ruta interna en inglés, externa traducida). Convenciones en `docs/CONVENTIONS.md`.

Anotado, fuera de alcance de esta fase: `sitemap.ts`, `robots.ts` y `hreflang` completo van a la fase 3; el cliente `service_role` se creará cuando el backoffice lo necesite (fase 4); `EMAIL_FROM` y `RESEND_API_KEY` siguen vacíos hasta la fase 8; no hay dominio propio todavía (ADR-12).

---

## Fase 1 · Datos y seguridad

Migraciones SQL completas de `docs/01-DATA-MODEL.md` · catálogos con semilla (Alemania, sectores, tipos de documento, identificadores) · **políticas RLS de todas las tablas** · vista `candidate_directory` seudonimizada (ADR-03) · buckets de storage con políticas · datos de prueba.

**Hecho cuando:** existe un set de tests que demuestra que un usuario ETT **no puede** leer IBAN, dirección, email ni documentos de un candidato, ni por API ni por vista.

> Es la fase más importante del proyecto. Un fallo aquí es una brecha de datos, no un bug.

### ✅ Cerrada

14 migraciones · **36 tablas, todas con RLS y con al menos una política** · vista `candidate_directory` · 3 buckets · **56 comprobaciones de seguridad en verde**.

| Verificación                    | Resultado                                                                |
| ------------------------------- | ------------------------------------------------------------------------ |
| `supabase db reset` desde cero  | las 14 migraciones aplican sin un error                                  |
| `pnpm test:security`            | 56/56                                                                    |
| `pnpm test:security:drill`      | rompe 3 políticas, **la batería caza las 3**, restaura y vuelve al verde |
| `rls_audit()` contra `pg_class` | 0 tablas sin RLS · 0 tablas sin políticas                                |
| `/robots.txt`                   | `Disallow: /`, estático (`○`) en el build                                |
| `next build`                    | públicas `●`, privadas `ƒ`; tipos y lint limpios                         |

Decisiones nuevas: **ADR-15** (cifrado en la capa de aplicación, AES-256-GCM con
llavero rotable e índice ciego) y **ADR-16** (indexación bajo bandera explícita).
ADR-09 corregido: la región real es `eu-west-1` (Irlanda), no Fráncfort.

**Tres cosas que la fase 1 descubrió y que condicionan fases futuras:**

1. **Storage cachea la autorización por token.** Revocado un consentimiento, un
   token nuevo es rechazado al instante, pero el que ya descargó ese archivo lo
   sigue descargando hasta caducar. Por eso los documentos **nunca** se sirven
   con URL autenticada directa a la ETT: van con URL firmada de vida corta que
   emite el servidor tras comprobar el permiso. Detalle en `docs/01-DATA-MODEL.md`.
2. ~~**El audio exige consentimiento, como el DNI.**~~ **Superado por ADR-18**
   (decidido después de esta fase): el audio **sí es reproducible desde la
   bolsa** por una ETT aprobada, con URL firmada de ≤5 min, sin descarga y con
   la escucha registrada. La base legal es el consentimiento propio que el
   candidato ya otorga al registrarse, y que la fase 2 recoge y permite
   revocar. **La fase 7 no tiene que decidir nada aquí**: implementa ADR-18.
   La vista `candidate_directory` sigue exponiendo solo `has_audio`, así que
   servir el audio es trabajo de la fase 7.
3. **`documents_requested` no se puede saltar** en el ciclo de una candidatura.
   Si en la fase 6 estorba, se cambia con una decisión explícita.

Anotado, fuera de alcance de esta fase: `sitemap.ts` y `hreflang` siguen en la
fase 3, y ahí se abre `NEXT_PUBLIC_ALLOW_INDEXING`; los tipos TypeScript
generados desde el schema (`supabase gen types`) se añadirán en la fase 2, que
es cuando el primer formulario los necesita; el cron que caduca solicitudes y
manda recordatorios es de la fase 8, aunque los índices que necesita ya existen.

---

## Fase 2 · Auth y onboarding candidato

Registro y login · confirmación de email · middleware de sesión y protección de rutas por rol · formulario de info básica (10 campos del scope) · perfil del candidato editable · consentimientos versionados en el registro.

**Hecho cuando:** un candidato se registra desde el móvil, completa su info básica y ve su perfil con estado "sin verificar".

### ✅ Cerrada

**Antes que nada, la corrección de entorno (ADR-17).** La fase 1 se ejecutó
entera contra producción; ya no es posible.

| Corrección                        | Resultado                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Base local con OrbStack           | levanta y aplica las 17 migraciones desde cero sin un error                  |
| Semillas y tests                  | leen `.env.test` (local); `.env.local` queda solo para producción            |
| `pnpm test:security` en local     | **57/57** (56 de la fase 1 + consentir en nombre de otro)                    |
| `pnpm test:security:drill` local  | rompe 3 políticas, la batería caza las 3, restaura y vuelve al verde         |
| El simulacro ya no cruza entornos | ejecutaba la batería con `.env.local` mientras rompía la local — corregido   |
| Producción, datos de demostración | borrados: 0 perfiles, 0 candidatos, 0 ETTs, 0 vacantes; catálogos intactos   |
| Producción, RLS tras el simulacro | 36 tablas, 99 políticas — idéntico a local, el `finally` sí había restaurado |
| `db:push:prod`                    | exige teclear `produccion`; `db:reset` sigue siendo local y no pregunta      |

Y un fallo que la corrección destapó: **el schema no concedía ni un permiso de
tabla** y vivía del ACL por defecto del proyecto alojado. En local ni la
`service_role` podía leer `agencies`. Corregido con una migración de `grant`
(**ADR-19**), que contra producción es un no-op.

**La fase.** Registro con confirmación por correo, entrada, salida,
recuperación y reenvío · protección por rol con redirección a donde le
corresponde a cada uno · onboarding en 5 pasos con el progreso guardado en
servidor · perfil editable con experiencia libre, estado activo/inactivo y
verificación documento a documento en solo lectura · 3 consentimientos
versionados, el de audio revocable · todo el copy en `es` y `en`.

| Verificación                     | Resultado                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alta end-to-end en móvil (390px) | alta → correo → confirmación → onboarding → perfil, completo y sin errores de consola                                                                            |
| Recuperación de contraseña       | correo → enlace → contraseña nueva → entra con ella                                                                                                              |
| Consentimientos                  | 4 filas con versión, IP y user-agent; el de audio se revoca y se vuelve a conceder                                                                               |
| Rol al registrarse               | `candidate`, siempre; el candidato no se asciende (test)                                                                                                         |
| Candidato en `/agency`           | redirige a `/es/cuenta`, sin página de error                                                                                                                     |
| Recargar a mitad del onboarding  | conserva lo escrito; `?step=5` a mano se queda en el paso alcanzado                                                                                              |
| `next build`                     | públicas y de auth `●`, privadas `ƒ`; tipos, lint y formato limpios                                                                                              |
| Cabeceras en `next start`        | `/es` y `/es/ofertas`: `x-nextjs-cache: HIT`, **sin** `x-ett-session-checked` ni `Set-Cookie`; `/es/cuenta` y `/es/completar-perfil`: `x-ett-session-checked: 1` |

Decisiones nuevas: **ADR-19** (permisos de tabla en migración), **ADR-20** (el
consentimiento se escribe en el alta) y **ADR-21** (el borrador del onboarding
vive en el servidor). ADR-18 pasa de decidido a recogido.

**Dos cosas que la fase 2 descubrió:**

1. **El límite de correo de producción es de 1–2 envíos por hora.** Medido:
   el segundo registro de la misma hora ya devuelve
   `over_email_send_rate_limit`. Con eso no se puede captar ni un puñado de
   candidatos: **hay que adelantar Resend como SMTP** (hoy en la fase 8) antes
   de mandar tráfico real. Se mide con
   `node --env-file=.env.local scripts/probe-email-limit.mts <correo>`.
2. **`additional_redirect_urls` no es opcional.** Sin declararlas, GoTrue
   ignora el `emailRedirectTo` de la aplicación y devuelve a la home: el
   registro parece funcionar y la sesión no se canjea nunca. Está puesto en
   `supabase/config.toml` para local; **el panel de producción lo necesita
   aparte**.

Anotado, fuera de alcance de esta fase: los `grant` replican los amplios de
Supabase por defecto y afinarlos por tabla y operación es endurecimiento
(fase 10); la subida de documentos y de audio sigue en la fase 4, y el perfil
solo enseña su estado; `candidate_private` (teléfono, dirección, IBAN) y los
identificadores fiscales no se piden todavía; las migraciones de esta fase
**están validadas en local pero no aplicadas a producción**, porque el `push`
necesita `supabase login` en la máquina.

---

## Fase 3 · Vacantes públicas + SEO

Listado con filtros (país, sector, idioma, alojamiento, transporte, carnet, turno) · página de detalle server-rendered · `JobPosting` schema.org · **landings programáticas** por país / ciudad / sector / alojamiento · enlazado interno vacante ↔ landing · sitemap dinámico · `hreflang` · Open Graph · CTA a registro.

**Más, adelantado de la fase 8 por decisión del 2026-08-15: Resend como SMTP de Supabase**, con `talpass.eu` verificado. Solo el transporte; las plantillas i18n bonitas siguen en la fase 8. _Motivo:_ la fase 2 midió el límite del SMTP por defecto y el **segundo** correo de la misma hora ya rebota con `over_email_send_rate_limit`. Esta fase construye la máquina de traer tráfico; mandarlo a un registro que se rompe con dos personas a la vez sería tirar el trabajo.

**Hecho cuando:** una vacante valida en Google Rich Results Test, las landings enlazan a sus vacantes y de vuelta, el listado carga rápido en 4G, y **un alta real funciona de punta a punta en producción**.

**La bandera de indexación se enciende bajo condición** (ADR-16): `NEXT_PUBLIC_ALLOW_INDEXING=true` solo en producción y solo después de comprobar que ese alta real funciona. Si no funciona, la fase entrega el SEO con la bandera apagada y lo dice. Indexar páginas cuyo CTA está roto gasta el primer rastreo de Google y cuesta meses deshacerlo.

**Verificar obligatoriamente** _(ADR-11)_: las rutas públicas **no** pasan por el middleware de sesión y se sirven cacheadas. Si aparecen como dinámicas, el SEO está roto aunque la página se vea bien.

> Se coloca antes que la verificación **a propósito**: en cuanto exista, ya se puede empezar a captar tráfico y candidatos mientras se construye el resto.

### 🟡 Construida y verificada en local — NO cerrada

> **Corrección del PM, 2026-08-15.** La sesión marcó esta fase ✅ y a la vez
> informó, con toda honestidad, de que no pudo comprobar los dos criterios de
> "hecho cuando" que dependen de producción: la validación en el **Google Rich
> Results Test** y el **alta real de punta a punta**. Con el criterio sin
> cumplir, la fase no está cerrada.
>
> No es contabilidad: si una fase puede marcarse ✅ con su criterio de
> aceptación sin verificar, el roadmap deja de decir qué está realmente probado,
> y dentro de cuatro fases nadie lo sabrá. Validar el marcado campo a campo
> contra la documentación de Google es un buen trabajo, pero el criterio pide el
> tester precisamente porque quien decide qué acepta Google es Google.
>
> **Actualización del 2026-08-16: el bloque de producción está cerrado entero**
> —migraciones, SMTP de Resend, URLs de retorno, despliegue y **alta real
> verificada de punta a punta**—. De los dos criterios que faltaban, el del alta
> ya está cumplido.
>
> **Queda uno solo: el Google Rich Results Test**, que necesita una vacante
> pública real. Llega con la fase 4, y con ella se cierra esta. La bandera de
> indexación se enciende en ese mismo momento y no antes: hoy el sitemap de
> producción son 2 URLs y ninguna oferta.

Lo construido y comprobado en local:

**El código de la fase está entero y verificado en local.** Lo que queda abierto
no es código: son tres gestos contra producción que esta sesión no pudo hacer
(ver `docs/ESTADO.md`), y de ellos depende la bandera de indexación.

Listado con filtros · detalle de vacante con `JobPosting` · **cuatro familias de
landings programáticas** con enlazado interno en los dos sentidos · `sitemap.ts`
dinámico con `hreflang` en las entradas · `hreflang` + canónica + Open Graph en
cada página · CTA a registro en vacante y en landing · todo el copy en `es` y `en`.

| Verificación                        | Resultado                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `next build`                        | **41 páginas públicas `●`**: home, listado, 6 vacantes y 16 landings (2 país + 6 sector + 2 alojamiento + 6 ciudad); privadas `ƒ` |
| Cabeceras en `next start`           | públicas `x-nextjs-cache: HIT`, **sin** `x-ett-session-checked` ni `Set-Cookie`; `/es/cuenta` con `1`                             |
| Vacantes dentro del HTML estático   | 3 enlaces de vacante en `/es/ofertas` sin ejecutar JavaScript                                                                     |
| `hreflang` recíproco                | `/es/trabajo/alemania/logistica` ↔ `/en/work/germany/logistics`, con `x-default`                                                  |
| Enlazado interno                    | landing → 3 vacantes y → 7 landings vecinas; vacante → sus 4 landings                                                             |
| `JobPosting`                        | válido, con `baseSalary`, `jobLocation`, `datePosted`, `employmentType` y `directApply: false`                                    |
| Rendimiento móvil (Lighthouse, 4G)  | listado **97** (FCP 0,8 s · LCP 2,6 s · TBT 10 ms · CLS 0,001); detalle 95; landing 97                                            |
| `test:security` / `:drill`          | 57/57 y el simulacro en verde, sin tocar una sola migración                                                                       |
| `typecheck`, `lint`, `format:check` | limpios                                                                                                                           |

Decisiones nuevas: **ADR-22** (tres clientes de Supabase; el público no lee
cookies), **ADR-23** (landings derivadas de las vacantes vivas, `dynamicParams`
en `false`, slugs desde el nombre traducido) y **ADR-24** (el listado filtra en
cliente, sin `useSearchParams`).

**Tres cosas que la fase 3 descubrió:**

1. **Que una ruta salga `●` en el build no significa que su HTML tenga
   contenido.** La primera versión del listado envolvía el filtro en un
   `Suspense` con `useSearchParams` dentro: Next prerenderizaba la página y
   dejaba ese subárbol para el cliente, así que el HTML salía **sin una sola
   vacante**. La comprobación del ADR-11 se amplía en `docs/CONVENTIONS.md`:
   además de la letra del build, se mira el HTML.
2. **Un `hreflang` con slugs traducidos no puede reutilizar los params del
   idioma actual.** Generaba `/en/work/alemania`, que no existe, y un enlace
   recíproco roto invalida el emparejamiento entero. Corregido con
   `landingHref(landing)`.
3. **Geist Mono se descargaba en todas las páginas y no se usaba en ninguna.**
   29 KB en el camino crítico de un producto mobile-first. Retirarla subió el
   listado de 91 a 97 y bajó el LCP de 3,5 s a 2,6 s.

Anotado, fuera de alcance de esta fase: aplicar a una vacante sigue en la fase 5
y por eso el `JobPosting` declara `directApply: false`; paginar el listado se
hará cuando el volumen lo pida (ADR-24); el `favicon.ico` pesa 26 KB y es
trabajo de la fase 10; las plantillas de correo i18n siguen en la fase 8.

---

## Fase 4 · Verificación + backoffice admin

Subida de documentos (móvil, con cámara) · **grabación de audio en navegador** con fallback a subida · estados por documento · backoffice: cola de revisión, aprobar/rechazar con motivo, ver candidatos y su estado.

**Más, decidido el 2026-08-15: una forma de que el admin publique vacantes reales en producción.** No existe ninguna hoy —el CRUD es de la fase 6 y `seed:demo` se niega, con razón, a tocar producción—, así que el SEO de la fase 3 está construido sobre un catálogo vacío. Basta lo mínimo que funcione; la alternativa autoservicio llega en la fase 6 (ADR-06).

_Motivo:_ la fase 3 se colocó antes que la verificación **a propósito**, para empezar a captar tráfico mientras se construye el resto. Sin vacantes reales esa máquina está encendida en vacío: Google rastrea un job board vacío y tarda en volver. Además, el criterio de la fase 3 —validar una vacante en el Rich Results Test— necesita una URL pública real.

**Hecho cuando:** un candidato sube sus documentos desde el móvil, el admin los aprueba, el candidato pasa a `verified` y recibe aviso, y **el admin ha podido publicar una vacante real en producción**.

### De dónde salen esas vacantes — decidido el 2026-08-16

Ulises reunió enlaces a ofertas reales de **otras ETTs** y se planteó cargarlas como catálogo. **Se descartó.** Publicar ofertas ajenas rompe la promesa al candidato —una aplicación que no llega a ninguna parte— y ante Google Jobs deja el dominio con perfil de agregador duplicado, que es exactamente lo contrario de lo que persigue la fase 3.

En su lugar, esos enlaces se explotan como **investigación de mercado**: rangos salariales por sector, ciudades y sectores reales, y el vocabulario con el que se escriben las ofertas. Con eso Ulises redacta ofertas **propias**. El prompt está en `docs/prompts/investigacion-ofertas.md` y **no es una fase**: no toca código ni base de datos, entrega un informe y puede correr en paralelo.

Sale además una lista de **sectores y ciudades que faltan en el catálogo**, que es catálogo en base de datos y no código.

### 🟡 Construida y verificada en local — falta un criterio

Todo lo construido está probado contra la base local, ciclo completo incluido.
**Lo único que falta para cerrarla es el último criterio: que exista una vacante
real publicada en producción.** La vía existe y funciona (`pnpm job:publish:prod`,
ADR-28), pero publicar es una escritura deliberada contra producción y la hace
Ulises con sus ofertas reales; esta sesión no toca producción (ADR-17).

| Verificación                      | Resultado                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| Ciclo completo en móvil (390×844) | 4 documentos → **rechazo con motivo** → vuelve a subir → aprobación → `verified`      |
| Aviso al candidato                | leído en Mailpit, en **su** idioma, tanto el aprobado como el rechazado               |
| Motivo del rechazo                | visible en `/es/cuenta` y en `/en/account`, traducido en cada uno (ADR-27)            |
| Registro de aperturas             | una fila en `document_access_log` por apertura del admin, con IP y user-agent         |
| URL firmada                       | 60 s, emitida en servidor tras comprobar permiso; sin sesión, **404**                 |
| Sin credencial de correo          | el candidato **igual pasa a `verified`**; el fallo se ve en pantalla y en `email_log` |
| `test:security` · `:drill`        | **64/64** (7 comprobaciones nuevas) y el simulacro en verde                           |
| Rutas públicas                    | `HIT`, sin `x-ett-session-checked` ni `Set-Cookie`; las privadas siguen `ƒ`           |
| Vacante publicada en local        | idempotente, sale en el listado **sin JavaScript** y estrena su landing de ciudad     |
| `typecheck` · `lint` · `build`    | limpios                                                                               |

Evidencia en `docs/evidencia/fase-4/`.

**Lo que llega hecho a la fase 5:**

- El backoffice ya tiene esqueleto (`/admin` con la cola y `/admin/[candidateId]`
  con la ficha). Las aplicaciones **se añaden como sección**, no se rehace.
- El correo propio ya existe y es un solo punto (ADR-26): un aviso nuevo es una
  plantilla en `messages/`, no un envío nuevo repartido por las acciones.
- `verification_status` ya se mueve solo: `pending` al subir un documento,
  `verified`/`rejected` por el admin. Que un candidato sin verificar no pueda
  aplicar ya lo fija la RLS y lo prueba un test.
- **`directApply: false` sigue en el `JobPosting`**: al existir el aplicar, hay
  que volver a la fase 3 y revisarlo.

---

## Fase 5 · Aplicaciones

Aplicar a vacante (bloqueado si no está verificado, con mensaje que explica qué falta) · listado "Mis aplicaciones" con estado · log de eventos de aplicación · vista admin de aplicaciones.

**El backoffice del admin crece a lo largo de tres fases** —revisión de documentos en la 4, aplicaciones en la 5, desbloqueos en la 7— así que en la 4 se monta su esqueleto y aquí se le añade una sección, no se rehace.

**Al aplicar existir, hay que volver a la fase 3:** el `JobPosting` declara hoy `directApply: false` porque no se podía aplicar. Revisarlo aquí.

**Hecho cuando:** un candidato verificado aplica, y el cambio de estado queda registrado en auditoría.

---

## Fase 6 · Portal ETT

Alta invite-only por admin · dashboard · CRUD de vacantes con traducciones (ADR-06) · lista de aplicaciones por vacante con cambio de estado · perfil de empresa (lo que ve el candidato).

**Ojo al solape con la fase 4:** allí se construye una vía mínima para que el **admin** publique vacantes reales. Aquí se construye el autoservicio de la **ETT**, que es otra cosa y otro actor. La vía del admin **no se retira**: en el MVP Ulises es el backend humano y va a seguir metiendo ofertas mientras haya una sola ETT. Lo que sí hay que hacer es que las dos escriban por el mismo sitio, para que una vacante sea igual venga de donde venga.

**Hecho cuando:** una ETT publica una vacante, recibe una aplicación real y la mueve a `in_review`.

---

## Fase 7 · Bolsa de candidatos + consentimiento documental

Bolsa navegable con filtros sobre la vista seudonimizada (ADR-03) · solicitud de acceso a documentos · **flujo de consentimiento del candidato** (ADR-05): email + aviso in-app, conceder/denegar, recordatorio 24 h, caducidad 7 días · acceso temporal por URL firmada · `document_access_log` · solicitud de contacto desde la bolsa.

**Hecho cuando:** el ciclo completo funciona y existe registro de cada apertura de documento.

> Fase de mayor valor comercial. Es lo que se enseña en la reunión con la ETT.

---

## Fase 8 · Emails y automatismos

~~Resend con dominio verificado~~ **(adelantado a la fase 3)** · plantillas i18n (registro, verificación aprobada/rechazada, cambio de estado, ETT te contacta, nueva aplicación para la ETT, ping de inactividad, solicitud de consentimiento) · **cron de inactividad 30 d → 72 h → `inactive`** · cron de caducidad de consentimientos · `email_log`.

**Qué llega ya hecho a esta fase.** No es una fase que empiece de cero: el transporte lo puso la fase 3, y varias fases anteriores **ya disparan correos funcionales** —el de confirmación de registro y recuperación de contraseña (fase 2), el de verificación aprobada o rechazada (fase 4), el de solicitud de consentimiento (fase 7)—. Todos son correos que llegan y están traducidos, pero sin plantilla cuidada. Aquí se les da forma, se centraliza el envío y se registra en `email_log`. **Lo que hay que revisar es si algún disparo falta, no reescribir los que ya funcionan.**

**Un guardarraíl que hay que añadir aquí, descubierto el 2026-08-16.** Una prueba en local mandó un correo **real** a `maria@talpass.test` —un candidato de mentira— porque `.env.test` tenía una clave de Resend válida. No hubo daño: `.test` es un TLD reservado, no existe ningún destinatario y el envío rebota. Se tapó vaciando la clave en `.env.test`, pero eso es un fichero que cualquiera vuelve a rellenar sin darse cuenta.

Como esta fase centraliza el envío (ADR-26), es aquí donde el punto único **debe negarse a enviar de verdad cuando el entorno es local**, en vez de depender de que falte una credencial. El día que un seed lleve direcciones reales en lugar de `@talpass.test`, la diferencia deja de ser inocua.

**Hecho cuando:** el ciclo de inactividad se verifica de punta a punta con fechas forzadas.

---

## Fase 9 · GDPR y legal

Aviso legal, política de privacidad y de cookies en `es`/`en` · banner de consentimiento · exportación de datos del candidato · flujo de borrado (art. 17) respetando obligaciones de conservación · página pública que explica al candidato qué ve una ETT y qué no.

**No confundir con los consentimientos de la fase 2.** Aquellos son de tratamiento de datos (términos, privacidad, compartición con agencias, audio) y se recogen versionados en el alta con ADR-20; ya están hechos. El de esta fase es el **banner de cookies**, que es otra cosa. Lo que sí falta de aquellos son los **textos** que el candidato aceptó: hoy se versionan en `src/config/legal.ts` pero el documento en sí no existe. Escribirlos es de esta fase.

**Y el banner no puede volver dinámicas las rutas públicas** (ADR-11, ADR-13). Se resuelve en cliente, como el estado de login.

**Hecho cuando:** un candidato puede exportar y solicitar el borrado de sus datos desde su perfil.

> Esa página de transparencia también es marketing: es el argumento de confianza frente al caos de WhatsApp.

---

## Fase 10 · Hardening y lanzamiento

Auditoría de RLS por segunda vez · **rate limiting** en registro, subidas y login · analítica básica del funnel · páginas de error · afinar los `grant` por tabla y operación (ADR-19) · `favicon.ico` (hoy 26 KB) · checklist de lanzamiento.

**Recomprobar, no estrenar** — estas dos ya se hicieron antes y aquí solo se repiten con datos reales:

- **Rendimiento móvil (Core Web Vitals).** La fase 3 midió Lighthouse 97/95/97 con 3 vacantes. Aquí se vuelve a medir con el volumen real, que es cuando aparece la paginación del listado (ADR-24).
- **Límites de tamaño y validación de tipo de archivo.** Los básicos son de la fase 4: un endpoint de subida sin límite es un problema el día que existe, no el día del lanzamiento. Aquí se endurecen.

_Ya no está aquí:_ el **seed de vacantes reales** pasó a la fase 4 el 2026-08-15, porque el SEO de la fase 3 no sirve de nada sobre un catálogo vacío.

**Hecho cuando:** listo para enviar tráfico orgánico y para la demo presencial.

---

## Después del MVP

Monetización tras validar con la ETT · matching con IA · OCR de documentos · mensajería interna · autoservicio de alta de ETT con aprobación · moderación de vacantes (cerrar ADR-06) · apertura de NL, BE, NO.

---

## Cómo trabajamos cada fase

El PM no ejecuta: **entrega el prompt de la fase** en `docs/prompts/fase-N.md`, y Ulises lo pega en una sesión nueva y limpia.

1. Sesión nueva por fase, con el prompt de `docs/prompts/fase-N.md`.
2. La sesión lee `docs/00-PROJECT.md`, `docs/01-DATA-MODEL.md` y la ficha de la fase.
3. Construye solo el alcance de la fase. Lo que aparezca fuera de alcance se anota, no se hace.
4. Verifica el criterio de "hecho cuando".
5. Marca la fase ✅ aquí, anota las decisiones nuevas en `00-PROJECT.md` y resume qué debe saber la siguiente sesión.
6. Ese resumen vuelve al PM, que redacta el prompt de la fase siguiente.

Los prompts se redactan **de uno en uno**, al cerrar la fase anterior: un prompt de la fase 6 escrito hoy ignoraría todo lo aprendido por el camino.
