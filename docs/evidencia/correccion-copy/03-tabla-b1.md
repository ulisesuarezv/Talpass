# 02 · La tabla B.1 de la auditoría, rellenada de nuevo

> **Estructura de `docs/evidencia/auditoria-previa/04-superficie-copy.md` §B.1,
> con la columna «lo publicado» al 2026-08-19.** No es una tabla nueva: es la
> misma, vuelta a rellenar después de la corrección. Contrastada contra
> `docs/investigacion/ofertas-mercado.md` (14 ofertas, consulta 2026-08-16).

## Las cinco filas que estaban en rojo

| #      | Dónde                                                             | Lo publicado ahora                                                                                                                   | Lo que dice la fuente                                                                                 | Estado                                                                                                                                                                             |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | `warehouse`, salario                                              | **15,69 – 17,50 €/h**, etiqueta «Rango observado: los dos extremos salen de las ofertas analizadas el 16 de agosto de 2026»          | §1: R2 15,69–16,21 · R4 15,69–17,50 · R5 15,69–17,50. §2.1: «Almacén con Staplerschein 15,69 – 17,50» | ✅ **Verde.** Los dos extremos trazan a oferta. La regla 3 de redacción (15,50–18,00) ya no se usa y el comentario del código lo dice                                              |
| **R2** | `production`, salario                                             | **14,96 – 16,50 €/h**, misma etiqueta                                                                                                | §1: R3 (Dresde) 14,96–16,50. §2.1: «Producción sin cualificación 14,96 – 16,50»                       | ✅ **Verde.** El 17,00 era la regla 2 de redacción y se ha ido. R1 (19,31–24,85) queda fuera del rango a propósito, se publica en `intro` y en `summary` y el comentario lo razona |
| **R3** | `warehouse`, `logistics`, `production` → Alojamiento y Transporte | **«En algunas ofertas»** — sin cambio                                                                                                | §0: «ninguna ofrece alojamiento ni transporte». §1: 0/14 y 0/14. §2.6: «14/14 callan»                 | 🟠 **Decisión consciente de Ulises, 2026-08-19.** No es un descuido: reclamo temporal para captar las primeras 30 personas. Anotada en `ESTADO.md` (no como ADR) y junto al código |
| **R4** | `warehouse.summary`                                               | «Las tres ofertas de la muestra que exigían certificado de carretilla pagaban por encima de la franja de producción sin cualificar…» | §1: certificado 3/14, los tres de Randstad; los tres arrancan en 15,69 frente a 14,96                 | ✅ **Verde.** «El perfil con más ofertas de la muestra» ha desaparecido. Producción sigue publicando su 8/14 y ya no hay dos páginas diciendo cosas distintas                      |
| **R5** | `warehouse.summary`                                               | «…el certificado vale entre 0,50 y 1 € más por hora»                                                                                 | §2.1, regla 3: «vale en torno a 0,50–1,00 € la hora»                                                  | ✅ **Verde.** «Y el que mejor paga sin titulación» ha desaparecido. Producción sigue publicando su 24,85 €/h, ahora también en su `summary`                                        |

## La fila de etiquetas

| Clave                  | Lo publicado ahora                                                                                           | Estado                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `facts.basisObserved`  | «Rango observado: los dos extremos salen de las ofertas analizadas el {date}, no de una franja recomendada.» | ✅ Describe exactamente lo que hay debajo. Ya no menciona el suelo del convenio, porque no lo usa |
| `facts.basisAgreement` | «Suelo del convenio. Sin rango observado: no publicamos un techo que no hemos medido.»                       | ✅ Sin cambio — la auditoría ya la daba por correcta                                              |

## Los ámbar

| #      | Estado                                                                                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A1** | 🟡 **Anotado, no corregido.** El 15,33 sigue presidiendo las páginas como suelo del convenio «desde el {date}», que es lo que era. Entra en la revisión del 2026-09-01                                                               |
| **A2** | ✅ **Resuelto.** «El suelo de la muestra coincide con el del convenio» ya no está: esa línea es ahora la que explica que el rango es lo medido en su fecha y que el suelo del convenio manda por encima                              |
| **A3** | 🟡 **Anotado, no corregido.** `logistics.conditions[0]` sigue diciendo «5 de las 6 ofertas que dan cifra», que es de toda la muestra y no del bloque. Correcto como está escrito, ambiguo leído dentro de la ficha. Fuera de alcance |

## B.2 — la contradicción del informe

| Sitio                 | Qué dice ahora                                             | Estado                                                                                 |
| --------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| §0, líneas 17–20      | «**Once** de las catorce exigen alemán de forma explícita» | ✅ **Verde ya antes de esta sesión**: lo corrigió el commit de la auditoría, `a71fba5` |
| §1, tabla de recuento | «Idioma exigido \| 11 / 14 \| 3 / 14»                      | ✅ Coinciden                                                                           |

## `es` contra `en`

```
$ node docs/evidencia/correccion-copy/parity.mjs
claves hoja: es=448 en=448
solo en es: 0
solo en en: 0
divergencias numéricas: 0
```

- claves hoja: **448 en `es`, 448 en `en`**, 0 solo en uno. **La misma cifra que
  la línea base**: las cuatro claves corregidas se reescribieron, no se añadieron.
- **0 claves con cifras distintas entre idiomas.**
- Las etiquetas de procedencia dicen lo mismo en los dos idiomas:
  `basisObserved` = «Rango observado: los dos extremos salen de las ofertas
  analizadas el {date}…» / «Observed range: both ends come from the ads reviewed
  on {date}…»; `perkSometimes` = «En algunas ofertas» / «In some offers», sin
  tocar por la decisión de R3.

**De los cinco rojos: cuatro en verde y uno marcado como decisión consciente con
su fecha.**
