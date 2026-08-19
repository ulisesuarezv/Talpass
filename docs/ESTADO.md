# Estado del proyecto — punto de retomada

> ## ✅ 2026-08-19 — el copy falso, corregido y desplegado
>
> **Punto 2 del orden acordado: hecho y vivo en `https://talpass.eu`.** Las
> cinco páginas de oportunidad ya no publican ninguna cifra que no salga de una
> oferta concreta del informe.
>
> - **Rango observado puro (ADR-31, ya escrita).** Almacén **15,69 – 17,50**
>   (R2, R4, R5), logística **15,69 – 17,50** (las mismas tres, que son las
>   únicas de su bloque con cifra) y producción **14,96 – 16,50** (R3, Dresde).
>   Se fueron el 18,00 y el 17,00, que salían de las reglas de redacción del
>   §2.1 y no de ninguna oferta. Cárnico y agrícola, intactos.
> - **`facts.basisObserved` reescrita** en `es` y `en`: ya no habla del suelo del
>   convenio, dice que los dos extremos son lo observado, con la fecha de
>   consulta interpolada desde `OPPORTUNITY_SOURCE_DATE`.
> - **R4 y R5 corregidos.** El `summary` de almacén ya no dice ser el perfil más
>   frecuente ni el mejor pagado —los dos eran falsos y contradecían a la ficha
>   de producción—: ahora se apoya en el certificado de carretilla, que sí está
>   verificado (§2.1, regla 3).
> - **El efecto del 2026-09-01, resuelto en el copy.**
>   `production.conditions[0]` dice que el rango es lo medido en su fecha y que
>   el suelo del convenio manda por encima. Sigue en la lista de B.3.
> - **B.2 ya estaba corregido** en el propio commit de la auditoría (`a71fba5`):
>   el §0 del informe dice «Once de las catorce». No había nada que hacer.
> - **R3 no se toca**, por la decisión de Ulises de abajo, y queda anotado junto
>   a los tres pares de campos en `src/lib/opportunities.ts`.
>
> Evidencia y tabla B.1 rellenada de nuevo en
> `docs/evidencia/correccion-copy/`.
>
> **Desplegado: `dpl_rQSDT7UzxqMPkHieAVfUVBsm15pB`**, confirmado con
> `vercel inspect talpass.eu` antes de leer ninguna cabecera. En producción, sin
> ejecutar JavaScript: las cifras nuevas en `es` y `en`, `x-vercel-cache: HIT`
> con `x-nextjs-prerender: 1` y sin `x-ett-session-checked` ni `Set-Cookie`, y
> cero `JobPosting`. Detalle en `docs/evidencia/correccion-copy/02-produccion.md`.
>
> **Lo siguiente es el punto 3: los textos legales y su ruta**, que arrastra el
> `<terms>` en negrita del registro y las cuatro fechas de `src/config/legal.ts`
> que hoy versionan documentos que no existen.

