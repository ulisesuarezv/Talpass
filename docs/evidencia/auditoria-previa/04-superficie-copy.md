# 04 · La superficie del rediseño, y el copy que la sostiene

> **Medición: 2026-08-18.** Commit `ed214e8`.

---

# Parte A · Inventario de lo que se va a tocar

## A.1 Rutas de `(public)` y `(auth)`

```bash
find "src/app/[locale]/(public)" "src/app/[locale]/(auth)" -type f | sort
wc -l <cada fichero>
```

### `(public)` — 9 ficheros, todos **Server Components**

| Ruta interna                                | URL `es`                             | Líneas | Componentes que usa                                                                                                     | Namespace               |
| ------------------------------------------- | ------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `page.tsx`                                  | `/es`                                | 62     | `ui/button`                                                                                                             | `Home`, `Metadata`      |
| `jobs/page.tsx`                             | `/es/ofertas`                        | 118    | `jobs/job-browser` ⚠️, `jobs/signup-cta`, `ui/button`                                                                   | `Jobs`                  |
| `jobs/[slug]/page.tsx`                      | `/es/ofertas/[slug]`                 | 210    | `jobs/format-salary`, `jobs/job-posting-jsonld`, `jobs/related-landings`, `jobs/signup-cta`, `ui/badge`, `ui/separator` | `Jobs`                  |
| `opportunities/page.tsx`                    | `/es/oportunidades`                  | 93     | `opportunities/market-disclosure`, `opportunities/opportunity-card`, `jobs/signup-cta`                                  | `Opportunities`         |
| `opportunities/[country]/[sector]/page.tsx` | `/es/oportunidades/[país]/[sector]`  | 269    | `opportunities/format-market-salary`, `opportunities/market-disclosure`, `jobs/signup-cta`, `ui/badge`, `ui/separator`  | `Opportunities`, `Jobs` |
| `work/[country]/page.tsx`                   | `/es/trabajo/[país]`                 | 74     | `jobs/landing-view`                                                                                                     | `Landing`               |
| `work/[country]/[sector]/page.tsx`          | `/es/trabajo/[país]/[sector]`        | 74     | `jobs/landing-view`                                                                                                     | `Landing`               |
| `work/[country]/with-housing/page.tsx`      | `/es/trabajo/[país]/con-alojamiento` | 76     | `jobs/landing-view`                                                                                                     | `Landing`               |
| `work/city/[city]/page.tsx`                 | `/es/trabajo/ciudad/[ciudad]`        | 74     | `jobs/landing-view`                                                                                                     | `Landing`               |

### `(auth)` — 5 páginas + 1 layout, páginas **Server**, formularios **cliente**

| Ruta                       | URL `es`               | Líneas | Componente cliente                      | Namespace |
| -------------------------- | ---------------------- | ------ | --------------------------------------- | --------- |
| `layout.tsx`               | —                      | 24     | — (fija `robots: noindex, nofollow`)    | —         |
| `signup/page.tsx`          | `/es/registro`         | 27     | `auth/signup-form` (139 l.)             | `Auth`    |
| `login/page.tsx`           | `/es/entrar`           | 27     | `auth/login-form` (66 l.)               | `Auth`    |
| `check-email/page.tsx`     | `/es/revisa-tu-correo` | 40     | `auth/resend-confirmation-form` (65 l.) | `Auth`    |
| `forgot-password/page.tsx` | `/es/recuperar-acceso` | 27     | `auth/forgot-password-form` (70 l.)     | `Auth`    |
| `reset-password/page.tsx`  | `/es/nueva-contrasena` | 30     | `auth/reset-password-form` (85 l.)      | `Auth`    |

## A.2 Server vs. cliente, y **por qué**

```bash
grep -rl "'use client'" src/app src/components
```

**Ninguna página es `'use client'`.** Las páginas son todas Server Components,
que es lo que permite que salgan `●` y se sirvan del CDN (ADR-11). Lo que es
cliente, y su motivo:

