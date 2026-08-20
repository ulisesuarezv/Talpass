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
| 4b  | Oportunidades de mercado          | Gancho publicado y sitio indexado sin ETT  | ✅     |
| C1  | Credibilidad (vía B)              | La home deja de poder parecer un fraude    | ✅     |
| C2  | Sistema visual (vía B)            | Consistencia demostrada con capturas       | ⬜     |
| 5   | Aplicaciones                      | Candidato verificado aplica y ve su estado | ⬜     |
| 6   | Portal ETT                        | ETT gestiona vacantes y aplicaciones       | ⬜     |
| 7   | Bolsa + consentimiento documental | Flujo completo de desbloqueo con log       | ⬜     |
| 8   | Emails y automatismos             | Cron de inactividad funcionando            | ⬜     |
| 9   | GDPR y legal                      | Export y borrado de datos operativos       | 🟡     |
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

> ⚠️ **Y «en local» es literal: en producción no hay ni una landing.** Las 16
> landings y las 6 vacantes de la tabla de abajo se midieron en local con datos
> de prueba. Como las landings derivan de las vacantes vivas (ADR-23) y hoy hay
> **cero vacantes publicadas**, `/es/trabajo/**` responde **404 entero** en
> `https://talpass.eu` — recomprobado el 2026-08-19. Funciona como está
> diseñado, pero **no leas esta ficha como si esas páginas estuvieran servidas**:
> la superficie indexable real de producción son 13 URLs (7 hasta los legales),
> ninguna de ellas una landing. Era el hallazgo 5 de la auditoría del 2026-08-18.
> El día que haya vacantes reales, vuelven solas con el redespliegue.

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
> pública real, y por tanto una ETT real. **Es lo único que le falta a esta fase.**
>
> ~~La bandera de indexación se enciende en ese mismo momento y no antes: hoy el
> sitemap de producción son 2 URLs y ninguna oferta.~~ **Caducado el 2026-08-17:**
> la bandera **ya está encendida** —la encendió la fase 4b, con contenido de
> mercado en lugar de vacantes, y ADR-16 quedó corregida en consecuencia—. El
> sitemap son 7 URLs. Esta fase ya no bloquea la indexación de nada.

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

## Fase 4b · Oportunidades de mercado

> **Fase nueva, decidida el 2026-08-17.** Se numera `4b` y no `5` a propósito:
> renumerar arrastraría las referencias cruzadas de las fases 5 a 10 por toda la
> documentación. No es una fase del plan original — es la respuesta a un bloqueo
> real que el plan no previó.

**El bloqueo.** Las fases 3 y 4 esperan una vacante real en producción, y una
vacante real exige una ETT. Pero no se consigue una ETT sin enseñarle candidatos,
y no se consiguen candidatos sin ofertas que enganchen. Es un pollo y huevo, y
el proyecto lleva parado en él desde el 2026-08-16.

**La decisión de Ulises, 2026-08-17:** romperlo por el lado del candidato,
publicando el gancho **sin fingir que hay vacantes**.

Sección propia `/es/oportunidades` ↔ `/en/opportunities`, derivada de
`docs/investigacion/ofertas-mercado.md`: tarjetas con sector, ciudad, franja
salarial, idioma exigido y alojamiento, y una página por perfil con tareas,
requisitos y condiciones. Se ve como un listado de ofertas —que es lo que
convierte— pero **no es un catálogo de vacantes**.

### Las cuatro reglas que la hacen legítima

Se descartó publicar los borradores como vacantes reales. Lo que activa las
políticas de Google Jobs no es el texto: es el marcado `JobPosting`, que es una
declaración legible por máquina de que el empleo existe y está abierto. El
castigo es una acción manual por _job posting spam_ justo en el canal del que
depende toda la estrategia de la fase 3.

1. **Cero marcado `JobPosting`** en esta sección. Es el interruptor.
2. **Ninguna empresa concreta con vacante abierta.** Nada de agencias inventadas
   ni fechas de incorporación.
