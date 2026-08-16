# Estado del proyecto — punto de retomada

> Última actualización: **2026-08-16**. **La fase 4 está construida y verificada
> en local**: subida de documentos, grabación de audio, backoffice de revisión,
> el primer correo propio de la aplicación y una vía para publicar vacantes
> reales. Se queda en 🟡 por **un solo criterio**: que exista una vacante real
> **publicada en producción**, que es una escritura deliberada y la hace Ulises.
> Esa misma vacante es la que desbloquea la fase 3 entera (Rich Results Test) y
> la bandera de indexación, que sigue **APAGADA a propósito**.
> **Siguiente paso: publicar las primeras ofertas reales** — abajo, "Lo primero
> al retomar".
> El detalle de cada fase está en `docs/02-ROADMAP.md`; las decisiones, en `docs/00-PROJECT.md`.

---

## Dónde estamos

**Fases 0, 1 y 2 cerradas. Las fases 3 y 4 están construidas y verificadas, y
las dos esperan a lo mismo: una vacante real en producción.** La 3 la necesita
para el Google Rich Results Test; la 4, porque su criterio de "hecho cuando"
incluye que el admin haya podido publicar una. No es trabajo de código: la vía
existe, está probada y documentada.

| Fase                  | Estado                                               |
| --------------------- | ---------------------------------------------------- |
| 0 · Fundaciones       | ✅ desplegada en producción                          |
| 1 · Datos y seguridad | ✅ 36 tablas, RLS probada                            |
| 2 · Auth y onboarding | ✅ registro real end-to-end                          |
| 3 · Vacantes + SEO    | 🟡 falta el Rich Results Test sobre una vacante real |
| 4 · Verificación      | 🟡 falta publicar una vacante real en producción     |
| **5 · Aplicaciones**  | **⬜ siguiente fase de código**                      |
| 6–10                  | ⬜                                                   |

### Lo que dejó la fase 4 (2026-08-16, verificado contra la base local)

| Verificación                      | Resultado                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Ciclo completo en móvil (390×844) | 4 documentos → **rechazo con motivo** → vuelve a subir → aprobación → `verified` |
| Aviso al candidato                | leído en Mailpit, en **su** idioma, aprobado y rechazado                         |
| Registro de aperturas             | una fila por apertura del admin, con IP y user-agent (ADR-25)                    |
| URL firmada                       | 60 s, emitida en servidor tras comprobar permiso; sin sesión, **404**            |
| Sin credencial de correo          | el candidato **igual pasa a `verified`**; el fallo se ve y queda en `email_log`  |
| `test:security` · `:drill`        | **64/64** y el simulacro en verde                                                |
| Rutas públicas                    | `HIT`, sin cabecera de sesión ni `Set-Cookie`; privadas `ƒ`                      |
| Publicar una vacante              | idempotente, en el listado sin JavaScript y con su landing de ciudad             |

Evidencia en `docs/evidencia/fase-4/`. ADR nuevos: **25** (registro de aperturas
del admin), **26** (un solo punto de envío de correo), **27** (motivos de rechazo
como claves), **28** (publicar vacantes por fichero) y **29** (la subida pasa por
el servidor).

**Marca:** Talpass · **dominio canónico:** https://talpass.eu (apex; `www`
redirige, ADR-12) · `ettrecruiter.vercel.app` sigue respondiendo como dominio antiguo

---

## Lo primero al retomar — poner las primeras vacantes reales en producción

Es lo que cierra **dos fases a la vez** (la 3 y la 4) y lo que abre el sitio a
Google. No hay que escribir código: hay que redactar ofertas y lanzar un comando.

### 1. Redactar las ofertas

Una por fichero, en `content/jobs/`. Copia
`content/jobs/ejemplo-almacen-nuremberg.json` y cambia lo que haga falta; el
formato entero, campo a campo, está en `docs/CONVENTIONS.md` → "Publicar una
vacante real". La investigación de mercado (`docs/prompts/investigacion-ofertas.md`)
es de dónde salen los rangos salariales, las ciudades y el vocabulario.

Prueba siempre primero en local, que no cuesta nada y es idempotente:

```bash
pnpm db:start && pnpm dev:local
pnpm job:publish content/jobs/mi-oferta.json
```

### 2. Antes de publicar en producción: la migración de la fase 4

Producción está al día **hasta la fase 3**. La fase 4 añade una migración
(`20260816120000_verification.sql`) y sin ella el backoffice no funciona ahí.
Validada en local con `db:reset` desde cero, `test:security` 64/64 y el
simulacro en verde:

```bash
! printf 'produccion\nY\n' | pnpm db:push:prod
```

> Lo ejecuta Ulises con el prefijo `!`: el clasificador de permisos deniega las
> escrituras contra producción desde la sesión, y hace bien.

### 3. Publicar, y **desplegar después**

```bash
pnpm job:publish:prod content/jobs/mi-oferta.json    # pide teclear "produccion"
pnpm exec vercel --prod
```

**El despliegue no es opcional.** Las landings son estáticas y se derivan de las
vacantes vivas (ADR-23): una ciudad o un sector nuevos no tienen landing hasta
que se redespliega, aunque la vacante ya esté publicada y visible en su URL.
Y recuerda que **este proyecto de Vercel no tiene integración con GitHub**: un
`git push` no despliega nada (ver 3 bis, más abajo).

### 4. Tres variables de entorno que faltan en Vercel

Sin ellas el backoffice de la fase 4 no funciona en producción:

| Variable                    | Para qué                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | escribir `document_access_log` y `email_log` — no hay política    |
| `RESEND_API_KEY`            | el aviso de aprobado/rechazado **lo manda la aplicación**         |
| `EMAIL_FROM`                | `no-reply@updates.talpass.eu` (el dominio verificado, no el apex) |

> La clave de Resend **ya es válida** — se comprobó sin querer el 2026-08-16, ver
> "Cosas que no deben olvidarse". Es la misma que usa el SMTP del panel.

### 5. Y entonces sí: encender la indexación y cerrar la fase 3

Con ofertas reales publicadas, se pasa una por
https://search.google.com/test/rich-results, se anota el resultado, y se
encienden **los dos gestos** —el segundo no es opcional, `NEXT_PUBLIC_` se
hornea en el build:

```bash
printf 'true' | pnpm exec vercel env add NEXT_PUBLIC_ALLOW_INDEXING production
pnpm exec vercel --prod
```

---

## Si retomas como PM — qué te toca

El método completo está en `docs/02-ROADMAP.md` → "Cómo trabajamos cada fase".
El resumen: **el PM no ejecuta**, redacta el prompt de cada fase en
`docs/prompts/fase-N.md`, y **verifica los cierres en vez de fiarse del
resumen**. Esta regla se ganó con dos errores reales: un resumen con 16
migraciones cuando eran 17, y una fase marcada ✅ mientras el propio resumen
admitía que su criterio no se había comprobado.

Ahora mismo, y por este orden:

1. **Acompañar a Ulises en los cinco pasos de arriba.** No los ejecuta el PM
   —las escrituras contra producción las lanza él con `!`— pero **cada uno se
   verifica al terminar**: `migration list --linked` tras el `db:push:prod`,
   `curl` del HTML y del sitemap tras el despliegue, `vercel env ls` tras las
   variables. Sirve de guion lo que ya se hizo el 2026-08-16.
2. **Cerrar las fases 3 y 4** en `docs/02-ROADMAP.md` cuando —y solo cuando— la
   vacante real esté publicada y el Rich Results Test la valide. Anotar el
   resultado del tester aquí.
3. **Redactar `docs/prompts/fase-5.md`**, y no antes: un prompt escrito hoy
   ignoraría lo que traiga la publicación de las primeras ofertas. Ojo a lo que
   la fase 4 dejó dicho: el backoffice **se amplía, no se rehace**, y al existir
   el aplicar hay que volver al `directApply: false` del `JobPosting` de la
   fase 3.

**Lo que el PM no debe hacer:** dar por hecho lo que diga un panel —Vercel llegó
a marcar "Valid Configuration" con el DNS roto—, ni aceptar un ✅ cuyo criterio
no se haya medido.

---

## Historia — el bloque de producción de la fase 3

**Cerrado el 2026-08-16.** Los cuatro pasos, más un quinto que no estaba en la
lista y resultó ser el que faltaba de verdad: **desplegar** (3 bis). Se deja
escrito porque explica cómo está montado el entorno y qué falló por el camino.

### 1. ~~Aplicar las tres migraciones pendientes a producción~~ ✅ HECHO, 2026-08-16

Ulises lo ejecutó desde la sesión y **el PM lo verificó**: `supabase migration
list --linked` devuelve **17 migraciones con `local` y `remote` idénticos y sin
huecos**, las tres nuevas incluidas. Producción está al día con el repositorio.

