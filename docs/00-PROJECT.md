# EttRecruiter — Documento maestro

> Fuente de verdad del proyecto. Si algo aquí contradice una conversación suelta, gana este documento.
> Fase actual: **MVP — validación con primera ETT en Alemania**. Fundador: Ulises (KAYAO).

---

## 1. Tesis del negocio

Marketplace de dos lados que conecta trabajadores hispanohablantes y lusófonos con ETTs (agencias de trabajo temporal) de Europa Central, empezando por Alemania.

**El activo defendible no son las vacantes: es la bolsa de candidatos verificados.** Las vacantes son el imán de tráfico; la verificación es lo que se vende. El momento de valor es cuando una ETT quiere avanzar con un candidato concreto y necesita sus documentos reales.

**Asimetría de los dos lados** (condiciona todo el diseño):

|                | Candidato                 | ETT                        |
| -------------- | ------------------------- | -------------------------- |
| Volumen        | Miles                     | Decenas                    |
| Captación      | Orgánica (SEO, redes)     | Presencial / venta directa |
| Valor unitario | Bajo                      | Alto                       |
| Cobro          | **Nunca** (regulación UE) | Sí (modelo por definir)    |
| Dispositivo    | Móvil, datos limitados    | Escritorio                 |

**En el MVP, Ulises es el backend humano**: verifica documentos, aprueba desbloqueos, da de alta ETTs. El sistema se diseña para que cada una de esas operaciones manuales se sustituya por un automatismo sin rehacer el modelo de datos.

**Riesgo estructural: desintermediación.** Si la ETT obtiene identidad y contacto del candidato sin pasar por la plataforma, no vuelve. Toda exposición de datos personales está deliberadamente restringida por esto, no solo por GDPR.

---

## 2. Milestone 1

Cerrar una ETT en Alemania que acepte recibir candidatos por la plataforma.

1. Construir el MVP (portal candidato + portal ETT + backoffice)
2. Captar ~30 candidatos verificados vía canales orgánicos
3. Demo presencial en ETTs alemanas con perfiles reales
4. Cerrar la primera ETT

**Métrica que hay que poder demostrar a la ETT nº2:** candidatos verificados, aplicaciones y **colocaciones** (por eso existe el estado `hired`).

---

## 3. Actores y roles

- **`candidate`** — persona con ciudadanía UE buscando empleo blue-collar (logística, producción, warehouse, cárnico, agrícola). Perfil ideal MVP: hispanohablante, con inglés, desempleado, con BSN o Steuer-ID disponible.
- **`agency_member`** — usuario perteneciente a una ETT. Sub-rol `owner` / `recruiter`.
- **`admin`** — Ulises. Verifica, aprueba, supervisa, opera.

Un usuario tiene **exactamente un rol**. Un `agency_member` pertenece a **una** ETT (el modelo soporta varias por si acaso, pero la UI asume una).

---

## 4. Decisiones de arquitectura (ADR)

Decisiones tomadas y cerradas. Cambiarlas requiere decisión explícita del fundador.

### ADR-01 · i18n desde el día 1

Rutas `/[locale]/...`, todo el copy en archivos de traducción, contenido de vacantes traducible en tabla aparte. **MVP arranca con `es` y `en`**; `pt`, `de`, `nl` se añaden sin tocar código.
_Motivo:_ candidatos ES/PT, ETTs DE/NL. Retrofitear i18n sobre 40 pantallas es un refactor doloroso.

### ADR-02 · Vacantes públicas e indexables

Cada vacante es una URL pública renderizada en servidor, con `JobPosting` de schema.org, sitemap y hreflang. **Ver es libre; aplicar exige cuenta verificada.**
_Motivo:_ Google Jobs es el canal de captación de coste cero, y "ver ofertas sin verificarte" es el diferenciador frente a Mokka360.

### ADR-03 · Bolsa de candidatos seudonimizada

La ETT navegando la bolsa ve: nombre de pila + inicial ("Carlos M."), edad, ciudad/país, experiencia, sellos de verificación, nivel de inglés, audio, disponibilidad, necesidades de alojamiento/transporte. **No ve** apellidos completos, email, teléfono, dirección, IBAN ni documento alguno.
Para contactar debe hacerlo **a través de la plataforma**.
_Motivo:_ anti-desintermediación + minimización de datos GDPR.
_Implementación:_ vista de base de datos con RLS, nunca filtrado en cliente.

### ADR-04 · Ciclo de vida de una aplicación

`pending` → `in_review` → `documents_requested` → `hired` | `rejected`
`rejected` es alcanzable desde cualquier estado. Todo cambio queda en log de auditoría.
_Motivo:_ `documents_requested` es el futuro punto de cobro y debe ser un estado observable; `hired` da la métrica de colocaciones.

### ADR-05 · Documentos reales solo con consentimiento explícito del candidato

La ETT solicita acceso → el candidato recibe email + aviso in-app → concede o deniega para **esa ETT concreta**.

