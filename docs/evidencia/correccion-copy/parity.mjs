// Paridad es/en: el mismo criterio que la auditoría del 2026-08-18 (B.1).
//
// Aplana los dos JSON de `messages/`, compara el conjunto de claves hoja y
// extrae los números de cada valor, normalizando la coma decimal española a
// punto para que "15,69 €" y "€15.69" se comparen como el mismo número.
//
//   node docs/evidencia/correccion-copy/parity.mjs
//   node docs/evidencia/correccion-copy/parity.mjs messages/legal/es.json messages/legal/en.json
//
// Acepta el par de ficheros por argumento (2026-08-19, sesión de los textos
// legales): el cuerpo de los documentos legales vive fuera de `messages/` por
// peso — ver ADR-33 y `src/lib/legal.ts`—, y necesitaba la misma comprobación.
// Se generaliza el que ya había en vez de escribir un segundo script que
// hiciera lo mismo con otras rutas dentro.
//
// Vive aquí y no en `scripts/` porque es la herramienta de una verificación,
// no del producto: se ejecuta al cerrar una sesión de copy, no en el build.
import { readFileSync } from 'node:fs';

const flat = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flat(v, key, out);
    else out[key] = String(v);
  }
  return out;
};

const [esPath = 'messages/es.json', enPath = 'messages/en.json'] =
  process.argv.slice(2);

const es = flat(JSON.parse(readFileSync(esPath, 'utf8')));
const en = flat(JSON.parse(readFileSync(enPath, 'utf8')));

console.log(`comparando: ${esPath} ↔ ${enPath}`);

console.log(
  `claves hoja: es=${Object.keys(es).length} en=${Object.keys(en).length}`,
);
const onlyEs = Object.keys(es).filter((k) => !(k in en));
const onlyEn = Object.keys(en).filter((k) => !(k in es));
console.log(`solo en es: ${onlyEs.length} ${onlyEs.join(', ')}`);
console.log(`solo en en: ${onlyEn.length} ${onlyEn.join(', ')}`);

const nums = (s) =>
  (s.replace(/(\d),(\d)/g, '$1.$2').match(/\d+(?:\.\d+)?/g) ?? []).join('|');

let divergencias = 0;
for (const k of Object.keys(es)) {
  if (!(k in en)) continue;
  if (nums(es[k]) !== nums(en[k])) {
    divergencias++;
    console.log(`DIVERGENCIA ${k}\n  es: ${nums(es[k])}\n  en: ${nums(en[k])}`);
  }
}
console.log(`divergencias numéricas: ${divergencias}`);