No se pudo repetir la auditoría de RLS contra producción desde la sesión —el
clasificador deniega usar la `service_role` contra producción, y hace bien—.
No hace falta: son las mismas tres migraciones validadas en local con `db:reset`
desde cero y `test:security` 57/57, y `grants.sql` contra el proyecto alojado es
el no-op que documentó la fase 2. Se recomprobará en la auditoría de la fase 10.

<details><summary>Cómo se hizo, por si hay que repetirlo</summary>

Validadas en local en esta misma sesión: `db:reset` desde cero, `test:security`
**57/57** y el simulacro en verde. `supabase migration list --linked` y un
`--dry-run` confirman que son exactamente estas tres y ninguna más:

```
20260814090000_grants.sql
20260814100000_onboarding.sql
20260814100100_signup_consents.sql
```

Ejecútalo tú, desde esta sesión, con el prefijo `!`:

```
! printf 'produccion\nY\n' | pnpm db:push:prod
```

> La sesión no pudo lanzarlo: el clasificador de permisos deniega las escrituras
> contra producción. **No es un fallo del proyecto**: el guardarraíl de
> `db:push:prod` funcionó, y encima de él hay otro. Lo ejecuta Ulises con `!`.

</details>

### 2. ~~Resend como SMTP de Supabase~~ ✅ HECHO, 2026-08-16

> **El dominio verificado en Resend es `updates.talpass.eu`, NO `talpass.eu`.**
> Es el único de la cuenta (`region: eu-west-1`, `sending: enabled`). Dar por
> hecho el dominio raíz costó dos intentos fallidos de alta el 2026-08-16: Resend
> rechaza cualquier envío cuyo remitente no esté en un dominio verificado, y
> GoTrue lo devuelve como `Error sending confirmation email` — un 500 opaco que
> desde la pantalla de registro se ve como un error genérico.
>
> Por eso el remitente es **`no-reply@updates.talpass.eu`**. Si algún día se
> quiere el raíz —se lee mejor en la bandeja del candidato—, hay que **añadir y
> verificar `talpass.eu` como dominio aparte** en Resend, con su DNS.

Configuración que funciona, en Authentication › Emails › SMTP Settings:

| Campo        | Valor                                             |
| ------------ | ------------------------------------------------- |
| Host / Port  | `smtp.resend.com` · `465`                         |
| Username     | `resend` — literalmente esa palabra, no el correo |
| Password     | una API key de Resend con permiso de envío        |
| Sender email | `no-reply@updates.talpass.eu`                     |
| Sender name  | `Talpass`                                         |

**Verificado contra producción el 2026-08-16**, llamando al `auth/v1/signup` con
la clave pública, igual que hace la aplicación:

| Verificación            | Resultado                                         |
| ----------------------- | ------------------------------------------------- |
| Alta por la API de Auth | 200 con `confirmation_sent_at`                    |
| Entrega                 | Resend marca los tres envíos como **`delivered`** |
| Remitente               | `"Talpass" <no-reply@updates.talpass.eu>`         |
| **Límite de envío**     | **3 altas en 16 segundos, ninguna rechazada**     |

Ese último dato es el que justificaba adelantar Resend de la fase 8 a la 3: con
el SMTP por defecto, el **segundo** correo de la misma hora ya rebotaba con
`over_email_send_rate_limit`. Ya no.

> **El asunto llega en inglés** ("Confirm your email address"): es la plantilla
> por defecto de Supabase. Las plantillas i18n son de la **fase 8**, así que
> hasta entonces un candidato hispanohablante recibe el correo en inglés. Está
> anotado, no es un fallo pendiente de esta fase.

> **Ojo, son dos cosas distintas.** El SMTP del panel solo mueve los correos que
> manda GoTrue —confirmación de registro y recuperación—. El aviso de
> "verificación aprobada / rechazada" lo manda **la aplicación** y va por la API
> de Resend con `RESEND_API_KEY`, que es otra vía aunque use la misma clave.
>
> Esa clave **es válida desde el 2026-08-16**. Hasta entonces `.env.local` tenía
> el hueco vacío de la fase 0, y la API la rechazaba con `API key is invalid`;
> se sustituyó al configurar el SMTP. Lo que falta es **ponerla en Vercel**, con
> `EMAIL_FROM` — están en "Lo primero al retomar", paso 4.

### 3. ~~Las URLs de retorno en el panel de producción~~ ✅ HECHO, 2026-08-16

