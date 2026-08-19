# PROMPT — Textos legales, su ruta y el consentimiento que hoy se pide en falso

> Pegar en una sesión nueva y limpia. Es el **punto 3** del orden acordado del 2026-08-18. El punto 2 (corrección del copy) está cerrado y desplegado: `docs/evidencia/correccion-copy/`, ADR-31.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/ESTADO.md` (empieza por el bloque del 2026-08-18), `docs/00-PROJECT.md` (ADR-01…31, y con atención **ADR-18** sobre consentimientos y **ADR-25** sobre el registro de aperturas), `docs/01-DATA-MODEL.md` (las tablas de consentimiento y todo lo que se guarda de una persona), `docs/CONVENTIONS.md`, y el hallazgo 3 de `docs/evidencia/auditoria-previa/00-resumen.md`.

Tu tarea: **publicar los textos legales, darles ruta, y hacer que el consentimiento que se pide en el registro sea real.**

## 0. Por qué esto es lo siguiente

Hoy, en producción, el formulario de registro tiene una casilla obligatoria que dice «He leído y acepto los Términos de uso y la Política de Privacidad», y **esos documentos no existen**: `/es/privacidad`, `/es/terminos` y `/es/legal` son 404. La casilla no los enlaza siquiera — `src/components/auth/signup-form.tsx:82` renderiza el marcador `<terms>` como `<strong>`, así que el texto va **en negrita en vez de en un enlace**. Y `src/config/legal.ts` versiona cuatro documentos con fecha `2026-08-14` que no están en el repositorio.

Eso es un consentimiento pedido en falso. No es un trámite pendiente: es la base legal con la que este proyecto guarda un DNI, un IBAN y una grabación de voz. Sin texto no hay consentimiento informado, y sin consentimiento informado el tratamiento no tiene base.

Y hay una segunda razón, la del 2026-08-18: **un candidato no tiene hoy con qué decidir que esto no es un fraude.** No hay una cara, ni un nombre, ni una dirección. Un Impressum con nombre y domicilio reales es la prueba de existencia más barata y más creíble que puede dar un proyecto nuevo. Por eso los legales salieron de la fase 9 y entraron aquí.

## 1. Entorno y límites

```bash
pnpm db:start
pnpm dev:local
```

Contra la base local (ADR-17). **Nada de escrituras contra la base de producción.**

**El despliegue es tuyo**, y esto no está hecho hasta estar vivo en `https://talpass.eu`. Recuerda: **este proyecto de Vercel no tiene integración con GitHub**, un `git push` no despliega nada. Y en producción **`x-nextjs-cache` no existe**: Next 16 sobre Vercel lo expresa como `x-vercel-cache` + `x-nextjs-prerender: 1`. Está razonado en `docs/evidencia/correccion-copy/02-produccion.md`; no lo redescubras.

## 2. El responsable del tratamiento — datos reales, dados por Ulises el 2026-08-19

```
Nombre:     José Ulises Suárez Victoria
NIF:        50232706S
Domicilio:  Theodor-Heuss-Straße 16, 37075 Göttingen, Alemania
Contacto:   kayaosv@gmail.com
```

**Persona física, no sociedad.** Es el responsable del tratamiento a efectos del RGPD y el titular del sitio. **Los cuatro campos están completos y confirmados por Ulises el 2026-08-19: no falta nada y nada bloquea el despliegue.** Cópialos literalmente, con la `ß` y con la diéresis — un Impressum con la dirección mal escrita no cumple.

El contacto es una cuenta personal de Gmail y **vale**: el §5 DDG pide una vía directa y rápida, no un dominio propio. Cuando `talpass.eu` tenga buzón, esto se cambia en un solo sitio — **por eso va en configuración y no repetido por el copy**. Y cuenta con que una dirección publicada en un Impressum **se acaba llenando de spam**: es el precio del documento, no un problema que resuelvas aquí.

### 2.1 Precisiones que Ulises ya conoce, para que no las redescubras

- El responsable **reside en Alemania**, así que el documento que manda es un **Impressum (§5 DDG)**, no un aviso legal español. Nombre completo, dirección postal completa y contacto directo.
- **El NIF español no es lo que pide un Impressum.** Ahí se publica la **USt-IdNr** y solo si se tiene. Incluir el NIF es correcto para el lado español y para identificar al responsable en la política de privacidad; **no sustituye** a nada del Impressum. Si no hay USt-IdNr, no se inventa y no se pone.
- El nombre y el dominio de marca **siguen viniendo de config e i18n** (regla no negociable de `CLAUDE.md`). Los datos del responsable son de la persona, no de la marca: **van en su propio módulo de configuración**, no rociados por el copy.

