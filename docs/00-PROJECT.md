# Talpass — Documento maestro

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

La ETT navegando la bolsa ve: nombre de pila + inicial ("Carlos M."), edad, ciudad/país, experiencia, sellos de verificación, nivel de inglés, **el audio en inglés reproducible** (condiciones exactas en ADR-18), disponibilidad, necesidades de alojamiento/transporte. **No ve** apellidos completos, email, teléfono, dirección, IBAN ni documento alguno.
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

Supabase en región europea y despliegue en Vercel. Datos personales de ciudadanos UE no salen de la UE.

_Precisión (fase 1):_ el proyecto real está en **`eu-west-1` (Irlanda)**, no en Fráncfort como decía la versión anterior de este ADR. Se corrige el texto, no la región: lo que exige la decisión es territorio UE, e Irlanda lo es. La latencia desde Alemania es equivalente a efectos prácticos.

### ADR-10 · Acabado visual: sobrio, profesional, mobile-first

Tailwind + shadcn/ui, sistema de diseño consistente. El candidato entra desde móvil con datos limitados: **velocidad de carga por encima del espectáculo**. Un portal lento pierde candidatos; una animación no cierra una ETT.

_Concreción (fase 0):_ shadcn/ui con preset Nova sobre Radix, base de color `neutral` (escala de grises pura, sin acento) y tipografía Geist. Sin librería de animación.

### ADR-11 · Un solo dominio, con el middleware acotado

Sitio público, portal ETT y backoffice conviven en un dominio: `/[locale]/...` público, `/agency`, `/admin` privados con `noindex`.

_Motivo real_ (el argumento de "consolidar autoridad" **no** aplica aquí: las áreas privadas no generan SEO):

1. Las landings programáticas de long-tail (`/es/trabajo/alemania/logistica`, `/es/trabajo/berlin`) y las vacantes se **enlazan entre sí**. Ese enlazado interno es el motor de tráfico de un job board y solo funciona con fuerza dentro del mismo host.
2. Un único sitemap y un único `hreflang`.

**Condición innegociable de esta decisión** — sin ella, un solo dominio sí perjudica el SEO:

- El `matcher` del middleware de sesión **excluye** las rutas públicas. Solo cubre `/cuenta`, `/agency`, `/admin`.
- Las páginas públicas **nunca leen la sesión en servidor**. Tocar cookies las vuelve dinámicas y destruye ISR y el caché de CDN, subiendo el TTFB justo en móvil con 4G y ante el crawler de Google Jobs.
- El estado de login en la navegación se resuelve en cliente.

### ADR-12 · Marca **Talpass**, dominio **talpass.eu**, slugs traducidos

Decidido el 2026-08-13. Sustituye a la versión previa de este ADR, que pedía un `.com` genérico.

- **Nada de ccTLD nacional** (`.de`, `.nl`): ataría el sitio a un mercado que no es el de la audiencia y estorbaría al abrir NL/BE/NO. Ese criterio se mantiene.
- **`.eu` no incumple ese criterio: lo cumple mejor que un `.com`.** El ámbito del negocio _es_ la Unión Europea — empleo en la UE, candidatos con ciudadanía UE, GDPR. Google fija el geo-targeting de `.eu` a la UE como región, no a un país, así que no hay mercado equivocado al que quedar atado.
- **Pathnames localizados por idioma**: `/es/ofertas/...` y `/en/jobs/...`, no `/en/ofertas/...`. Señal directa de relevancia.
- La marca sigue **fuera del JSX**: nombre y dominio salen de `src/config/site.ts` y de variables de entorno. Cambiar de marca debe seguir costando una variable, no un refactor.

**Riesgos asumidos y su mitigación:**

1. **Segmento latinoamericano.** El geo-targeting a la UE puede restar algo de visibilidad en búsquedas desde Colombia, Argentina o Perú, donde hay candidatos con pasaporte comunitario. El efecto del TLD es hoy menor que el del contenido y el `hreflang`, así que se compensa con contenido en español y buen marcado, no cambiando de dominio.
2. **`.eu` exige que el titular resida o esté establecido en la UE.** Si algún día la sociedad se domicilia fuera de la UE, el dominio se pierde — le pasó a miles de titulares británicos tras el Brexit. **Mitigación: registrar `talpass.com` de forma defensiva** y mantenerlo redirigido. Protege la marca y da una salida sin rehacer el SEO.

   _Estado (2026-08-14):_ `talpass.eu` registrado. El `.com` **queda aplazado por presupuesto**, con el riesgo asumido de forma explícita: mientras tanto, la mitigación de este ADR no está en vigor. Pendiente en `docs/ESTADO.md`.

