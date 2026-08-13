# Modelo de datos

> Diseñado para que abrir un país nuevo sea **insertar filas, no migrar el schema** (ADR-07).
> Referencia conceptual. Las migraciones SQL reales viven en `supabase/migrations/`.

---

## Principios

1. **Lo que varía por país es catálogo, no enum ni código.**
2. **Lo sensible va segregado** en tablas propias con RLS estricta (ADR-08).
3. **Todo lo que puede disputarse legalmente se registra**: consentimientos, cambios de estado, accesos a documentos.
4. **La seudonimización se aplica en la base de datos** (vistas + RLS), nunca en el cliente.
5. Toda tabla: `id uuid`, `created_at`, `updated_at`. Borrado lógico (`deleted_at`) donde GDPR lo permita.

---

## A. Catálogos (semilla, editables sin desplegar)

| Tabla                           | Contenido                                                                                              | Por qué es catálogo                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `countries`                     | code ISO-2, nombre i18n, moneda por defecto, activo                                                    | Abrir NL/BE/NO = 3 filas            |
| `sectors`                       | slug, nombre i18n                                                                                      | Sectores nuevos sin desplegar       |
| `document_types`                | slug (`id_front`, `id_back`, `cv`, `audio_en`, `driving_license`, `tax_doc`), i18n, formatos aceptados | Cada país pide papeles distintos    |
| `country_document_requirements` | country + document_type + obligatorio                                                                  | Requisitos de verificación por país |
| `identifier_types`              | slug (`bsn`, `steuer_id`, `rijksregister`, `fodselsnummer`), country_code, regex de validación         | Identificadores fiscales por país   |
| `languages` / niveles           | código, i18n                                                                                           | Requisitos de idioma en vacantes    |

---

## B. Identidad

**`profiles`** — 1:1 con `auth.users`
`id`, `role` (`candidate` | `agency_member` | `admin`), `locale`, `email`, `created_at`, `last_seen_at`

---

## C. Candidato

**`candidates`** — datos no sensibles, base de la bolsa
`profile_id` PK · `first_name` · `last_name` · `nationality_code` · `date_of_birth` · `current_country_code` · `current_city` · `english_level` · `has_driving_license` · `worked_in_nl_de` · `needs_housing` · `needs_transport` · `work_experience` (texto libre) · `status` (`active` | `inactive`) · `verification_status` (`unverified` | `pending` | `verified` | `rejected`) · `last_activity_at`

**`candidate_private`** — sensible, RLS más estricta _(ADR-08)_
`candidate_id` PK · `phone` · `address_line` · `postal_code` · `city` · `country_code` · `iban_encrypted`

**`candidate_identifiers`** — multi-país _(ADR-07)_
`candidate_id` · `identifier_type_id` · `value_encrypted` · `verified_at`

**`candidate_documents`**
`candidate_id` · `document_type_id` · `storage_path` (bucket privado) · `status` (`pending` | `verified` | `rejected`) · `reviewed_by` (nulo = revisión automática futura) · `reviewed_at` · `rejection_reason` · `mime_type` · `size_bytes`

**`candidate_sectors`** — experiencia por sector (N:M con `sectors`), con meses de experiencia

> **Vista `candidate_directory`** — lo único que la ETT puede consultar en la bolsa (ADR-03):
> `display_name` = `first_name || ' ' || left(last_name,1) || '.'`, edad calculada (no fecha de nacimiento), ciudad + país, experiencia, sectores, nivel de inglés, URL firmada del audio, sellos de verificación booleanos, disponibilidad, alojamiento/transporte.
> Solo incluye candidatos `verified` y `active`.

---

## D. ETT

**`agencies`**
`name` · `slug` · `logo_url` · `description` (i18n) · `country_code` · `registration_number` · `registration_type` (`handelsregister` | `kvk` | …) · `sectors[]` · `status` (`pending` | `approved` | `suspended`)

**`agency_members`**
`profile_id` · `agency_id` · `role` (`owner` | `recruiter`)

---

## E. Vacantes