- Recordatorio a las 24 h
- Caduca a los 7 días sin respuesta
- El acceso concedido es temporal (URLs firmadas de vida corta) y **cada apertura de documento se registra**
- La ETT ve el estado "esperando consentimiento del candidato" para no percibir la plataforma como rota

_Motivo:_ base legal GDPR sólida y control del punto de monetización.
_Riesgo asumido:_ el candidato puede no responder y frenar el proceso. Mitigado con recordatorios y visibilidad de estado.

### ADR-06 · La ETT crea y edita sus propias vacantes (MVP)

Sin moderación previa. **Deuda consciente**: publicación con estados `draft/published/paused/closed` y capacidad de despublicar desde el backoffice. Activar moderación previa será un flag, no un refactor.
_Pendiente:_ decidir el modelo definitivo tras ver la calidad real de las ofertas de la primera ETT.

### ADR-07 · Escalabilidad multi-país por diseño, MVP solo Alemania

Todo lo que varía por país es **dato, no código**:

- Países, sectores, tipos de documento e identificadores fiscales viven en **tablas de catálogo**, no en enums ni en `if`
- Salarios: importe + `currency` + `period` (Noruega usa NOK)
- Identificadores fiscales (BSN, Steuer-ID, rijksregisternummer, fødselsnummer…) en tabla `candidate_identifiers`, no en columnas
- Requisitos documentales por país en catálogo, para que abrir un país sea insertar filas + traducciones

_Motivo:_ la expansión no es "algún día", es el plan. Añadir el país nº8 debe costar lo mismo que el nº2.

### ADR-08 · Datos personales sensibles segregados

Dirección, IBAN, teléfono, identificadores fiscales y documentos viven en tablas/buckets separados del perfil, con RLS propia. Nadie salvo el candidato y el admin los toca por defecto.

### ADR-09 · Región de datos: UE

Supabase en región europea (Frankfurt) y despliegue en Vercel. Datos personales de ciudadanos UE no salen de la UE.

### ADR-11 · Un solo dominio, con el middleware acotado

Sitio público, portal ETT y backoffice conviven en un dominio: `/[locale]/...` público, `/agency`, `/admin` privados con `noindex`.

_Motivo real_ (el argumento de "consolidar autoridad" **no** aplica aquí: las áreas privadas no generan SEO):

1. Las landings programáticas de long-tail (`/es/trabajo/alemania/logistica`, `/es/trabajo/berlin`) y las vacantes se **enlazan entre sí**. Ese enlazado interno es el motor de tráfico de un job board y solo funciona con fuerza dentro del mismo host.
2. Un único sitemap y un único `hreflang`.

**Condición innegociable de esta decisión** — sin ella, un solo dominio sí perjudica el SEO:

- El `matcher` del middleware de sesión **excluye** las rutas públicas. Solo cubre `/cuenta`, `/agency`, `/admin`.
- Las páginas públicas **nunca leen la sesión en servidor**. Tocar cookies las vuelve dinámicas y destruye ISR y el caché de CDN, subiendo el TTFB justo en móvil con 4G y ante el crawler de Google Jobs.
- El estado de login en la navegación se resuelve en cliente.

### ADR-12 · Dominio `.com` genérico y slugs traducidos

- **`.com`, nunca un ccTLD** (`.de`): la audiencia busca en español desde España y Latinoamérica. La ubicación del empleo la comunica `jobLocation` del schema, no el TLD. Un `.de` estorbaría al abrir NL/BE/NO.
- **Pathnames localizados por idioma**: `/es/ofertas/...` y `/en/jobs/...`, no `/en/ofertas/...`. Señal directa de relevancia y coste cero si se configura desde el inicio.
- Nombre y dominio **provisionales**: "EttRecruiter" es nombre de trabajo. Nada de marca hardcodeada — nombre, dominio y logotipo salen de config e i18n.

### ADR-10 · Acabado visual: sobrio, profesional, mobile-first

Tailwind + shadcn/ui, sistema de diseño consistente. El candidato entra desde móvil con datos limitados: **velocidad de carga por encima del espectáculo**. Un portal lento pierde candidatos; una animación no cierra una ETT.

_Concreción (fase 0):_ shadcn/ui con preset Nova sobre Radix, base de color `neutral` (escala de grises pura, sin acento) y tipografía Geist. Sin librería de animación.

### ADR-13 · Un solo proxy, dos alcances

_(Fase 0. Consecuencia técnica directa de ADR-11.)_

Next 16 sustituyó `middleware.ts` por `proxy.ts` y **solo admite un fichero con un `matcher`**. Pero esta aplicación necesita dos alcances incompatibles:

- **i18n** debe correr en todo el sitio: sin él, `/es/ofertas` no se reescribe a la ruta interna `/jobs`.
- **La sesión de Supabase** solo puede correr en `/cuenta`, `/agency` y `/admin`: toca cookies, y eso vuelve dinámica y no cacheable cualquier ruta pública que atraviese.

**Decisión:** el `matcher` de `src/proxy.ts` es el de i18n (amplio). El alcance de la sesión se acota **dentro** del proxy con `isProtectedPathname()`, que deriva los prefijos protegidos del mismo mapa `pathnames` de `src/i18n/routing.ts`. Añadir `pt` genera `/pt/conta` automáticamente; no hay una segunda lista que mantener sincronizada.

