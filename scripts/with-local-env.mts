import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Arranca Next contra la base LOCAL (ADR-17).
 *
 *     node scripts/with-local-env.mts dev
 *
 * No se usa `node --env-file=.env.test next …` porque Node propaga esa bandera
 * a los workers vía `NODE_OPTIONS` y el build de Next, que levanta varios,
 * revienta con `--env-file= is not allowed in NODE_OPTIONS`. Así que el
 * fichero se lee aquí y se pasa por el entorno del proceso hijo.
 *
 * Next respeta lo que ya viene en el entorno y no lo pisa con `.env.local`
 * —que apunta a producción—, y de ahí que este envoltorio baste.
 */

const ENV_FILE = '.env.test';

function parseEnvFile(path: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

let fileEnv: Record<string, string>;
try {
  fileEnv = parseEnvFile(ENV_FILE);
} catch {
  console.error(
    `\nFalta ${ENV_FILE}. Créalo con:\n\n  cp .env.test.example ${ENV_FILE}\n`,
  );
  process.exit(1);
}

const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', ...process.argv.slice(2)],
  { stdio: 'inherit', env: { ...process.env, ...fileEnv } },
);

child.on('close', (code) => process.exit(code ?? 1));
