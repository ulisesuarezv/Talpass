import 'server-only';

import {
  listCandidateDocuments,
  type CandidateDocument,
} from '@/lib/candidate/documents';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Lecturas del backoffice de verificación (fase 4).
 *
 * Todo va con la **sesión del admin**, no con `service_role`: la RLS ya le da
 * lectura sobre `candidates`, `profiles` y `candidate_documents`, así que
 * saltársela aquí solo serviría para que los tests de seguridad dejaran de
 * probar el camino real. La clave de servicio se reserva para lo que ninguna
 * política puede hacer — escribir el registro de aperturas.
 */

export type QueueEntry = {
  candidateId: string;
  firstName: string;
  lastName: string;
  verificationStatus: Database['public']['Enums']['verification_status'];
  pendingCount: number;
  waitingSince: string;
};

/**
 * La cola de revisión: quién tiene documentos pendientes, **el que más lleva
 * esperando primero**. El orden no es un detalle de presentación — es la
 * promesa que se le hace al candidato en la pantalla de "en revisión".
 */
export async function listReviewQueue(): Promise<QueueEntry[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('candidate_documents')
    .select(
      'candidate_id, created_at, candidates!inner(first_name, last_name, verification_status)',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const byCandidate = new Map<string, QueueEntry>();

  for (const row of data ?? []) {
    const existing = byCandidate.get(row.candidate_id);

    if (existing) {
      existing.pendingCount += 1;
      continue;
    }

    byCandidate.set(row.candidate_id, {
      candidateId: row.candidate_id,
      firstName: row.candidates.first_name,
      lastName: row.candidates.last_name,
      verificationStatus: row.candidates.verification_status,
      pendingCount: 1,
      // La primera fila de este candidato es la más antigua: la consulta ya
      // llega ordenada.
      waitingSince: row.created_at,
    });
  }

  return [...byCandidate.values()];
}

export type CandidateFile = {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  locale: string | null;
  verificationStatus: Database['public']['Enums']['verification_status'];
  status: Database['public']['Enums']['candidate_status'];
  currentCity: string | null;
  currentCountryCode: string;
  nationalityCode: string;
  englishLevel: Database['public']['Enums']['language_level'] | null;
  hasDrivingLicense: boolean;
  documents: CandidateDocument[];
  /** Últimas aperturas registradas, para que el registro se vea, no se suponga. */
  openings: { openedAt: string; documentId: string | null }[];
};

export async function getCandidateFile(
  candidateId: string,
  locale: string,
): Promise<CandidateFile | null> {
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('profile_id', candidateId)
    .maybeSingle();

  if (!candidate) return null;

  const [{ data: profile }, documents] = await Promise.all([
    supabase
      .from('profiles')
      .select('email, locale')
      .eq('id', candidateId)
      .maybeSingle(),
    listCandidateDocuments(candidateId, locale, {
      hasDrivingLicense: candidate.has_driving_license,
    }),
  ]);

  const documentIds = documents
    .map((document) => document.documentId)
    .filter((id): id is string => id !== null);

  const { data: openings } = documentIds.length
    ? await supabase
        .from('document_access_log')
        .select('opened_at, document_id')
        .in('document_id', documentIds)
        .order('opened_at', { ascending: false })
        .limit(10)
    : { data: [] };

  return {
    candidateId,
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: profile?.email ?? null,
    locale: profile?.locale ?? null,
    verificationStatus: candidate.verification_status,
    status: candidate.status,
    currentCity: candidate.current_city,
    currentCountryCode: candidate.current_country_code,
    nationalityCode: candidate.nationality_code,
    englishLevel: candidate.english_level,
    hasDrivingLicense: candidate.has_driving_license,
    documents,
    openings: (openings ?? []).map((row) => ({
      openedAt: row.opened_at,
      documentId: row.document_id,
    })),
  };
}
