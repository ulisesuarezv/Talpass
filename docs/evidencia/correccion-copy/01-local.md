# 01 · La corrección, verificada en local

**Sesión del 2026-08-19.** Punto 2 del orden acordado de `docs/ESTADO.md`:
corregir el copy que no traza a su fuente. No se ha tocado ni un componente
visual, ni la base de datos, ni una migración.

## Qué se ha cambiado, y nada más

| Fichero                                                           | Cambio                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/lib/opportunities.ts`                                        | Rangos de `warehouse`, `logistics` y `production`, comentarios con las ofertas de origen y la nota de R3  |
| `messages/es.json`, `messages/en.json`                            | 4 claves: `facts.basisObserved`, `warehouse.summary`, `production.summary`, `production.conditions[0]`    |
| `src/app/[locale]/(public)/opportunities/[country]/[sector]/page` | Interpola `OPPORTUNITY_SOURCE_DATE` en la etiqueta de base y en las condiciones. **Cero texto en el JSX** |
| `docs/00-PROJECT.md`                                              | **ADR-31**                                                                                                |
| `docs/ESTADO.md`                                                  | Punto 2 tachado, la excepción de R3 fechada y la tarea del 2026-09-01                                     |

## Los rangos nuevos, y de qué oferta sale cada extremo

| Perfil            | Antes         | Ahora             | Suelo sale de                            | Techo sale de   |
| ----------------- | ------------- | ----------------- | ---------------------------------------- | --------------- |
| `warehouse`       | 15,50 – 18,00 | **15,69 – 17,50** | R2, R4 y R5 (las tres arrancan en 15,69) | R4 y R5 (17,50) |
| `logistics`       | 15,33 – 17,50 | **15,69 – 17,50** | R2, R4 y R5                              | R4 y R5         |
| `production`      | 15,33 – 17,00 | **14,96 – 16,50** | R3, Dresde                               | R3, Dresde      |
| `meat-processing` | desde 15,33   | _sin tocar_       | convenio (`basisAgreement`)              | —               |
| `agriculture`     | desde 15,33   | _sin tocar_       | convenio (`basisAgreement`)              | —               |

**Comprobado contra el informe, no contra el prompt.** El prompt apuntaba
15,69 – 17,50 en almacén y 14,96 – 16,50 en producción, y el informe lo
confirma: §1 (R2 15,69–16,21 · R4 15,69–17,50 · R5 15,69–17,50 · R3
14,96–16,50) y la tabla de rangos observados del §2.1. **No hubo que corregir al
prompt en ninguna cifra.**

Tres cosas que el prompt dejaba abiertas y las resolvió el informe:

1. **`logistics` acaba idéntico a `warehouse`.** Su bloque son seis ofertas
   —R2, R4, R5, T1, T2, T3— y **solo las tres de Randstad dan cifra**: Tempton
   es 0/4 con salario (§1). No hay otro rango observado que publicar. Queda
   escrito en el comentario del perfil para que no parezca un copiar y pegar.
2. **R1 (Hamburgo, 19,31 – 24,85) queda fuera del rango de producción.** Es
   Vollkonti con aptitud médica en cliente industrial grande: otra franja (§2.1,
   regla 4). Se publica donde ya estaba, en `production.intro`, y ahora también
   en `production.summary`, para que ninguna página se calle lo que la otra dice.
3. **Las reglas 2 y 3 del §2.1 no son fuente de nada.** Son consejos para
   redactar anuncios sin delatarse. De ahí salían el 18,00 y el 17,00 que la
   auditoría cazó como R1 y R2.

## R4 y R5 — la contradicción entre dos páginas del sitio, resuelta

`warehouse.summary` decía **«El perfil con más ofertas de la muestra y el que
mejor paga sin titulación»**. Las dos mitades eran falsas y las dos las
desmentía la ficha de producción, que publica 8/14 y 24,85 €/h.

Ahora dice, en `es`: _«Las tres ofertas de la muestra que exigían certificado de
carretilla pagaban por encima de la franja de producción sin cualificar: el
certificado vale entre 0,50 y 1 € más por hora.»_

Cada mitad, verificada contra el informe:

| Afirmación                                          | Origen                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| «tres ofertas exigían certificado de carretilla»    | §1, recuento: Carné/certificado **3/14**, los tres de Randstad ✅          |
| «pagaban por encima de la franja de producción»     | R2/R4/R5 arrancan en 15,69; producción sin cualificar, 14,96–16,50 (§1) ✅ |
| «el certificado vale entre 0,50 y 1 € más por hora» | §2.1, regla 3: «vale en torno a 0,50–1,00 € la hora» ✅                    |

`production.summary` también se reescribió. Decía **«el que más se ensancha por
arriba»**, y con el rango nuevo —14,96 – 16,50, el más estrecho de los tres— eso
se leía al revés de lo que es. Ahora nombra la cifra: 24,85 €/h en Hamburgo, con
turno continuo y aptitud médica (R1, §1). Sigue vendiendo el perfil y ya no
depende de una comparación que la página no enseña.

## La etiqueta de procedencia, reescrita

Ya no menciona el suelo del convenio, porque el rango ya no lo usa:

- `es`: «Rango observado: los dos extremos salen de las ofertas analizadas el
  {date}, no de una franja recomendada.»
- `en`: «Observed range: both ends come from the ads reviewed on {date}, not
  from a recommended band.»

`{date}` se interpola desde `OPPORTUNITY_SOURCE_DATE`: la fecha vive en un solo
sitio y caduca el día que se rehaga la investigación. `basisAgreement` no se
toca — la auditoría ya la daba por correcta.

## La trampa del 2026-09-01, resuelta en el copy

Producción arranca en 14,96 €/h y el 2026-09-01 el suelo legal pasa a 15,33. La
frase vive en `production.conditions[0]`, que es donde el lector está mirando la
cifra:

> Salario por hora y bruto. El rango publicado es lo medido en las ofertas de
> producción sin cualificar el 16 de agosto de 2026: la mejor pagada de la
> muestra, con turno continuo y aptitud médica, queda fuera de esa franja y se
> explica arriba. Y por encima de lo medido manda siempre el suelo del convenio,
> 15,33 € brutos por hora desde el 1 de septiembre de 2026: por debajo de esa
> cifra ninguna oferta puede pagarte.

De paso mata el ámbar **A2** («el suelo de la muestra coincide con el del
convenio»), que caducaba ese mismo día y ocupaba esa misma línea. Las cifras se
interpolan desde `AGREEMENT_FLOOR` y `OPPORTUNITY_SOURCE_DATE`: en el JSON no
hay ni un número.

**Anotado con fecha** en `docs/ESTADO.md`, bloque «🗓️ Tarea con fecha:
2026-09-01», junto al resto de la lista de B.3.

## B.2 — ya estaba corregido

```bash
git log --oneline -1 -- docs/investigacion/ofertas-mercado.md   # a71fba5
sed -n '17,26p' docs/investigacion/ofertas-mercado.md
```

El §0 dice **«Once de las catorce exigen alemán de forma explícita»**, con la
nota «Corregido el 2026-08-18» debajo. Lo arregló el propio commit de la
auditoría (`a71fba5`), posterior a la medición que dejó escrito el hallazgo.
**No había nada que hacer.**

## R3 — decisión consciente, anotada junto al código

`housing: 'sometimes'` y `transport: 'sometimes'` **siguen igual** en los tres
perfiles, por decisión de Ulises del 2026-08-19. Los tres llevan ahora este
comentario encima:

```ts
// ⚠️ La muestra dice alojamiento 0/14 y transporte 0/14, y 14/14 callan
// (informe §0, §1 y §2.6). Publicar 'sometimes' es una decisión de Ulises
// del 2026-08-19 —reclamo temporal para captar las primeras 30 personas—,
// no un descuido: hallazgo R3 de la auditoría, pendiente de revisar.
```

## Paridad `es` / `en` — el script de B.1, vuelto a pasar

```
$ node docs/evidencia/correccion-copy/parity.mjs
claves hoja: es=448 en=448
solo en es: 0
solo en en: 0
divergencias numéricas: 0
```

Mismo criterio que la auditoría: aplana los dos JSON, compara el conjunto de
claves hoja y extrae los números de cada valor normalizando la coma decimal
española. **448 y 448, 0 divergencias**, igual que en la línea base. El script
queda en esta carpeta para que la próxima sesión de copy no lo reinvente.

## Comprobaciones

```
$ pnpm typecheck        # tsc --noEmit, limpio
$ pnpm lint             # eslint, limpio
$ pnpm format:check     # All matched files use Prettier code style!
$ pnpm test:security    # 64 comprobaciones superadas
$ pnpm test:security:drill
                        # la batería caza las cuatro políticas rotas;
                        # «todo restaurado y en verde»
