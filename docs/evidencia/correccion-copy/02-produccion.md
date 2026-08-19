# 02 · Evidencia en producción

**Contra `https://talpass.eu`, el 2026-08-19.**

| Despliegue                         | Qué hizo                                                   |
| ---------------------------------- | ---------------------------------------------------------- |
| `dpl_rQSDT7UzxqMPkHieAVfUVBsm15pB` | publica la corrección de copy de esta sesión (ADR-31 vivo) |

Despliegue vivo confirmado **antes** de dar por buena ninguna cabecera:

```
$ vercel inspect talpass.eu
id      dpl_rQSDT7UzxqMPkHieAVfUVBsm15pB
target  production
status  ● Ready
Aliases ╶ https://talpass.eu  ╶ https://www.talpass.eu  ╶ https://ettrecruiter.vercel.app
```

Es el mismo ID que devolvió el `vercel --prod`, y el alias del apex apunta a él.
La comprobación no es ceremonia: en este proyecto ya se dio por desplegado algo
que estaba solo en `origin`, y `origin` aquí no despliega nada.

## Las cifras nuevas, leídas del HTML de producción sin ejecutar JavaScript

`curl` y nada más — ni navegador, ni hidratación.

| URL                                     | Salario                    | Etiqueta de procedencia                                                                                                  |
| --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/es/oportunidades/alemania/almacen`    | 15,69 € – 17,50 € por hora | Rango observado: los dos extremos salen de las ofertas analizadas el 16 de agosto de 2026, no de una franja recomendada. |
| `/es/oportunidades/alemania/logistica`  | 15,69 € – 17,50 € por hora | ídem                                                                                                                     |
| `/es/oportunidades/alemania/produccion` | 14,96 € – 16,50 € por hora | ídem                                                                                                                     |
| `/en/opportunities/germany/warehouse`   | €15.69 – €17.50 per hour   | Observed range: both ends come from the ads reviewed on August 16, 2026, not from a recommended band.                    |
| `/en/opportunities/germany/production`  | €14.96 – €16.50 per hour   | ídem                                                                                                                     |

**El 18,00 y el 17,00 ya no existen en producción.** Eran los dos techos que la
auditoría marcó como R1 y R2.

### R4 y R5, en el listado de producción

Los `summary` que sirve `/es/oportunidades`, tal cual salen del HTML:

> **Almacén** — Las tres ofertas de la muestra que exigían certificado de
> carretilla pagaban por encima de la franja de producción sin cualificar: el
> certificado vale entre 0,50 y 1 € más por hora.
>
> **Producción** — El perfil más abierto: varias ofertas dicen expresamente que
> no hace falta experiencia y que la formación se da en planta. Es también donde
> está la mejor pagada de la muestra, 24,85 € la hora en Hamburgo, con turno
> continuo y aptitud médica.

Ni «el perfil con más ofertas de la muestra» ni «el que mejor paga sin
titulación» quedan en ninguna página. **Las dos fichas ya cuentan la misma
historia**: producción es la más frecuente y la mejor pagada, almacén es la que
paga la cualificación.

### La frase del 2026-09-01, viva en la ficha de producción

> Salario por hora y bruto. El rango publicado es lo medido en las ofertas de
> producción sin cualificar el 16 de agosto de 2026: la mejor pagada de la
> muestra, con turno continuo y aptitud médica, queda fuera de esa franja y se
> explica arriba. Y por encima de lo medido manda siempre el suelo del convenio,
> 15,33 € brutos por hora desde el 1 de septiembre de 2026: por debajo de esa
> cifra ninguna oferta puede pagarte.

## Cabeceras — las rutas públicas siguen sin tocar la sesión (ADR-11, ADR-13)

Primera petición tras desplegar: `PRERENDER` (es el estreno del prerender en el
borde). Segunda, ya caliente:

| URL                                    | Caché                                          | Sesión                                         |
| -------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `/es/oportunidades`                    | `x-vercel-cache: HIT`, `x-nextjs-prerender: 1` | sin `x-ett-session-checked`, sin `Set-Cookie`  |
| `/es/oportunidades/alemania/almacen`   | `x-vercel-cache: HIT`                          | sin `x-ett-session-checked`, sin `Set-Cookie`  |
| `/en/opportunities/germany/production` | `x-vercel-cache: HIT`                          | sin `x-ett-session-checked`, sin `Set-Cookie`  |
| `/es/cuenta` (control negativo)        | `MISS`                                         | 307 a `/es/entrar`, `x-ett-session-checked: 1` |

> **Nota sobre el nombre de la cabecera.** El criterio del prompt pedía
> `x-nextjs-cache: HIT`. Lo que sirve este despliegue es
> **`x-vercel-cache: HIT` junto a `x-nextjs-prerender: 1`**, que es cómo Next 16
> sobre Vercel expresa lo mismo: la respuesta sale del prerender cacheado en el
> borde, no de una función. No hay ninguna cabecera `x-nextjs-cache` en la
> respuesta, ni en las públicas ni en las privadas. El volcado completo de
> `/es/oportunidades` lo confirma, y el control negativo cierra la pinza: la
> ruta privada sí lleva `x-ett-session-checked: 1` y las públicas no.

El dump entero de `/es/oportunidades` no trae `Set-Cookie` de ningún tipo, y
`vary` es el de siempre (`rsc, next-router-state-tree, next-router-prefetch,
next-router-segment-prefetch`), sin `cookie`.

## Cero `JobPosting` en producción (ADR-30)

```bash
grep -ri "JobPosting" prod_*.html   # las 6 páginas descargadas
# salida vacía, exit=1
```

Comprobado sobre el HTML servido, no sobre el código, en el listado y en cuatro
fichas de los dos idiomas. Una corrección de copy no ha roto la regla que define
la sección.

## Lo que este despliegue **no** ha cambiado

- **Ni una migración**: la base de datos de producción no se ha tocado.
- Alojamiento y transporte siguen diciendo «En algunas ofertas» / «In some
  offers», por la decisión de Ulises del 2026-08-19 (hallazgo R3).
- Las funciones se siguen ejecutando en `iad1` — punto 4 del orden acordado,
  fuera del alcance de esta sesión y con decisiones de Ulises por delante.
