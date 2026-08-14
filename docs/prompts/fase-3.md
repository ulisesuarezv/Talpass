# PROMPT — Fase 3 · Vacantes públicas y SEO

> Pegar en una sesión nueva y limpia. Fases 0, 1 y 2 cerradas.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/ESTADO.md`, `docs/00-PROJECT.md` (ADRs 01–21), `docs/01-DATA-MODEL.md`, `docs/CONVENTIONS.md` y la ficha de la Fase 3 en `docs/02-ROADMAP.md`.

Tu tarea es la **Fase 3: vacantes públicas y SEO**, más el desbloqueo del correo que la Fase 2 midió y dejó anotado.

## 0. Entorno — igual que en la fase 2

```bash
pnpm db:start        # OrbStack arrancado
pnpm dev:local       # Next contra la base local
```

Se desarrolla contra la base local (ADR-17). `.env.test` es local, `.env.local` es producción, y no se mezclan. Los scripts se niegan solos si el destino no es local; si alguno se niega, lo que está mal es el destino, no el guardarraíl.

Esta fase **sí** toca producción en dos momentos concretos y solo en esos: aplicar migraciones validadas y configurar el correo. Cuando toque, avisa de lo que vas a hacer antes de hacerlo.

## 1. Desbloqueo del correo — antes del SEO

La Fase 2 midió el límite del SMTP por defecto de Supabase: el **segundo** correo de la misma hora ya devuelve `over_email_send_rate_limit`. Esta fase construye la máquina de traer tráfico, así que el registro tiene que aguantar tráfico antes de encenderla. **Se adelanta de la fase 8 solo el transporte**; las plantillas i18n bonitas siguen siendo de la fase 8.

1. **Aplica a producción las migraciones pendientes de la fase 2.** Son tres, validadas en local pero sin aplicar: `20260814090000_grants.sql`, `20260814100000_onboarding.sql`, `20260814100100_signup_consents.sql`. Necesita `supabase login`; si no hay token en la máquina, **para y pídeselo a Ulises**, no lo esquives.
2. **Configura Resend como SMTP de Supabase** con `talpass.eu` verificado (SPF, DKIM y el registro de retorno que pida Resend). El `EMAIL_FROM` sale de configuración, no del código.
3. **Declara las URLs de retorno en el panel de producción** (Authentication › URL Configuration): `site_url` y las `additional_redirect_urls`, las mismas que `supabase/config.toml` tiene para local, con el dominio real. Sin esto el registro falla **sin dar ningún error**: GoTrue ignora el `emailRedirectTo`, manda el enlace a la home y la sesión no se canjea nunca. La fase 2 perdió un rato descubriéndolo.
4. **Vuelve a medir** con `scripts/probe-email-limit.mts` y reporta el límite nuevo.

Si algo de esto queda a medias, sigue con el resto de la fase pero **dilo claramente al cerrar**: condiciona el último punto.

## 2. Alcance de la fase

**Vacantes públicas**

- Listado con filtros: país, sector, idioma, alojamiento, transporte, carnet, turno. Los filtros salen de los **catálogos** (ADR-07), nunca de listas en el código.
- Página de detalle renderizada en servidor, con el contenido traducible que ya contempla el modelo de datos.
- Estados: solo se ve lo `published`. Eso ya lo garantiza la RLS de la fase 1; no lo dupliques en el cliente ni lo debilites.

**SEO**

- `JobPosting` de schema.org en cada vacante, válido en el Rich Results Test.
- **Landings programáticas** por país / ciudad / sector / alojamiento, con enlazado interno vacante ↔ landing en ambos sentidos. Es el motor de tráfico del job board (ADR-11), no un extra.
- `sitemap.ts` dinámico, `hreflang` completo entre `es` y `en`, Open Graph.
- CTA a registro en vacante y en landing.

**Rendimiento**

El candidato entra desde el móvil con 4G (ADR-10). El listado tiene que cargar rápido de verdad, no "rápido en tu portátil". Mide y reporta.

## 3. La trampa técnica de esta fase — léela dos veces

Las páginas de esta fase son **públicas**, y una ruta pública nunca lee la sesión (ADR-11, ADR-13). Leer cookies la vuelve dinámica, la saca del CDN y destruye justo el SEO que estás construyendo.

La fase 2 dejó esto avisado: **`lib/supabase/server` y `lib/catalogs.ts` leen cookies**, así que no se pueden usar aquí. Necesitas un cliente de servidor **sin cookies** para leer catálogos y vacantes desde rutas estáticas. Créalo, documenta cuál es cuál en `docs/CONVENTIONS.md`, y deja claro en el código qué cliente puede usarse desde dónde — esta confusión se va a repetir en cada fase futura que toque páginas públicas.

El estado de login en la cabecera ya está resuelto en cliente por `components/account-nav.tsx`. No lo muevas a servidor.

Los pathnames nuevos se añaden en `src/i18n/routing.ts` y en ningún otro sitio (ADR-14).

## 4. Fuera de alcance — no lo hagas

Aplicar a una vacante (Fase 5), portal de ETT y CRUD de vacantes (Fase 6), subida de documentos (Fase 4), plantillas de email i18n (Fase 8), banner de cookies y textos legales (Fase 9).

Las vacantes de prueba salen de `pnpm seed:demo`. **No inventes vacantes falsas en producción**: el seed de vacantes reales es de la fase 10.

## 5. Verificación antes de cerrar

1. Una vacante valida en el **Google Rich Results Test** como `JobPosting`. Adjunta el resultado.
2. Las landings enlazan a sus vacantes y las vacantes de vuelta a sus landings.
3. **Las rutas públicas siguen estáticas**: repite el procedimiento de `docs/CONVENTIONS.md` y adjunta la evidencia. Listado, detalle y landings deben salir `●` en el build, con `x-nextjs-cache: HIT` y **sin** `x-ett-session-checked`. Si alguna sale `ƒ`, la fase está mal aunque la página se vea bien.
4. `sitemap.xml` y `hreflang` correctos en ambos idiomas.
5. `pnpm test:security` y `:drill` siguen en verde en local.
6. `typecheck`, `lint`, `format:check` y `build` limpios.
7. Rendimiento del listado en móvil, medido y reportado.

## 6. La bandera de indexación — condicional, no automática

`NEXT_PUBLIC_ALLOW_INDEXING=true` se pone **solo en producción** y **solo si** antes has comprobado, con un alta real de punta a punta contra producción, que un candidato puede registrarse, recibir el correo, confirmarlo y completar el onboarding.

**Si ese alta no funciona, deja la bandera apagada y dilo.** No la enciendas "porque ya casi". Indexar páginas cuyo CTA está roto gasta el primer rastreo de Google, y sacar basura del índice cuesta meses (ADR-16).

Cuando la enciendas, díselo a Ulises explícitamente: a partir de ahí el sitio es público para Google y lo que se publique ya no es un borrador.

## 7. Al terminar

- Marca la Fase 3 como ✅ en `docs/02-ROADMAP.md` y añade los ADR nuevos que hayas tomado.
- Actualiza `docs/ESTADO.md`: dónde queda el trabajo, qué pendientes cierras de la lista de la fase 2 y cuáles siguen abiertos.
- Reporta el límite de envío nuevo, y si la bandera de indexación quedó encendida o apagada y por qué.
- Resume qué debe saber la sesión de la Fase 4.
- **Commitea y sube a `origin`** (https://github.com/ulisesuarezv/Talpass). Antes de commitear, comprueba que no se cuela ningún `.env` con valores de producción ni ninguna clave de Resend.