Además:

- `localeCookie: false` y `localeDetection: false`. Una cabecera `Set-Cookie` en una respuesta pública impide que el CDN la cachee. El idioma vive en la URL, que es además lo correcto para el crawler.
- El grupo de rutas `(private)` lleva `force-dynamic` y `robots: noindex`; el grupo `(public)` se prerenderiza. La frontera es visible en el árbol de ficheros.

**Cómo se verifica** (obligatorio en cada fase que toque rutas): `updateSession` marca sus respuestas con `x-ett-session-checked: 1`. Una ruta pública que devuelva esa cabecera, o que salga como `ƒ` en `next build`, significa que la sesión se ha filtrado y el SEO está roto. Procedimiento en `docs/CONVENTIONS.md`.

### ADR-14 · Ruta interna en inglés, ruta externa traducida

_(Fase 0.)_

La carpeta se llama `src/app/[locale]/(public)/jobs/`; el usuario ve `/es/ofertas` y `/en/jobs`. El emparejamiento vive en `pathnames` (`src/i18n/routing.ts`), única fuente de verdad del enrutado.

_Motivo:_ con pathnames localizados hace falta un nombre canónico interno. Si fuera el español, abrir `de`/`nl` dejaría carpetas en un idioma arbitrario y el código sería ilegible para cualquier colaborador. El inglés interno mantiene el código en un idioma y las URLs en el del usuario, que es lo único que ve Google.

_Consecuencia:_ nunca se usa `next/link` ni `redirect`/`useRouter` de `next/navigation` — no conocen el mapa. Se usa `@/i18n/navigation`, y ESLint bloquea lo demás.

---

## 5. Reglas de negocio

1. Ver ofertas: libre y sin cuenta. **Aplicar: requiere cuenta verificada.**
2. Un candidato puede tener múltiples aplicaciones activas a la vez.
3. Una aplicación por candidato y vacante (no puede aplicar dos veces a la misma).
4. La ETT nunca ve documentos reales sin consentimiento específico del candidato para esa ETT.
5. Inactividad: 30 días sin actividad → email "¿sigues disponible?" → 72 h para confirmar con un clic → `inactive` si no responde. Reactivable en cualquier momento.
6. Un candidato `inactive` no aparece en la bolsa, pero sus aplicaciones en curso siguen vivas.
7. **Nunca se cobra al candidato.** Ni comisión, ni suscripción, ni destacados. Regulación UE.
8. Sin pasarela de pagos en el MVP.
9. Un candidato puede solicitar la eliminación de sus datos en cualquier momento (GDPR art. 17).

---

## 6. Documentación de verificación

| Documento                     | Obligatorio | Notas                           |
| ----------------------------- | ----------- | ------------------------------- |
| DNI o pasaporte (ambas caras) | Sí          | 2 archivos                      |
| Dirección completa            | Sí          | Dato, no archivo                |
| IBAN                          | Sí          | Dato cifrado                    |
| CV en inglés                  | Sí          | PDF/DOCX                        |
| Audio en inglés               | Sí          | Grabación en navegador o subida |
| BSN / Steuer-ID               | No          | Según país destino              |
| Carnet de conducir            | No          | Solo si declaró tenerlo         |

El **conjunto obligatorio es un catálogo por país**, no una lista fija en código (ADR-07).
Verificación manual por admin en MVP; OCR/IA en fase 2 — el modelo de datos ya contempla `reviewed_by` nulo para revisión automática.

**Sellos que ve la ETT** (nunca el documento): identidad ✓, IBAN ✓, identificador fiscal ✓/✗, carnet de conducir ✓/✗.

---

## 7. Legal

- **Alemania:** basta Gewerbeanmeldung. La intermediación laboral privada no requiere licencia desde 2002. La Arbeitnehmerüberlassung (cesión de trabajadores) sí, pero eso lo hace la ETT, no la plataforma.
- **GDPR desde el día 1:** aviso legal, política de privacidad, consentimientos **versionados** con marca de tiempo, cifrado de datos sensibles, derecho de acceso/exportación/borrado, y registro de accesos a documentos.

---

## 8. Stack

| Capa      | Elección                                                         |
| --------- | ---------------------------------------------------------------- |
| Framework | Next.js (App Router), TypeScript                                 |
| UI        | Tailwind CSS + shadcn/ui                                         |
| DB + Auth | Supabase (Postgres, RLS), región EU                              |
| Archivos  | Supabase Storage, buckets privados + URLs firmadas               |
| Email     | Resend, plantillas i18n                                          |
| Cron      | Vercel Cron (pings de inactividad, caducidad de consentimientos) |
| Hosting   | Vercel                                                           |

---

## 9. Fuera del MVP (fase 2+)

Monetización y pagos · Matching automático con IA · Verificación documental por OCR/IA · Mensajería interna · Analytics · Alta de ETTs por formulario con aprobación · Moderación de vacantes · Expansión a NL, BE, NO.