3. **Ninguna promesa específica sin confirmar** — alojamiento a 280 €, meses
   gratis, transporte diario. Lo avisa la sección 5 de la propia investigación:
   eso solo lo promete la ETT que lo va a cumplir.
4. **Encuadre honesto y visible**, no en letra pequeña: son condiciones típicas
   del mercado, no una vacante a la que se aplica.

**Lo que sí se publica, porque es cierto y está documentado:** los rangos
salariales, el convenio de la Zeitarbeit, las ciudades y sectores con demanda, y
que en varios de ellos no se exige alemán. Sale de 14 ofertas reales analizadas
con fecha de consulta. **Y es lo único que hace falta para convertir**: quien se
registra lo hace por las cifras y las condiciones, no porque exista un número de
referencia de vacante.

### Lo que cuesta y lo que hay que vigilar

- **Una oportunidad NUNCA es una fila en `jobs`.** Es la restricción estructural
  de la fase, y es de seguridad: si vive en esa tabla, el listado, el sitemap, el
  `JobPosting`, las landings y —en la fase 5— el botón de aplicar la tratan
  automáticamente como vacante real, y una bandera olvidada publica justo lo que
  esta fase existe para no publicar. Lo natural es por fichero, como ADR-28 con
  las vacantes: `content/opportunities/`, rutas estáticas propias, sin base de
  datos y sin migración.
- **Por ese camino NO hace falta enmendar ADR-23 aquí.** Las landings siguen
  derivando de vacantes vivas y las oportunidades son su propio árbol de rutas.
  La enmienda —permitir páginas indexables que no cuelguen de una vacante— es de
  las landings de mercado, que están aplazadas más abajo. La fase sale bastante
  más pequeña de lo que parecía el 2026-08-17.
- **`/ofertas` vacío va en `noindex`** con enlace a oportunidades, para que no
  sea un callejón sin salida ni una página delgada en el sitemap.
- **Namespace aparte, no `/ofertas`.** El día que entre una vacante real tiene
  que verse distinta de un perfil de mercado; además evita colisión de slugs y
  permite que las oportunidades pasen a ser la parte alta del embudo.
- **Techo de tres a ocho perfiles.** Multiplicar ciudad × sector hasta cincuenta
  páginas delgadas las convierte en _doorway pages_, que sí es un problema de
  calidad. La contención está en no multiplicarlas.
- **La bandera de indexación se puede encender aquí** (ADR-16), que es el motivo
  de la fase: sin `JobPosting` no hay riesgo de acción manual.

### Lo que esta fase NO resuelve

**Las fases 3 y 4 siguen 🟡.** Su criterio pide el Rich Results Test sobre una
vacante real y esto no lo sustituye. Se cierran cuando haya ETT.

**El activo se enfría.** Esta fase acumula registros de gente esperando una
vacante que todavía no existe. Cuanto más tarde la ETT, menos vale la lista. No
lo arregla el código: condiciona el calendario comercial.

**Hecho cuando:** las oportunidades están publicadas en producción, sin una sola
línea de `JobPosting` en su HTML, el sitio está indexado, y un candidato llega a
una oportunidad y completa el registro.

### ✅ Cerrada, 2026-08-17

**Cinco perfiles** en `/es/oportunidades` ↔ `/en/opportunities`: almacén,
logística, producción, cárnico y agrícola. **El sitio está abierto a Google** por
primera vez desde que existe, y el sitemap pasó de 2 URLs a 7.

| Verificación (producción, `dpl_BTmB7MvesM7E65iDJNXvyeEbaM4U`) | Resultado                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| **`JobPosting` en el HTML de las oportunidades**              | **cero**, en local (102 ficheros del build) y en `curl`        |
| `/robots.txt`                                                 | ya no dice `Disallow: /`; anuncia el sitemap                   |
| `/sitemap.xml`                                                | **7 URLs**, cada una con sus `xhtml:link`                      |
| Oportunidades en el HTML sin ejecutar JavaScript              | 5 perfiles enlazados, cifras y encuadre incluidos              |
| Cabeceras públicas                                            | `HIT`/`PRERENDER`, sin `x-ett-session-checked` ni `Set-Cookie` |
| `/es/cuenta` (control)                                        | 307 a `/es/entrar`, `x-ett-session-checked: 1`                 |
| `hreflang` recíproco con `x-default`                          | segmentos traducidos enteros, en el apex                       |
| `/es/ofertas` vacío                                           | `noindex, follow` + enlace visible a oportunidades             |
| Registro desde una oportunidad, móvil 390×844                 | completo de punta a punta, fila en `candidates`                |
| `test:security` · `:drill` · `typecheck` · `lint` · `format`  | 64/64, simulacro en verde, todo limpio                         |