_Precisión (2026-08-15) · el canónico es el apex:_ **`https://talpass.eu` sirve el sitio y `www.talpass.eu` redirige a él**, no al revés. Da igual cuál se elija a efectos de SEO mientras sea **uno solo y consistente**, pero se elige a propósito: es más corto, es el nombre de la marca y es el que dice este ADR.

Se documenta porque al conectar el dominio en Vercel el valor por defecto hizo lo contrario —un 308 del apex hacia `www`— apuntando a un `www` que **no existía en el DNS**, así que el dominio entero quedó irresoluble durante unas horas. Vercel marcaba el `www` como "Valid Configuration" igualmente: comprueba su propia configuración, no si el registro DNS existe.

Consecuencia para cualquier fase que toque URLs: `NEXT_PUBLIC_SITE_URL`, las `additional_redirect_urls` de Supabase, el `sitemap.xml`, el `hreflang` y las etiquetas canónicas usan **todos** el apex. Mezclar los dos hosts parte la señal de SEO en dos y rompe el canje de sesión del correo de confirmación.

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

### ADR-15 · Cifrado de datos sensibles en la capa de aplicación

_(Fase 1.)_

**IBAN e identificadores fiscales** (Steuer-ID, BSN, …) se guardan cifrados con **AES-256-GCM**, cifrando y descifrando **en el servidor de la aplicación**. La base de datos nunca ve el valor en claro ni la clave. Implementación en `src/lib/crypto/sensitive.ts`.

**Alternativas descartadas:**

| Opción                                     | Por qué no                                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Texto plano + RLS estricta                 | La RLS protege del usuario de la API, no de una copia de seguridad filtrada, de un volcado, ni de quien tenga la `service_role`. Un IBAN merece defensa en profundidad. |
| `pgcrypto` con la clave en una tabla       | La clave y el dato viajan juntos en el mismo volcado. Cifrado teatral.                                                                                                  |
| `pgsodium` / Transparent Column Encryption | Supabase la ha dado por obsoleta y desaconseja construir nada nuevo encima. Atarse a ella hoy es una migración forzosa mañana.                                          |
| Cifrado en cliente                         | El candidato entra desde el móvil y puede perder el dispositivo. Una clave que no se puede recuperar convierte "he cambiado de teléfono" en "he perdido mi IBAN".       |

**Formato del sobre:** `v1.<keyId>.<iv>.<ciphertext+tag>`. El identificador de clave viaja en claro dentro del propio valor, que es lo que permite rotar sin reescribir la tabla: se añade `k2` al llavero, se cifra con `k2` y las filas con `k1` se siguen leyendo. `k1` no se retira mientras quede una sola fila que la use.

**Datos autenticados adicionales (AAD).** Cada valor se ata a su sitio (`candidate_private.iban:<candidateId>`). Copiar un criptograma de una fila a otra no descifra: falla. Protege del atacante que consigue escritura en la base pero no la clave.

**Índice ciego.** AES-GCM no es determinista, así que no permite comprobar si un Steuer-ID ya existe. Para eso hay un HMAC-SHA256 con **clave distinta** (`TALPASS_BLIND_INDEX_KEY`) en `candidate_identifiers.value_blind_index`, con restricción de unicidad. Detecta duplicados sin guardar nada en claro; y al llevar clave, no se puede recorrer hacia atrás probando los 10¹¹ valores posibles, cosa que con un SHA-256 pelado sería cuestión de minutos.

**Gestión de claves:**