| Componente                                             | Líneas  | Por qué es cliente                                                                                                                                                                         |
| ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `jobs/job-browser.tsx`                                 | **322** | Filtra el listado **en el navegador, sin `useSearchParams`** (ADR-24). Es el más grande del sitio y es el que muerde: fue aquí donde un `Suspense` dejó el HTML sin vacantes en la fase 3. |
| `jobs/job-card.tsx`                                    | 59      | Lo renderiza `job-browser`                                                                                                                                                                 |
| `account-nav.tsx`                                      | 77      | **El único sitio de la cabecera que sabe si hay sesión**, y por eso lo resuelve en cliente con `lib/supabase/client`                                                                       |
| `locale-switcher.tsx`                                  | 61      | Navegación con `router.replace`                                                                                                                                                            |
| `auth/*-form.tsx` (5)                                  | 425     | Estado de formulario y Server Actions                                                                                                                                                      |
| `forms/form-parts.tsx`                                 | —       | Primitivas de formulario                                                                                                                                                                   |
| `ui/{checkbox,label,radio-group,select,separator}.tsx` | —       | Radix                                                                                                                                                                                      |

**Server Components sin `'use client'` que el rediseño toca:**
`site-header.tsx` (50), `site-footer.tsx` (15), `jobs/landing-view.tsx` (124),
`jobs/related-landings.tsx` (94), `jobs/signup-cta.tsx` (48),
`jobs/job-posting-jsonld.tsx` (103), `opportunities/market-disclosure.tsx` (59),
`opportunities/opportunity-card.tsx` (77).

> ⚠️ **La regla que el rediseño no puede romper:** convertir cualquiera de esos
> Server Components en `'use client'`, o meter un `Suspense` cuyo contenido
> dependa de datos de cliente, deja el HTML vacío por dentro **sin que la ruta
> deje de salir `●`**. Lo mide `01-local.md` §3, no el build.

## A.3 Namespaces de `messages/{es,en}.json` y su tamaño

```bash
wc -c messages/es.json messages/en.json
node -e "…"   # tamaño de cada namespace serializado
```

`es` = **33.463 bytes** · `en` = **32.248 bytes** · **17 namespaces cada uno**,
con **448 claves hoja idénticas** en ambos (0 claves huérfanas en cualquiera de
los dos sentidos).

| Namespace         | `es` (bytes) | `en` (bytes) | Alimenta                                                         |
| ----------------- | ------------ | ------------ | ---------------------------------------------------------------- |
| **Opportunities** | **12.489**   | **12.119**   | `/es/oportunidades` y las 5 fichas — **37 % del copy del sitio** |
| **Auth**          | 3.608        | 3.442        | las 5 páginas de `(auth)`                                        |
| Account           | 2.631        | 2.556        | privado                                                          |
| **Jobs**          | 2.390        | 2.356        | `/es/ofertas` y la ficha de vacante                              |
| Onboarding        | 1.819        | 1.809        | privado                                                          |
| **Landing**       | 1.740        | 1.675        | las 4 familias de `/es/trabajo/**`                               |
| Admin             | 1.381        | 1.300        | privado                                                          |
| Emails            | 610          | 565          | avisos de la fase 4                                              |
| **Home**          | **375**      | **345**      | **toda la home**                                                 |
| Metadata          | 198          | 200          | título y descripción de la home                                  |
| EnglishLevels     | 158          | 160          | catálogo                                                         |
| **Nav**           | 156          | 156          | cabecera                                                         |
| NotFound          | 128          | 117          | 404                                                              |
| Agency            | 88           | 81           | placeholder de la fase 6                                         |
| **Footer**        | **47**       | **49**       | pie entero: «{brand} · Proyecto en construcción»                 |
| Common            | 22           | 23           |                                                                  |
| LocaleSwitcher    | 18           | 20           |                                                                  |

**El dato que ordena el rediseño:** el embudo del candidato descansa sobre
**375 bytes de copy en la home** y **47 en el pie**, contra **12.489 en las
oportunidades**. La página que recibe la visita de Google está prácticamente
vacía de argumento, y la que lo tiene todo es la de detrás.

---

# Parte B · Auditoría de atribuciones del namespace `Opportunities`

> Contrastado contra `docs/investigacion/ofertas-mercado.md` (14 ofertas,
> consulta 2026-08-16) y contra `src/lib/opportunities.ts`, que es de donde
> salen las cifras interpoladas.
>
> `es` y `en` se compararon clave a clave y **cifra a cifra**: **0 divergencias
> numéricas** y **0 claves desparejadas**. Todo lo que se marca abajo está mal
> **en los dos idiomas por igual**, que al menos es coherente.

## B.1 Tabla: afirmación publicada → de dónde sale → verificada

### ✅ Verificadas — trazan a una fila del informe

