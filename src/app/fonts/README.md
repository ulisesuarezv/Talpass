# General Sans — qué se sirve, qué permite la licencia y qué costó medirlo

**Fichero servido:** `GeneralSans-Regular.woff2` (23.904 B), del paquete
`GeneralSans_Complete` de [Fontshare](https://www.fontshare.com/fonts/general-sans),
descargado el 2026-08-20 de `https://api.fontshare.com/v2/fonts/download/general-sans`.
**Sin modificar**: mismo binario que reparte la fundición, byte a byte.

Diseñada por Indian Type Foundry (ITF). Es la **única** que se carga: una sola
petición, preacargada.

## Licencia: ITF Free Font License (FFL) v2.0 — 17 Aug 2026

El texto íntegro está en `LICENSE-FFL.txt`, tal como viene en el paquete. Lo que
importa aquí, leído el 2026-08-20 **antes** de commitear los ficheros:

### Lo que permite, y es justo lo que hace este proyecto

- **Uso comercial, gratuito y por tiempo ilimitado** (§01).
- **Autoalojamiento explícito.** §01: _«You may self-host the Font Software on
  your own servers or infrastructure for use on your own websites and
  applications, including through standard webfont technologies such as CSS
  @font-face. Self-hosting by end users is permitted and recommended for greater
  control, reliability and performance.»_ La API de Fontshare es opcional y la
  propia licencia desaconseja depender de ella: §06 no garantiza su
  disponibilidad y dice que usarla es _«at its own risk»_. Aquí se sirve desde
  `/_next/static/media`, que es autoalojamiento.
- **No exige atribución** (§01, último párrafo). Este README existe por higiene
  del repositorio, no porque la licencia lo pida.

### 🔴 Lo que NO permite, y contradice al prompt de la fase

**§02 prohíbe el subsetting y la conversión de formato** sin permiso escrito de
la fundición:

> _«You may not modify, edit, adapt, translate, reverse engineer, decompile,
> disassemble or otherwise alter the Font Software (…). This includes modifying
> or replacing glyphs, **subsetting, format conversion**, or altering font names,
> copyright information, ownership information or other metadata.»_

El prompt de la fase C2 pedía «subsetea a `latin`». **No se ha hecho, y no se
puede hacer**: sería una obra derivada no autorizada (§05). Lo que se sirve es
el WOFF2 oficial íntegro.

**No hacía falta**, además: el WOFF2 oficial de la Regular pesa **23.904 B**,
que son **5,4 KB menos** que el subconjunto `latin` de Geist que había antes
(29.288 B). La tipografía de marca entró **abaratando** la ruta crítica.

### Lo que tampoco se puede hacer, por si alguien lo intenta más adelante

- Redistribuirla fuera de este producto, ni dársela a un tercero (§02). Un
  diseñador o una agencia que trabaje para Talpass tiene que bajársela de
  Fontshare por su cuenta.
- Ofrecerla como fuente seleccionable a terceros dentro de una aplicación —por
  ejemplo, dejar que una ETT elija tipografía para su perfil— (§02).

La segunda deja de ser hipotética el día que exista el portal de ETT (fase 6).

## 🔴 Por qué solo la Regular, y por qué los titulares van en negrita sintética

**Esto no es una simplificación: es el resultado de medir seis configuraciones.**
El detalle está en `docs/evidencia/fase-c2/02-rendimiento.md`; el resumen:

| Configuración                                 | Ruta crítica             | Home            | Registro        |
| --------------------------------------------- | ------------------------ | --------------- | --------------- |
| Geist `latin` (lo que había)                  | 29,3 KB                  | 97 · 2,63 s     | 96 · 2,77 s     |
| **General Sans Regular** ← lo que va          | **23,9 KB**              | **97 · 2,62 s** | **96 · 2,77 s** |
| General Sans Variable (200–700)               | 38,4 KB                  | 93 · 2,78 s     | 92 · 2,93 s     |
| Regular + Semibold, las dos preacargadas      | 48,2 KB                  | 93 · 2,78 s     | 92 · 2,92 s     |
| Regular preacargada + Semibold sin preacargar | 23,9 KB + 24,3 diferidos | 96 · 2,77 s     | 95 · 2,93 s     |
| Variable sin preacargar                       | —                        | 93 · 2,77 s     | **86** · 2,93 s |

Mediana de 5 pasadas, misma máquina y mismo día.

**Cualquier segundo corte de la fuente cuesta LCP, se cargue como se cargue.**
El variable son 38 KB en un solo fichero y cuesta lo mismo que dos ficheros de
48 KB: lo que pesa no es el número de peticiones, son los bytes en la ruta
crítica, y el umbral está entre los 29 KB de Geist y los 38 del variable.
Diferir la Semibold sin preacargarla recupera parte, pero **sigue empeorando el
LCP en las dos páginas**, y el presupuesto de velocidad es puerta dura (ADR-10).

**Consecuencia asumida:** los titulares y las etiquetas en `font-semibold` los
emboldece el navegador a partir de la Regular. No es la Semibold de verdad —es
un engrosado algorítmico— y en un titular grande se nota si se compara al lado.
Es el precio de no gastar el presupuesto de velocidad, y está escrito aquí para
que sea una decisión y no una sorpresa.

👉 **Si Ulises quiere la Semibold de verdad**, el precio medido es de **1 a 4
puntos de Lighthouse y entre 0,15 y 0,16 s de LCP**, sobre un sitio que ya está
en 2,6–2,8 s con el umbral «bueno» en 2,5. Es una decisión suya, no técnica, y
el fichero está a un `cp` de distancia: `GeneralSans-Semibold.woff2` del mismo
paquete de Fontshare.

**Sin cursiva**, tampoco: `GeneralSans-VariableItalic.woff2` son 40 KB más y el
sitio no pinta cursiva en ninguna pantalla.