> ## 📋 2026-08-18 — auditoría previa hecha, y el rumbo cambia
>
> **Lee esto primero y no actúes sobre los bloques de abajo sin haberlo leído.**
> Los de más abajo son ciertos en lo suyo, pero este los reordena.
>
> **Se ha pasado una auditoría al proyecto entero.** Entregable en
> `docs/evidencia/auditoria-previa/` (6 ficheros), y su `00-resumen.md` abre con
> **una tabla de 40 cifras con el comando que produce cada una**. Esa tabla es la
> línea base del rediseño: la auditoría posterior la vuelve a rellenar columna a
> columna. **No la reinventes; rellénala.**
>
> **Decisión de Ulises, 2026-08-18: se replantea el orden del roadmap y se hace
> un pase de credibilidad sobre las páginas públicas.** El motivo no es estético.
> La home son 375 bytes de copy, un `h1` y cero `h2`; no hay ni una cara, ni
> quién hay detrás, ni un texto legal. Un peón que se plantea subir su DNI y su
> IBAN a un dominio que no conoce, en un sector lleno de estafas, **no tiene con
> qué decidir que esto no es un fraude**. Eso es lo que se arregla, y por eso es
> medible.
>
> **El roadmap no se renumera: se corta en dos vías.** Nada se tira, nada cambia
> de número.
>
> - **Vía A — espera a la ETT** (fases 3, 4, 5, 6, 7): construidas y verificadas,
>   congeladas donde están. Se retoman el día que haya ETT.
> - **Vía B — captar y retener candidatos, ahora**: corregir el copy falso ·
>   textos legales · desbloquear la verificación en producción · el campo de
>   sector de destino en el onboarding · el pase de credibilidad.
>
> **Los textos legales dejan de ser fase 9** y entran en la vía B: caen dentro de
> la superficie del rediseño y son parte del problema de confianza, no un
> trámite posterior.
>
> **Pendiente de decisión de Ulises: precisar ADR-10** — el presupuesto de
> velocidad se queda intacto y "sobrio y profesional" pasa a definirse como
> **creíble**, no como vacío. Es una enmienda de un párrafo, no una sustitución.
> Y **nada de GSAP, R3F ni shaders**: hay agentes instalados para eso en la
> máquina y en este proyecto restan. El candidato entra con 4G desde el móvil.
>
> ### Lo que la auditoría encontró, por orden de gravedad
>
> 1. ~~**La fase 4b no existía fuera del portátil.**~~ **✅ RESUELTO HOY.**
>    `origin/main` iba 4 commits por detrás y **no tenía ni uno de los 6 ficheros
>    de `opportunities`**: el sitio que Google está indexando existía solo en
>    local. Hecho `git push`; `origin/main` = `a71fba5` y verificado que los 6
>    ficheros están. La frase "Git y producción quedan sincronizados" que este
>    documento tenía escrita **era falsa** y la escribió el PM.
> 2. 🔴 **Cinco atribuciones falsas siguen vivas en producción.** La peor: los
>    perfiles de **almacén, logística y producción** publican "Alojamiento / En
>    algunas ofertas" y "Transporte / En algunas ofertas" sobre una investigación
>    cuyo dato es **0 de 14 lo ofrecen y 14 de 14 callan**. No es una etiqueta mal
>    puesta como la que se cazó al cerrar la 4b: **es un hecho inventado**, y cae
>    justo en las dos casillas que son la apuesta del producto. Las otras cuatro:
>    dos techos salariales etiquetados "observado" que salen de las **reglas de
>    redacción** del informe (18,00 en almacén y 17,00 en producción; nunca se
>    observaron) y dos frases de la ficha de almacén que contradicen a la de
>    producción. Detalle en `04-superficie-copy.md` §B.1.
> 3. 🔴 **El registro pide aceptar unos Términos que no existen.** No hay ninguna
>    ruta legal (`/es/privacidad`, `/es/terminos`, `/es/legal` son 404), la
>    casilla obligatoria pone los Términos **en negrita en vez de enlazarlos**
>    (`<terms>` → `<strong>`), y `src/config/legal.ts` versiona con fecha
>    `2026-08-14` cuatro documentos que no están en el repositorio.
> 4. 🔴 **Las funciones se ejecutan en Estados Unidos.** La cabecera
>    `x-vercel-id` de una ruta privada empieza por `fra1::iad1::`: el borde está
>    en Fráncfort y **la función en Washington**,
>    contra una base de datos en Irlanda. Con ADR-29 la subida de documentos
>    **pasa por el servidor**, así que hoy un DNI transita por `iad1`. Choca de
>    frente con ADR-09 ("los datos personales de ciudadanos UE no salen de la
>    UE"). No lo cubre ningún ADR y no hay `vercel.json` ni `regions`. El arreglo
>    es una línea de configuración y un redespliegue; la decisión de si es
>    urgente es de Ulises.
> 5. 🔴 **`/es/trabajo/**` es 404 entero en producción** (0 vacantes ⇒ 0
>    landings, ADR-23). Funciona como está diseñado, pero **ningún documento lo
>    decía** y el roadmap sigue presentando las landings como entregadas. La
>    superficie indexable real de producción son **7 URLs**, y el "landing 97"
>    del roadmap **no se puede reproducir donde se sirve**: el rediseño mide en
>    local para tener las seis páginas.
> 6. 🟡 **Faltan DOS variables en Vercel, no tres.** `SUPABASE_SERVICE_ROLE_KEY`
>    ya está puesta desde el 2026-08-14. Faltan `RESEND_API_KEY` y `EMAIL_FROM`.
> 7. 🟡 **Las páginas de `(auth)` no tienen metadatos propios**: `/es/registro`
>    sirve el título y la descripción **de la home**, sin canónica y con el
>    `hreflang` apuntando a la home. Cae dentro del rediseño.
> 8. 🟡 **`ettrecruiter.vercel.app` sirve el sitio entero a 200 y es rastreable**
>    en vez de redirigir. Mitigado porque su canónica apunta al apex.
>
> ### La decisión de las cifras — **tomada el 2026-08-19 por Ulises**
>
> Estaba abierta desde el día 18 y ya no lo está. Dos partes, y no van en la
> misma dirección:
>
> **1. Los salarios pasan a rango observado puro.** Se abandona la fórmula mixta
> "suelo del convenio + techo observado": los dos extremos salen de las ofertas
> analizadas. Almacén y producción bajan (18,00 y 17,00 eran reglas de redacción
> del informe, no observaciones) y logística también se revisa, porque su mínimo
> era el del convenio. El suelo del convenio no se va de la página: sigue en el
> bloque `Opportunities.agreement`, que es su sitio. Queda como **ADR-31**, que
> escribe la sesión de la corrección.
>
> ⚠️ **Efecto con fecha:** producción arrancará en 14,96 €/h, y **el 2026-09-01
> el suelo legal pasa a 15,33 €/h**. Ese día la ficha enseñará un mínimo por
> debajo del suelo legal, al lado de un bloque que anuncia el 15,33. No es falso
> —es lo medido el 2026-08-16 y la página publica su fecha— pero **tiene que
> leerse como lo que es**, y entra en la lista con fecha de B.3.
>
> **2. Alojamiento y transporte se quedan en "En algunas ofertas".** El hallazgo
> R3 —el más grave de la auditoría— **no se corrige**. La fuente dice
> **0 de 14 lo ofrecen y 14 de 14 callan**; la página seguirá diciendo "en
> algunas". Motivo dado por Ulises: estas páginas son un reclamo temporal para
> captar las primeras 30 personas y "en tres días esto dará igual".
>
> Queda escrito aquí, y no como ADR, porque **un ADR es una regla que se sigue y
> esto es una excepción consciente y temporal**. El PM planteó dos veces que la
> fuente dice cero; Ulises lo reafirmó. Se anota también junto al código, para
> que dentro de un mes nadie lo tome por un descuido.
>
> Lo que conviene no perder de vista: las páginas están **indexadas desde el
> 2026-08-17**, así que lo que se lea estos días entra en el índice de Google
> aunque el copy cambie después. **Revisar esta excepción es una tarea viva, no
> un asunto cerrado.**
>
> ### ❗ Pendiente de Ulises antes de desplegar los legales
>
> El responsable del tratamiento queda fijado el 2026-08-19: **José Ulises
> Suárez Victoria, NIF 50232706S, Theodor-Heuss-Straße 16, Göttingen
> (Alemania)**, persona física. Los datos están en
> `docs/prompts/textos-legales.md` §2 y van a un módulo de configuración, no al
> copy.
>
> Faltan **dos cosas, y sin ellas el Impressum no se publica**:
>
> 1. **El código postal de Göttingen.** Una dirección postal incompleta no
>    cumple el §5 DDG.
> 2. **Un email de contacto que exista y que alguien lea.** El §5 DDG exige vía
>    directa y rápida; un formulario no basta por sí solo.
>
> Y dos precisiones ya dadas: el responsable **reside en Alemania**, así que el
> documento que manda es un **Impressum**, no un aviso legal español; y el
> **NIF español no es lo que pide un Impressum** —ahí va la USt-IdNr, y solo si
> se tiene—, aunque sirve para identificar al responsable en la política.
>
> ⚠️ **Y una dependencia con el punto 4:** mientras las funciones se ejecuten en
> `iad1`, la política de privacidad **no puede escribir que los datos no salen
> de la UE**. Los dos puntos están atados: el que se ejecute primero condiciona
> al otro.
>
> ⚠️ Estos textos **los redacta el responsable y no son un dictamen jurídico**.
> Este proyecto trata DNI, IBAN y grabaciones de voz de trabajadores migrantes:
> **necesitan revisión de un profesional antes de captar en serio.** Los propios
> documentos lo dicen, y decirlo es parte del arreglo.

> ### 🗓️ Tarea con fecha: **2026-09-01**
>
> Ese día sube el convenio a 15,33 €/h y hay que revisar **la lista de B.3 de la
> auditoría** (`docs/evidencia/auditoria-previa/04-superficie-copy.md`), que
> desde el 2026-08-19 incluye un punto más:
>
> - **El mínimo de producción, 14,96 €/h**, queda por debajo del suelo legal
>   vigente. El copy ya lo explica (`production.conditions[0]`), pero hay que
>   releerlo ese día y decidir si se mantiene o se rehace la medición.
> - `Opportunities.disclosure.source` pasa a hablar en pasado de una subida que
>   ya habrá ocurrido.
> - `agreement.body` y los `conditions[0]` de cárnico y agrícola interpolan
>   `AGREEMENT_FLOOR`, así que se corrigen solos: lo que caduca es el texto que
>   los rodea, no la cifra.
> - La excepción de alojamiento y transporte (arriba) es buen momento para
>   revisarla también.
>
> ### El orden acordado — nada de diseño hasta que esto esté
>
> 1. ~~`git push`~~ ✅ hecho el 2026-08-18.
> 2. ~~**Corregir el copy falso y redesplegar.**~~ ✅ **hecho el 2026-08-19**
>    con `docs/prompts/correccion-copy.md`, desplegado y verificado contra
>    producción. Ver el bloque de arriba y `docs/evidencia/correccion-copy/`.
> 3. **Los textos legales y su ruta.** **Prompt escrito el 2026-08-19:
>    `docs/prompts/textos-legales.md`.** Pendiente de ejecutar, y **con dos
>    huecos que bloquean su despliegue**: ver abajo.
> 4. **Desbloquear la verificación en producción**: `db:push:prod` de
>    `20260816120000_verification.sql` + las dos variables + redespliegue.
> 5. **El campo de sector/ciudad de destino en el onboarding** — antes de captar,
>    no después: pedírselo a 30 personas ya captadas es hacerlas volver.
> 6. **El pase de credibilidad**, y su auditoría posterior contra la tabla.
>
> ### Lo siguiente — ~~el prompt del punto 2~~ **ejecutado el 2026-08-19**
>
> `docs/prompts/correccion-copy.md` ya está ejecutado y desplegado: ver el
> bloque del 2026-08-19, arriba del todo. **El PM verifica su cierre contra
> producción, no contra el resumen de la sesión.**
>
> Le toca ahora el **prompt del punto 3, los textos legales**, que arrastra
> además el `<terms>` en negrita del registro y las cuatro fechas de
> `src/config/legal.ts` que hoy versionan documentos que no existen.

> ## ✅ Fase 4b cerrada, 2026-08-17 — el sitio ya está abierto a Google
>
> El pollo y huevo **está roto por el lado del candidato**. Se publicaron **cinco
> perfiles de mercado** en `/es/oportunidades` ↔ `/en/opportunities` —almacén,
> logística, producción, cárnico y agrícola—, sacados de
> `docs/investigacion/ofertas-mercado.md` y del convenio de la Zeitarbeit, **sin
> una sola línea de `JobPosting` y sin fingir que hay vacantes abiertas**.
>
> **`NEXT_PUBLIC_ALLOW_INDEXING` está ENCENDIDA en producción.** `/robots.txt` ya
> no dice `Disallow: /` y el sitemap pasó de **2 URLs a 7**. Es la primera vez
> que el sitio es rastreable.
>
> Dos despliegues, en ese orden: `dpl_C5jM3MRvPU49pSugvnusD99LowDr` (el
> contenido) y `dpl_BTmB7MvesM7E65iDJNXvyeEbaM4U` (la bandera, que se hornea en
> el build y por eso exige redesplegar). Verificación completa contra
> `https://talpass.eu` en `docs/evidencia/fase-4b/02-produccion.md`.
>
> **Decisión nueva: ADR-30.** Una oportunidad no es una vacante y no puede llegar
> a serlo: no hay tabla, no hay migración y no hay camino de código hasta `jobs`.
> Y **ADR-16 y ADR-23 quedaron corregidas** el mismo día: la bandera ya no exige
> vacantes reales, y una página indexable sin vacante detrás no contradice
> ADR-23.
>
> **Las fases 3 y 4 siguen 🟡** y esta fase **no las cierra**: su criterio pide el
> Rich Results Test sobre una vacante real. Todo lo de la sección "El día que
> haya ETT" sigue vigente palabra por palabra, pero como el guion de ese día.
>
> **Siguiente paso real: conseguir la primera ETT.** Ya hay algo que enseñarle
> —un sitio indexado y una lista que empieza a llenarse—, que es exactamente lo
> que no había ayer.
>
> ⚠️ **Y el activo se enfría.** Esto acumula registros de gente esperando una
> vacante que todavía no existe: cuanto más tarde la ETT, menos vale la lista.
> No lo arregla el código, condiciona el calendario comercial.

> Última actualización: **2026-08-16**. **La fase 4 está construida y verificada
> en local**: subida de documentos, grabación de audio, backoffice de revisión,
> el primer correo propio de la aplicación y una vía para publicar vacantes
> reales. Se queda en 🟡 por **un solo criterio**: que exista una vacante real
> **publicada en producción**, que es una escritura deliberada y la hace Ulises.
> Esa misma vacante es la que desbloquea la fase 3 entera (Rich Results Test).
> ~~Y la bandera de indexación, que sigue APAGADA~~ — **caducado el 2026-08-17**:
> la bandera la encendió la fase 4b y ya no depende de que haya vacantes
> (ADR-16, corregida).
> ~~**Siguiente paso: publicar las primeras ofertas reales**~~ — **caducado el
> 2026-08-17**, ver el aviso de arriba. Sigue siendo el guion del día que haya
> ETT, y por eso no se borra.
> El detalle de cada fase está en `docs/02-ROADMAP.md`; las decisiones, en `docs/00-PROJECT.md`.

---

## Dónde estamos

**Fases 0, 1 y 2 cerradas. Las fases 3 y 4 están construidas y verificadas, y
las dos esperan a lo mismo: una vacante real en producción.** La 3 la necesita
para el Google Rich Results Test; la 4, porque su criterio de "hecho cuando"
incluye que el admin haya podido publicar una. No es trabajo de código: la vía
existe, está probada y documentada.

**Pero desde el 2026-08-17 se sabe que eso no depende de ponerse a ello, sino de
que exista una ETT** — una vacante real es de una agencia real. Por eso las dos
están bloqueadas y por eso existe la 4b: para conseguir los candidatos con los
que se cierra esa ETT.

| Fase                   | Estado                                                                     |
| ---------------------- | -------------------------------------------------------------------------- |
| 0 · Fundaciones        | ✅ desplegada en producción                                                |
| 1 · Datos y seguridad  | ✅ 36 tablas, RLS probada                                                  |
| 2 · Auth y onboarding  | ✅ registro real end-to-end                                                |
| 3 · Vacantes + SEO     | 🟡 **bloqueada hasta que haya ETT** — Rich Results Test sobre vacante real |
| 4 · Verificación       | 🟡 **bloqueada hasta que haya ETT** — publicar una vacante real            |
| **4b · Oportunidades** | **✅ cerrada 2026-08-17 — 5 perfiles vivos y el sitio abierto a Google**   |
| **5 · Aplicaciones**   | **⬜ siguiente fase de código** — su prompt sigue sin escribirse           |
| 6–10                   | ⬜                                                                         |

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

## El día que haya ETT — poner las primeras vacantes reales en producción

> **Esto ya NO es "lo primero al retomar"** (cambiado el 2026-08-17). Es el guion
> del día que Ulises firme una ETT, y hasta entonces **no se ejecuta ningún paso
> de esta sección**. Lo que toca antes es la fase 4b. Se conserva entero porque
> el día que toque vale palabra por palabra.
>
> Y ojo al paso 1: las ofertas tienen que ser **de esa ETT y confirmadas por
> ella**. `content/jobs/ejemplo-almacen-nuremberg.json` lleva una agencia
> inventada (`Franken Personal GmbH`) y es **solo un molde de formato**:
> publicarlo tal cual en producción es exactamente lo que la fase 4b existe para
> evitar.

Es lo que cierra **dos fases a la vez** (la 3 y la 4). ~~Y lo que abre el sitio a
Google~~ — eso ya lo hizo la fase 4b el 2026-08-17. No hay que escribir código:
hay que redactar ofertas y lanzar un comando.

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

### 4. Dos variables de entorno que faltan en Vercel

> **Corregido el 2026-08-18 con `vercel env ls`**: aquí decía **tres**.
> `SUPABASE_SERVICE_ROLE_KEY` **ya está puesta** en `production` desde el
> 2026-08-14. Faltan dos, y esto ya no espera a la ETT: es del punto 4 del orden
> acordado arriba.

Sin ellas el backoffice de la fase 4 no funciona en producción:

| Variable         | Para qué                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `RESEND_API_KEY` | el aviso de aprobado/rechazado **lo manda la aplicación**         |
| `EMAIL_FROM`     | `no-reply@updates.talpass.eu` (el dominio verificado, no el apex) |

> La clave de Resend **ya es válida** — se comprobó sin querer el 2026-08-16, ver
> "Cosas que no deben olvidarse". Es la misma que usa el SMTP del panel.

### 5. Y entonces sí: cerrar la fase 3 con el Rich Results Test

Con ofertas reales publicadas, se pasa una por
https://search.google.com/test/rich-results y se anota el resultado. **Eso es lo
único que le falta a la fase 3.**

> **La bandera de indexación ya no se enciende aquí** (2026-08-17): la enciende
> la fase 4b, y ADR-16 quedó corregida en consecuencia. Si al llegar a este paso
> la 4b ya se ejecutó, la bandera está puesta y estos dos comandos **ya se
> lanzaron**; volver a lanzarlos no rompe nada, pero no hace falta. Se dejan por
> si se llega aquí sin haber pasado por la 4b.

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

> **⚠️ Esta lista está superada desde el 2026-08-18.** El orden que manda es el
> del bloque de arriba ("El orden acordado"). Lo de aquí se conserva porque los
> puntos 3, 4 y 5 siguen vivos tal cual y porque los tachados dejan escrito qué
> falló, que es de donde salen las reglas de esta casa.

Lo que decía el 2026-08-17, con lo hecho desde entonces marcado:

0. ~~**Verificar el cierre de la 4b**~~ **✅ HECHO por el PM, 2026-08-17.** Se
   recomprobó de cero contra `https://talpass.eu`, sin fiarse de la evidencia de
   la sesión que construyó y desplegó (era juez y parte). Resultado: `robots.txt`
   con `Allow: /`, **las 10 páginas a 200 con `JobPosting = 0`** tras encender la
   bandera, sitemap de 7 URLs con alternates, `/es/ofertas` en `noindex, follow`,
   y **0 ficheros tocados en `supabase/`** —así se verificó "no toca la base" sin
   depender del test—. Commit `c416f9f`.

   > **Un fallo real que dejó la 4b, y que el PM cazó al verificar.** Tres
   > franjas salariales se publicaban con la etiqueta "Rango observado en las
   > ofertas analizadas" cuando eran **derivadas**: el suelo es el del convenio
   > (15,33 € desde el 2026-09-01), no el mínimo visto en la muestra (14,96 €).
   > Las cifras eran las correctas —copiar el 14,96 volvería la página falsa
   > sola en septiembre—, pero la etiqueta afirmaba una procedencia que no
   > tenía, en unas páginas cuya premisa entera es que cada dato es verificable.
   > Corregido en `messages/{es,en}.json` y en el comentario de `SalaryBasis`.
   > **La lección para el próximo PM: en esta fase lo que hay que auditar no son
   > las cifras, son las atribuciones.**

1. ~~**Desplegar la corrección de esa etiqueta.**~~ **✅ HECHO, 2026-08-17**
   (`dpl_14Fw5ScwWntESvy6wTGkjaEiEYJR`). Verificado: la etiqueta nueva viva en
   `es` y en `en`, **cero apariciones de la vieja**, y sin regresión —
   `JobPosting = 0`, `robots.txt` con `Allow: /` y el sitemap en 7 URLs.
   ~~**Git y producción quedan sincronizados.**~~ **Esta frase era falsa** y la
   escribió el PM: se comprobó producción y se dio por hecho `origin`. La
   auditoría del 2026-08-18 encontró `origin/main` **4 commits por detrás y sin
   la fase 4b entera**. Resuelto ese mismo día con `git push` (`a71fba5`).
   **La lección: "desplegado" y "subido" son dos hechos distintos, y en este
   proyecto —sin integración con GitHub— no se implican.**

2. ~~**Arreglar la contradicción del informe de mercado.**~~ **✅ HECHO,
   2026-08-18.** El §0 decía "ocho de las catorce exigen alemán" contra su propia
   tabla de recuento. Recontadas las 14 fichas una a una: son **once** —las 5 de
   Randstad, A1 y A5 de Adecco, las 4 de Tempton—, y las mudas son A2, A3 y A4.
   Corregido en el propio informe, con la nota de qué se cambió. **No afecta a
   nada vivo**: el código y el copy publicado ya usaban el 11.

3. **Los cinco textos caducan el 2026-09-01**, cuando sube el convenio de la
   Zeitarbeit (15,33 → 15,87 €/h en abril de 2027). Los suelos publicados dejan
   de ser ciertos ese día. Es una revisión con fecha, no una tarea abierta.

4. **Decidir si las páginas siguen nombrando a Randstad, Adecco y Tempton.**
   Hoy los citan como fuente del análisis, y es honesto y da credibilidad. Pero
   son competidores, y algún día una ETT socia leerá esas páginas. Nadie tomó
   esa decisión explícitamente: se puede cambiar por "tres de las mayores ETTs
   de Alemania" sin perder nada. **Es decisión de Ulises, no del PM.**

5. **Vigilar que la lista de candidatos no se enfríe.** La 4b acumula registros
   de gente esperando vacantes que aún no existen. Cuanto más tarde la ETT, menos
   vale la lista, y eso no lo arregla el código. Si pasan semanas sin ETT, **es
   señal de replantear el orden del roadmap**, no de seguir construyendo fases.

> **Del 6 al 8: en espera hasta que haya una ETT firmada.** No son trabajo
> pendiente, son el guion de un día que todavía no ha llegado.

6. **Acompañar a Ulises en los cinco pasos de "El día que haya ETT"** — _en espera_. No los ejecuta el PM
   —las escrituras contra producción las lanza él con `!`— pero **cada uno se
   verifica al terminar**: `migration list --linked` tras el `db:push:prod`,
   `curl` del HTML y del sitemap tras el despliegue, `vercel env ls` tras las
   variables. Sirve de guion lo que ya se hizo el 2026-08-16.
7. **Cerrar las fases 3 y 4** en `docs/02-ROADMAP.md` cuando —y solo cuando— la
   vacante real esté publicada y el Rich Results Test la valide. Anotar el
   resultado del tester aquí.
8. **Redactar `docs/prompts/fase-5.md`** — con la 4b cerrada, es **el siguiente
   prompt de código**, y sigue sin escribirse a propósito: uno escrito hoy
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

> **Todo lo que sigue en esta sección es una foto del 2026-08-16 y no describe
> el presente.** Verás frases como "la bandera sigue APAGADA" o "el sitemap son
> 2 URLs": eran ciertas ese día y dejaron de serlo el 2026-08-17, cuando la fase
> 4b abrió el sitio a Google. **No actúes sobre nada de aquí**; se conserva
> porque documenta cómo está montado el entorno y qué falla cuando se hace mal.

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
> `EMAIL_FROM` — están en "El día que haya ETT", paso 4.

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
ADR-28), así que ya no falta código: falta **una ETT** cuyas ofertas publicar.
Está todo en "El día que haya ETT", arriba.