Evidencia en `docs/evidencia/fase-4b/`. Decisión nueva: **ADR-30** (una
oportunidad no es una vacante y no puede llegar a serlo). **ADR-16 y ADR-23 se
corrigieron el 2026-08-17** —la bandera de indexación ya no exige vacantes
reales, y las páginas indexables sin vacante detrás no contradicen ADR-23— y
esta fase se construyó sobre esas correcciones.

**Esta fase no toca la base de datos:** ni migración, ni tabla, ni política. Los
perfiles viven en `src/lib/opportunities.ts` y su copy en `messages/`.

#### Dos decisiones que conviene conocer antes de tocar esto

**Los slugs son los de la landing, a propósito.**
`/es/oportunidades/alemania/almacen` ↔ `/es/trabajo/alemania/almacen`: mismos
segmentos, derivados del mismo catálogo. Por eso hay **una oportunidad por
sector y ninguna más**, y por eso el 301 del día que se retiren es mecánico.
Cambiar la forma de la URL cierra esa puerta.

**El "sin alemán" se publica medido, no prometido.** El prompt de la fase listaba
"que en varios no se exige alemán" como publicable, pero el informe no lo
sostiene tal cual: 11 de 14 ofertas exigen alemán y de las 3 que no lo dicen,
ninguna afirma que no haga falta —el anuncio entero está en alemán—. Lo que sí
está documentado, y es lo que se publica, es el dato exacto: _"tres de las ocho
ofertas de producción no indicaban ningún nivel"_, y que solo 3 de 14 lo miden
con la escala MCER. Es la misma ventaja de venta dicha sin inventar, que es lo
que pedían las reglas 3 y 4 de la propia fase.

**Lo que no cierra:** las fases 3 y 4 **siguen 🟡**. Su criterio pide el Rich
Results Test sobre una vacante real y esto no lo sustituye.

### La salida — decidido el 2026-08-17, y condiciona el diseño de HOY

`/oportunidades` es de esta etapa: existe para captar candidatos mientras no hay
ETT. Pero **no se borra cuando deje de hacer falta.** Para entonces esas URLs
tendrán posiciones, enlaces e historial, y se retiran justo cuando por fin hay
ofertas reales que colocar ahí.

- **Se retira con 301, nunca con un borrado.** Y **cada oportunidad redirige a su
  equivalente concreto** —almacén en Sajonia → la landing de almacén en Sajonia,
  ya derivada de vacantes reales—, no todas en bloque a `/ofertas`: Google trata
  como _soft 404_ el redirect a una página que no es el equivalente, así que un
  301 masivo pierde casi tanto como borrar.
- **Por eso los slugs de la 4b tienen que encajar con los de las landings.** Es
  la restricción de diseño que esta sección viene a fijar: si la sesión que
  construye la 4b elige slugs cómodos, cierra esa puerta sin enterarse.
- **Y lo más probable es que no haya que retirarlas.** Una página que explica las
  condiciones reales de un sector en una región, con rangos y sin vacante
  asociada, **es** la landing de mercado aplazada más abajo: mismo contenido,
  misma arquitectura, misma enmienda a ADR-23. La transición natural es un cambio
  de papel, no una demolición: `/ofertas` sale de `noindex` y pasa a ser lo
  principal, `/oportunidades` cede el sitio en la navegación y su CTA cambia de
  "regístrate" a "mira las vacantes abiertas". Eso es configuración, no obra.

### Anotado para más adelante — landings de mercado

