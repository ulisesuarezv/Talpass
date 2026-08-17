# PROMPT — Investigación de mercado: cómo son las ofertas reales

> Pegar en una sesión nueva y limpia. **No es una fase del roadmap**: no toca código,
> no toca la base de datos y no publica nada. Entrega un informe.
> Puede correr en paralelo a la fase 4.

---

Eres analista de mercado de este proyecto. Lee `CLAUDE.md` y `docs/00-PROJECT.md`
para entender el negocio, y `docs/01-DATA-MODEL.md` para saber qué campos tiene
una vacante. No necesitas leer más.

## Qué se te pide

Ulises ha reunido enlaces a ofertas reales publicadas por **ETTs de Europa Central**
para trabajadores hispanohablantes y lusófonos. Son de la competencia y de
agencias con las que todavía no hay relación.

**No vas a copiarlas.** Se han descartado explícitamente como catálogo: publicar
ofertas ajenas rompe la promesa al candidato —una aplicación que no llega a
ninguna parte—, y ante Google Jobs deja el dominio con perfil de agregador
duplicado, que es justo lo contrario de lo que persigue la fase 3.

Lo que se te pide es **el patrón**: con qué datos, en qué rangos y con qué
vocabulario se escriben estas ofertas, para que Ulises redacte las suyas y suenen
del mercado real, no inventadas.

## Los enlaces

<!-- Ulises: pega aquí los enlaces, uno por línea -->

## 1. Ficha por oferta

Una tabla con **una fila por oferta** y, en la medida en que el anuncio lo diga:

| Dato               | Detalle                                                               |
| ------------------ | --------------------------------------------------------------------- |
| Agencia y país     | quién publica y dónde se trabaja                                      |
| Sector             | y si encaja en los sectores del catálogo o falta uno                  |
| Ciudad o región    | ídem: ¿está en el catálogo?                                           |
| Salario            | importe, **moneda** y **periodo** (hora, mes, año) — bruto o neto     |
| Contrato y jornada | temporal/indefinido, completa/parcial, turnos, horas semanales        |
| Idioma exigido     | cuál y qué nivel; si no piden alemán, dilo — es el argumento de venta |
| Alojamiento        | ofrecido, ayudado o nada; si se descuenta del sueldo y cuánto         |
| Transporte         | ídem                                                                  |
| Carné              | exigido o no, y de qué tipo                                           |
| Requisitos         | experiencia, titulación, documentación                                |
| Qué prometen       | el gancho: pagas extra, alojamiento gratis, viaje pagado…             |

Si un dato no aparece, escribe "no dice". **Que un anuncio calle el salario es un
hallazgo, no un hueco**: conviene contar cuántos lo callan.

## 2. Los patrones, que es lo que se busca

- **Rangos salariales por sector**, con moneda y periodo. Es lo que evita que
  Ulises escriba una cifra que delate que la oferta no es real.
- **Ciudades y sectores que más se repiten**: por ahí empieza el catálogo.
- **Cómo titulan.** Reproduce la _estructura_ del título, no el título.
- **Qué extensión y qué secciones** tiene el cuerpo de un anuncio típico.
- **Qué se promete y con qué palabras**, en español y en alemán si aparece.
- **Qué callan.** Lo que sistemáticamente no se dice es una oportunidad de
  diferenciación para Talpass, que vende transparencia.

## 3. Lo que hay que decirle al proyecto

- **Sectores y ciudades que faltan en el catálogo** y aparecen en el mercado
  real. Lo que varía por país es catálogo en base de datos, así que esto es una
  lista de altas, no una decisión de código.
- **Campos del modelo de datos que el mercado usa y la vacante no recoge**, o al
  revés. Anótalos; no cambies el modelo.
- **Un borrador de 3 ofertas propias de ejemplo**, escritas de cero con los
  rangos y el vocabulario del informe, para que Ulises vea el molde. Con su
  contenido en `es` y `en`, porque una vacante es traducible.

## 4. Límites

- **No copies descripciones ni frases enteras.** Es obra ajena y el objetivo es
  no tener contenido duplicado. Parafrasea y agrega.
- **No toques la base de datos, ni local ni de producción. No publiques nada.**
  Publicar vacantes es de la fase 4, que está en curso, y tiene su propia vía.
- Si un enlace no carga o ha caducado, **dilo y sigue**. Una oferta caducada
  también informa: dice cuánto duran.

## 5. Entregable

Un único fichero, `docs/investigacion/ofertas-mercado.md`, con el informe
completo y **la fecha de consulta**, porque los salarios envejecen. Nada más:
ni migraciones, ni semillas, ni cambios en `src/`.

Al terminar, resume en cinco líneas qué debería saber Ulises antes de sentarse a
escribir sus ofertas.
