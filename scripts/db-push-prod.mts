import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

/**
 * `supabase db push --linked` contra PRODUCCIÓN, con una pausa deliberada
 * delante (ADR-17).
 *
 * El camino cómodo es el local: `pnpm db:reset` recrea la base de desarrollo
 * sin preguntar nada. Este comando es el otro, y tiene que costar un gesto
 * consciente: la fase 1 acabó ejecutando `db reset` y un simulacro de brecha
 * contra el proyecto de producción precisamente porque los dos caminos se
 * parecían demasiado.
 *
 * No comprueba nada del contenido de las migraciones: la CLI ya lista lo que va
 * a aplicar y espera confirmación. Lo que añade esto es decir en voz alta a
 * dónde apunta, antes de que la CLI lo pregunte.
 */

const CONFIRMATION = 'produccion';

const forced = process.argv.includes('--yes');

if (!forced) {
  console.log(
    '\x1b[33m\n  Vas a aplicar migraciones al proyecto Supabase de PRODUCCIÓN.\x1b[0m\n',
  );
  console.log(
    '  Antes de seguir, las migraciones deben estar validadas en local:',
  );
  console.log(
    '    pnpm db:reset && pnpm test:security && pnpm test:security:drill\n',
  );

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(
    `  Escribe "${CONFIRMATION}" para continuar: `,
  );
  rl.close();

  if (answer.trim() !== CONFIRMATION) {
    console.log('\n  Cancelado. No se ha tocado nada.\n');
    process.exit(1);
  }
  console.log('');
}

const child = spawn('supabase', ['db', 'push', '--linked'], {
  stdio: 'inherit',
});

child.on('close', (code) => process.exit(code ?? 1));