## 3. Los cuatro documentos

`src/config/legal.ts` ya nombra exactamente cuatro, y esa lista manda: `terms`, `privacy`, `data_sharing`, `audio_sharing`. Tres son obligatorios en el registro y `audio_sharing` es opcional y retirable (ADR-18).

**No inventes el contenido a partir de una plantilla genérica.** Este proyecto tiene el schema documentado: `docs/01-DATA-MODEL.md` dice qué campos existen, quién los ve y con qué política. **La política de privacidad se escribe leyendo eso**, y tiene que responder, con lo que el código hace de verdad:

- **Qué se recoge**: identidad, documentos, IBAN, dirección, teléfono, email, grabaciones de voz.
- **Para qué y con qué base jurídica**, documento a documento.
- **Quién lo ve**: que la bolsa es **seudonimizada** y que una ETT no ve documentos, IBAN, dirección, email ni teléfono **sin consentimiento explícito para esa ETT concreta** — es la regla no negociable del proyecto y es el argumento de confianza más fuerte que tiene. Dilo en la política, no solo en el marketing.
- **Dónde se guarda**: Supabase, región UE (ADR-09). ⚠️ **Y aquí hay un problema abierto**: la auditoría encontró que las funciones se ejecutan en `iad1` (Washington), así que hoy un documento subido **transita por Estados Unidos** (ADR-29 lo hace pasar por el servidor). Es el punto 4 del orden y **no lo arreglas tú**. Lo que sí haces: **no escribir en la política que los datos no salen de la UE mientras eso no sea cierto**, y dejarlo anotado en `ESTADO.md` como dependencia entre los dos puntos. No publiques una promesa que el despliegue de hoy incumple.
- **Cuánto tiempo** se conservan y **cómo se ejerce** acceso, rectificación, supresión, portabilidad y retirada del consentimiento — y **desde dónde se hace en el producto**, no solo un email.
- **Que al candidato no se le cobra nunca** (regulación UE, regla no negociable).
- **Las aperturas de documentos quedan registradas** con IP y user-agent (ADR-25). Es un dato a favor: dilo.

Cada documento abre diciendo **de qué fecha es su versión**, y esa fecha tiene que ser la de `CONSENT_VERSIONS`.

### 3.1 Que digan lo que son

Los cuatro llevan, visible y no en letra pequeña, que **son textos redactados por el responsable y no un dictamen jurídico**. Es cierto, y ocultarlo sería la misma clase de fallo que esta sesión viene a arreglar: un proyecto que vende transparencia no puede fingir un sello que no tiene.

Lo que **no** escribes es que estén «pendientes de revisión» ni ninguna fórmula que sugiera que el sitio aún no está operativo. Ulises decidió el 2026-08-19 que la captación no espera a una revisión legal, y esa es su llamada: los textos salen tal cual, publicados y en vigor.

## 4. La ruta

Rutas **públicas** y por tanto **estáticas**: `x-vercel-cache` cacheado, `x-nextjs-prerender: 1`, **sin tocar la sesión** — ni proxy de sesión ni lectura de cookies en servidor (ADR-11, ADR-13, regla no negociable). Es exactamente el patrón de `/oportunidades`; cópialo.

Los slugs se localizan en `src/i18n/routing.ts`, como todo lo demás. `es` y `en`, con `hreflang` recíproco y `x-default`. **Decide tú la forma** —una ruta por documento, o un `/[documento]` bajo un prefijo común— y razónalo en el commit; lo que no es negociable es que las cuatro sean direcciones estables y enlazables, porque el consentimiento apunta a ellas.

**Metadatos propios en cada una**: título, descripción y canónica. La auditoría encontró que las páginas de `(auth)` sirven el título y la descripción **de la home**; no repitas ese fallo aquí. Las de `(auth)` son del rediseño, no de esta sesión.

Enlazadas desde el pie en todas las páginas públicas, y el Impressum **también desde la home**: es su función.

## 5. El consentimiento, que es la parte que de verdad importa