- Viven en variables de entorno (`TALPASS_ENCRYPTION_KEYS`, `TALPASS_ENCRYPTION_ACTIVE_KEY_ID`, `TALPASS_BLIND_INDEX_KEY`), nunca en el repositorio ni en la base de datos.
- Sin prefijo `NEXT_PUBLIC_`: no pueden llegar al navegador ni por accidente.
- En Vercel, como variables de entorno del proyecto, distintas por entorno.
- **Perder el llavero es perder los datos cifrados.** No hay recuperación por diseño. Copia fuera de Vercel, en el gestor de contraseñas del fundador.
- El índice ciego **no se puede rotar** sin reescribir todas las filas: cambiar su clave invalida los HMAC guardados. Es una operación consciente, no un descuido.

_Coste asumido:_ un valor cifrado no se puede buscar, ordenar ni indexar. Es aceptable porque el IBAN y los identificadores fiscales no se buscan nunca: se leen enteros, de uno en uno y en el momento de la contratación.

### ADR-16 · La indexación se abre con una bandera explícita, nunca por el entorno

_(Fase 1.)_

`/robots.txt` devuelve `Disallow: /` salvo que `NEXT_PUBLIC_ALLOW_INDEXING` valga exactamente `true`. Hoy está apagada en todos los entornos.

_Motivo:_ la decisión **no** se deriva de `VERCEL_ENV` ni del dominio de la petición. En cuanto `talpass.eu` se conecte en Vercel, un criterio basado en el host levantaría el bloqueo por su cuenta y Google indexaría marcadores de posición. Sacar basura del índice cuesta meses; poner una variable cuesta un minuto.

_Se abre en la fase 3_, cuando existan vacantes reales, `sitemap.ts` y `hreflang`, y solo en producción.

### ADR-17 · Local para desarrollar, remoto solo para producción

_(Corrección tras la Fase 1.)_

- **Todo el desarrollo, las semillas y los tests de seguridad corren contra la base local** (`supabase start`, sobre OrbStack).
- El proyecto Supabase remoto es **producción**. Solo recibe `supabase db push` de migraciones ya validadas en local.
- **Nunca** contra el remoto: `db reset`, el simulacro que desactiva políticas, ni datos de demostración.
- `pnpm db:reset` debe apuntar a local. Cualquier comando destructivo contra producción exige confirmación explícita y consciente.

_Motivo:_ la Fase 1 se ejecutó entera contra el proyecto de producción, incluidos un `db reset` (que borra la base) y un simulacro que desactiva tres políticas RLS a propósito. No hubo daño porque no había un solo dato real. Repetirlo a partir de la Fase 4 significa una brecha de documentos de identidad e IBAN, o una pérdida irreversible.

_Causa raíz:_ una nota de contexto afirmaba que la máquina no tenía Docker. Era cierta por la mañana y falsa por la tarde. **Las notas sobre el entorno caducan; el ADR manda.**

_Cumplimiento (revisión previa al primer commit):_ la regla ya no depende de que
alguien se acuerde. `scripts/lib/supabase.mts` expone `assertLocalTarget()`, que
resuelve el **host real** de `NEXT_PUBLIC_SUPABASE_URL` y de `SUPABASE_DB_URL` y
aborta si alguno no es local; lo invocan `seed-demo.mts` y el simulacro de
brecha antes de abrir una sola conexión. La salida de emergencia es una variable
de entorno con un valor largo y explícito, que no se guarda en ningún `.env`.

Detalle que importa: la comprobación anterior miraba `NEXT_PUBLIC_SITE_URL`
—una variable que no interviene en la conexión a la base— y por eso dejaba pasar
producción mientras el comentario del fichero afirmaba lo contrario. **Un
guardarraíl que comprueba la variable equivocada es peor que ninguno**, porque
sustituye la cautela por una falsa confianza.

### ADR-18 · El audio en inglés se escucha en la bolsa; el resto exige consentimiento

_(Decisión tras un hallazgo de la Fase 1.)_

La Fase 1 aplicó a `audio_en` la misma regla que al DNI, y la bolsa quedó anunciando solo `has_audio`. Eso vacía el argumento comercial: **el audio es justo lo que permite a la ETT juzgar a un candidato sin pedir sus documentos.** Sin él, la bolsa es una lista de casillas verdes.

Regla definitiva:

