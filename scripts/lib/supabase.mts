import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Clientes de Supabase para scripts de línea de comandos (semilla y tests de
 * seguridad). No comparten código con `src/lib/supabase/*`, que está atado al
 * ciclo de vida de peticiones de Next.
 */

export function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. ` +
        'Los scripts se ejecutan con `node --env-file=.env.local`.',
    );
  }

  return value;
}

/**
 * Guardarraíl de destino (ADR-17). Lo comprueban los scripts que escriben datos
 * falsos o que tocan políticas: solo pueden apuntar a la base LOCAL.
 *
 * Se mira el **host real** al que se va a conectar, no el dominio del sitio ni
 * ninguna otra variable de adorno: el único hecho que importa es contra qué
 * Postgres se ejecuta la sentencia. La versión anterior de esta comprobación
 * miraba `NEXT_PUBLIC_SITE_URL`, que no tiene nada que ver con la base de
 * datos, y por eso la fase 1 sembró candidatos falsos en producción creyendo
 * estar protegida.
 *
 * La salida de emergencia es una variable con un valor largo y explícito: no se
 * teclea por costumbre ni se hereda de un `.env` sin darse cuenta.
 */
const ESCAPE_HATCH = 'TALPASS_ALLOW_PRODUCTION_WRITES';
const ESCAPE_VALUE = 'si-se-lo-que-hago-y-es-produccion';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

function hostnameOf(raw: string, name: string): string {
  try {
    // Los corchetes de una IPv6 literal no forman parte del host.
    return new URL(raw).hostname.replace(/^\[|\]$/g, '');
  } catch {
    throw new Error(`${name} no es una URL válida: "${raw}".`);
  }
}

export function assertLocalTarget(operation: string): void {
  const targets: Array<{ name: string; host: string }> = [];

  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_DB_URL']) {
    const raw = process.env[name];
    if (raw) targets.push({ name, host: hostnameOf(raw, name) });
  }

  if (targets.length === 0) {
    throw new Error(
      `${operation}: no hay ni NEXT_PUBLIC_SUPABASE_URL ni SUPABASE_DB_URL, ` +
        'así que no se puede comprobar el destino. Se aborta.',
    );
  }

  const remote = targets.filter((t) => !LOCAL_HOSTNAMES.has(t.host));
  if (remote.length === 0) return;

  if (process.env[ESCAPE_HATCH] === ESCAPE_VALUE) {
    console.log(
      `\x1b[33m⚠ ${operation} contra un destino REMOTO ` +
        `(${remote.map((t) => t.host).join(', ')}), con ${ESCAPE_HATCH} ` +
        'puesta a mano.\x1b[0m',
    );
    return;
  }

  throw new Error(
    `${operation}: el destino no es local.\n` +
      remote.map((t) => `  · ${t.name} → ${t.host}`).join('\n') +
      '\n\nEste script escribe datos falsos o desactiva políticas de RLS. ' +
      'Contra el proyecto de producción eso es una brecha o una pérdida de ' +
      'datos (ADR-17).\n' +
      'Arranca la base local con `pnpm db:start` y usa su fichero de entorno.\n' +
      `Si de verdad es lo que quieres: ${ESCAPE_HATCH}=${ESCAPE_VALUE}`,
  );
}

/** Salta la RLS. Solo para sembrar y para las comprobaciones de catálogo. */
export function adminClient(): SupabaseClient {
  return createClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Sin sesión: es lo que ve un visitante anónimo. */
export function anonClient(): SupabaseClient {
  return createClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Un cliente autenticado de verdad, con su JWT. Los tests NO simulan roles:
 * hacen login como cada usuario y hablan con la misma API que usará la
 * aplicación. Es la única forma de que el test pruebe lo que dice probar.
 */
export async function signInAs(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = anonClient();

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(
      `No se pudo iniciar sesión como ${email}: ${error.message}`,
    );
  }

  return client;
}

export async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match.id;

    if (data.users.length < 200) return null;
  }

  return null;
}
