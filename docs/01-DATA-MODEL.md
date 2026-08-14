# Modelo de datos

> Diseñado para que abrir un país nuevo sea **insertar filas, no migrar el schema** (ADR-07).
> **Implementado en la fase 1.** Las migraciones SQL reales viven en `supabase/migrations/` y mandan sobre este documento; aquí está el mapa, no el territorio. Actualizado con el schema realmente aplicado: 36 tablas, todas con RLS.

---

## Principios

1. **Lo que varía por país es catálogo, no enum ni código.**
2. **Lo sensible va segregado** en tablas propias con RLS estricta (ADR-08).
3. **Todo lo que puede disputarse legalmente se registra**: consentimientos, cambios de estado, accesos a documentos.
4. **La seudonimización se aplica en la base de datos** (vistas + RLS), nunca en el cliente.
5. Toda tabla: `id uuid`, `created_at`, `updated_at`. Borrado lógico (`deleted_at`) donde GDPR lo permita.

---

## A. Catálogos (semilla, editables sin desplegar)

| Tabla                           | Contenido                                                                                               | Por qué es catálogo                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `locales`                       | código de idioma de la interfaz, activo                                                                 | Abrir `pt` = una fila + su JSON     |
| `countries`                     | code ISO-2, moneda por defecto, `is_active`                                                             | Abrir NL/BE/NO = un `update`        |
| `sectors`                       | slug, activo                                                                                            | Sectores nuevos sin desplegar       |
| `document_types`                | slug (`id_front`, `id_back`, `cv`, `audio_en`, `driving_license`, `tax_doc`), bucket, MIME, tamaño máx. | Cada país pide papeles distintos    |
| `country_document_requirements` | country + document_type + obligatorio                                                                   | Requisitos de verificación por país |
| `identifier_types`              | slug (`bsn`, `steuer_id`, `rijksregister`, `fodselsnummer`), country_code, regex de validación          | Identificadores fiscales por país   |
| `registration_types`            | slug (`handelsregister`, `kvk`, `kbo_bce`, `brreg`), country_code                                       | Registro mercantil de la ETT        |
| `languages`                     | código ISO-639-1, activo                                                                                | Requisitos de idioma en vacantes    |

**Los textos visibles no viven en la fila del catálogo**, sino en una tabla
`*_translations` hermana (`country_translations`, `sector_translations`,
`document_type_translations`, `identifier_type_translations`,
`registration_type_translations`, `language_translations`), con clave
`(<catálogo>_id, locale)`. Abrir un idioma es insertar filas, igual que abrir un
país.

Los **niveles** de idioma sí son un enum (`language_level`: `a1`…`c2`, `native`):
el Marco Común Europeo no cambia al abrir un país. La regla es esa — es catálogo
lo que varía por país o por idioma, es enum lo que describe un flujo interno.

`countries` contiene los 27 de la UE más Noruega. La fila **existe** para
cualquier nacionalidad que pueda tener un candidato; `is_active` marca los
**mercados abiertos**, que hoy es solo Alemania. No son lo mismo y confundirlos
impide dar de alta a un candidato rumano.

---

## B. Identidad

**`profiles`** — 1:1 con `auth.users`
`id`, `role` (`candidate` | `agency_member` | `admin`), `locale`, `email`, `created_at`, `last_seen_at`

---

## C. Candidato

**`candidates`** — datos no sensibles, base de la bolsa
`profile_id` PK · `first_name` · `last_name` · `nationality_code` · `date_of_birth` · `current_country_code` · `current_city` · `english_level` · `has_driving_license` · `worked_in_nl_de` · `needs_housing` · `needs_transport` · `work_experience` (texto libre) · `status` (`active` | `inactive`) · `verification_status` (`unverified` | `pending` | `verified` | `rejected`) · `last_activity_at`

**`candidate_private`** — sensible, RLS más estricta _(ADR-08)_
`candidate_id` PK · `phone` · `address_line` · `postal_code` · `city` · `country_code` · `iban_ciphertext` · `iban_key_id` · `iban_last4`

**`candidate_identifiers`** — multi-país _(ADR-07)_
`candidate_id` · `identifier_type_id` · `value_ciphertext` · `value_key_id` · `value_blind_index` · `verified_at` · `verified_by`
Único por `(candidate_id, identifier_type_id)` y por `(identifier_type_id, value_blind_index)`: dos candidatos no pueden declarar el mismo Steuer-ID, y eso se detecta **sin guardar el identificador en claro** (ADR-15).

