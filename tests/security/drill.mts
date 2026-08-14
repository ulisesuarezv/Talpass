import { spawn } from 'node:child_process';

import pg from 'pg';

import { assertLocalTarget, required } from '../../scripts/lib/supabase.mts';

/**
 * SIMULACRO DE BRECHA — el test de los tests.
 *
 *     pnpm test:security:drill
 *
 * Unos tests de seguridad que nadie ha visto fallar no demuestran nada:
 * demuestran que el código se ejecuta. Este script rompe una política a
 * propósito, ejecuta la batería entera y EXIGE que se ponga roja. Luego
 * restaura lo que rompió y vuelve a exigir el verde.
 *
 * Si un simulacro sale verde, el problema no es la política: es que el test
 * que debía cazarla no la estaba mirando.
 *
 * Restaura SIEMPRE, incluso si algo revienta por el medio (`finally`). Si aun
 * así quedara algo roto, `supabase db reset` o reaplicar las migraciones deja
 * el esquema como estaba: todo esto vive en migraciones, no en el panel.
 *
 * SOLO CONTRA LA BASE LOCAL (ADR-17). Entre que rompe una política y la
 * restaura, la base está realmente abierta; y si el proceso muere por el medio,
 * se queda así. Contra producción eso es una brecha de documentos de identidad
 * y de IBAN, así que se comprueba el destino antes de abrir una sola conexión.
 */

assertLocalTarget('El simulacro de brecha');

/**
 * El hijo hereda el destino del padre. Si aquí pusiera `.env.local` —como hacía
 * la fase 1— el simulacro rompería las políticas de la base local y luego
 * pasaría la batería contra producción: dos bases distintas y un verde que no
 * significa nada.
 */
const ENV_FILE = process.env.TALPASS_ENV_FILE ?? '.env.test';

type Drill = {
  name: string;
  why: string;
  /** Lo que rompe. */
  break_: string;
  /** Lo que lo deja como estaba. */
  restore: string;
};

const drills: Drill[] = [
  {
    name: 'Política permisiva de más en `candidates`',
    why:
      'Alguien añade un `using (true)` "temporal" para depurar y lo olvida. ' +
      'La ETT pasa a leer apellidos y fechas de nacimiento.',
    break_: `create policy drill_leak on public.candidates
               for select to authenticated using (true);`,
    restore: 'drop policy if exists drill_leak on public.candidates;',
  },
  {
    name: 'Storage sin la comprobación de consentimiento',
    why:
      'Se retoca la política del bucket y se pierde el `granted`. La ETT ' +
      'descarga documentos de cualquiera.',
    break_: `drop policy if exists candidate_files_agency_granted_read
               on storage.objects;
             create policy candidate_files_agency_granted_read
               on storage.objects for select to authenticated
               using (bucket_id in ('candidate-documents', 'candidate-audio'));`,
    restore: `drop policy if exists candidate_files_agency_granted_read
                on storage.objects;
              create policy candidate_files_agency_granted_read
                on storage.objects for select to authenticated
                using (
                  bucket_id in ('candidate-documents', 'candidate-audio')
                  and app.agency_can_read_object(bucket_id, name)
                );`,
  },
  {
    name: 'Sin el disparador que impide autoverificarse',
    why:
      'La RLS deja al candidato editar su ficha; lo único que le impide ' +
      'marcarse como verificado y entrar en la bolsa es este disparador.',
    break_: `drop trigger if exists candidate_documents_guard_review
               on public.candidate_documents;
             drop trigger if exists candidates_guard_privileged_columns
               on public.candidates;`,
    restore: `create trigger candidate_documents_guard_review
                before insert or update on public.candidate_documents
                for each row execute function app.guard_document_review_columns();
              create trigger candidates_guard_privileged_columns
                before insert or update on public.candidates
                for each row execute function app.guard_candidate_privileged_columns();`,
  },
];

// La base local de `supabase start` no habla TLS; el proyecto alojado lo exige.
const dbUrl = required('SUPABASE_DB_URL');
const isLocalDb = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(
  new URL(dbUrl).hostname,
);

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  max: 1,
});

async function sql(statement: string): Promise<void> {
  await pool.query(statement);
}

/** Ejecuta la batería en un proceso aparte y devuelve su código de salida. */
function runSuite(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [`--env-file=${ENV_FILE}`, 'tests/security/run.mts'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));

    child.on('close', (code) => {
      const failures = output
        .split('\n')
        .filter((line) => line.includes('✗'))
        .map((line) => `      ${line.trim()}`);

      if (failures.length > 0) {
        console.log(failures.slice(0, 8).join('\n'));
      }
      resolve(code ?? 1);
    });
  });
}

let broken = 0;

console.log(
  'SIMULACRO DE BRECHA — se rompe una política y se espera el rojo.\n',
);

for (const drill of drills) {
  console.log(`\x1b[1m${drill.name}\x1b[0m`);
  console.log(`  ${drill.why}`);

  try {
    await sql(drill.break_);
    console.log('  · política rota, ejecutando la batería…');

    const code = await runSuite();

    if (code === 0) {
      broken += 1;
      console.log(
        `  \x1b[31m✗ LA BATERÍA HA PASADO CON LA POLÍTICA ROTA.\x1b[0m\n` +
          `    Falta un test que cubra esto. Escríbelo antes de seguir.`,
      );
    } else {
      console.log('  \x1b[32m✓ la batería lo ha cazado\x1b[0m');
    }
  } finally {
    await sql(drill.restore);
    console.log('  · política restaurada\n');
  }
}

console.log('Comprobando que todo ha quedado como estaba…');
const finalCode = await runSuite();

if (finalCode !== 0) {
  broken += 1;
  console.log(
    '\x1b[31m✗ La batería NO vuelve a verde: el simulacro ha dejado algo ' +
      'roto. Reaplica las migraciones.\x1b[0m',
  );
} else {
  console.log('\x1b[32m✓ todo restaurado y en verde\x1b[0m');
}

await pool.end();
process.exit(broken === 0 ? 0 : 1);