**`jobs`**
`agency_id` · `created_by` · `slug` · `client_company_name` · `show_client_company` · `country_code` · `city` · `salary_min` · `salary_max` · **`salary_currency`** · **`salary_period`** (`hour` | `month`) · `shifts[]` (`morning`/`afternoon`/`night`/`rotating`) · `weekly_hours` · `sector_id` · `required_language` + `level` · `requires_driving_license` · `housing_provided` + `housing_price` + `currency` · `transport_provided` · `min_contract_months` · `start_date` · `status` (`draft` | `published` | `paused` | `closed`) · `published_at` · `expires_at`

**`job_translations`** — SEO multi-idioma _(ADR-01, ADR-02)_
`job_id` · `locale` · `title` · `description` · `tasks` · `requirements` · `benefits`
El texto de la vacante **no vive en `jobs`**: vive aquí, una fila por idioma.

---

## F. Aplicaciones

**`applications`**
`job_id` · `candidate_id` · `status` (`pending` | `in_review` | `documents_requested` | `hired` | `rejected`) · `status_changed_at` · `rejection_reason`
**Único** por (`job_id`, `candidate_id`).

**`application_events`** — auditoría _(ADR-04)_
`application_id` · `from_status` · `to_status` · `actor_profile_id` · `note` · `created_at`

---

## G. Acceso a documentos — el corazón del producto _(ADR-05)_

**`document_access_requests`**
`agency_id` · `candidate_id` · `application_id` (nulo si viene de la bolsa) · `requested_by` · `scope` (tipos de documento solicitados) · `status` (`pending` | `granted` | `denied` | `expired` | `revoked`) · `requested_at` · `responded_at` · `expires_at` (7 días) · `reminder_sent_at` (24 h) · `access_expires_at`

**`document_access_log`** — una fila por **apertura** de documento
`request_id` · `document_id` · `opened_by` · `opened_at` · `ip`

> Esta pareja de tablas es la que sostiene el argumento de venta, la defensa GDPR y la futura facturación. No es logging opcional.

**`candidate_contact_requests`** — contacto desde la bolsa sin vacante asociada
`agency_id` · `candidate_id` · `message` · `status` · `created_at`

---

## H. Cumplimiento y ciclo de vida

**`consents`** — versionados _(GDPR)_
`profile_id` · `type` (`terms` | `privacy` | `data_sharing`) · `version` · `granted_at` · `revoked_at` · `ip` · `user_agent`

**`activity_pings`** — inactividad 30 d / 72 h
`candidate_id` · `token` · `sent_at` · `expires_at` · `confirmed_at`

**`email_log`** — trazabilidad de envíos
`profile_id` · `template` · `locale` · `provider_id` · `status` · `sent_at`

**`data_deletion_requests`** — GDPR art. 17
`profile_id` · `requested_at` · `processed_at` · `status`

---

## I. Storage (Supabase)

| Bucket                | Público | Contenido                        |
| --------------------- | ------- | -------------------------------- |
| `candidate-documents` | **No**  | DNI, CV, carnet, identificadores |
| `candidate-audio`     | **No**  | Audio en inglés                  |
| `agency-logos`        | Sí      | Logos de ETT                     |

Ningún bucket sensible es público. Acceso exclusivamente por **URL firmada de vida corta**, emitida por el servidor tras comprobar permiso, y registrada en `document_access_log`.

---

## J. Matriz de acceso (resumen de RLS)

| Recurso                           | Candidato   | ETT (sin consentimiento) | ETT (con consentimiento) | Admin |
| --------------------------------- | ----------- | ------------------------ | ------------------------ | ----- |
| Perfil propio                     | RW          | —                        | —                        | R     |
| Datos sensibles (IBAN, dirección) | RW          | **Nunca**                | **Nunca**                | R     |
| Documentos                        | RW          | **No**                   | R temporal + log         | RW    |
| Bolsa (vista seudonimizada)       | —           | R                        | R                        | R     |
| Identidad completa del candidato  | —           | No                       | R                        | R     |
| Vacantes publicadas               | R           | RW (propias)             | RW (propias)             | RW    |
| Aplicaciones                      | R (propias) | RW (a sus vacantes)      | RW                       | RW    |

> El IBAN y la dirección **no se comparten con la ETT en ningún caso** dentro del MVP: no los necesita para decidir. Son datos de la fase de contratación, fuera de la plataforma por ahora.
