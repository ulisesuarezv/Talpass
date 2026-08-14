# PROMPT — Fase 1 · Datos y seguridad

> Pegar en una sesión nueva y limpia, **solo después de cerrar la Fase 0**.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/00-PROJECT.md` (ADRs y reglas de negocio) y **entero** `docs/01-DATA-MODEL.md`. Lee también la ficha de la Fase 1 en `docs/02-ROADMAP.md`.

Tu tarea es **únicamente la Fase 1: modelo de datos y seguridad**. No hay interfaz en esta fase.

> Esta es la fase más importante del proyecto. Un fallo aquí no es un bug: es una brecha de datos personales de ciudadanos de la UE, con un regulador detrás. Trabaja en consecuencia: despacio, y verificando.

## Alcance

**1. Migraciones**

- Supabase CLI con migraciones versionadas en `supabase/migrations/`. Nada de cambios a mano en el dashboard: todo debe ser reproducible.
- Implementa el schema completo de `docs/01-DATA-MODEL.md`: catálogos, identidad, candidato (con `candidate_private` segregada), ETT, vacantes con `job_translations`, aplicaciones con `application_events`, acceso a documentos con su log, consentimientos, pings de actividad, log de emails, solicitudes de borrado.
- Índices donde importan: filtros de vacantes, filtros de la bolsa, búsquedas por estado.
- Constraints reales: unicidad de (`job_id`, `candidate_id`), transiciones de estado válidas, claves foráneas con el `on delete` correcto pensando en GDPR.

**2. Catálogos con semilla (ADR-07)**

- Alemania como único país activo, con el resto (NL, BE, NO) presentes pero inactivos.
- Sectores, tipos de documento, requisitos documentales de Alemania, tipos de identificador fiscal (`steuer_id`, `bsn`, …) con su validación.
- Traducciones `es`/`en` de todos los catálogos.
- **Regla:** abrir un país nuevo debe ser insertar filas. Si te ves escribiendo un `if country ===`, el diseño está mal.

**3. Cifrado de datos sensibles (ADR-08)**

- IBAN e identificadores fiscales cifrados en reposo, no en texto plano.
- Decide e implementa el mecanismo (pgsodium/Vault o cifrado en la capa de aplicación), documenta la elección y su gestión de claves como ADR nuevo.

**4. RLS en todas las tablas — el núcleo de la fase**

- Ninguna tabla sin RLS habilitada. Ninguna política permisiva por defecto.
- Implementa la matriz de acceso de `docs/01-DATA-MODEL.md` al pie de la letra.
- **Vista `candidate_directory`** (ADR-03): seudonimizada, `first_name + inicial`, **edad calculada, nunca la fecha de nacimiento**, sin email, sin teléfono, sin dirección, sin IBAN, sin documentos. Solo candidatos `verified` y `active`. La seudonimización vive aquí, en la base de datos, no en el cliente.
- Documentos: acceso de la ETT solo si existe un `document_access_request` con estado `granted` y no caducado (ADR-05).
- Cuidado con las funciones `security definer`: son la vía habitual de fuga.

**5. Storage**

- Buckets `candidate-documents` y `candidate-audio` **privados**; `agency-logos` público.
- Políticas de storage alineadas con las de las tablas. Que un candidato no pueda leer la carpeta de otro.

**6. Tests de seguridad — el entregable real de esta fase**
Escribe un set de tests ejecutable (script TS con clientes de Supabase autenticados como cada rol, o pgTAP) que **demuestre**, con datos sembrados:

- Un usuario ETT **no puede** leer: email, teléfono, dirección, IBAN, fecha de nacimiento ni apellido completo de un candidato — ni por tabla, ni por vista, ni por join, ni por RPC.
- Un usuario ETT **no puede** descargar ningún documento sin un `granted` vigente, y **sí** puede con él.
- Un acceso concedido y luego caducado o revocado **deja de funcionar**.
- Un candidato no puede leer datos de otro candidato.
- Un candidato no puede modificar el estado de verificación de sus propios documentos.
- Una ETT no ve aplicaciones ni vacantes de otra ETT.
- Un usuario anónimo solo ve vacantes `published`.

Los tests deben poder ejecutarse con un comando y salir en rojo si alguien rompe una política. Déjalo documentado en `docs/CONVENTIONS.md`.

**7. Adenda fuera del tema de la fase (10 minutos, hazla primero)**
El sitio es público y no tiene `robots.txt`. El dominio definitivo ya está decidido — **talpass.eu** (ADR-12) — pero **todavía no hay contenido real que merezca indexarse**: solo marcadores de posición. Que Google indexe placeholders, o el dominio de Vercel, nos deja basura en el índice difícil de limpiar.

Añade `src/app/robots.ts` que devuelva **`Disallow: /` salvo que la indexación esté explícitamente habilitada**, mediante una variable propia (por ejemplo `NEXT_PUBLIC_ALLOW_INDEXING`) que hoy queda desactivada en todos los entornos.

Importante: **no derives la decisión solo del host o de `VERCEL_ENV`**. En cuanto se conecte `talpass.eu` en Vercel, un criterio basado en el host levantaría el bloqueo solo y expondría páginas vacías. El interruptor lo activa la Fase 3, cuando existan vacantes reales y sitemap.

## Fuera de alcance — no lo hagas

Interfaz, pantallas, formularios, autenticación de cara al usuario, emails. Nada visual. Si algo del modelo te parece incompleto para una fase futura, anótalo en el roadmap y sigue.

## Verificación antes de cerrar

1. Las migraciones se aplican desde cero sobre una base limpia, sin errores.
2. Todos los tests de seguridad pasan y **has comprobado que fallan** si desactivas una política (si nunca los viste en rojo, no prueban nada).
3. Ninguna tabla tiene RLS deshabilitada. Compruébalo con una consulta al catálogo de Postgres, no de memoria.
4. Los datos de semilla permiten trabajar en las fases siguientes: un admin, dos ETTs, varios candidatos en distintos estados de verificación, vacantes publicadas y en borrador.
5. `/robots.txt` responde y bloquea la indexación, y `next build` sigue limpio.

## Al terminar

- Marca la Fase 1 como ✅ en `docs/02-ROADMAP.md`.
- Documenta el mecanismo de cifrado elegido como ADR en `docs/00-PROJECT.md`.
- Si el schema real se desvió de `docs/01-DATA-MODEL.md`, **actualiza ese documento**: es la fuente de verdad de las fases siguientes.
- Resume qué políticas existen y qué debe saber la sesión de la Fase 2.
