import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Cifrado de datos sensibles en la capa de aplicación (ADR-15).
 *
 * SOLO SERVIDOR. Las claves viven en variables de entorno sin prefijo
 * `NEXT_PUBLIC_`, así que este módulo no puede funcionar en el navegador ni
 * por accidente. No se importa desde ningún Client Component.
 *
 * Formato del sobre, tal y como se guarda en la base de datos:
 *
 *     v1.<keyId>.<iv en base64url>.<ciphertext+tag en base64url>
 *
 * El `keyId` viaja en claro a propósito: es lo que permite rotar la clave sin
 * reescribir la tabla entera. Se cifra con la clave activa y se descifra con
 * la que diga cada fila.
 */

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

type Keyring = {
  activeKeyId: string;
  keys: Map<string, Buffer>;
};

let cachedKeyring: Keyring | null = null;
let cachedBlindIndexKey: Buffer | null = null;

function decodeKey(raw: string, source: string): Buffer {
  const key = Buffer.from(raw, 'base64');

  if (key.length !== KEY_BYTES) {
    throw new Error(
      `${source}: la clave debe ser de ${KEY_BYTES} bytes en base64 ` +
        `(recibidos ${key.length}).`,
    );
  }

  return key;
}

function loadKeyring(): Keyring {
  if (cachedKeyring) return cachedKeyring;

  const raw = process.env.TALPASS_ENCRYPTION_KEYS;
  if (!raw) {
    throw new Error(
      'Falta TALPASS_ENCRYPTION_KEYS. Sin llavero no se puede leer ni escribir ' +
        'ningún dato cifrado. Revisa .env.local o el entorno de Vercel.',
    );
  }

  const keys = new Map<string, Buffer>();

  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf(':');
    if (separator === -1) {
      throw new Error(
        'TALPASS_ENCRYPTION_KEYS: cada entrada es "id:clave-base64".',
      );
    }

    const keyId = trimmed.slice(0, separator);
    if (!/^[a-z0-9_-]+$/.test(keyId)) {
      throw new Error(
        `TALPASS_ENCRYPTION_KEYS: identificador de clave no válido "${keyId}". ` +
          'Solo minúsculas, dígitos, guion y guion bajo: el punto separa los ' +
          'campos del sobre.',
      );
    }

    keys.set(
      keyId,
      decodeKey(
        trimmed.slice(separator + 1),
        `TALPASS_ENCRYPTION_KEYS[${keyId}]`,
      ),
    );
  }

  if (keys.size === 0) {
    throw new Error('TALPASS_ENCRYPTION_KEYS está vacío.');
  }

  const activeKeyId = process.env.TALPASS_ENCRYPTION_ACTIVE_KEY_ID ?? 'k1';
  if (!keys.has(activeKeyId)) {
    throw new Error(
      `TALPASS_ENCRYPTION_ACTIVE_KEY_ID="${activeKeyId}" no está en el llavero.`,
    );
  }

  cachedKeyring = { activeKeyId, keys };
  return cachedKeyring;
}

function loadBlindIndexKey(): Buffer {
  if (cachedBlindIndexKey) return cachedBlindIndexKey;

  const raw = process.env.TALPASS_BLIND_INDEX_KEY;
  if (!raw) {
    throw new Error(
      'Falta TALPASS_BLIND_INDEX_KEY. Es una clave distinta de las de cifrado ' +
        'a propósito: comprometer una no debe comprometer la otra.',
    );
  }

  cachedBlindIndexKey = decodeKey(raw, 'TALPASS_BLIND_INDEX_KEY');
  return cachedBlindIndexKey;
}

/**
 * Cifra un valor sensible.
 *
 * `aad` (datos autenticados adicionales) ata el criptograma a su sitio: se le
 * pasa algo como `candidate_private.iban:<candidateId>`. Si alguien con acceso
 * de escritura a la base copia el IBAN cifrado de una fila a otra, el descifrado
 * falla en lugar de devolver el dato de otra persona.
 */
export function encryptSensitive(plaintext: string, aad?: string): string {
  const { activeKeyId, keys } = loadKeyring();
  const key = keys.get(activeKeyId)!;
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const payload = Buffer.concat([ciphertext, cipher.getAuthTag()]);

  return [
    VERSION,
    activeKeyId,
    iv.toString('base64url'),
    payload.toString('base64url'),
  ].join('.');
}

export function decryptSensitive(envelope: string, aad?: string): string {
  const parts = envelope.split('.');

  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Sobre cifrado con formato desconocido.');
  }

  const [, keyId, ivPart, payloadPart] = parts;
  const { keys } = loadKeyring();
  const key = keys.get(keyId);

  if (!key) {
    throw new Error(
      `El dato está cifrado con la clave "${keyId}", que no está en el ` +
        'llavero. Nunca se retira una clave del llavero mientras quede una ' +
        'sola fila cifrada con ella.',
    );
  }

  const payload = Buffer.from(payloadPart, 'base64url');
  const tag = payload.subarray(payload.length - 16);
  const ciphertext = payload.subarray(0, payload.length - 16);

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivPart, 'base64url'),
  );
  if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * Índice ciego: HMAC-SHA256 con una clave propia.
 *
 * AES-GCM es no determinista (cada cifrado da un criptograma distinto), que es
 * justo lo que se quiere para un IBAN pero impide comprobar "¿ya existe este
 * Steuer-ID?". El HMAC sí es determinista, así que la restricción de unicidad
 * de `candidate_identifiers` funciona sin guardar un solo identificador en
 * claro. Y al ser con clave, no se puede recorrer hacia atrás probando los
 * 10^11 Steuer-ID posibles, cosa que con un SHA-256 pelado sería trivial.
 */
export function blindIndex(value: string): string {
  return createHmac('sha256', loadBlindIndexKey())
    .update(normalizeIdentifier(value), 'utf8')
    .digest('base64url');
}

export function blindIndexMatches(value: string, stored: string): boolean {
  const computed = Buffer.from(blindIndex(value));
  const expected = Buffer.from(stored);

  return (
    computed.length === expected.length && timingSafeEqual(computed, expected)
  );
}

/** Sin espacios ni guiones y en mayúsculas: "es 91 2100" y "ES912100" son lo mismo. */
export function normalizeIdentifier(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/** Últimos cuatro caracteres, para que el candidato reconozca su cuenta. */
export function last4(value: string): string {
  return normalizeIdentifier(value).slice(-4);
}

/** Solo para tests y scripts: obliga a releer el entorno. */
export function resetCryptoCache(): void {
  cachedKeyring = null;
  cachedBlindIndexKey = null;
}
