# Estado del proyecto — punto de retomada

> Última actualización: **2026-08-16**. **El bloque de producción de la fase 3
> está cerrado entero**: migraciones, SMTP, URLs de retorno, despliegue y alta
> real, todo hecho y verificado. La fase 3 sigue 🟡 por **un solo criterio**: el
> Google Rich Results Test, que necesita una vacante pública real.
> La bandera de indexación sigue **APAGADA a propósito** hasta que existan esas
> vacantes. **Siguiente paso: la fase 4**, con `docs/prompts/fase-4.md`.
> Este documento dice exactamente dónde se dejó el trabajo y cuál es el siguiente paso.
> El detalle de cada fase está en `docs/02-ROADMAP.md`; las decisiones, en `docs/00-PROJECT.md`.

---

## Dónde estamos

**Fases 0, 1 y 2 cerradas. La fase 3 está construida y verificada en local, pero
NO cerrada:** sus dos criterios de "hecho cuando" que dependen de producción —la
validación en el Google Rich Results Test y el alta real de punta a punta— no se
han comprobado. Se cierra con el bloque de producción de abajo, que es además lo
que decide si el sitio se abre a Google.

Verificado por el PM el 2026-08-15: build con 41 públicas `●` y privadas `ƒ`, el
HTML del listado trae las vacantes dentro, `hreflang` recíproco entre
`/es/trabajo/alemania` y `/en/work/germany`, rutas públicas con `HIT` y sin
cabecera de sesión, y `test:security` 57/57. El trabajo está bien; lo que falta
es solo lo que no se puede probar sin producción.

| Fase                  | Estado                                              |
| --------------------- | --------------------------------------------------- |
| 0 · Fundaciones       | ✅ desplegada en producción                         |
| 1 · Datos y seguridad | ✅ 36 tablas, RLS probada                           |
| 2 · Auth y onboarding | ✅ registro real end-to-end, 57 tests verdes        |
| 3 · Vacantes + SEO    | 🟡 construida y verificada en local; **no cerrada** |
| **4 · Verificación**  | **⬜ siguiente, tras el bloque de abajo**           |
| 5–10                  | ⬜                                                  |

**Marca:** Talpass · **dominio canónico:** https://talpass.eu (apex; `www`
redirige, ADR-12) · `ettrecruiter.vercel.app` sigue respondiendo como dominio antiguo

---

## Lo primero al retomar — el bloque de producción de la fase 3

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

| Campo          | Valor                                                  |
| -------------- | ------------------------------------------------------ |
| Host / Port    | `smtp.resend.com` · `465`                              |
| Username       | `resend` — literalmente esa palabra, no el correo      |
| Password       | una API key de Resend con permiso de envío             |
| Sender email   | `no-reply@updates.talpass.eu`                          |
| Sender name    | `Talpass`                                              |

**Verificado contra producción el 2026-08-16**, llamando al `auth/v1/signup` con
la clave pública, igual que hace la aplicación:

| Verificación                | Resultado                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| Alta por la API de Auth     | 200 con `confirmation_sent_at`                                   |
| Entrega                     | Resend marca los tres envíos como **`delivered`**                |
| Remitente                   | `"Talpass" <no-reply@updates.talpass.eu>`                        |
| **Límite de envío**         | **3 altas en 16 segundos, ninguna rechazada**                    |

Ese último dato es el que justificaba adelantar Resend de la fase 8 a la 3: con
el SMTP por defecto, el **segundo** correo de la misma hora ya rebotaba con
`over_email_send_rate_limit`. Ya no.

> **El asunto llega en inglés** ("Confirm your email address"): es la plantilla
> por defecto de Supabase. Las plantillas i18n son de la **fase 8**, así que
> hasta entonces un candidato hispanohablante recibe el correo en inglés. Está
> anotado, no es un fallo pendiente de esta fase.

> **Ojo, son dos cosas distintas y la fase 4 necesita la segunda.** El SMTP del
> panel solo mueve los correos que manda GoTrue. El aviso de "verificación
> aprobada / rechazada" lo manda **la aplicación**, y para eso hace falta una
> `RESEND_API_KEY` **real**: la que hay hoy en `.env.local` es el hueco de la
> fase 0 y la API de Resend la rechaza con `API key is invalid` (comprobado el
> 2026-08-16). Crea una clave de envío en Resend y ponla en `.env.local` y en
> Vercel cuando llegue el momento; en local se sigue leyendo todo en Mailpit.

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

> El proyecto fuerza *Sensitive* en todas las variables, también en las
> `NEXT_PUBLIC_`, así que su valor **no se puede leer ni desde el panel ni con
> `vercel env pull`**. Se verifican mirando el HTML desplegado, no el panel.

**Desplegado el 2026-08-16** (`dpl_AHUq3dUG8D5hvM6ctJLYVX5Rqjw5`) y verificado
por el PM contra `https://talpass.eu`:

| Verificación                | Resultado en producción                                              |
| --------------------------- | -------------------------------------------------------------------- |
| `<title>` y marca           | **Talpass**, ya no EttRecruiter                                      |
| Canónica y `hreflang`       | apex en las tres: `es`, `en` y `x-default` — `SITE_URL` confirmada   |
| `/robots.txt`               | `Disallow: /` — correcto, la bandera sigue apagada (ADR-16)          |
| `/sitemap.xml`              | responde; **solo 2 URLs**, home y listado                            |
| `/es` y `/es/ofertas`       | `HIT` / `PRERENDER`, **sin** `x-ett-session-checked` ni `Set-Cookie` |
| `/es/cuenta`                | 307 a `/es/entrar`, `x-ett-session-checked: 1`, `no-store`           |

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
el **Google Rich Results Test**. Necesita una URL pública, y producción no tiene
ni una vacante — el seed de vacantes reales es de la fase 10. El marcado se
validó campo a campo contra los requisitos documentados de Google. Cuando exista
la primera vacante real en `talpass.eu`, se pasa por
https://search.google.com/test/rich-results y se anota aquí.

---

## Pendientes de Ulises (fuera del repositorio)

1. **Guardar el llavero de cifrado de `.env.local` en el gestor de contraseñas.**
   Es el único secreto del proyecto que **no se puede regenerar**: perderlo es
   perder los IBAN cifrados, por diseño. Lo más urgente de esta lista.
2. **Rotar la contraseña de la base de datos** — pasó por el chat. Está en
   `.env.local`, ignorado por git, así que es higiene, no urgencia.
3. **El bloque de producción de la fase 3**, arriba. Es lo que abre el sitio a
   Google.
4. **`talpass.com` queda aplazado por presupuesto.** Decisión consciente: es la
   mitigación del riesgo de ADR-12 y sigue pendiente. Revisarlo cuando haya caja.
5. **En tu bandeja hay un correo de "Confirm your email address"** con alias
   `+smtp-probe-…`. Es de la medición del límite de envío; la cuenta ya está
   borrada y se puede ignorar.

---

## Para trabajar en local, sea cual sea la fase

```bash
pnpm db:start        # OrbStack tiene que estar arrancado
pnpm seed:demo       # 3 vacantes publicadas: sin ellas el listado sale vacío
pnpm dev:local       # Next contra la base local
```

**Se desarrolla contra la base local, no contra producción** (ADR-17). Hay dos
ficheros de entorno y no se mezclan: `.env.test` apunta a local y lo leen
`dev:local`, las semillas y los tests; `.env.local` apunta a producción. Si
falta `.env.test`, se crea con `cp .env.test.example .env.test`. Los correos de
prueba se leen en Mailpit, http://127.0.0.1:54324.

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
  claves de traducción, no frases.
