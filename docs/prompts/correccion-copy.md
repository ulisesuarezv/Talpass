# PROMPT — Corrección del copy falso en las páginas de oportunidades

> Pegar en una sesión nueva y limpia. Es una sesión **corta y quirúrgica**: no construye nada, corrige cinco afirmaciones que hoy están vivas en producción y las redespliega. No es el rediseño, y no lo empieza.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/ESTADO.md` (empieza por el bloque del 2026-08-18, arriba del todo), `docs/CONVENTIONS.md`, el informe `docs/investigacion/ofertas-mercado.md` y —esto es el corazón de la tarea— **`docs/evidencia/auditoria-previa/04-superficie-copy.md`, sección B.1**, que es la tabla que enumera lo que hay que corregir con su origen al lado.

Tu tarea es el **punto 2 del orden acordado**: corregir el copy que no traza a su fuente y redesplegar. Nada más.

## 0. Por qué esto va antes que el rediseño

Las cinco páginas de oportunidad son, desde el 2026-08-17, lo único indexable que tiene este proyecto: 7 URLs en el sitemap y el primer contenido que Google ha visto nunca. La auditoría del 2026-08-18 encontró que **cinco afirmaciones publicadas no salen de donde dicen salir**. Un proyecto cuya propuesta entera es «aquí no te mienten» no puede pasar a trabajar la credibilidad visual mientras el texto miente. Se arregla el texto primero.

**No estás juzgando si las cifras venden.** Esa decisión ya está tomada, con fecha, y está abajo. Estás haciendo que cada número de la página trace a una fila del informe.

## 1. Entorno y límites

```bash
pnpm db:start
pnpm dev:local
```

Trabajas **contra la base local** (ADR-17). **Nada de escrituras contra la base de producción.** Esta corrección no toca la base de datos en absoluto: son constantes de TypeScript y cadenas de `messages/`. Si te ves escribiendo una migración, párate: te has salido de la tarea.

**El despliegue sí es tuyo**, igual que en la 4b, y la corrección no está hecha hasta estar viva en `https://talpass.eu`. Recuerda que **este proyecto de Vercel no tiene integración con GitHub**: un `git push` no despliega nada.

## 2. Las decisiones de Ulises, del 2026-08-19 — no las reabras

Estas dos las tomó Ulises después de leer la auditoría. Son entradas de la tarea, no preguntas.

### 2.1 Los salarios pasan a ser **rango observado puro**

Se abandona la fórmula «suelo del convenio + techo observado». **Los dos extremos de cada rango salen de las ofertas analizadas**, y la etiqueta lo dice así de claro. El suelo del convenio no desaparece de la página: sigue en el bloque `Opportunities.agreement`, que es su sitio.

Para `warehouse`, `logistics` y `production`, **deriva `min` y `max` del informe, no de este prompt**: §1 y §2.1 de `docs/investigacion/ofertas-mercado.md`, y en el comentario de cada perfil deja **los identificadores de las ofertas** (R1, R2, R4, R5, A1…, T1…) de las que sale cada extremo. La auditoría apunta que en almacén el observado con Staplerschein es **15,69 – 17,50** y en producción sin cualificar **14,96 – 16,50**; **compruébalo contra el informe antes de escribirlo** y corrígeme si el informe dice otra cosa. `logistics` está hoy en 15,33 – 17,50 y su suelo era el del convenio: bajo la regla nueva **también le toca revisión**, porque su mínimo tiene que ser observado.

`meat-processing` y `agriculture` **no se tocan**: no tienen rango observado, publican solo el suelo del convenio con la etiqueta `basisAgreement`, y eso ya es correcto y honrado.

Reescribe `Opportunities.facts.basisObserved` en `es` y en `en` para que diga lo que ahora es cierto —el rango es lo observado en las ofertas analizadas, con su fecha— y **no mencione el suelo del convenio**, porque ya no lo usa.