**`candidate_documents`**
`candidate_id` · `document_type_id` · `storage_bucket` · `storage_path` (bucket privado) · `status` (`pending` | `verified` | `rejected`) · `reviewed_by` (nulo = revisión automática futura) · `reviewed_at` · `rejection_reason` · `mime_type` · `size_bytes`
`storage_path` empieza obligatoriamente por `<candidate_id>/` **por CHECK**: de esa convención depende la política de storage que impide leer la carpeta de otro, así que no puede ser una costumbre. Índice único parcial por `(candidate_id, document_type_id)` donde `status <> 'rejected'`: un documento vigente por tipo, y los rechazados se conservan como historial.

**`candidate_sectors`** — experiencia por sector (N:M con `sectors`), con meses de experiencia

> **Vista `candidate_directory`** — lo único que la ETT puede consultar en la bolsa (ADR-03):
> `candidate_id`, `display_name` = `first_name || ' ' || left(last_name,1) || '.'`, `age` **calculada** (nunca la fecha de nacimiento), ciudad + país + nacionalidad, `work_experience`, `sectors` (jsonb agregado), `english_level`, disponibilidad, alojamiento/transporte, y sellos booleanos: `identity_verified`, `driving_license_verified`, `tax_id_verified`, `iban_on_file`, `has_audio`, `has_cv`.
> Solo incluye candidatos `verified` y `active` sin borrado lógico.
>
> **Es una vista SECURITY DEFINER a propósito.** Con `security_invoker = on` heredaría la RLS de `candidates` —donde la ETT no tiene ninguna política— y devolvería cero filas. Al ser definer, la vista **es** el control de acceso: por eso lleva dentro el filtro `app.is_agency_member() or app.is_admin()`, que es tan parte de la seguridad como cualquier política. Sin él, otro candidato leería la bolsa entera.
>
> No expone rutas de storage ni ids de documento. El audio y el CV se anuncian como booleanos; el archivo se sirve aparte y con consentimiento.

---

## D. ETT

**`agencies`**
`name` · `slug` · `logo_url` · `country_code` · `registration_type_id` → `registration_types` · `registration_number` · `status` (`pending` | `approved` | `suspended`) · `deleted_at`

**`agency_translations`** — `agency_id` · `locale` · `description`
**`agency_sectors`** — N:M con `sectors`

**`agency_members`**
`profile_id` · `agency_id` · `role` (`owner` | `recruiter`), único por pareja

> `status` es la llave maestra: `app.current_agency_id()` solo devuelve la ETT si está `approved`, así que **suspender una ETT corta su acceso de verdad**, no solo en la interfaz. Y un miembro no puede aprobar ni reactivar su propia ETT: lo impide un disparador, no la interfaz.

---

## E. Vacantes

**`jobs`**
`agency_id` · `created_by` · `slug` · `client_company_name` · `show_client_company` · `country_code` · `city` · `salary_min` · `salary_max` · **`salary_currency`** · **`salary_period`** (`hour` | `month`) · `shifts[]` (`morning`/`afternoon`/`night`/`rotating`) · `weekly_hours` · `sector_id` · `required_language_code` + `required_language_level` · `requires_driving_license` · `housing_provided` + `housing_price` + `housing_currency` · `transport_provided` · `min_contract_months` · `start_date` · `status` (`draft` | `published` | `paused` | `closed`) · `published_at` · `expires_at` · `deleted_at`

> **Una vacante no se publica sin al menos una traducción**: lo impide un disparador. Una URL pública indexable y vacía es peor que no tenerla.
> **`closed` es terminal.** Una vacante cerrada con candidaturas dentro es historial; reabrirla falsearía la métrica de colocaciones. Se publica una nueva.

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

> **Transiciones válidas, impuestas por disparador:**
> `pending` → `in_review` | `rejected` · `in_review` → `documents_requested` | `rejected` · `documents_requested` → `hired` | `rejected`. `hired` y `rejected` son terminales, y rechazar exige un motivo.
> `documents_requested` **no se puede saltar**: es el futuro punto de cobro y tiene que quedar constancia de que ocurrió. Si en la fase 6 resulta que estorba, se cambia aquí y en el disparador, con una decisión, no con un parche.
> Los eventos los escribe **solo** el disparador: `application_events` no tiene política de INSERT, UPDATE ni DELETE para nadie, ni siquiera para el admin. El historial no se reescribe desde la API.
> `applications.job_id` es `on delete restrict`: borrar una vacante no puede borrar la prueba de que hubo candidaturas.

---

## G. Acceso a documentos — el corazón del producto _(ADR-05)_

**`document_access_requests`**
`agency_id` · `candidate_id` · `application_id` (nulo si viene de la bolsa) · `requested_by` · `message` · `status` (`pending` | `granted` | `denied` | `expired` | `revoked`) · `requested_at` · `responded_at` · `expires_at` (7 días) · `reminder_sent_at` (24 h) · `access_expires_at` · `revoked_at`

**`document_access_request_scope`** — `request_id` · `document_type_id`
El alcance es una tabla hija, no un array de texto: así hay clave foránea real contra el catálogo.