- **`audio_en` es reproducible desde la bolsa** por una ETT aprobada, mediante URL firmada de **vida muy corta (≤ 5 min)** emitida por el servidor, **sin descarga**, y con la escucha registrada igual que una apertura de documento.
- El audio va **siempre seudonimizado**: se sirve junto al `display_name`, nunca junto a la identidad completa.
- **CV, DNI, carné e identificadores fiscales siguen exigiendo consentimiento por ETT** (ADR-05). Sin excepción.
- La base legal es el **consentimiento informado que el candidato otorga al registrarse**: se le dice de forma explícita que su grabación será audible por agencias verificadas. La Fase 2 debe recogerlo como consentimiento propio y versionado, no escondido en los términos.

_Motivo:_ minimización de datos real (una voz sin apellido ni contacto identifica poco) manteniendo intacto lo que hace vendible la bolsa. Si el candidato retira ese consentimiento, deja de ser audible.

_Estado (fase 2):_ recogido. El registro pide el consentimiento de audio en **casilla propia**, sin marcar, explicada en una frase, y se guarda como `consents.audio_sharing` con versión, IP y user-agent. Se retira desde el perfil con un botón, marcando `revoked_at`; volver a concederlo escribe una fila nueva. La fase 7 tiene que **leer ese estado** antes de firmar cualquier URL de audio.

### ADR-19 · Los permisos de tabla son parte del schema, no del entorno

_(Fase 2.)_

Toda tabla de `public` recibe sus `grant` en una migración (`20260814090000_grants.sql`), y las tablas futuras los heredan de un `alter default privileges` que también vive ahí.

_Motivo:_ hasta la fase 2 el schema no concedía ni un permiso y se apoyaba en el ACL por defecto que trae el proyecto alojado. Funcionaba en producción y **no funcionaba en local**: allí ese ACL pertenece a `supabase_admin` mientras que las migraciones se aplican como `postgres`, así que las tablas nacían sin permisos y hasta la `service_role` recibía `permission denied for table agencies`. Un schema que solo se levanta entero en un entorno concreto no es reproducible, y sin reproducibilidad la base local no sirve para lo que existe: probar antes de tocar producción (ADR-17).

_Precisión que no se debe perder:_ el permiso de tabla es la puerta y la RLS es el portero. Conceder `all` a `authenticated` no abre nada por sí solo — sin política, una tabla con RLS no devuelve una fila. Lo que sí se retira explícitamente es el acceso de `anon` a toda tabla con datos de una persona; `anon` solo llega a catálogos, agencias y vacantes.

_Deuda anotada:_ esos permisos replican los del proyecto alojado, que son los amplios de Supabase por defecto. Afinarlos por tabla y operación es trabajo de endurecimiento (fase 10), y hacerlo aquí habría cambiado el comportamiento de producción en una fase que no iba de eso.

### ADR-20 · El consentimiento se escribe en el mismo acto que crea la cuenta

_(Fase 2.)_

`app.handle_new_user()` inserta las filas de `consents` — `terms`, `privacy`, `data_sharing` y, si procede, `audio_sharing` — leyendo versión, IP y user-agent de los metadatos del registro.

_Motivo:_ con confirmación por correo, `signUp` crea el usuario pero **no devuelve sesión**, así que ninguna política de `consents` dejaría escribir esa fila desde el cliente. Aplazarlo al primer inicio de sesión pondría en la fila una marca de tiempo que no es la del consentimiento, y de quien se registra y nunca confirma no quedaría constancia alguna pese a que sus datos ya existen.

**Términos y privacidad se aceptan en una sola casilla pero se guardan como dos filas.** Son dos documentos y sus versiones se moverán por separado; unificarlos obligaría a volver a pedir el consentimiento de ambos cada vez que cambie uno.

_Riesgo asumido:_ los metadatos del registro los controla quien se registra, así que alguien podría llamar a `signUp` a mano y falsear su propia fila. No abre ninguna puerta —el rol sigue naciendo `candidate` pase lo que pase, y los tres obligatorios se escriben aunque no vengan—, y consentir en nombre de **otro** sigue siendo imposible: lo impide la RLS y lo fija un test.

### ADR-21 · El progreso del onboarding vive en el servidor, en una tabla aparte

_(Fase 2.)_

`candidate_onboarding_drafts` guarda el formulario a medias como `jsonb`. Al terminarlo se crea la fila de `candidates` y el borrador se borra.

