# Roadmap por fases

> Cada fase está pensada para caber en **una sesión de trabajo con contexto limpio**.
> Regla de oro: se abre sesión nueva por fase, se leen `docs/00`, `docs/01` y la ficha de la fase, y se cierra con el entregable verificado.

**Estado global:** ⬜ no empezada · 🟡 en curso · ✅ cerrada

| #   | Fase                              | Entregable verificable                     | Estado |
| --- | --------------------------------- | ------------------------------------------ | ------ |
| 0   | Fundaciones                       | App desplegada, `/es` y `/en` vivos        | ✅     |
| 1   | Datos y seguridad                 | Schema + RLS probada con tests             | ✅     |
| 2   | Auth y onboarding candidato       | Registro real end-to-end                   | ⬜     |
| 3   | Vacantes públicas + SEO           | Vacante indexable en Google Jobs           | ⬜     |
| 4   | Verificación + backoffice         | Documento subido → aprobado por admin      | ⬜     |
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
2. **El audio exige consentimiento, como el DNI.** ADR-03 lo listaba entre lo
   visible en la bolsa; se ha cerrado con la regla estricta y la bolsa solo
   anuncia `has_audio`. **La fase 7 debe decidir** si la vista previa lo
   necesita sin consentimiento, y documentarlo.
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

---

## Fase 3 · Vacantes públicas + SEO

Listado con filtros (país, sector, idioma, alojamiento, transporte, carnet, turno) · página de detalle server-rendered · `JobPosting` schema.org · **landings programáticas** por país / ciudad / sector / alojamiento · enlazado interno vacante ↔ landing · sitemap dinámico · `hreflang` · Open Graph · CTA a registro.

**Hecho cuando:** una vacante valida en Google Rich Results Test, las landings enlazan a sus vacantes y de vuelta, y el listado carga rápido en 4G.

**Verificar obligatoriamente** _(ADR-11)_: las rutas públicas **no** pasan por el middleware de sesión y se sirven cacheadas. Si aparecen como dinámicas, el SEO está roto aunque la página se vea bien.

> Se coloca antes que la verificación **a propósito**: en cuanto exista, ya se puede empezar a captar tráfico y candidatos mientras se construye el resto.

---

## Fase 4 · Verificación + backoffice admin

Subida de documentos (móvil, con cámara) · **grabación de audio en navegador** con fallback a subida · estados por documento · backoffice: cola de revisión, aprobar/rechazar con motivo, ver candidatos y su estado.

**Hecho cuando:** un candidato sube sus documentos desde el móvil, el admin los aprueba, y el candidato pasa a `verified` y recibe aviso.

---

## Fase 5 · Aplicaciones

Aplicar a vacante (bloqueado si no está verificado, con mensaje que explica qué falta) · listado "Mis aplicaciones" con estado · log de eventos de aplicación · vista admin de aplicaciones.

**Hecho cuando:** un candidato verificado aplica, y el cambio de estado queda registrado en auditoría.

---

## Fase 6 · Portal ETT

Alta invite-only por admin · dashboard · CRUD de vacantes con traducciones (ADR-06) · lista de aplicaciones por vacante con cambio de estado · perfil de empresa (lo que ve el candidato).

**Hecho cuando:** una ETT publica una vacante, recibe una aplicación real y la mueve a `in_review`.

---

## Fase 7 · Bolsa de candidatos + consentimiento documental

Bolsa navegable con filtros sobre la vista seudonimizada (ADR-03) · solicitud de acceso a documentos · **flujo de consentimiento del candidato** (ADR-05): email + aviso in-app, conceder/denegar, recordatorio 24 h, caducidad 7 días · acceso temporal por URL firmada · `document_access_log` · solicitud de contacto desde la bolsa.

**Hecho cuando:** el ciclo completo funciona y existe registro de cada apertura de documento.

> Fase de mayor valor comercial. Es lo que se enseña en la reunión con la ETT.

---

## Fase 8 · Emails y automatismos

Resend con dominio verificado · plantillas i18n (registro, verificación aprobada/rechazada, cambio de estado, ETT te contacta, nueva aplicación para la ETT, ping de inactividad, solicitud de consentimiento) · **cron de inactividad 30 d → 72 h → `inactive`** · cron de caducidad de consentimientos · `email_log`.

**Hecho cuando:** el ciclo de inactividad se verifica de punta a punta con fechas forzadas.

---

## Fase 9 · GDPR y legal

Aviso legal, política de privacidad y de cookies en `es`/`en` · banner de consentimiento · exportación de datos del candidato · flujo de borrado (art. 17) respetando obligaciones de conservación · página pública que explica al candidato qué ve una ETT y qué no.

**Hecho cuando:** un candidato puede exportar y solicitar el borrado de sus datos desde su perfil.

> Esa página de transparencia también es marketing: es el argumento de confianza frente al caos de WhatsApp.

---

## Fase 10 · Hardening y lanzamiento

Auditoría de RLS por segunda vez · rate limiting en registro, subidas y login · límites de tamaño y validación de tipo de archivo · rendimiento móvil (Core Web Vitals) · analítica básica del funnel · páginas de error · seed de vacantes reales · checklist de lanzamiento.

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