Idea aceptada el 2026-08-17 y **aplazada por calendario, no descartada**:
páginas de contenido real por ciudad y sector —_"Trabajo en almacén en Alemania:
cuánto se paga en 2026"_, _"Trabajar en Alemania sin saber alemán"_— construidas
con los rangos, el convenio y el apartado "qué callan" de la investigación.

Rankean por consultas informativas, que es donde un dominio sin autoridad puede
competir de verdad: por un título de puesto concreto pierde contra Indeed,
Randstad y StepStone. **Se aplazan porque el SEO informativo tarda meses y no
engancha**: nadie se registra en un job board para leer un informe salarial. El
gancho va primero.

Cuando toquen, se apoyan en la misma enmienda a ADR-23 que hace esta fase, así
que el trabajo no se repite.

---

## Fase C1 · Credibilidad

> **Fase nueva, decidida el 2026-08-20.** Se numera `C1` y no `11` a propósito,
> con el precedente de la 4b: es **vía B**, y la numeración de la vía A está
> congelada esperando a que haya una ETT. Renumerar arrastraría referencias
> cruzadas por toda la documentación para no ganar nada.

**El problema, y no es que esté feo.** Un peón que se plantea subir su DNI y su
IBAN a un dominio que no conoce, en un sector lleno de estafas, **no tiene con
qué decidir que esto no es un fraude**. Planteado como «está genérico» se
discute de gustos; planteado como credibilidad se mide. Esta fase existe para lo
segundo.

**Lo medido el 2026-08-20 contra producción, que es de dónde sale el alcance:**

| Qué                   | Estado hoy                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Estructura de la home | **1 `<h1>` y cero `<h2>`**; 546 bytes de copy. Es un hero y se acaba                            |
| El CTA principal      | 🔴 «Ver ofertas», **dos veces**, lleva a una página que responde «No hay / Sin resultados»      |
| Lo primero que se lee | 🔴 el eyebrow dice **«Fase de construcción»**                                                   |
| Metadatos de `(auth)` | 🔴 `/es/registro` sirve el título de la home, **sin canónica** (hallazgo 7 de la auditoría)     |
| Ancho a 390 px        | 🔴 el documento mide **453 px** por la cabecera, no por el contenido (encontrado el 2026-08-19) |
| Quién hay detrás      | ✅ ya está: la home lo dice y enlaza al Impressum, desde los legales del 2026-08-19             |
| Rendimiento móvil     | ✅ Lighthouse **97–99**. Es un activo, y es el techo a defender                                 |

**El CTA vacío es el más grave y no es un problema de diseño.** Quien pulsa el
botón grande y aterriza en la nada concluye una de dos: que esto está abandonado
o que le están mintiendo. Se decide en esta fase si el botón principal pasa a
`/oportunidades` —que sí tiene contenido— o si `/es/ofertas` deja de ofrecerse
hasta que haya vacantes. **No se resuelve inventando vacantes** (ADR-30).

### Las reglas que la acotan

1. **El presupuesto de velocidad no se toca.** Lighthouse móvil **no baja de lo
   medido** (fila 32 y 33 de la tabla de la auditoría). Es puerta dura, no
   aspiración: el candidato entra con 4G desde el móvil (ADR-10).
2. **Nada de GSAP, R3F, shaders ni layout disruptivo.** Decisión de Ulises del
   2026-08-18, reafirmada el 2026-08-20. Hay agentes instalados para eso y en
   este proyecto **restan**: un layout roto en un sitio cuyo problema es que
   podría parecer una estafa empeora justo lo que se viene a arreglar. Los que
   sí se usan son **`ui-polish`** y **`visual-qa`** — este último es el que
   permite cerrar la fase con capturas y medición en vez de con criterio.
3. **Las rutas públicas siguen sin tocar la sesión** (ADR-11, ADR-13). Si una
   página deja de servirse con `HIT` y sin `Set-Cookie`, la fase ha roto algo.
4. **Cero texto en el JSX** y paridad `es`/`en`, como siempre (ADR-01).
5. **No toca la base de datos.** Ni migración, ni tabla, ni política.