```

**Los 64 siguen siendo 64.** Esta corrección no toca la base de datos: no hay
migración y no se ha escrito schema, así que no había nada que empujar ni que
comparar.

## `next build`

```
├   /[locale]/opportunities
│ ├ ● /es/opportunities                       1h  1y
│ └ ● /en/opportunities                       1h  1y
├   /[locale]/opportunities/[country]/[sector]
│ ├ ● /es/opportunities/alemania/almacen      1h  1y
│ ├ ● /es/opportunities/alemania/logistica    1h  1y
│ ├ ● /es/opportunities/alemania/produccion   1h  1y
│ └ ● [+7 more paths]
...
├ ƒ /[locale]/account   ├ ƒ /[locale]/admin   ├ ƒ /[locale]/admin/[candidateId]
├ ƒ /[locale]/agency    ├ ƒ /[locale]/onboarding
├ ƒ /api/auth/callback  ├ ƒ /api/documents/[id]
```

Las 12 páginas de oportunidad siguen `●`; las privadas, `ƒ`.

## Cero `JobPosting` en el HTML construido (ADR-30)

```bash
grep -ri "JobPosting" .next/server/app/{es,en}/opportunities.html \
                      .next/server/app/{es,en}/opportunities/
# salida vacía, exit=1 → ni una coincidencia
```

## Las cifras, leídas del HTML estático

| Página                                     | Salario                    | Etiqueta                                  |
| ------------------------------------------ | -------------------------- | ----------------------------------------- |
| `es/oportunidades/alemania/almacen`        | 15,69 € – 17,50 € por hora | Rango observado … el 16 de agosto de 2026 |
| `es/oportunidades/alemania/logistica`      | 15,69 € – 17,50 € por hora | ídem                                      |
| `es/oportunidades/alemania/produccion`     | 14,96 € – 16,50 € por hora | ídem                                      |
| `es/oportunidades/alemania/carnico`        | Desde 15,33 € por hora     | Suelo del convenio. Sin rango observado…  |
| `es/oportunidades/alemania/agricola`       | Desde 15,33 € por hora     | ídem                                      |
| `en/opportunities/germany/warehouse`       | €15.69 – €17.50 per hour   | Observed range … August 16, 2026          |
| `en/opportunities/germany/logistics`       | €15.69 – €17.50 per hour   | ídem                                      |
| `en/opportunities/germany/production`      | €14.96 – €16.50 per hour   | ídem                                      |
| `en/opportunities/germany/meat-processing` | From €15.33 per hour       | Collective agreement floor…               |
| `en/opportunities/germany/agriculture`     | From €15.33 per hour       | ídem                                      |

Leído del HTML del build, sin ejecutar JavaScript.

## Lo que esta sesión no ha tocado, a propósito

El rediseño de credibilidad · los textos legales y su ruta · la región `iad1` y
las dos variables de Vercel · los metadatos de `(auth)` y el `<terms>` en
negrita · los ámbar **A1** y **A3**. El **A2** cayó dentro porque compartía
frase con la trampa del 2026-09-01.