Authentication › URL Configuration, **todo con el apex y sin mezclar hosts**:

```
site_url                  https://talpass.eu
additional_redirect_urls  https://talpass.eu/**
```

Y en Vercel, `NEXT_PUBLIC_SITE_URL=https://talpass.eu` y
`NEXT_PUBLIC_SITE_NAME=Talpass`.

> **Sin esto el registro falla sin dar ningún error**: GoTrue ignora el
> `emailRedirectTo`, manda el enlace a la home y la sesión no se canjea nunca.
> La fase 2 perdió un rato descubriéndolo.
>
> **No se usa `supabase config push`** para esto, aunque exista: empujaría el
> `config.toml` local —con `site_url = http://localhost:3000`— y el resto del
> bloque `[auth]` encima de producción.

### 3 bis. Desplegar — descubierto el 2026-08-16

**La fase 3 estaba en `origin` pero no en producción.** El único despliegue vivo
era del 2026-08-13 (fases 0–2): `talpass.eu` servía el `<title>` "EttRecruiter",
el `hreflang` apuntaba a `ettrecruiter.vercel.app` y `/robots.txt` daba 404.

**Causa: el proyecto de Vercel no tiene integración con GitHub.** Un `git push`
no despliega nada; los despliegues son manuales con `pnpm exec vercel --prod`.
Conectar el repositorio es trabajo pendiente y evita que vuelva a pasar.

> **Cuidado con el orden.** El alta real del paso 4 contra un build antiguo no
> vale para cerrar nada: se prueba código que no es el que está en el repositorio.
> **Desplegar va siempre antes de verificar.**

Y faltaban en Vercel las **tres claves de cifrado** (`TALPASS_ENCRYPTION_KEYS`,
`TALPASS_ENCRYPTION_ACTIVE_KEY_ID`, `TALPASS_BLIND_INDEX_KEY`), que la fase 4
necesita para escribir `candidate_private`. Añadidas el 2026-08-16, junto con
`NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_SITE_NAME` reescritas con el apex y la marca.

> El proyecto fuerza _Sensitive_ en todas las variables, también en las
> `NEXT_PUBLIC_`, así que su valor **no se puede leer ni desde el panel ni con
> `vercel env pull`**. Se verifican mirando el HTML desplegado, no el panel.

**Desplegado el 2026-08-16** (`dpl_AHUq3dUG8D5hvM6ctJLYVX5Rqjw5`) y verificado
por el PM contra `https://talpass.eu`:

| Verificación          | Resultado en producción                                              |
| --------------------- | -------------------------------------------------------------------- |
| `<title>` y marca     | **Talpass**, ya no EttRecruiter                                      |
| Canónica y `hreflang` | apex en las tres: `es`, `en` y `x-default` — `SITE_URL` confirmada   |
| `/robots.txt`         | `Disallow: /` — correcto, la bandera sigue apagada (ADR-16)          |
| `/sitemap.xml`        | responde; **solo 2 URLs**, home y listado                            |
| `/es` y `/es/ofertas` | `HIT` / `PRERENDER`, **sin** `x-ett-session-checked` ni `Set-Cookie` |
| `/es/cuenta`          | 307 a `/es/entrar`, `x-ett-session-checked: 1`, `no-store`           |

**28 páginas estáticas frente a las 41 de local, y un sitemap de 2 URLs en vez
de 13.** No es un fallo: producción no tiene ni una vacante, así que no hay
páginas de detalle ni landings que derivar (ADR-23). Es exactamente el catálogo
vacío que la fase 4 viene a resolver.

### 4. ~~Alta real end-to-end~~ ✅ HECHO, 2026-08-16 — la bandera espera

Ulises se registró de verdad en `https://talpass.eu/es/registro`, recibió el
correo, lo confirmó **entrando con la sesión hecha** y completó el onboarding.
Con eso quedan probados por el camino real los tres pasos anteriores: las
migraciones, el SMTP de Resend y las URLs de retorno.

> **Cuidado al verificar esto con `curl`.** Una llamada directa a
> `auth/v1/signup` **no manda `emailRedirectTo`**, así que GoTrue confirma el
> correo pero devuelve al `site_url` a secas en vez de a `/api/auth/callback`,
> que es quien canjea el código por sesión. Se aterriza en la home sin sesión y
> parece que las URLs de retorno están mal cuando no lo están. **El retorno solo
> se valida desde el formulario**; el `curl` sirve para probar el envío y nada más.