### Lo que NO es de esta fase

El sistema visual —tipografía, color, escala, componentes— es la **C2**. Aquí se
arregla lo que destruye confianza, no lo que se juzga a ojo. Mezclarlas haría
que lo subjetivo contaminase lo auditable, y en esta casa lo que no se mide no
se cierra.

**Hecho cuando** — y todo esto se comprueba, no se opina:

- **La tabla de 40 cifras de `docs/evidencia/auditoria-previa/00-resumen.md`
  vuelve a rellenarse columna a columna**, con los mismos comandos. Es el
  contrato de la fase. **No se reinventa: se rellena.**
- **Ningún CTA de la superficie pública lleva a una página vacía.**
- Una persona ajena al proyecto responde, **leyendo solo la home y sin ejecutar
  JavaScript**: quién responde de este sitio, qué hace Talpass, si le van a
  cobrar, qué pasa con sus documentos y a dónde lleva cada botón.
- **390×844 sin desbordamiento horizontal** en la home, el registro y una
  oportunidad, con captura de `visual-qa`.
- Las páginas de `(auth)` tienen **metadatos propios y canónica**.
- Lighthouse móvil **igual o mejor** que la línea base, página por página.
- `typecheck`, `lint`, `format:check` limpios · `test:security` en verde ·
  cabeceras públicas sin regresión.

### ✅ Cerrada el 2026-08-20 — desplegada y verificada

**`dpl_64afKgpF4rDcxSRGVvfkKUMXzKFv`**, vivo en `https://talpass.eu` y leído de
`vercel inspect` **antes** de mirar ninguna cabecera. Evidencia completa en
`docs/evidencia/fase-c1/`.

| Criterio                            | Estado                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| Tabla de 40 cifras rellenada        | ✅ las 40, columna a columna, con los mismos comandos                                        |
| Ningún CTA lleva a una página vacía | ✅ **ADR-36** — en producción el primario va a `/oportunidades` y `/ofertas` queda ×1        |
| Las cinco preguntas, sin JavaScript | ✅ `curl` sobre el HTML servido; la home pasa de 546 B a 3.791 B de copy y de 0 a 5 `h2`     |
| 390×844 sin desbordamiento          | ✅ 390/390 en home, registro y oportunidad — contra local **y** contra producción            |
| `(auth)` con metadatos y canónica   | ✅ las diez páginas, `es` y `en`, con el `noindex` intacto                                   |
| Lighthouse igual o mejor            | ✅ producción **100/100/100/98/99**: ninguna empeora y **cuatro mejoran**                    |
| Calidad y cabeceras                 | ✅ 64/64, drill verde, 15/15 públicas sin sesión ni cookie, `/es/cuenta` en 307 desde `dub1` |
| `JobPosting` en oportunidades       | ✅ **0** en las 10 páginas de producción — ADR-30 intacto                                    |

**Subido y desplegado.** `origin/main` está en `4d3c30d` y la fila 19 pasa a
**0 commits sin subir**. Conviene no leerlo como una sola cosa: en este proyecto
`git push` no despliega nada, así que son dos actos y hubo que hacer los dos.

### 🔴 Dos reglas de método que la C2 hereda

Las dos salieron de esta fase, y las dos produjeron una regresión que no existía:

1. **Una pasada de Lighthouse por página no vale.** El mismo build medido dos
   veces seguidas da notas distintas: banda de ruido de **±3 puntos**. Mediana
   de 3 como mínimo; las dos páginas dudosas se remidieron con 7 y empataron.
2. **En producción hay que calentar el borde antes de medir.** Recién
   desplegado, `/es/oportunidades` daba **93** con tres pasadas de acuerdo entre
   sí. Con el borde caliente, **100**. Tres `curl` y comprobar `HIT`.

Y una tercera, de operación: `pkill -f "next start"` **no mata** el servidor de
`pnpm start:local`; el puerto 3210 se queda con el proceso viejo y se acaba
midiendo el build anterior. Se mata con `kill -9 $(lsof -ti tcp:3210)`.

