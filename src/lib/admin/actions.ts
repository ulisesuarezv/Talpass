'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { routing, type Locale } from '@/i18n/routing';
import { isRejectionReason } from '@/lib/admin/rejection-reasons';
import {
  listCandidateDocuments,
  requiredDocumentsApproved,
} from '@/lib/candidate/documents';
import { sendVerificationDecisionEmail } from '@/lib/email/verification';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/validation';

/**
 * Aprobar y rechazar documentos. Es el trabajo del admin y el momento en el que
 * un candidato entra —o no— en la bolsa.
 *
 * Va con la **sesión del admin**: la RLS de la fase 1 ya le da UPDATE sobre
 * `candidate_documents` y sobre `candidates`, y los disparadores comprueban
 * otra vez que quien mueve una columna de revisión es un admin. Hacer esto con
 * `service_role` habría desactivado las dos comprobaciones a la vez.
 *
 * Sobre el aviso al candidato: **no puede tumbar la decisión**. Si el correo
 * falla, el documento queda aprobado o rechazado igual y el fallo se devuelve
 * como aviso para que se vea en pantalla, además de quedar en `email_log`.
 */

export type ReviewResult =
  | { ok: true; message: string; warning?: string }
  | { ok: false; error: string };

async function currentAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function refresh(): void {
  revalidatePath('/[locale]/(private)/admin', 'page');
  revalidatePath('/[locale]/(private)/admin/[candidateId]', 'page');
}

/**
 * ¿Ha quedado completo el conjunto obligatorio del país? Entonces el candidato
 * pasa a `verified` y se entera por correo.
 *
 * Se recalcula sobre el catálogo después de cada aprobación en vez de llevar
 * una cuenta: es la única forma de que añadir un requisito a un país no deje
 * verificados a quienes ya no lo estarían.
 */
async function promoteIfComplete(
  candidateId: string,
  locale: string,
): Promise<string | undefined> {
  const supabase = await createClient();

  const { data: candidate } = await supabase
    .from('candidates')
    .select('first_name, has_driving_license, verification_status')
    .eq('profile_id', candidateId)
    .maybeSingle();

  if (!candidate || candidate.verification_status === 'verified') return;

  const documents = await listCandidateDocuments(candidateId, locale, {
    hasDrivingLicense: candidate.has_driving_license,
  });

  if (!requiredDocumentsApproved(documents)) return;

  const { error } = await supabase
    .from('candidates')
    .update({ verification_status: 'verified' })
    .eq('profile_id', candidateId);

  if (error) return 'verificationNotSaved';

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, locale')
    .eq('id', candidateId)
    .maybeSingle();

  if (!profile?.email) return 'emailNotSent';

  const sent = await sendVerificationDecisionEmail({
    profileId: candidateId,
    email: profile.email,
    locale: profile.locale,
    firstName: candidate.first_name,
    approved: true,
  });

  return sent.ok ? undefined : 'emailNotSent';
}

export async function approveDocumentAction(
  _prev: ReviewResult | null,
  form: FormData,
): Promise<ReviewResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, error: 'sessionExpired' };

  const documentId = text(form, 'documentId');
  const locale = text(form, 'locale');
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from('candidate_documents')
    .update({
      status: 'verified',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', documentId)
    .select('candidate_id')
    .maybeSingle();

  if (error || !document) return { ok: false, error: 'unexpected' };

  const warning = await promoteIfComplete(document.candidate_id, locale);

  refresh();
  return { ok: true, message: 'documentApproved', warning };
}

export async function rejectDocumentAction(
  _prev: ReviewResult | null,
  form: FormData,
): Promise<ReviewResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, error: 'sessionExpired' };

  const documentId = text(form, 'documentId');
  const reason = text(form, 'reason');

  // Sin motivo no hay rechazo. Lo exige también un CHECK de la tabla, pero
  // llegar hasta allí devolvería un error de base de datos donde tiene que
  // haber una frase que explique qué falta. Y tiene que ser una clave conocida:
  // lo que se guarda aquí lo lee el candidato traducido a su idioma.
  if (!isRejectionReason(reason)) {
    return { ok: false, error: 'rejectionReasonRequired' };
  }

  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from('candidate_documents')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', documentId)
    .select('candidate_id')
    .maybeSingle();

  if (error || !document) return { ok: false, error: 'unexpected' };

  const candidateId = document.candidate_id;

  // Un documento rechazado deja al candidato en `rejected`: es el estado que
  // su propia pantalla explica con "revisa el motivo y vuelve a enviarlos".
  // Volver a subir cualquier documento lo devuelve a `pending` por disparador.
  const { data: candidate } = await supabase
    .from('candidates')
    .update({ verification_status: 'rejected' })
    .eq('profile_id', candidateId)
    .select('first_name')
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, locale')
    .eq('id', candidateId)
    .maybeSingle();

  let warning: string | undefined;

  if (profile?.email && candidate) {
    // El motivo se traduce al idioma DEL CANDIDATO, no al del admin que acaba
    // de pulsar el botón.
    const t = await getTranslations({
      locale: routing.locales.includes(profile.locale as Locale)
        ? (profile.locale as Locale)
        : routing.defaultLocale,
      namespace: 'Account.documents.rejectionReasons',
    });

    const sent = await sendVerificationDecisionEmail({
      profileId: candidateId,
      email: profile.email,
      locale: profile.locale,
      firstName: candidate.first_name,
      approved: false,
      reasons: [t(reason)],
    });

    if (!sent.ok) warning = 'emailNotSent';
  } else {
    warning = 'emailNotSent';
  }

  refresh();
  return { ok: true, message: 'documentRejected', warning };
}
