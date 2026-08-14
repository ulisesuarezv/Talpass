import {
  adminClient,
  anonClient,
  findUserIdByEmail,
  required,
} from './lib/supabase.mts';

/**
 * Mide cuántos correos deja enviar de verdad el proyecto, registrando cuentas
 * hasta que el proveedor dice que no.
 *
 *     node --env-file=.env.local scripts/probe-email-limit.mts
 *
 * El SMTP que trae Supabase de fábrica es para desarrollo y su límite es muy
 * bajo. Saber el número exacto importa porque marca el techo de altas por hora:
 * si son dos, la primera campaña de captación se muere sola y hay que adelantar
 * la configuración de Resend, hoy planificada para la fase 8.
 *
 * Se mide en lugar de suponerlo porque el límite se cambia por proyecto desde
 * el panel, así que la documentación general no vale como respuesta.
 *
 * Las cuentas de sonda se crean con alias `+` de una dirección que ya es tuya y
 * se borran al terminar, pasara lo que pasara por el camino. Deja unos pocos
 * correos de confirmación en esa bandeja: es el precio de la medición.
 */

const MAX_ATTEMPTS = 4;
const PREFIX = `smtp-probe-${Date.now()}`;

/**
 * Dirección base, con alias `+`. Tiene que ser un dominio real: el proyecto
 * alojado rechaza `.test` con `email_address_invalid` antes siquiera de
 * intentar enviar, así que ahí no se mide nada. Y el SMTP de fábrica de
 * Supabase solo entrega a las direcciones del equipo del proyecto, de modo que
 * la única que sirve es la del propio fundador.
 */
const base = process.argv[2];
if (!base || !base.includes('@')) {
  console.error(
    '\n  Uso: node --env-file=.env.local scripts/probe-email-limit.mts <correo>\n',
  );
  process.exit(1);
}
const [localPart, domain] = base.split('@');
const address = (n: number) => `${localPart}+${PREFIX}-${n}@${domain}`;

const target = new URL(required('NEXT_PUBLIC_SUPABASE_URL')).host;
const anon = anonClient();
const admin = adminClient();

const created: string[] = [];
let sent = 0;
let stoppedBy: string | null = null;

console.log(`\n  Sonda de envío de correo contra ${target}\n`);

try {
  for (let i = 1; i <= MAX_ATTEMPTS; i += 1) {
    const email = address(i);

    const { data, error } = await anon.auth.signUp({
      email,
      password: `Sonda-${PREFIX}-${i}!`,
    });

    if (data.user) created.push(email);

    if (error) {
      stoppedBy = `${error.code ?? error.status ?? 'error'}: ${error.message}`;
      console.log(`  intento ${i}: ✗ ${stoppedBy}`);
      break;
    }

    sent += 1;
    console.log(`  intento ${i}: ✓ correo aceptado`);
  }
} finally {
  for (const email of created) {
    const id = await findUserIdByEmail(admin, email);
    if (id) await admin.auth.admin.deleteUser(id);
  }
  console.log(`\n  Sondas borradas: ${created.length}`);
}

console.log(`\n  Correos aceptados seguidos: ${sent}`);
console.log(
  stoppedBy
    ? `  Se ha parado en: ${stoppedBy}\n`
    : `  No se ha alcanzado ningún límite en ${MAX_ATTEMPTS} intentos.\n`,
);