Detalle en `docs/evidencia/fase-c1/03-rendimiento.md` y `02-produccion.md`.

---

## Fase C2 · Sistema visual

> **Fase nueva, decidida el 2026-08-20**, hermana de la C1 y **después** de ella.

Lo que la C1 deja fuera a propósito: tipografía y su escala, color, espaciado,
los componentes de shadcn usados de forma coherente, y los estados que hoy no
tienen tratamiento —carga, error, vacío—. Es la capa que hace que algo **se lea**
como profesional, una vez que ya es creíble.

**Aquí sí entra `ui-polish`**, y sigue fuera todo lo demás de la regla 2 de la
C1. El presupuesto de velocidad sigue siendo puerta dura.

**Por qué va después y no antes:** un sistema visual sobre una home que manda al
vacío es maquillaje. El orden importa.

### La paleta y la tipografía — elegidas por Ulises el 2026-08-20

| Papel         | Color                                        | Nota       |
| ------------- | -------------------------------------------- | ---------- |
| Primario      | `#0D9488`                                    | teal-600   |
| Primario dark | `#134E4A`                                    | teal-900   |
| Acento        | `#F97316`                                    | orange-500 |
| Neutros       | tinta muy oscura, gris azulado y blanco roto |            |

**Tipografía: General Sans** (Fontshare / ITF). Hoy el proyecto carga `Geist`
por `next/font/google`; General Sans **no está en Google Fonts**, así que se
sirve **local con `next/font/local`** y los ficheros en el repositorio. Se
subsetea a `latin` y se cargan solo los pesos que se usen: cada peso extra es
carga en la ruta crítica, y el presupuesto de velocidad es puerta dura.

**Dónde vive:** en los tokens de `src/app/globals.css` —`--primary`, `--accent`,
`--font-sans`, `--font-heading`—, que ya existen. **No se escribe un color ni una
fuente en el JSX**, igual que la marca sale de `src/config/site.ts` (ADR-12).

#### El contraste, medido — y no es opcional

Calculado el 2026-08-20 (WCAG 2.1; AA exige **4,5:1** en texto normal y **3:1**
en texto grande y en elementos de interfaz):

| Combinación                          | Ratio     | Veredicto                        |
| ------------------------------------ | --------- | -------------------------------- |
| Blanco sobre acento `#F97316`        | **2,80**  | 🔴 **falla incluso para grande** |
| Blanco sobre primario `#0D9488`      | **3,74**  | 🟡 solo texto grande e interfaz  |
| Blanco sobre primario dark `#134E4A` | **9,48**  | ✅                               |
| Tinta `#0F172A` sobre blanco         | **17,85** | ✅                               |

**Esto no cambia la paleta: cambia el reparto de papeles.** Un botón naranja con
texto blanco encima **no se puede leer** a pleno sol en un móvil barato, que es
exactamente el escenario del candidato. Las salidas, ya calculadas:

- **Botón principal:** fondo `#134E4A` con texto blanco (9,48) — o fondo acento
  `#F97316` con **tinta `#0F172A`** encima, que da **6,37** y conserva el
  naranja.
- **Texto o enlace en naranja sobre blanco:** `#C2410C` (orange-700), **5,18**.
  El `#F97316` no vale para texto.
- **Si hace falta blanco sobre verde:** `#0F766E` (teal-700), **5,47**.
- **El `#0D9488` y el `#F97316` se quedan** para superficies, bordes, iconos,
  gráficos y titulares grandes, que es donde cumplen.

> **Y hay un motivo de fondo, no solo de norma.** Esta fase existe para dar
> credibilidad. Un sitio que no se lee al sol no parece profesional: parece
> descuidado. El contraste aquí es parte del encargo, no una casilla de
> accesibilidad.

**Hecho cuando:** las pantallas de la superficie pública y del onboarding se ven
consistentes a **390 y 1280 px** con capturas de `visual-qa` que lo demuestren,
los tres estados (carga, error, vacío) tienen tratamiento explícito, **ninguna
combinación de texto baja de 4,5:1** (y ninguna de interfaz de 3:1),
**Lighthouse no baja** y no hay regresión en las cabeceras públicas.

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