| Clave                                        | Afirmación publicada                                                                     | Origen real                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `subtitle`, `disclosure.source`              | «14 ofertas de Randstad, Adecco y Tempton analizadas el 2026-08-16»                      | Cabecera del informe ✅                                                  |
| `disclosure.source`                          | «suben el 1 de septiembre de 2026 y otra vez en abril de 2027»                           | §2.1: 15,33 € el 2026-09-01, 15,87 € el 2027-04-01 ✅                    |
| `agreement.body`                             | «15,33 € brutos/hora desde el 2026-09-01», «por debajo es ilegal»                        | §2.1 + `AGREEMENT_FLOOR` ✅ (matiz en B.3)                               |
| `ask.intro`                                  | «ninguna decía la jornada, ninguna el alojamiento, ninguna la duración»                  | §1 recuento: 0/14, 0/14, 0/14 ✅                                         |
| `ask.items[4]`                               | «solo 3 de las 14 daban un nivel MCER»                                                   | §1: «Nivel con escala MCER 3/14» ✅                                      |
| `warehouse.summary`                          | «el certificado de carretilla vale entre 0,50 y 1 € más por hora»                        | §2.1 regla 3 ✅                                                          |
| `warehouse.intro`                            | «Seis de las catorce son de almacén y logística»                                         | §1: R2, R4, R5, T1, T2, T3 = 6 ✅                                        |
| `warehouse.intro`                            | «Tres exigían Staplerschein y las tres pagaban por encima de producción»                 | §1: 3/14, los tres de Randstad, ≥15,69 ✅                                |
| `warehouse.conditions[1..4]`                 | pluses 4/14 · vacaciones 9/14 · pagas 8/14 · ropa y EPI 8/14                             | §2.5, fila a fila ✅                                                     |
| `logistics.intro`                            | «una agencia lo publica siempre, otra nunca y la tercera solo de gancho»                 | §1: Randstad 5/5, Tempton 0/4, Adecco 1/5 ✅                             |
| `logistics.intro`                            | «carretilla en tres de las seis ofertas de este bloque»                                  | §1 ✅                                                                    |
| `logistics.conditions[0]`                    | «rango de mínimo y máximo en 5 de las 6 ofertas que dan cifra»                           | §2.1 regla 7 ✅                                                          |
| `logistics.conditions[3]`                    | «convenio GVP/DGB citado expresamente en 12 de las 14»                                   | §2.5 fila 1: 12/14 ✅                                                    |
| `production.intro`                           | «Ocho de las catorce son de producción»                                                  | §1: R1, R3, A1–A5, T4 = 8 ✅                                             |
| `production.intro`                           | «la mejor pagada, en Hamburgo, llegaba a 24,85 €/h, con turno continuo y aptitud médica» | §1 R1 ✅                                                                 |
| `production.intro`                           | «tres de las ocho de producción no indicaban ningún nivel»                               | §1: A2, A3, A4 = 3 ✅                                                    |
| `production.conditions[4]`                   | «indefinido con la agencia en 6 de las 14, paso a plantilla en 3»                        | §2.5: 6/14 y 3/14 ✅                                                     |
| `meat-processing.intro`, `agriculture.intro` | «Ninguna de las catorce es de este sector»                                               | §1: no hay ninguna ✅                                                    |
| `logistics` salario **15,33 – 17,50**        | etiqueta «Suelo del convenio y techo observado»                                          | Suelo = convenio; techo = R4 y R5 (17,50) ✅ **La etiqueta corresponde** |
| `meat-processing`, `agriculture` salario     | «Suelo del convenio. Sin rango observado: no publicamos un techo que no hemos medido»    | Correcto y honrado ✅                                                    |

### 🔴 En rojo — cifras y etiquetas que NO corresponden con su origen

