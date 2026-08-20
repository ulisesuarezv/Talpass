/**
 * Comprobador de contraste — fase C2, ADR-38.
 *
 *     pnpm check:contrast          # tabla + veredicto, sale 1 si algo falla
 *     pnpm check:contrast --md     # la misma tabla en Markdown, para evidencia
 *
 * **Qué comprueba, y por qué no basta con mirar la paleta.** Los cuatro pares
 * de la ficha del roadmap (blanco sobre acento, blanco sobre primario…) son los
 * que se calcularon a mano el 2026-08-20. Lo que de verdad pinta la aplicación
 * son bastantes más, y los peligrosos no son los obvios:
 *
 * - Las superficies con alfa. `bg-muted/40` sobre `--background` no es
 *   `--muted`: es una mezcla, y el ratio hay que calcularlo contra la mezcla.
 * - `--muted-foreground`, que aparece 114 veces en `src/` y es el par más
 *   pintado del sitio entero.
 * - Los bordes de campo y el anillo de foco, que WCAG 1.4.11 mete en 3:1 y que
 *   antes de esta fase daban 1,35 y 1,9.
 *
 * **De dónde salen los colores:** de `src/app/globals.css`, parseando el bloque
 * `:root`. No hay una copia de la paleta aquí. Si alguien cambia un token y
 * rompe un par, esto falla; si hubiera una copia, no se enteraría nadie.
 *
 * **Umbrales** (WCAG 2.1 AA): 4,5:1 texto normal · 3:1 texto grande (≥24 px, o
 * ≥18,66 px en negrita) y elementos de interfaz.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSS = resolve(ROOT, 'src/app/globals.css');

// --- OKLCH -> sRGB ---------------------------------------------------------
// Conversión estándar (Björn Ottosson). Se implementa aquí en vez de traer una
// dependencia: son treinta líneas y este script tiene que poder ejecutarse sin
// instalar nada.

type Rgb = [number, number, number];

/** Codificación de transferencia sRGB: lineal → con gamma (lo que va en el hex). */
const gamma = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/** Decodificación: con gamma → lineal. */
const linear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

/** Devuelve sRGB **con gamma** en 0..1, que es lo que pinta el navegador. */
function oklchToRgb(L: number, C: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(1, Math.max(0, gamma(v)))) as Rgb;
}

