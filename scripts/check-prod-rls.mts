import { adminClient, required } from './lib/supabase.mts';

/**
 * Comprobación de solo lectura del estado de RLS de un proyecto (ADR-17).
 *
 *     node --env-file=.env.local scripts/check-prod-rls.mts
 *
 * Existe porque la fase 1 ejecutó el simulacro de brecha contra producción. El
 * simulacro restaura lo que rompe en un `finally`, pero "debería haber
 * restaurado" no es una comprobación: esto lo pregunta al catálogo de Postgres.
 *
 * No escribe nada. No es un sustituto de `pnpm test:security`, que sí ejercita
 * las políticas de verdad y por eso solo corre en local.
 */

const admin = adminClient();

const { data, error } = await admin.rpc('rls_audit');
if (error) throw new Error(`rls_audit(): ${error.message}`);

type Row = { table_name: string; rls_enabled: boolean; policy_count: number };
const rows = (data ?? []) as Row[];

const broken = rows.filter((r) => !r.rls_enabled || Number(r.policy_count) < 1);

console.log(
  `\n  Destino: ${new URL(required('NEXT_PUBLIC_SUPABASE_URL')).host}`,
);
console.log(`  Tablas en \`public\`: ${rows.length}`);

if (broken.length > 0) {
  console.error('\n  \x1b[31mTablas sin RLS o sin políticas:\x1b[0m');
  for (const r of broken) {
    console.error(
      `    · ${r.table_name} — rls=${r.rls_enabled} políticas=${r.policy_count}`,
    );
  }
  process.exit(1);
}

const total = rows.reduce((n, r) => n + Number(r.policy_count), 0);
console.log(`  Todas con RLS activada y con política. ${total} políticas.\n`);