- **`src/components/auth/signup-form.tsx:82`**: `terms: (chunks) => <strong>{chunks}</strong>` pasa a ser un **enlace real** a los documentos, que abre sin perder lo que la persona ya haya escrito en el formulario.
- **Un enlace por documento.** Hoy una sola frase cubre dos textos y una sola casilla cubre tres consentimientos. Revísalo contra ADR-18: el RGPD pide consentimiento **específico**, y meter `data_sharing` dentro de un «acepto los términos» genérico es justo lo que no vale. Si eso obliga a separar casillas, sepáralas — pero **mide antes cuánta fricción añade** al registro desde el móvil, que es el embudo real, y déjalo escrito.
- **`audio_sharing` es opcional y retirable** (ADR-18): comprueba que se puede retirar de verdad desde la cuenta, y si no se puede, **anótalo, no lo construyas aquí**.
- **Las versiones de `src/config/legal.ts` tienen que corresponder con textos que existen.** Hoy dicen `2026-08-14` y no hay documento. Si el texto que publicas es nuevo, la versión es la fecha de hoy, no una heredada. **Y comprueba qué pasa con las filas de consentimiento que ya existen en la base local con la versión vieja**: decide y documenta si valen o si hay que volver a pedirlo. Es una decisión de producto con consecuencia legal — razónala en `ESTADO.md` y déjasela vista a Ulises.

## 6. Hecho cuando

- Los cuatro documentos existen, en `es` y en `en`, con su fecha de versión y su aviso de revisión pendiente.
- **Cero texto en el JSX**: todo el copy desde `messages/`. Si los documentos son largos y `messages/` deja de ser el sitio razonable, **propón la alternativa y razónala** — no la impongas en silencio.
- Paridad `es`/`en`: reutiliza `docs/evidencia/correccion-copy/parity.mjs`, no escribas otro script. Deja la salida.
- El registro enlaza los documentos, se abren, y **el alta completa sigue funcionando end-to-end desde el móvil (390×844)**.
- Los datos del responsable salen de un módulo de configuración, no del copy suelto.
- `pnpm typecheck`, `lint`, `format:check` limpios. `test:security` y `:drill` en verde.
- `next build`: las rutas legales son `●`; las privadas siguen `ƒ`.
- **`grep -ri "JobPosting"` sobre el HTML de `/oportunidades` sigue devolviendo cero** (ADR-30).

**Y contra `https://talpass.eu`, después de desplegar:**

- Las cuatro rutas responden **200** en `es` y `en` y se leen **sin ejecutar JavaScript**.
- `x-vercel-cache` cacheado + `x-nextjs-prerender: 1`, **sin** `x-ett-session-checked` ni `Set-Cookie`. Control negativo: `/es/cuenta` sigue con su 307 y **con** `x-ett-session-checked: 1`.
- `/sitemap.xml` las incluye — hoy son **7 URLs**; anota cuántas quedan.
- El Impressum publicado enseña **nombre, dirección completa con código postal y contacto**. Los cuatro campos están dados y confirmados: si algo no cuadra, es un fallo tuyo de transcripción, no un dato que falte.
- Anota el **ID del despliegue** y confirma que miras el nuevo antes de dar por buena una cabecera.

Evidencia en `docs/evidencia/textos-legales/`.

## 7. Fuera de alcance — anotar, no hacer

- **La región `iad1`.** Es el punto 4 del orden y toca configuración de despliegue. Aquí solo condiciona **lo que la política puede prometer** (sección 3).
- **Las dos variables de Vercel** (`RESEND_API_KEY`, `EMAIL_FROM`) y el `db:push:prod` de la verificación. Punto 4.
- **El rediseño de credibilidad** y los metadatos de `(auth)`. Punto 6.
- **El campo de sector/ciudad de destino en el onboarding.** Punto 5.
- **Un formulario de contacto, un panel de cookies o un banner de consentimiento.** Comprueba si el sitio pone cookies que no sean estrictamente necesarias; **si no las pone, dilo en la política y no montes banner**. Si las pone, **anótalo** — es su propia tarea.

## 8. Al cerrar

Si tomas decisiones estructurales —cómo se versiona un texto legal, cómo se separan los consentimientos— van como **ADR-32 en adelante**; la última es la 31. Actualiza `docs/02-ROADMAP.md`, que todavía tiene los legales como fase 9, y `docs/ESTADO.md`: tacha el punto 3, deja el 4 como lo siguiente, y escribe qué debe saber la sesión que venga detrás.

**Y no des por hecho lo que no hayas medido.** En este proyecto ya se marcó una fase ✅ con el criterio sin comprobar y hubo que revertirlo, y una auditoría encontró escrita la frase «Git y producción quedan sincronizados» cuando `origin` iba cuatro commits por detrás.