_Motivo:_ `candidates` exige nombre, apellidos, fecha de nacimiento y dos países, y hace bien — una ficha a medias no es un candidato y no debe poder existir. Pero el formulario se rellena desde un móvil, de pie y con interrupciones. Guardar en `localStorage` habría sido más barato y habría atado el progreso a un navegador concreto: el candidato que empieza en el móvil y sigue en otro sitio empezaría de cero.

_Alternativa descartada:_ relajar los `not null` de `candidates`. Habría metido fichas incompletas en la tabla que alimenta la bolsa, y con ellas un `is not null` de más en cada consulta futura.

_Consecuencia:_ es una tabla con datos personales sin validar. Solo su dueño tiene política — ni el admin — y la batería de seguridad la incluye entre las tablas que nadie más puede leer.

### ADR-22 · Tres clientes de Supabase, y el de las rutas públicas no lee cookies

_(Fase 3.)_

Hay **tres** clientes y cada uno tiene un sitio:

| Fichero               | Lee cookies | Dónde se puede usar                                 |
| --------------------- | ----------- | --------------------------------------------------- |
| `lib/supabase/public` | **No**      | rutas públicas y estáticas, `sitemap.ts`, catálogos |
| `lib/supabase/server` | Sí          | **solo** `(private)`: Server Actions y área privada |
| `lib/supabase/client` | —           | navegador                                           |

_Motivo:_ hasta la fase 2 solo había dos, y `lib/catalogs.ts` usaba el de
servidor. Eso convertía en dinámica cualquier página pública que quisiera leer
un catálogo — o sea, todas las de esta fase — y con ella se iban el ISR y el
caché de CDN de los que vive el SEO (ADR-11, ADR-13).

El cliente público usa la **anon key y respeta la RLS**: llega exactamente a lo
que llega un visitante sin cuenta —catálogos, ETTs aprobadas y vacantes
`published`— y a nada más. No es una puerta de servicio; lo que decide qué se ve
sigue siendo la base de datos. `persistSession` y `autoRefreshToken` van a
`false` porque detrás de una página prerenderizada no hay ningún usuario.

_Consecuencia:_ `lib/catalogs.ts` pasa al cliente público y por tanto vale para
las dos zonas. La regla que hay que recordar es una sola: **si el fichero lo
puede importar una ruta pública, no puede tocar `cookies()`.**

### ADR-23 · Las landings programáticas se derivan de las vacantes vivas

_(Fase 3.)_

Cuatro familias de landing, todas estáticas: país (`/es/trabajo/alemania`),
país + sector (`/es/trabajo/alemania/logistica`), país + alojamiento
(`/es/trabajo/alemania/con-alojamiento`) y ciudad
(`/es/trabajo/ciudad/berlin`).

**Solo existe la combinación que tiene al menos una vacante publicada**, y
`dynamicParams = false`: lo que no está generado devuelve 404.

_Motivo:_ el producto cartesiano de catálogos daría cientos de URLs indexables
vacías. Es el mismo argumento por el que una vacante no se publica sin
traducción, aplicado a la capa de arriba: gastar el rastreo de Google en páginas
sin contenido cuesta meses de deshacer (ADR-16), y una landing vacía tampoco le
sirve de nada al candidato que llega buscando.

**Los slugs se derivan del nombre traducido del catálogo, no se guardan en una
columna.** `alemania`/`germany`, `logistica`/`logistics`. Así abrir un idioma
sigue siendo insertar filas en `*_translations` (ADR-07) y nadie tiene que
acordarse de rellenar un slug por idioma.

_Consecuencia que costó un fallo real:_ como el slug cambia de idioma, **el
`hreflang` no puede reutilizar los params del idioma actual**. La primera
versión generaba `/en/work/alemania`, una URL que no existe, y Google descarta
el emparejamiento entero cuando el enlace recíproco falla. Por eso
`seoMetadata` acepta una función `(locale) => href` y las landings pasan
`landingHref(landing)`.

La ciudad es la excepción: es texto libre de la vacante, no un catálogo, así que
tiene un solo nombre y un solo slug en todos los idiomas.

### ADR-24 · El listado filtra en cliente; lo indexable son las landings