---

## Pendientes de Ulises (fuera del repositorio)

1. **Guardar el llavero de cifrado de `.env.local` en el gestor de contraseñas.**
   Es el único secreto del proyecto que **no se puede regenerar**: perderlo es
   perder los IBAN cifrados, por diseño. Lo más urgente de esta lista.
2. **Rotar la contraseña de la base de datos** — pasó por el chat. Está en
   `.env.local`, ignorado por git, así que es higiene, no urgencia.
3. **Conseguir la primera ETT.** Es lo único que desbloquea las fases 3 y 4, y
   desde el 2026-08-17 hay con qué enseñarse: el sitio está indexado y las
   oportunidades ya están captando. Cuando la haya, publicar sus vacantes reales
   —arriba—, que incluye subir la migración de la fase 4 y poner **dos variables
   en Vercel** (`RESEND_API_KEY` y `EMAIL_FROM`; la `SUPABASE_SERVICE_ROLE_KEY`
   ya está puesta). **Desde el 2026-08-18 la migración y las variables ya no
   esperan a la ETT**: son el punto 4 del orden acordado, porque sin ellas no se
   puede verificar a nadie y una bolsa sin verificar no se le enseña a nadie.
   **Revisar los textos de las oportunidades** (`messages/es.json` y
   `messages/en.json`, namespace `Opportunities`): están vivos en producción y
   respondes tú de ellos. Y **caducan el 2026-09-01**, cuando suba el convenio.
