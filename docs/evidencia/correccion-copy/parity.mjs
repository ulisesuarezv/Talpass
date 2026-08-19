// Paridad es/en: el mismo criterio que la auditoría del 2026-08-18 (B.1).
//
// Aplana los dos JSON de `messages/`, compara el conjunto de claves hoja y
// extrae los números de cada valor, normalizando la coma decimal española a
// punto para que "15,69 €" y "€15.69" se comparen como el mismo número.
//
//   node docs/evidencia/correccion-copy/parity.mjs
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

const es = flat(JSON.parse(readFileSync('messages/es.json', 'utf8')));
const en = flat(JSON.parse(readFileSync('messages/en.json', 'utf8')));

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
