import 'server-only';

import type { DocumentStatusRow } from '@/components/candidate/documents-status';
import { createClient } from '@/lib/supabase/server';

/**
 * Qué papeles se le van a pedir a este candidato y en qué estado está cada uno.
 *
 * La lista sale del catálogo por país de destino (ADR-07): hoy solo Alemania
 * está activa, y abrir los Países Bajos será insertar filas, no tocar esto.
 * Ojo con la distinción: el país que manda aquí es el mercado abierto, no la
 * nacionalidad ni dónde vive ahora el candidato.
 */
export async function listDocumentStatus(
  candidateId: string,
  locale: string,
): Promise<DocumentStatusRow[]> {
  const supabase = await createClient();

  const [{ data: requirements }, { data: documents }] = await Promise.all([
    supabase
      .from('country_document_requirements')
      // Una sola cadena literal, sin concatenar: supabase-js deduce el tipo del
      // resultado a partir del texto del `select`, y un `+` lo deja en `any`.
      .select(
        'is_required, sort_order, countries!inner(is_active), document_types!inner(id, slug, is_active, document_type_translations(locale, name))',
      )
      .eq('countries.is_active', true)
      .eq('document_types.is_active', true)
      .order('sort_order'),
    supabase
      .from('candidate_documents')
      .select('document_type_id, status')
      .eq('candidate_id', candidateId),
  ]);

  const byType = new Map(
    (documents ?? []).map((d) => [d.document_type_id, d.status]),
  );

  const seen = new Set<string>();
  const rows: DocumentStatusRow[] = [];

  for (const requirement of requirements ?? []) {
    const type = requirement.document_types;
    if (!type || seen.has(type.id)) continue;
    seen.add(type.id);

    const translations = type.document_type_translations ?? [];
    const match =
      translations.find((t) => t.locale === locale) ?? translations[0];

    rows.push({
      slug: type.slug,
      label: match?.name ?? type.slug,
      required: requirement.is_required,
      status: (byType.get(type.id) as DocumentStatusRow['status']) ?? 'missing',
    });
  }

  return rows;
}
