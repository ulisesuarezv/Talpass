import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

/**
 * Qué papeles se le piden a un candidato, en qué estado está cada uno y con qué
 * límites se aceptan.
 *
 * La lista sale del **catálogo por país** de destino (ADR-07): hoy solo
 * Alemania está activa, y abrir los Países Bajos será insertar filas, no tocar
 * esto. Ojo con la distinción: el país que manda aquí es el mercado abierto, no
 * la nacionalidad ni dónde vive ahora el candidato.
 *
 * Los límites de tamaño y los tipos aceptados también son catálogo, y son los
 * que validan tanto el formulario como la Server Action. El bucket de storage
 * los vuelve a aplicar por su cuenta: un límite que solo vive en el navegador
 * no es un límite.
 */

export type DocumentStatus = 'missing' | 'pending' | 'verified' | 'rejected';

export type CandidateDocument = {
  typeId: string;
  slug: string;
  label: string;
  help: string | null;
  required: boolean;
  bucket: string;
  acceptedMimeTypes: string[];
  maxSizeBytes: number;
  status: DocumentStatus;
  documentId: string | null;
  rejectionReason: string | null;
  storagePath: string | null;
  uploadedAt: string | null;
};

/**
 * El carné no es un requisito del país: es un papel que solo tiene sentido
 * pedirle a quien ha declarado tenerlo. Es la única coincidencia hoy entre un
 * tipo de documento y un atributo del candidato; si aparece una segunda, el
 * enganche pasa a ser una columna del catálogo y deja de estar aquí.
 */
const DRIVING_LICENSE_SLUG = 'driving_license';

type Client = SupabaseClient<Database>;

export async function listCandidateDocuments(
  candidateId: string,
  locale: string,
  options: { hasDrivingLicense?: boolean; client?: Client } = {},
): Promise<CandidateDocument[]> {
  const supabase = options.client ?? (await createClient());

  const [{ data: requirements }, { data: documents }] = await Promise.all([
    supabase
      .from('country_document_requirements')
      // Una sola cadena literal, sin concatenar: supabase-js deduce el tipo del
      // resultado a partir del texto del `select`, y un `+` lo deja en `any`.
      .select(
        'is_required, sort_order, countries!inner(is_active), document_types!inner(id, slug, is_active, storage_bucket, accepted_mime_types, max_size_bytes, document_type_translations(locale, name, help_text))',
      )
      .eq('countries.is_active', true)
      .eq('document_types.is_active', true)
      .order('sort_order'),
    supabase
      .from('candidate_documents')
      .select(
        'id, document_type_id, status, rejection_reason, storage_path, created_at',
      )
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false }),
  ]);

  // Un tipo puede tener varias filas si hubo rechazos: la vigente es la más
  // reciente que no esté rechazada, y si no hay ninguna, el último rechazo —
  // que es justo lo que el candidato necesita leer para volver a subirlo.
  const byType = new Map<string, NonNullable<typeof documents>[number]>();
  for (const document of documents ?? []) {
    const current = byType.get(document.document_type_id);
    if (!current) {
      byType.set(document.document_type_id, document);
      continue;
    }
    if (current.status === 'rejected' && document.status !== 'rejected') {
      byType.set(document.document_type_id, document);
    }
  }

  const seen = new Set<string>();
  const rows: CandidateDocument[] = [];

  for (const requirement of requirements ?? []) {
    const type = requirement.document_types;
    if (!type || seen.has(type.id)) continue;
    seen.add(type.id);

    if (
      type.slug === DRIVING_LICENSE_SLUG &&
      options.hasDrivingLicense === false
    ) {
      continue;
    }

    const translations = type.document_type_translations ?? [];
    const match =
      translations.find((t) => t.locale === locale) ?? translations[0];

    const document = byType.get(type.id) ?? null;

    rows.push({
      typeId: type.id,
      slug: type.slug,
      label: match?.name ?? type.slug,
      help: match?.help_text ?? null,
      required: requirement.is_required,
      bucket: type.storage_bucket,
      acceptedMimeTypes: type.accepted_mime_types,
      maxSizeBytes: type.max_size_bytes,
      status: (document?.status as DocumentStatus) ?? 'missing',
      documentId: document?.id ?? null,
      rejectionReason: document?.rejection_reason ?? null,
      storagePath: document?.storage_path ?? null,
      uploadedAt: document?.created_at ?? null,
    });
  }

  return rows;
}

/**
 * ¿Está el conjunto OBLIGATORIO del país completo y aprobado?
 *
 * Es la condición para que el candidato pase a `verified`, y se calcula sobre
 * el catálogo, no sobre una lista escrita en el código: el día que Alemania
 * pida un papel más, la respuesta cambia sola.
 */
export function requiredDocumentsApproved(rows: CandidateDocument[]): boolean {
  const required = rows.filter((row) => row.required);
  return (
    required.length > 0 && required.every((row) => row.status === 'verified')
  );
}