_(Fase 3.)_

`/es/ofertas` se prerenderiza con **todas** las vacantes publicadas dentro del
HTML, y los filtros —país, sector, idioma, turno, alojamiento, transporte,
carné— se aplican en el navegador escondiendo tarjetas.

_Motivo:_ filtrar en servidor obliga a leer `searchParams`, y eso vuelve la ruta
dinámica. Las superficies filtradas que sí interesa indexar no son las
combinaciones de la query: son las landings de ADR-23, que son rutas estáticas
de verdad y además tienen texto propio.

**Y no se usa `useSearchParams`.** Ese hook obliga a un `Suspense`, y en una
página prerenderizada Next deja ese subárbol para el cliente: el HTML estático
salía **sin una sola vacante dentro** — comprobado, no supuesto. El estado del
filtro es la query de la URL, leída con `useSyncExternalStore` (snapshot de
servidor: cadena vacía) y escrita con `history.replaceState`. Así el servidor
pinta la lista entera, un enlace ya filtrado se restaura al montar, y el
candidato que aún no ha ejecutado el JavaScript ve las ofertas igual.

_Coste asumido:_ la página lleva todas las vacantes publicadas. A escala de MVP
es más rápido que paginar; cuando el listado crezca lo suficiente para que
importe, se pagina en servidor y se conserva el prerenderizado de la primera
página. No antes.

### ADR-25 · El registro de aperturas también cubre al admin

_(Fase 4.)_

`document_access_log.request_id` pasa a ser **nulo** cuando quien abre un
documento es el administrador durante la revisión.

_Motivo:_ la fase 1 solo imaginó una apertura, la de una ETT, que siempre nace
de una solicitud de consentimiento (ADR-05). Pero en el MVP quien más
documentos de identidad abre es el admin, y esa apertura tiene exactamente el
mismo peso probatorio. Las dos alternativas eran peores: no registrar al actor
principal, o inventar solicitudes de acceso falsas para poder apuntar a ellas,
ensuciando con filas ficticias la tabla que sostiene la defensa GDPR.

**No lleva un CHECK del tipo "o solicitud o autor".** Se probó y **rompía el
borrado de una cuenta**: `opened_by` es `on delete set null` a propósito, así
que al ejercer el derecho de supresión la fila se quedaría sin ninguno de los
dos y la restricción abortaría el borrado entero. Es la misma decisión que ya
tomó `email_log`: la traza sobrevive al perfil aunque pierda el nombre de quien
actuó. Lo que nunca se pierde es que el documento se abrió, cuándo, desde qué
IP y con qué navegador.

_Consecuencia:_ el candidato gana una política nueva para ver **las aperturas de
sus propios documentos**, tengan solicitud detrás o no. Sin ella, las del
backoffice serían invisibles justo para el interesado.

### ADR-26 · Un solo punto de envío de correo, y el correo nunca tumba la operación

_(Fase 4.)_

`src/lib/email/send.ts` es el **único** sitio del proyecto que manda un correo
propio. Todo lo demás sigue saliendo de Supabase Auth, que no pasa por ahí.

Tres garantías que la fase 8 no puede perder al centralizar y maquetar:

1. **No lanza nunca.** Devuelve el resultado. Si el admin aprueba a un
   candidato, el candidato queda aprobado aunque el proveedor esté caído; el
   fallo se enseña al lado del resultado correcto, no en lugar de él.
2. **Deja rastro siempre**, en `email_log`, con `sent` o `failed` y el motivo.
   `email_log` era de la fase 8, pero un fallo que solo existe en la consola del
   servidor no es visible para nadie, así que se empieza a escribir aquí.
3. **No conoce ni un texto.** Asunto y cuerpo llegan traducidos desde
   `messages/`, en el idioma **del candidato** (el de su `profiles.locale`), no
   en el del admin que pulsa el botón.

_Transporte por entorno, sin condicionales repartidos:_ con
`EMAIL_DEV_INBOX_URL` se entrega en Mailpit y no sale a internet; si no, la API
de Resend con `RESEND_API_KEY`. Es lo que permite probar el ciclo entero en
local sin credencial real.