### 2.2 Alojamiento y transporte **se quedan como están**

`housing: 'sometimes'` y `transport: 'sometimes'` en `warehouse`, `logistics` y `production` **no se corrigen**. Lo decidió Ulises el 2026-08-19 a sabiendas de que la fuente dice 0/14 y 14/14 callan (auditoría, hallazgo R3), porque estas páginas son un reclamo temporal para captar las primeras 30 personas.

**No lo cambies, no lo discutas y no gastes tiempo en ello.** Lo único que sí haces: dejar un comentario junto a esos tres pares de campos en `src/lib/opportunities.ts` que diga en una línea que el dato de la muestra es 0/14 y que la publicación de `'sometimes'` es una decisión de Ulises del 2026-08-19 pendiente de revisar. Que quien lo lea dentro de un mes no lo tome por un descuido.

## 3. Lo que hay que corregir, y su criterio

Cada punto se da por hecho cuando la afirmación publicada traza a una fila del informe que puedas citar.

| #      | Fichero                                 | Qué está mal                                                                                                     | Criterio                                                                                                                              |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | `src/lib/opportunities.ts`              | `warehouse` publica 15,50 – 18,00 como «techo observado»; 18,00 sale de una regla de redacción, no de una oferta | El rango es el observado, con las ofertas citadas en el comentario                                                                    |
| **R2** | `src/lib/opportunities.ts`              | `production` publica techo 17,00, que no se observó en ninguna oferta                                            | Ídem                                                                                                                                  |
| —      | `src/lib/opportunities.ts`              | `logistics` tiene suelo de convenio bajo etiqueta de observado (ver 2.1)                                         | Ídem                                                                                                                                  |
| —      | `messages/{es,en}.json`                 | `facts.basisObserved` describe una fórmula que ya no se usa                                                      | La etiqueta describe exactamente lo que hay debajo                                                                                    |
| **R4** | `messages/{es,en}.json`                 | `profiles.warehouse.summary`: «el perfil con más ofertas de la muestra»                                          | Falso: producción es 8/14, almacén+logística 6/14, y la ficha de producción publica el 8/14. **Dos páginas del sitio se contradicen** |
| **R5** | `messages/{es,en}.json`                 | `profiles.warehouse.summary`: «y el que mejor paga sin titulación»                                               | Falso: R1 (producción, Hamburgo) llega a 24,85 €/h sin titulación reglada, y lo publica la propia ficha de producción                 |
| **B2** | `docs/investigacion/ofertas-mercado.md` | §0 dice «ocho de las catorce exigen alemán»; §1 dice 11/14                                                       | Ya está resuelto a favor del **11** (auditoría B.2). Corrige el §0, que es el único sitio que sigue diciendo ocho                     |

Sobre R4 y R5: el `summary` de almacén tiene que **seguir vendiendo el perfil**, no quedarse en un hueco. El dato del certificado de carretilla —entre 0,50 y 1 € más por hora— está **verificado** (§2.1, regla 3) y es el mejor argumento que tiene esa ficha. Construye el `summary` sobre lo que sí traza, y **verifica contra el informe cada frase nueva que escribas**, incluida cualquiera que reaproveches del `intro`.

## 4. La trampa que crea la regla nueva — resuélvela, no la ignores

Con rango observado puro, **producción arranca en 14,96 €/h**, y el **2026-09-01 —dentro de menos de dos semanas— el suelo legal del convenio pasa a 15,33 €/h**. Ese día la misma página enseñará un mínimo por debajo del suelo legal, junto a un bloque que anuncia el suelo de 15,33. A ojos de un candidato eso parece una contradicción, y a ojos de un inspector parece otra cosa.

No es una mentira —es lo observado el 2026-08-16 y la página publica su fecha de consulta—, pero **tiene que leerse como lo que es**. Resuélvelo en el copy: que la ficha deje explícito que el rango es lo medido en la muestra en esa fecha y que el suelo legal manda por encima. Es una frase, y decides tú dónde vive.