**La bandera sigue APAGADA, y ahora por otro motivo.** Decisión del 2026-08-16:
el alta ya funciona, pero producción no tiene ni una vacante y su sitemap son 2
URLs. Encenderla hoy es invitar a Google a rastrear un job board vacío —
justo lo que se quiso evitar al mover la publicación de vacantes reales a la
fase 4. **Se enciende al terminar la fase 4**, con ofertas reales publicadas, y
en la misma tacada se pasa el Rich Results Test y se cierra la fase 3 entera.

Cuando toque, son dos gestos y **el segundo no es opcional**:

```bash
printf 'true' | pnpm exec vercel env add NEXT_PUBLIC_ALLOW_INDEXING production
pnpm exec vercel --prod   # es NEXT_PUBLIC_: se hornea en el build
```

---

## Lo que la fase 3 dejó verificado

Todo contra la base local con `pnpm seed:demo` (3 vacantes publicadas):

| Verificación                       | Resultado                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `next build`                       | **41 páginas públicas `●`**; `account`, `agency`, `admin`, `onboarding` siguen `ƒ`    |
| Cabeceras (ADR-11)                 | públicas `x-nextjs-cache: HIT`, **sin** `x-ett-session-checked` ni `Set-Cookie`       |
| Vacantes en el HTML estático       | 3 enlaces en `/es/ofertas` sin ejecutar JavaScript                                    |
| `hreflang` recíproco               | `/es/trabajo/alemania/logistica` ↔ `/en/work/germany/logistics`, con `x-default`      |
| Enlazado interno en ambos sentidos | landing → 3 vacantes y 7 landings vecinas; vacante → sus 4 landings                   |
| `sitemap.xml`                      | 13 URLs, cada una con sus `xhtml:link` de `hreflang` y `x-default`                    |
| `JobPosting`                       | los 9 campos obligatorios de Google presentes y bien formados                         |
| Rendimiento móvil (Lighthouse, 4G) | listado **97** · detalle 95 · landing 97 — FCP 0,8 s, LCP 2,6 s, TBT 10 ms, CLS 0,001 |
| `test:security` / `:drill`         | 57/57 y el simulacro en verde                                                         |
| `typecheck` · `lint` · `format`    | limpios                                                                               |

**Lo único del guion de la fase que no se pudo cerrar**: pasar una vacante por
el **Google Rich Results Test**. Necesita una URL pública y producción no tiene
ni una vacante. El marcado se validó campo a campo contra los requisitos
documentados de Google, pero quien decide qué acepta Google es Google.

La vía para publicarlas la construyó la **fase 4** (`pnpm job:publish:prod`,
ADR-28), así que ya no falta código: falta redactar las ofertas. Está todo en
"Lo primero al retomar", arriba.

---

## Pendientes de Ulises (fuera del repositorio)

1. **Guardar el llavero de cifrado de `.env.local` en el gestor de contraseñas.**
   Es el único secreto del proyecto que **no se puede regenerar**: perderlo es
   perder los IBAN cifrados, por diseño. Lo más urgente de esta lista.
2. **Rotar la contraseña de la base de datos** — pasó por el chat. Está en
   `.env.local`, ignorado por git, así que es higiene, no urgencia.
3. **Publicar las primeras vacantes reales**, arriba. Es lo que cierra las fases
   3 y 4 y lo que abre el sitio a Google. Incluye subir la migración de la fase
   4 y poner tres variables en Vercel.
4. **Conectar el repositorio de GitHub al proyecto de Vercel.** Hoy los
   despliegues son manuales (`pnpm exec vercel --prod`) y por eso la fase 3
   pasó un día entero en `origin` sin llegar a producción, con todo el mundo
   creyendo que estaba desplegada.
5. **`talpass.com` queda aplazado por presupuesto.** Decisión consciente: es la
   mitigación del riesgo de ADR-12 y sigue pendiente. Revisarlo cuando haya caja.
6. **Ruido conocido en la bandeja y en Resend, nada que hacer.** Correos de
   "Confirm your email address" con alias `+smtp-probe-…` y `+talpassprobe…`,
   de las pruebas de envío; **sus cuentas se borraron el 2026-08-16 y se
   comprobó que ya no existen**. Y un envío a `maria@talpass.test`, de una
   prueba en local que heredó la clave real: rebotará, porque ese dominio no
   existe.

---

## Para trabajar en local, sea cual sea la fase