| #      | Dónde                                                                                                                                             | Lo publicado                                                                                 | Lo que dice la fuente                                                                                                                                               | Por qué es rojo                                                                                                                                                                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | `warehouse`, salario **15,50 – 18,00 €/h**, etiqueta `facts.basisObserved` = «Suelo del convenio y **techo observado** en las ofertas analizadas» | 15,50 y 18,00                                                                                | Observado con Staplerschein: **15,69 – 17,50** (§2.1). El 15,50–18,00 es la **regla 3 para escribir anuncios**, no una observación. El suelo del convenio es 15,33. | **Ni el suelo es el del convenio (15,33) ni el techo está observado (17,50 era el máximo).** Es exactamente el fallo que el PM cazó en la 4b — la etiqueta afirma una procedencia que el dato no tiene — y sobrevivió en este perfil. El comentario del código lo admite: «Se publica 15,50–18,00, la franja del informe (§2.1)». |
| **R2** | `production`, salario **15,33 – 17,00 €/h**, misma etiqueta                                                                                       | techo 17,00                                                                                  | Observado en producción sin cualificar: **14,96 – 16,50** (Dresde, R3). El 15,00–17,00 es la **regla 2 para escribir anuncios**.                                    | El techo de 17,00 **no se observó en ninguna oferta**. El suelo sí es el del convenio. Etiqueta a medias verdad.                                                                                                                                                                                                                  |
| **R3** | `warehouse`, `logistics`, `production` → `facts.perkSometimes` = **«En algunas ofertas»** en Alojamiento y Transporte                             | «Alojamiento: En algunas ofertas», «Transporte: En algunas ofertas» — vivo hoy en producción | §0: «Ninguna de las tres agencias ofrece alojamiento, ni transporte». §1: **Alojamiento 0/14, Transporte 0/14**. §2.6: «14/14 callan».                              | **La fuente dice cero y la página dice «en algunas».** Es la clase de promesa que el §5 del informe avisa que solo puede hacer la ETT que la vaya a cumplir, y aquí ni siquiera hay ETT. **El más grave de los tres.**                                                                                                            |
| **R4** | `warehouse.summary`: «**El perfil con más ofertas de la muestra**»                                                                                | warehouse es el más frecuente                                                                | Producción son **8/14**; almacén+logística juntos, 6/14. La propia ficha de producción publica el 8/14.                                                             | Dos páginas del mismo sitio se contradicen. La afirmación no traza a ninguna fila.                                                                                                                                                                                                                                                |
| **R5** | `warehouse.summary`: «**y el que mejor paga sin titulación**»                                                                                     | warehouse paga más que ningún otro sin título                                                | R1 (producción, Hamburgo) llega a **24,85 €/h** y no pide titulación reglada — lo dice la propia ficha de producción.                                               | Misma contradicción interna, y en sentido contrario al dato mejor documentado de la muestra.                                                                                                                                                                                                                                      |

### 🟡 En ámbar — correcto pero con fecha o matiz

| #      | Dónde                             | Qué                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1** | `agreement.body` + los 5 salarios | Publican **15,33 €/h** como suelo, y **hoy (2026-08-18) el suelo vigente es 14,96 €/h**: el 15,33 entra en vigor el 2026-09-01. La frase dice «desde el {date}», así que **no miente**, pero durante 14 días la cifra que preside las páginas es un suelo futuro presentado como el suelo. Fue una decisión deliberada y documentada (evita que las páginas se vuelvan falsas solas en septiembre); queda anotada, no corregida. |
| **A2** | `production.conditions[0]`        | «el suelo de la muestra coincide con el del convenio, no es casualidad» — cierto de **14,96**, que fue el suelo hasta el 2026-09-01. **Caduca ese día**: a partir de entonces el suelo de la muestra ya no coincide con el del convenio.                                                                                                                                                                                         |
| **A3** | `logistics.conditions[0]`         | «rango de mínimo y máximo en 5 de las 6 ofertas que dan cifra» — el 5/6 es de **toda la muestra**, no del bloque de logística. La frase, tal como está escrita, es correcta; leída dentro de la ficha de logística, sugiere lo contrario.                                                                                                                                                                                        |

### ✅ `es` contra `en`

```bash
node -e "…"   # aplana los dos JSON, compara claves y extrae los números de cada valor
```

- claves hoja: **448 en `es`, 448 en `en`**, 0 solo en uno.
- **0 claves de `Opportunities` con cifras distintas entre idiomas.**
- Las etiquetas de procedencia dicen lo mismo:
  `basisObserved` = «Suelo del convenio y techo observado en las ofertas
  analizadas» / «Collective agreement floor and ceiling observed in the ads
  reviewed»; `perkSometimes` = «En algunas ofertas» / «In some offers».

**Los cinco fallos rojos están idénticos en los dos idiomas.** No hay
divergencia que corregir, hay una corrección que hacer dos veces.

## B.2 La contradicción del informe de mercado — **confirmada, sigue sin corregir**

```bash
sed -n '19,20p' docs/investigacion/ofertas-mercado.md   # §0
sed -n '82p'    docs/investigacion/ofertas-mercado.md   # tabla de recuento
```