Y **déjalo anotado como tarea con fecha** en `docs/ESTADO.md`: el 2026-09-01 hay que revisar los textos de B.3 de la auditoría, y ahora ese punto incluye el mínimo de producción.

## 5. Hecho cuando

- Cada cifra publicada en `src/lib/opportunities.ts` tiene, en el comentario de su perfil, **las ofertas del informe de las que sale**.
- `messages/es.json` y `messages/en.json` siguen con **el mismo número de claves hoja** y **sin ninguna cifra que difiera entre idiomas**. La auditoría lo comprobó con un script en B.1 («448 y 448, 0 divergencias»); **vuelve a pasarlo y deja la salida**.
- Ninguna página contradice a otra: almacén ya no dice ser el perfil más frecuente ni el mejor pagado, y producción sigue publicando su 8/14 y su 24,85.
- Cero texto en el JSX: todo el copy desde `messages/`, en `es` y `en`.
- `pnpm typecheck`, `lint`, `format:check` limpios. `test:security` y `:drill` en verde — esta corrección no toca la base, así que si algo se mueve ahí, párate y explica por qué.
- `next build`: las oportunidades siguen `●`, las privadas siguen `ƒ`.
- **`grep -ri "JobPosting"` sobre el HTML generado de `/oportunidades` no devuelve nada.** Sigue siendo la regla que define esta sección (ADR-30) y una corrección de copy no puede haberla roto.

**Y contra `https://talpass.eu`, después de desplegar — no está hecho hasta aquí:**

- Las cifras nuevas se leen en el HTML de producción **sin ejecutar JavaScript**, en `es` y en `en`.
- `/es/oportunidades`: `x-nextjs-cache: HIT`, **sin** `x-ett-session-checked` ni `Set-Cookie` (ADR-11, ADR-13).
- Cero `JobPosting` en el HTML de producción de una ficha.
- Anota el **ID del despliegue** en la evidencia, y confirma que estás mirando el despliegue nuevo antes de dar por buena una cabecera. En este proyecto ya se dio por desplegado algo que estaba solo en `origin`.

Deja la evidencia en `docs/evidencia/correccion-copy/`, con la tabla B.1 de la auditoría **rellenada de nuevo**: la misma estructura, columna «lo publicado» actualizada, y las filas que estaban en rojo o bien en verde o bien —el caso de R3— marcadas como **decisión consciente con su fecha**. No inventes una tabla nueva; rellena esa.

## 6. Fuera de alcance — anotar, no hacer

- **El rediseño de credibilidad.** Esta sesión no toca ni un componente visual.
- **Los textos legales** y su ruta. Son el punto 3 del orden y tienen su propia sesión.
- **La región de las funciones** (`iad1`), las dos variables de Vercel y `db:push:prod` de la verificación. Punto 4, y hay decisiones de Ulises por delante.
- **Los metadatos de `(auth)`** y el `<terms>` en negrita del registro. Caen en el rediseño y en los legales.
- **Los ámbar A1, A2 y A3** de la auditoría. Quedan anotados con fecha, no corregidos, salvo lo que la sección 4 te obliga a tocar.

## 7. Al cerrar

Registra en `docs/00-PROJECT.md` un **ADR-31** —la última es la 30— con la regla nueva: cómo se publica un rango salarial en las páginas de oportunidad y por qué se abandonó la fórmula mixta. Es la clase de regla que la próxima investigación de mercado necesitará leer.

**La decisión de alojamiento y transporte (2.2) no es un ADR**: un ADR es una regla que se sigue, y esto es una excepción temporal. Va en `docs/ESTADO.md`, con fecha, con el dato de la fuente al lado y con quién la tomó.

Actualiza `docs/ESTADO.md`: tacha el punto 2 del orden acordado, deja el punto 3 (los legales) como lo siguiente, y escribe qué debe saber la sesión que venga detrás.