```bash
pnpm db:start        # OrbStack tiene que estar arrancado
pnpm seed:demo       # 3 vacantes publicadas: sin ellas el listado sale vacío
pnpm dev:local       # Next contra la base local
```

> **`seed:demo` y `job:publish` no son lo mismo y no compiten.** `seed:demo`
> llena la base local de datos de mentira para poder desarrollar, y **se niega a
> tocar producción**. `job:publish` (fase 4, ADR-28) publica **una oferta real**
> desde un fichero de `content/jobs/`, va a local por defecto y a producción solo
> si se lo pides a propósito. Para desarrollar, `seed:demo`; para publicar una
> oferta de verdad, `job:publish`.

**Se desarrolla contra la base local, no contra producción** (ADR-17). Hay dos
ficheros de entorno y no se mezclan: `.env.test` apunta a local y lo leen
`dev:local`, las semillas y los tests; `.env.local` apunta a producción. Si
falta `.env.test`, se crea con `cp .env.test.example .env.test`. Los correos de
prueba se leen en Mailpit, http://127.0.0.1:54324 — desde la fase 4, también los
que manda la propia aplicación.

> **Y no se mezclan… salvo lo que `.env.test` no declare.** Next lee `.env.local`
> para todo lo que no venga ya en el entorno, así que una variable que solo
> exista en producción se cuela en una ejecución local. Por eso `.env.test`
> lleva `RESEND_API_KEY=` **vacía**. Al añadir una variable de producción,
> añádela vacía a `.env.test` en la misma tacada.

Procedimiento completo en `docs/CONVENTIONS.md`.

---

## Decisiones abiertas, para cuando toquen

- **ADR-06** · ¿La ETT seguirá creando vacantes sin moderación? Se decide tras
  ver la calidad real de las ofertas de la primera ETT.
- **ADR-04** · `documents_requested` no se puede saltar. Si estorba en la fase 6,
  se cambia con una decisión, no con un parche.
- **ADR-19** · Los `grant` de tabla replican los amplios de Supabase por defecto.
  Afinarlos por tabla y operación es endurecimiento, fase 10.
- **ADR-24** · El listado lleva todas las vacantes publicadas en el HTML. Cuando
  el volumen lo pida, se pagina en servidor conservando el prerenderizado de la
  primera página. No antes.
- **Fase 7** · El audio se reproduce en la bolsa con URL firmada de ≤5 min y
  escucha registrada (ADR-18). El consentimiento ya se recoge y se revoca; **la
  fase 7 tiene que leerlo antes de firmar nada**.

---

## Cosas que no deben olvidarse

- **Las rutas públicas no tocan la sesión** (ADR-11, ADR-13), y desde la fase 3
  tampoco `searchParams` ni `useSearchParams`. Se verifica en cada fase con el
  procedimiento de `docs/CONVENTIONS.md`.
- **Que una ruta salga `●` en el build no garantiza que su HTML tenga
  contenido.** Un `Suspense` con `useSearchParams` dentro se prerenderiza vacío.
  Se mira también el HTML, no solo la letra del build.
- **Qué cliente de Supabase desde dónde** (ADR-22): si un fichero lo puede
  importar una ruta pública, no puede tocar `cookies()`. Tabla en
  `docs/CONVENTIONS.md`.
- **Nunca `db reset` ni el simulacro contra producción** (ADR-17). Los scripts ya
  se niegan solos.
- La marca no se escribe en el JSX: sale de `src/config/site.ts` (ADR-12).
- **Cero texto en el JSX, tampoco los errores.** Las Server Actions devuelven
  claves de traducción, no frases. Desde la fase 4 eso incluye el **motivo de
  rechazo de un documento**, que se guarda como clave (ADR-27).
- **Lo que `.env.test` no declara, se hereda de `.env.local`.** Costó un correo
  real enviado desde la cuenta de producción durante una prueba en local
  (2026-08-16). Variable de producción nueva ⇒ entrada vacía en `.env.test`.
- **`service_role` se salta la RLS entera.** Vive en `lib/supabase/admin.ts` y
  hoy solo escribe `document_access_log` y `email_log`, que no tienen política
  de INSERT para nadie. Si algo funciona con la sesión del usuario, va con la
  sesión del usuario: si no, los tests dejan de probar el camino real.
- **Comprueba a qué servidor le estás preguntando.** Un `next start` viejo
  pegado al puerto sirve un build anterior y parece un fallo del código;
  `pkill -f "next start"` no siempre lo mata. Procedimiento en
  `docs/CONVENTIONS.md`.
