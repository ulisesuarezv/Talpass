# Fuentes de la web (rediseño de Kayao, 2026-11-25)

| Fichero           | Familia                | Pesos   | Licencia                  |
| ----------------- | ---------------------- | ------- | ------------------------- |
| inter.woff2       | Inter (variable)       | 400–700 | SIL Open Font License 1.1 |
| inter-tight.woff2 | Inter Tight (variable) | 500–800 | SIL Open Font License 1.1 |
| geist-mono.woff2  | Geist Mono (variable)  | 400–600 | SIL Open Font License 1.1 |

Son las de Google Fonts (subconjunto `latin`) recortadas con fontTools a:

- Caracteres: U+0020–007E, U+00A0–00FF, Œ œ – — ‘ ’ ‚ “ ” „ • … € ← → ✓ − № ™.
  Cubre español, alemán, portugués e inglés. Lo que falte cae en la fuente de
  sistema.
- Rasgos OpenType: kern, liga, calt, tnum, case, ccmp, locl, mark, mkmk.
- Eje de peso limitado a los pesos que usa la web.

Para regenerarlas o añadir caracteres: `pyftsubset` / `fontTools.subset` sobre
el woff2 latino de Google Fonts y `fontTools.varLib.instancer` para el eje.
La OFL permite modificar y redistribuir; el nombre de la fuente no cambia
porque no es una fuente reservada.
