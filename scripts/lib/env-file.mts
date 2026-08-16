import { readFileSync } from 'node:fs';

/**
 * Lectura de un `.env` sin dependencias.
 *
 * No se usa `node --env-file=` porque Node propaga esa bandera a los procesos
 * hijos vía `NODE_OPTIONS`, y el build de Next —que levanta varios— revienta
 * con `--env-file= is not allowed in NODE_OPTIONS`. Así que el fichero se lee
 * aquí y se coloca en el entorno del proceso.
 */
export function parseEnvFile(path: string): Record<string, string> {
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

/**
 * Carga el fichero en `process.env`. Lo que ya venga del entorno **manda**:
 * una variable escrita a mano en la línea del comando no puede quedar pisada
 * por un fichero, o dejaría de servir para desviar una ejecución concreta.
 */
export function loadEnvFile(path: string): void {
  let values: Record<string, string>;

  try {
    values = parseEnvFile(path);
  } catch {
    throw new Error(
      `Falta ${path}.` +
        (path === '.env.test'
          ? ' Créalo con: cp .env.test.example .env.test'
          : ''),
    );
  }

  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