> **Dos relojes distintos, y confundirlos sería un fallo de seguridad:**
> `expires_at` es el plazo del **candidato para responder**; `access_expires_at` es hasta cuándo la ETT puede abrir los documentos ya concedidos.
> Una sola solicitud viva por ETT y candidato (índice único parcial sobre `pending`): sin eso, una ETT podría ametrallar al candidato con avisos hasta que ceda.
> **Conceder, denegar y revocar son actos del candidato**, comprobados en el disparador además de en la política. La ETT no tiene UPDATE sobre esta tabla: si lo tuviera, lo único entre ella y los documentos sería un disparador.

**`document_access_log`** — una fila por **apertura** de documento
`request_id` · `document_id` · `opened_by` · `opened_at` · `ip` · `user_agent`

> **No tiene política de INSERT para ningún rol.** La fila la escribe el servidor con `service_role` en el mismo paso en el que firma la URL. Si se pudiera abrir un documento sin dejar rastro, el registro no valdría como prueba, que es justo para lo que existe.

> Esta pareja de tablas es la que sostiene el argumento de venta, la defensa GDPR y la futura facturación. No es logging opcional.

**`candidate_contact_requests`** — contacto desde la bolsa sin vacante asociada
`agency_id` · `candidate_id` · `message` · `status` · `created_at`

---

## H. Cumplimiento y ciclo de vida

**`consents`** — versionados _(GDPR)_
`profile_id` · `type` (`terms` | `privacy` | `data_sharing`) · `version` · `granted_at` · `revoked_at` · `ip` · `user_agent`

**`activity_pings`** — inactividad 30 d / 72 h
`candidate_id` · `token` · `sent_at` · `expires_at` · `confirmed_at`

> Ninguna política deja leer esta tabla a un usuario final, **ni siquiera al propio candidato**: guarda el token del enlace del correo y la RLS no filtra columnas. El canje se hace en el servidor.

**`email_log`** — trazabilidad de envíos
`profile_id` · `recipient_email` · `template` · `locale` · `provider_id` · `status` · `error` · `sent_at`
`profile_id` es `on delete set null` y el correo se copia: la prueba de qué se envió sobrevive al borrado del perfil.

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

### Cómo está implementada (fase 1)

La forma de garantizar la fila "ETT → nunca" no es filtrar columnas, es **no darle ninguna puerta**:

- La ETT **no tiene ni una política** sobre `profiles`, `candidates`, `candidate_private`, `candidate_identifiers` ni `candidate_sectors`. Ni de lectura parcial. Su única puerta a la bolsa es la vista `candidate_directory`. Así "no ve el apellido" no depende de que nadie escriba un `select *` por descuido, ni por join, ni por RPC.
- Sobre `candidate_documents` tiene **una sola** política de SELECT, y llama a `app.agency_can_read_document(id)`: exige consentimiento `granted`, del tipo de documento pedido y con la ventana sin vencer. La política de storage aplica la misma regla al archivo.
- `service_role` no aparece en ninguna política porque se salta la RLS por atributo del rol. Todo lo que se haga con esa clave es responsabilidad del servidor, y por eso nunca sale de él.

**Dos precisiones sobre la tabla de arriba**, decididas al implementarla:

1. **El admin tiene RW sobre `candidates`, no solo R.** `verification_status` vive en esa tabla y verificar es su trabajo (fase 4). La fila "Perfil propio · Admin R" se refería a `profiles`, donde efectivamente solo tiene lectura: promocionar a alguien a `admin` o `agency_member` exige `service_role` desde el backoffice, no basta con ser admin.
2. **El audio del candidato exige consentimiento igual que el DNI.** ADR-03 lo lista entre lo que ve la bolsa, pero una grabación de voz es dato personal y va en un bucket privado con la misma regla que los demás documentos. La bolsa anuncia `has_audio`; escucharlo pasa por el flujo de ADR-05. Si la fase 7 concluye que la vista previa lo necesita sin consentimiento, es una decisión de producto que se toma y se documenta, no un descuido que se hereda.

### El aviso que la fase 7 no puede ignorar

**Supabase Storage cachea la decisión de autorización por token de acceso.** Comprobado contra la API real: revocado el consentimiento, un token **nuevo** recibe un rechazo inmediato —la política funciona—, pero el token que ya descargó ese archivo lo sigue descargando hasta que caduca (1 h por defecto).

Consecuencia de diseño, y no es opcional: **los documentos no se sirven nunca con una URL autenticada directa al navegador de la ETT.** Se sirven con URL firmada de vida corta que emite el servidor **después** de comprobar el permiso, que es además el único sitio donde se puede escribir `document_access_log`. Así la revocación es inmediata, porque la decisión la toma nuestro código y no la caché de storage. La batería de seguridad fija este comportamiento en un test: si Supabase lo cambia, se pondrá roja.