/** Luminancia relativa WCAG. La entrada es sRGB con gamma en 0..1. */
function luminance([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Composición `source-over` de `fg` con alfa `alpha` sobre `bg`, ya opaco. */
function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as Rgb;
}

function toHex([r, g, b]: Rgb): string {
  const h = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

// --- Los tokens, leídos de globals.css -------------------------------------

function readTokens(): Map<string, Rgb> {
  const css = readFileSync(CSS, 'utf8');
  const rootStart = css.indexOf(':root {');
  if (rootStart === -1) throw new Error('No se encuentra el bloque :root');
  const block = css.slice(rootStart, css.indexOf('\n}', rootStart));

  const tokens = new Map<string, Rgb>();
  const re = /--([a-z0-9-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g;
  for (const m of block.matchAll(re)) {
    tokens.set(m[1], oklchToRgb(Number(m[2]), Number(m[3]), Number(m[4])));
  }
  if (tokens.size === 0) throw new Error('No se ha parseado ningún token');
  return tokens;
}

const T = readTokens();

function tok(name: string): Rgb {
  const v = T.get(name);
  if (!v) throw new Error(`Token --${name} no existe en globals.css`);
  return v;
}

// --- Las superficies reales -------------------------------------------------
// Cada una es un fondo OPACO sobre el que se pinta texto. Las que llevan alfa
// se componen aquí contra el fondo sobre el que aparecen de verdad, no contra
// blanco: esa es la diferencia entre medir la paleta y medir la pantalla.

const bg = tok('background');
const card = tok('card');

const surfaces: Record<string, { rgb: Rgb; note: string }> = {
  background: { rgb: bg, note: 'fondo de página' },
  card: { rgb: card, note: 'tarjeta, popover' },
  popover: { rgb: tok('popover'), note: 'desplegable de `select`' },
  muted: { rgb: tok('muted'), note: 'bloque apagado, `bg-muted`' },
  'muted/40 sobre fondo': {
    rgb: over(tok('muted'), bg, 0.4),
    note: 'caja «qué ve una agencia» de la home y hermanas',
  },
  'muted/50 sobre tarjeta': {
    rgb: over(tok('muted'), card, 0.5),
    note: 'pie de tarjeta (`CardFooter`)',
  },
  'muted/30 sobre fondo': {
    rgb: over(tok('muted'), bg, 0.3),
    note: 'onboarding',
  },
  secondary: { rgb: tok('secondary'), note: 'botón secundario, badge' },
  primary: { rgb: tok('primary'), note: 'botón principal' },
  'brand-soft': { rgb: tok('brand-soft'), note: 'superficie de marca' },
  'brand-accent': { rgb: tok('brand-accent'), note: 'superficie de acento' },
  'brand-accent-soft': {
    rgb: tok('brand-accent-soft'),
    note: 'aviso de acento',
  },
  'brand-strong': { rgb: tok('brand-strong'), note: 'superficie teal oscura' },
  'destructive/10 sobre fondo': {
    rgb: over(tok('destructive'), bg, 0.1),
    note: 'botón y badge destructivos',
  },
  'destructive/20 sobre fondo': {
    rgb: over(tok('destructive'), bg, 0.2),
    note: 'destructivo en hover',
  },
};

// --- Los pares -------------------------------------------------------------
// `kind`: 'texto' exige 4,5 · 'grande' y 'interfaz' exigen 3,0.
// Cada uno lleva dónde se pinta, para que se pueda ir a comprobarlo.

type Kind = 'texto' | 'grande' | 'interfaz';

type Pair = {
  fg: string; // token de primer plano
  surface: keyof typeof surfaces;
  kind: Kind;
  where: string;
  alpha?: number; // alfa del primer plano, si lo lleva
};

const pairs: Pair[] = [
  // --- El texto por defecto, en toda superficie donde se pinta -------------
  {
    fg: 'foreground',
    surface: 'background',
    kind: 'texto',
    where: 'cuerpo de toda pantalla',
  },
  { fg: 'card-foreground', surface: 'card', kind: 'texto', where: '`Card`' },
  {
    fg: 'popover-foreground',
    surface: 'popover',
    kind: 'texto',
    where: '`Select`',
  },
  {
    fg: 'foreground',
    surface: 'muted',
    kind: 'texto',
    where: '`bg-muted` con texto normal',
  },
  {
    fg: 'foreground',
    surface: 'muted/40 sobre fondo',
    kind: 'texto',
    where: 'home §privacidad',
  },
  {
    fg: 'foreground',
    surface: 'muted/30 sobre fondo',
    kind: 'texto',
    where: 'onboarding',
  },
  {
    fg: 'foreground',
    surface: 'brand-soft',
    kind: 'texto',
    where: 'caja de marca',
  },
  {
    fg: 'foreground',
    surface: 'brand-accent-soft',
    kind: 'texto',
    where: 'aviso de acento',
  },
  {
    fg: 'secondary-foreground',
    surface: 'secondary',
    kind: 'texto',
    where: 'botón secundario',
  },
  {
    fg: 'accent-foreground',
    surface: 'muted',
    kind: 'texto',
    where: 'hover de `select`',
  },
  {
    fg: 'brand-accent-ink',
    surface: 'brand-accent',
    kind: 'texto',
    where: 'tinta sobre naranja',
  },

  // --- `--muted-foreground`: el par más pintado del sitio ------------------
  {
    fg: 'muted-foreground',
    surface: 'background',
    kind: 'texto',
    where: '114 usos en `src/`',
  },
  {
    fg: 'muted-foreground',
    surface: 'card',
    kind: 'texto',
    where: '`CardDescription`',
  },
  {
    fg: 'muted-foreground',
    surface: 'popover',
    kind: 'texto',
    where: 'placeholder de `select`',
  },
  {
    fg: 'muted-foreground',
    surface: 'muted',
    kind: 'texto',
    where: 'badge fantasma en hover',
  },
  {
    fg: 'muted-foreground',
    surface: 'muted/40 sobre fondo',
    kind: 'texto',
    where: 'home §privacidad',
  },
  {
    fg: 'muted-foreground',
    surface: 'muted/50 sobre tarjeta',
    kind: 'texto',
    where: '`CardFooter`',
  },
  {
    fg: 'muted-foreground',
    surface: 'muted/30 sobre fondo',
    kind: 'texto',
    where: 'onboarding',
  },
  {
    fg: 'muted-foreground',
    surface: 'brand-soft',
    kind: 'texto',
    where: 'caja de marca',
  },
  {
    fg: 'muted-foreground',
    surface: 'brand-accent-soft',
    kind: 'texto',
    where: 'aviso de acento',
  },

  // --- Botones, badges y enlaces ------------------------------------------
  {
    fg: 'primary-foreground',
    surface: 'primary',
    kind: 'texto',
    where: 'botón y badge principal',
  },
  {
    fg: 'primary',
    surface: 'background',
    kind: 'texto',
    where: '`text-primary`, enlaces',
  },
  {
    fg: 'primary',
    surface: 'card',
    kind: 'texto',
    where: 'enlace dentro de tarjeta',
  },
  {
    fg: 'primary-foreground',
    surface: 'brand-strong',
    kind: 'texto',
    where: 'blanco sobre teal-700',
  },

  // --- Marca ---------------------------------------------------------------
  {
    fg: 'brand-strong',
    surface: 'background',
    kind: 'texto',
    where: 'antetítulo, `.type-eyebrow`',
  },
  {
    fg: 'brand-strong',
    surface: 'brand-soft',
    kind: 'texto',
    where: 'antetítulo sobre marca',
  },
  {
    fg: 'brand-accent-strong',
    surface: 'background',
    kind: 'texto',
    where: 'texto en naranja',
  },
  {
    fg: 'brand-accent-strong',
    surface: 'brand-accent-soft',
    kind: 'texto',
    where: 'aviso de acento',
  },
  {
    fg: 'brand',
    surface: 'background',
    kind: 'interfaz',
    where: 'icono, borde y regla de marca',
  },
  {
    fg: 'brand',
    surface: 'card',
    kind: 'interfaz',
    where: 'icono dentro de tarjeta',
  },

  // --- Errores -------------------------------------------------------------
  {
    fg: 'destructive',
    surface: 'background',
    kind: 'texto',
    where: 'error de formulario',
  },
  {
    fg: 'destructive',
    surface: 'card',
    kind: 'texto',
    where: 'error dentro de tarjeta',
  },
  {
    fg: 'destructive',
    surface: 'destructive/10 sobre fondo',
    kind: 'texto',
    where: 'botón destructivo',
  },
  {
    fg: 'destructive',
    surface: 'destructive/20 sobre fondo',
    kind: 'texto',
    where: 'destructivo en hover',
  },

  // --- Interfaz: lo que WCAG 1.4.11 mete en 3:1 ---------------------------
  {
    fg: 'input',
    surface: 'background',
    kind: 'interfaz',
    where: 'borde de campo, `Input`',
  },
  {
    fg: 'input',
    surface: 'card',
    kind: 'interfaz',
    where: 'campo dentro de tarjeta',
  },
  {
    fg: 'ring',
    surface: 'background',
    kind: 'interfaz',
    where: 'indicador de foco',
  },
  {
    fg: 'ring',
    surface: 'card',
    kind: 'interfaz',
    where: 'foco dentro de tarjeta',
  },
  {
    fg: 'primary',
    surface: 'background',
    kind: 'interfaz',
    where: '`border-primary` (radio marcado)',
  },
  {
    fg: 'destructive',
    surface: 'background',
    kind: 'interfaz',
    where: 'borde de campo inválido',
  },
];

// --- Ejecución --------------------------------------------------------------

const MIN: Record<Kind, number> = { texto: 4.5, grande: 3, interfaz: 3 };

const results = pairs.map((p) => {
  const s = surfaces[p.surface];
  const raw = tok(p.fg);
  const fg = p.alpha === undefined ? raw : over(raw, s.rgb, p.alpha);
  const ratio = contrast(fg, s.rgb);
  const min = MIN[p.kind];
  return {
    ...p,
    fgHex: toHex(fg),
    bgHex: toHex(s.rgb),
    ratio,
    min,
    ok: ratio >= min,
  };
});

const failures = results.filter((r) => !r.ok);
const asMd = process.argv.includes('--md');
const n = (x: number) => x.toFixed(2).replace('.', ',');

if (asMd) {
  console.log(
    '| Primer plano | Sobre | Papel | Ratio | Mínimo | Dónde se pinta |',
  );
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const r of results) {
    console.log(
      `| \`--${r.fg}\` ${r.fgHex} | ${r.surface} ${r.bgHex} | ${r.kind} | ` +
        `**${n(r.ratio)}** | ${n(r.min)} | ${r.ok ? '✅' : '🔴'} ${r.where} |`,
    );
  }
  console.log('');
  console.log(
    failures.length === 0
      ? `**${results.length} pares comprobados, ${results.length} pasan.** ` +
          `El más justo: \`--${[...results].sort((a, b) => a.ratio - b.ratio)[0].fg}\` ` +
          `sobre ${[...results].sort((a, b) => a.ratio - b.ratio)[0].surface}, ` +
          `**${n([...results].sort((a, b) => a.ratio - b.ratio)[0].ratio)}**.`
      : `🔴 **${failures.length} de ${results.length} pares fallan.**`,
  );
} else {
  for (const r of results) {
    console.log(
      `${r.ok ? '✅' : '🔴'} ${n(r.ratio).padStart(6)} / ${n(r.min)}  ` +
        `--${r.fg} ${r.fgHex} sobre ${r.surface} ${r.bgHex}  · ${r.where}`,
    );
  }
  console.log('');
  const worst = [...results].sort((a, b) => a.ratio - b.ratio)[0];
  console.log(
    `${results.length} pares. El más justo: ${n(worst.ratio)} (--${worst.fg} sobre ${worst.surface}).`,
  );
  console.log(
    failures.length === 0
      ? '✅ Ninguna combinación de texto baja de 4,5:1 ni de interfaz de 3:1.'
      : `🔴 ${failures.length} fallan.`,
  );
}

process.exit(failures.length === 0 ? 0 : 1);