_Aviso que costó un envío real:_ **`pnpm dev:local` hereda de `.env.local` todo
lo que `.env.test` no declare.** Probando esta fase, una ejecución local cogió
la clave de producción de Resend y mandó un correo de verdad. Por eso
`.env.test` declara `RESEND_API_KEY=` **vacía**: lo que no está allí, se hereda.

### ADR-27 · Los motivos de rechazo son claves de una lista cerrada

_(Fase 4.)_

`candidate_documents.rejection_reason` guarda una **clave** (`unreadable`,
`expired`, `wrongDocument`, `incomplete`, `mismatch`, `other`), no una frase.

_Motivo:_ el motivo lo escribe un admin que trabaja en español y lo lee un
candidato que puede estar en cualquiera de los idiomas del sitio. Con texto
libre, "la foto está borrosa" llega en español a quien se registró en inglés —y
llega además al correo, que es donde más duele—. Es la misma regla que ya
gobierna las Server Actions: se devuelven claves, no frases (ADR-01).

_Precio asumido:_ el admin no puede matizar. Para una persona revisando
documentos de identidad con cinco fallos posibles, sobra. El día que haga falta
detalle, se añade una nota libre **junto** a la clave, nunca en su lugar.

### ADR-28 · Las vacantes reales se publican con un comando y un fichero

_(Fase 4.)_

`pnpm job:publish content/jobs/<oferta>.json` da de alta o actualiza una
vacante. `pnpm job:publish:prod` hace lo mismo contra producción, y exige
teclear `produccion`, igual que `db:push:prod`.

_Motivo:_ hacía falta **lo mínimo que funcione**, no un CRUD. Una vacante real
lleva unos veinte campos y texto traducible en dos idiomas; un formulario para
eso es media fase 6, que además la hará la propia ETT (ADR-06) y tiraría lo
construido. Un fichero se redacta con calma, se corrige, se versiona con el
repositorio y queda como plantilla de la siguiente oferta: la sexta vacante se
publica copiando la quinta. Y es **repetible sin abrir una sesión de Claude**.

- **Idempotente**, con el `slug` como clave: relanzarlo actualiza, no duplica.
- **Local por defecto.** Publicar contra producción es una escritura deliberada.
- Exige traducción en **todos los idiomas activos** del catálogo: media
  traducción rompe el `hreflang` recíproco (ADR-23).
- La ETT se da de alta desde el mismo fichero. En producción no había ninguna, y
  una vacante sin ETT no existe.

_Consecuencia que hay que recordar:_ las landings son estáticas y se derivan de
las vacantes vivas (ADR-23), así que **publicar en una ciudad o un sector nuevos
exige redesplegar** para que su landing exista. El script lo dice al terminar.

_No se retira en la fase 6._ En el MVP Ulises es el backend humano y va a seguir
metiendo ofertas mientras haya una sola ETT; lo que sí debe pasar es que las dos
vías escriban por el mismo sitio.

### ADR-29 · El archivo del candidato pasa por el servidor

_(Fase 4.)_

La subida de documentos va por una Server Action, no del navegador directo a
Supabase Storage. `serverActions.bodySizeLimit` sube a 11 MB para que quepa el
límite de 10 MB del catálogo más lo que añade `multipart/form-data`.

_Motivo:_ el tamaño y el tipo aceptado son **catálogo** (`document_types`), y
comprobarlos en un sitio que el candidato no controla es lo que los convierte en
un límite y no en una sugerencia. Con subida directa, la única barrera sería la
del bucket. Ahora son tres —formulario, Server Action y bucket— y ninguna sobra:
un endpoint de subida sin límite es un problema el primer día, no en la fase de
endurecimiento.

_Coste asumido:_ el archivo viaja dos veces (navegador → servidor → storage).
A escala de MVP, con un candidato subiendo cinco archivos una vez en su vida, es
irrelevante frente a la garantía que compra.

_Y una nota de la subida:_ volver a subir un documento **pendiente** actualiza
la fila que ya existe en vez de crear otra —hay un índice único parcial que
impide dos documentos vivos del mismo tipo—, así que no hay ni un instante en
el que el candidato se quede sin documento por un fallo a mitad de camino. Un
documento **ya aprobado** no se puede pisar desde la aplicación.

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
