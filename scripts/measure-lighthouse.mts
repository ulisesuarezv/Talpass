import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Mide una página con Lighthouse y devuelve la MEDIANA de varias pasadas.
 *
 *     pnpm measure                              # home local, 6 pasadas
 *     pnpm measure https://talpass.eu/es --warm # producción, calentando el borde
 *     pnpm measure http://localhost:3210/es/ofertas --runs=9
 *
 * ## Por qué existe este script, y por qué seis pasadas
 *
 * Aquí el rendimiento es una puerta dura (ADR-10), y las tres veces que se ha
 * medido mal ha costado horas:
 *
 * 1. **Una sola pasada no vale.** El mismo build medido dos veces seguidas da
 *    notas distintas: banda de ±3 puntos.
 * 2. **La mediana de 3 tampoco vale en la home.** El LCP simulado no es una
 *    nube alrededor de un valor: salta entre **cubos discretos** —se han visto
 *    1,96 / 2,62 / 2,78 / 3,64 s en el mismo build—, porque el simulador
 *    redondea a vueltas completas de red. Con tres pasadas, la mediana es casi
 *    una moneda al aire entre dos cubos, y esa moneda inventó una regresión de
 *    0,3 s que no existía (bisecada el 2026-09-25). Seis es el mínimo para
 *    afirmar que algo cambió; el script las hace por defecto.
 * 3. **Lo que mueve el LCP aquí son los BYTES, no los efectos.** Observado en
 *    local, FCP y LCP ocurren en el mismo instante (~40 ms): todo pinta a la
 *    vez. Los 2,x s son el simulador extrapolando el grafo de dependencias a
 *    4G, y en ese grafo pesan sobre todo los ~260 KB de scripts. Un gradiente,
 *    una sombra o un `clamp()` cuestan cero; 8 KB más de documento cuestan un
 *    RTT. Por eso el script imprime también el desglose del LCP: si el tiempo
 *    extra es _render delay_ y el elemento no ha cambiado, mira los bytes.
 *
 * ## Dos trampas del entorno
 *
 * - **`pkill -f "next start"` no mata** el servidor de `pnpm start:local`: el
 *   puerto se queda ocupado, el `start` nuevo falla en silencio y se acaba
 *   midiendo el build anterior. Se mata con `kill -9 $(lsof -ti tcp:3210)`.
 * - **En producción hay que calentar el borde** antes de medir: recién
 *   desplegado, una página puede dar 93 y en caliente 100. Con `--warm` el
 *   script hace tres peticiones y comprueba `x-vercel-cache: HIT`.
 *
 * Local y producción **no se comparan entre sí**: producción va mejor porque
 * sirve desde CDN. Se compara siempre contra el mismo entorno, misma máquina y
 * mismo día (ver `docs/evidencia/fase-c1/03-rendimiento.md`).
 */

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3210/es';
const runs = Number(
  args.find((a) => a.startsWith('--runs='))?.split('=')[1] ?? 6,
);
const warm = args.includes('--warm');

type Pass = {
  score: number;
  lcp: number;
  fcp: number;
  cls: number;
  tbt: number;
  phases: string;
  node: string;
};

function warmUp(target: string) {
  console.log('Calentando el borde…');
  for (let i = 0; i < 3; i++) {
    const headers = execFileSync(
      'curl',
      ['-s', '-D-', '-o', '/dev/null', target],
      {
        encoding: 'utf8',
      },
    );
    const cache = /x-vercel-cache:\s*(\S+)/i.exec(headers)?.[1] ?? '—';
    console.log(`  ${i + 1}/3 · x-vercel-cache: ${cache}`);
  }
}

function runLighthouse(target: string, out: string): Pass {
  execFileSync(
    'pnpm',
    [
      'dlx',
      'lighthouse@12',
      target,
      '--only-categories=performance',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--throttling-method=simulate',
      '--quiet',
      '--chrome-flags=--headless=new',
      '--output=json',
      `--output-path=${out}`,
    ],
    { stdio: 'ignore' },
  );

  const report = JSON.parse(readFileSync(out, 'utf8'));
  const audits = report.audits;

  // El desglose por fases del LCP (TTFB / carga / render delay) y el elemento
  // que lo provoca. Si el elemento cambia entre dos medidas, las dos cifras no
  // están midiendo lo mismo y no se pueden restar.
  const element = audits['largest-contentful-paint-element'];
  const items = element?.details?.items ?? [];
  const phases = (items[1]?.items ?? [])
    .map(
      (p: { phase: string; timing: number }) =>
        `${p.phase}:${Math.round(p.timing)}`,
    )
    .join('  ');

  return {
    score: Math.round(report.categories.performance.score * 100),
    lcp: audits['largest-contentful-paint'].numericValue / 1000,
    fcp: audits['first-contentful-paint'].numericValue / 1000,
    cls: audits['cumulative-layout-shift'].numericValue,
    tbt: audits['total-blocking-time'].numericValue,
    phases,
    node: items[0]?.items?.[0]?.node?.snippet ?? '—',
  };
}

const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const dir = mkdtempSync(join(tmpdir(), 'talpass-lh-'));

try {
  if (warm) warmUp(url);

  console.log(`\n${url} · ${runs} pasadas\n`);
  const passes: Pass[] = [];

  for (let i = 0; i < runs; i++) {
    const pass = runLighthouse(url, join(dir, `run-${i}.json`));
    passes.push(pass);
    console.log(
      `  ${String(i + 1).padStart(2)} · nota ${pass.score}` +
        ` · LCP ${pass.lcp.toFixed(2)} s` +
        ` · FCP ${pass.fcp.toFixed(2)} s` +
        ` · TBT ${Math.round(pass.tbt)} ms` +
        ` · CLS ${pass.cls.toFixed(3)}` +
        (pass.phases ? `   [${pass.phases}]` : ''),
    );
  }

  console.log(
    `\n  MEDIANA · nota ${median(passes.map((p) => p.score))}` +
      ` · LCP ${median(passes.map((p) => p.lcp)).toFixed(2)} s` +
      ` · FCP ${median(passes.map((p) => p.fcp)).toFixed(2)} s` +
      ` · TBT ${Math.round(median(passes.map((p) => p.tbt)))} ms` +
      ` · CLS ${median(passes.map((p) => p.cls)).toFixed(3)}`,
  );

  console.log(`\n  Elemento LCP: ${passes[0].node.slice(0, 120)}`);

  // Si los LCP no caen todos en el mismo cubo, decirlo: es la señal de que
  // hacen falta más pasadas antes de afirmar nada.
  const cubos = new Set(passes.map((p) => p.lcp.toFixed(2)));
  if (cubos.size > 2) {
    console.log(
      `\n  ⚠️  ${cubos.size} valores distintos de LCP (${[...cubos].join(', ')}).` +
        ' Sube las pasadas antes de comparar contra otra medida.',
    );
  }

  console.log(
    '\n  Recuerda: local y producción no se comparan entre sí, y la comparación' +
      '\n  válida es contra el mismo entorno, misma máquina y mismo día.\n',
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