4. **Dar de alta `talpass.eu` en Google Search Console y enviarle el sitemap**
   (`https://talpass.eu/sitemap.xml`). ⚠️ **Es lo que convierte la fase 4b en
   visitas, y solo puedes hacerlo tú**: exige verificar la propiedad del dominio.
   Encender la bandera el 2026-08-17 solo dejó de prohibirle el paso a Google;
   después de meses sirviendo `Disallow: /`, Google no tiene ningún motivo para
   volver pronto por su cuenta. Sin este gesto, el trabajo de la 4b tarda semanas
   en notarse. Search Console es además el único sitio donde se ve si Google
   **acepta** las páginas o las descarta, que es información que no da ningún
   `curl`.
5. **Conectar el repositorio de GitHub al proyecto de Vercel.** ⚠️ **Subió de
   prioridad el 2026-08-18.** Hoy los despliegues son manuales
   (`pnpm exec vercel --prod`), y esa desconexión ya ha fallado **en los dos
   sentidos**: la fase 3 pasó un día entero en `origin` sin llegar a producción,
   y la fase 4b pasó un día entero **en producción sin llegar a `origin`** —
   indexándose en Google desde un código que solo existía en tu portátil. Mientras
   no estén conectados, "desplegado" y "subido" hay que comprobarlos por separado.
6. **`talpass.com` queda aplazado por presupuesto.** Decisión consciente: es la
   mitigación del riesgo de ADR-12 y sigue pendiente. Revisarlo cuando haya caja.
7. **Ruido conocido en la bandeja y en Resend, nada que hacer.** Correos de
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
