/**
 * Arnés mínimo para los tests de seguridad. Sin dependencias: lo que se prueba
 * aquí no puede depender de que un runner de terceros se comporte.
 */

export type Check = {
  name: string;
  run: () => Promise<void>;
};

export class Suite {
  private readonly checks: Check[] = [];
  private currentSection = '';
  private readonly sections = new Map<string, Check[]>();

  section(title: string): void {
    this.currentSection = title;
    if (!this.sections.has(title)) this.sections.set(title, []);
  }

  check(name: string, run: () => Promise<void>): void {
    const check = { name, run };
    this.checks.push(check);
    this.sections.get(this.currentSection)!.push(check);
  }

  async run(): Promise<number> {
    let failed = 0;
    let passed = 0;

    for (const [title, checks] of this.sections) {
      console.log(`\n${title}`);

      for (const check of checks) {
        try {
          await check.run();
          passed += 1;
          console.log(`  \x1b[32m✓\x1b[0m ${check.name}`);
        } catch (error) {
          failed += 1;
          const message =
            error instanceof Error ? error.message : String(error);
          console.log(`  \x1b[31m✗ ${check.name}\x1b[0m`);
          console.log(`      ${message.split('\n').join('\n      ')}`);
        }
      }
    }

    console.log('');
    if (failed === 0) {
      console.log(`\x1b[32m${passed} comprobaciones superadas.\x1b[0m`);
      return 0;
    }

    console.log(
      `\x1b[31m${failed} de ${passed + failed} comprobaciones HAN FALLADO.\x1b[0m`,
    );
    console.log(
      '\x1b[31mNo despliegues. Una política rota aquí es una brecha de datos ' +
        'personales, no un test en rojo.\x1b[0m',
    );
    return 1;
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type QueryResult = { data: unknown; error: { message: string } | null };

/** La consulta devuelve cero filas (o falla). Es la forma normal de "denegado". */
export function assertNoRows(result: QueryResult, message: string): void {
  if (result.error) return;

  const rows = Array.isArray(result.data)
    ? result.data
    : result.data == null
      ? []
      : [result.data];

  assert(
    rows.length === 0,
    `${message} — se devolvieron ${rows.length} filas: ` +
      `${JSON.stringify(rows).slice(0, 400)}`,
  );
}

/** La escritura tiene que ser rechazada: por error o por no afectar a nada. */
export function assertWriteDenied(result: QueryResult, message: string): void {
  if (result.error) return;

  const rows = Array.isArray(result.data) ? result.data : [];
  assert(rows.length === 0, `${message} — la escritura SÍ se aplicó.`);
}

export function assertFails(result: QueryResult, message: string): void {
  assert(result.error != null, `${message} — la operación no dio error.`);
}

export function assertOk(result: QueryResult, message: string): void {
  assert(
    result.error == null,
    `${message} — ${result.error?.message ?? 'error desconocido'}`,
  );
}

export function rows(result: QueryResult, context: string): unknown[] {
  assertOk(result, context);
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Busca una cadena en TODA la respuesta, mire donde mire. Es la red que caza
 * la fuga que no se te ocurrió: da igual por qué columna, join o vista haya
 * llegado el apellido, si está en el JSON, el test se pone rojo.
 */
export function assertAbsent(
  payload: unknown,
  needles: string[],
  message: string,
): void {
  const serialized = JSON.stringify(payload ?? null);

  for (const needle of needles) {
    assert(
      !serialized.toLowerCase().includes(needle.toLowerCase()),
      `${message} — apareció "${needle}" en la respuesta.`,
    );
  }
}
