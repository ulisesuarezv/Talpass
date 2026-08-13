# Roadmap por fases

> Cada fase está pensada para caber en **una sesión de trabajo con contexto limpio**.
> Regla de oro: se abre sesión nueva por fase, se leen `docs/00`, `docs/01` y la ficha de la fase, y se cierra con el entregable verificado.

**Estado global:** ⬜ no empezada · 🟡 en curso · ✅ cerrada

| #   | Fase                              | Entregable verificable                     | Estado |
| --- | --------------------------------- | ------------------------------------------ | ------ |
| 0   | Fundaciones                       | App desplegada, `/es` y `/en` vivos        | ⬜     |
| 1   | Datos y seguridad                 | Schema + RLS probada con tests             | ⬜     |
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

---

## Fase 1 · Datos y seguridad

Migraciones SQL completas de `docs/01-DATA-MODEL.md` · catálogos con semilla (Alemania, sectores, tipos de documento, identificadores) · **políticas RLS de todas las tablas** · vista `candidate_directory` seudonimizada (ADR-03) · buckets de storage con políticas · datos de prueba.

**Hecho cuando:** existe un set de tests que demuestra que un usuario ETT **no puede** leer IBAN, dirección, email ni documentos de un candidato, ni por API ni por vista.

> Es la fase más importante del proyecto. Un fallo aquí es una brecha de datos, no un bug.

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
