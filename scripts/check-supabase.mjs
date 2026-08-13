/**
 * Verificación de conexión a Supabase. `pnpm check:supabase`
 *
 * No crea nada ni lee ninguna tabla del proyecto: solo comprueba que las claves
 * son válidas y que el endpoint responde. No imprime ninguna clave.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    '✗ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  );
  process.exit(1);
}

const supabase = createClient(url, anonKey);

// `getSession` sin sesión devuelve `{ session: null }` sin error: prueba de que
// el cliente se instancia y habla con el proyecto.
const { error: authError } = await supabase.auth.getSession();
if (authError) {
  console.error('✗ Auth:', authError.message);
  process.exit(1);
}

// Consulta a una tabla inexistente: con clave válida responde PGRST205
// ("no existe la tabla"); con clave inválida respondería 401.
const { error: restError } = await supabase
  .from('__connectivity_probe')
  .select('*')
  .limit(1);

if (restError && restError.code !== 'PGRST205') {
  console.error(`✗ REST: [${restError.code ?? '?'}] ${restError.message}`);
  process.exit(1);
}

const host = new URL(url).host;
console.log(`✓ Supabase alcanzable en ${host}`);
console.log('✓ Auth (GoTrue) responde');
console.log('✓ REST (PostgREST) acepta la anon key');
console.log('  Sin schema todavía: es lo esperado en la fase 0.');