**Aviso al candidato cuando entre una vacante de su perfil** — anotado por la
fase 4b, que es la que lo hace necesario: acumula gente registrada esperando una
vacante que todavía no existe, y sin ese aviso la lista se enfría sola.

**Y el onboarding hoy NO captura de dónde saldría ese aviso.** Comprobado paso a
paso el 2026-08-17: recoge nombre, nacionalidad, país y ciudad **de residencia**,
nivel de inglés, carné, experiencia previa y si necesita alojamiento o
transporte. **No pregunta ni sector ni ciudad preferidos en destino.** Así que el
aviso, tal cual está el modelo, solo puede segmentar por país de destino y por
necesidad de alojamiento o transporte. Si se quiere por sector —que es lo que
pide un candidato que llega desde `/oportunidades/alemania/almacen`—, hay que
añadir el campo antes, y el sitio natural es el onboarding.

**Hecho cuando:** el ciclo de inactividad se verifica de punta a punta con fechas forzadas.

---

## Fase 9 · GDPR y legal

> 🟡 **Parcialmente hecha, y no por esta fase.** Los **textos legales salieron
> de aquí el 2026-08-18** y se hicieron el 2026-08-19 dentro de la vía B del
> rediseño de credibilidad, porque no eran un trámite posterior: eran el
> hallazgo 3 de la auditoría —un consentimiento pedido sobre documentos
> inexistentes— y parte del problema de confianza. Ver ADR-33, ADR-34 y
> `docs/evidencia/textos-legales/`.

**Hecho ya, fuera de esta fase:**

- Los cinco documentos en `es` y `en`, versionados y publicados en
  `/legal/[documento]`: Impressum (§5 DDG), política de privacidad, términos de
  uso y los dos consentimientos de compartición. Estáticos, enlazados desde el
  pie de todas las páginas y desde el registro con un enlace real por documento.
- **La página pública que explica qué ve una ETT y qué no** era una entrega de
  esta fase: la cubre «Cómo se comparte tu perfil», que lo enumera campo a campo
  a partir de la vista seudonimizada real.
- **El banner de cookies no se hace, y es una decisión, no un olvido.** El sitio
  no pone cookies que no sean estrictamente necesarias: no hay analítica, ni
  seguimiento, ni cookie de idioma (`localeCookie: false`), y las públicas se
  sirven sin tocar la sesión. Comprobado: `Set-Cookie` ausente en las doce rutas
  legales y en las públicas. Sin cookies que consentir, un banner sería teatro.
  Lo dice la política. Si algún día se añade analítica, el banner vuelve a ser
  una tarea y esta nota es su disparador.

**Lo que sigue pendiente de esta fase:**

- **Exportación de datos del candidato** (portabilidad, art. 20) desde el
  producto. Hoy se atiende por correo, y la política lo dice tal cual.
- **Flujo de borrado (art. 17) desde el producto.** La tabla
  `data_deletion_requests` existe desde la fase 1 con su RLS, pero **no hay ni
  una pantalla ni una acción que la use**: hoy la baja se pide por correo. La
  política lo dice expresamente —«todavía no hay un botón para borrar la cuenta
  dentro del producto»—, así que **el día que se construya hay que subir la
  versión del texto**.
- **Ejecutar de verdad los plazos de conservación.** La política se compromete a
  30 días para el borrado, 3 años para consentimientos y aperturas, y 1 año para
  `email_log`. Hoy se cumplen a mano y el texto lo admite. Programarlos es de
  esta fase.
- **El flujo de reconsentimiento** para las filas cuya versión apunta a un texto
  que nunca existió (ADR-34).

**No confundir con los consentimientos de la fase 2.** Aquellos son de tratamiento de datos (términos, privacidad, compartición con agencias, audio) y se recogen versionados en el alta con ADR-20; ya están hechos, y desde el 2026-08-19 los **textos** que se aceptan existen y se enlazan.

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