| Sitio                                  | Qué dice                                                   |
| -------------------------------------- | ---------------------------------------------------------- |
| §0, líneas 19–20                       | «**Ocho** de las catorce exigen alemán de forma explícita» |
| §1 «El recuento que importa», línea 82 | «Idioma exigido \| **11 / 14** \| 3 / 14»                  |

**Sigue ahí.** Ya está resuelta a favor del **11** (5 de Randstad, A1 y A5 de
Adecco, 4 de Tempton; las mudas son A2, A3 y A4), y el código lo refleja: el
comentario de `germanLevel` en `src/lib/opportunities.ts` dice «11 de 14 ofertas
exigen alemán y solo 3 lo miden con la escala MCER». Y la ficha de producción
publica «tres de las ocho de producción no indicaban ningún nivel», que **solo
cuadra con el 11**. El único sitio que sigue diciendo ocho es el §0.
**Anotado, no arreglado.**

## B.3 Textos que caducan el **2026-09-01**, con sus claves exactas

Ese día el convenio de la Zeitarbeit sube y el suelo publicado deja de ser
futuro para ser presente.

> ⚠️ **El prompt de esta auditoría dice que ese día sube «de 15,33 a 15,87 €/h».
> No es así.** El informe (§2.1) y `src/lib/opportunities.ts` coinciden: 14,96 €
> desde 2026-01-01, **15,33 € desde 2026-09-01**, y **15,87 € desde
> 2027-04-01**. Son dos revisiones con fecha, no una.

### En `messages/{es,en}.json`

| Clave                                                  | Qué caduca                                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Opportunities.agreement.body`                         | «{amount} brutos por hora desde el {date}» → interpola 15,33 / 2026-09-01. Correcta el 2026-09-01; **falsa el 2027-04-01**                  |
| `Opportunities.disclosure.source`                      | «Los salarios del sector **suben el 1 de septiembre de 2026** y otra vez en abril de 2027» → en futuro. **El 2026-09-01 pasa a ser pasado** |
| `Opportunities.profiles.meat-processing.conditions[0]` | «Suelo del convenio de la Zeitarbeit: {floor} desde el {floorDate}»                                                                         |
| `Opportunities.profiles.agriculture.conditions[0]`     | ídem, con la coletilla «siempre que quien contrate sea una ETT»                                                                             |
| `Opportunities.profiles.production.conditions[0]`      | «el suelo de la muestra coincide con el del convenio» → **deja de ser cierto el 2026-09-01** (ámbar A2)                                     |
| `Opportunities.facts.basisObserved` / `basisAgreement` | etiquetas, sin cifra: no caducan por fecha, pero son las que R1/R2 ponen en duda                                                            |

### En `src/lib/opportunities.ts` — **aquí están las cifras de verdad**

| Símbolo                                            | Valor hoy                                | Cuándo caduca                     |
| -------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| `AGREEMENT_FLOOR`                                  | `{ amount: 15.33, since: '2026-09-01' }` | 2027-04-01 → 15,87                |
| `OPPORTUNITY_PROFILES[warehouse].salary.min`       | 15.5                                     | ver **R1**                        |
| `OPPORTUNITY_PROFILES[logistics].salary.min`       | 15.33                                    | 2027-04-01                        |
| `OPPORTUNITY_PROFILES[production].salary.min`      | 15.33                                    | 2027-04-01                        |
| `OPPORTUNITY_PROFILES[meat-processing].salary.min` | 15.33                                    | 2027-04-01                        |
| `OPPORTUNITY_PROFILES[agriculture].salary.min`     | 15.33                                    | 2027-04-01                        |
| `OPPORTUNITY_SOURCE_DATE`                          | `'2026-08-16'`                           | cuando se rehaga la investigación |

**Cinco claves de copy y siete constantes de código**, en dos idiomas. La
revisión de septiembre es una tarea con fecha, y esta es su lista.

## B.4 Randstad, Adecco y Tempton, nombrados en producción

`Opportunities.disclosure.source` los cita por su nombre en `es` y en `en`, y
está **vivo en las 12 páginas de oportunidad** (`MarketDisclosure` se renderiza
tanto en el listado como en cada ficha). No es un hallazgo de la auditoría —
`ESTADO.md` punto 4 ya lo plantea como decisión pendiente de Ulises — pero
conviene saber que **el alcance es cada página del embudo, no solo el listado**.
