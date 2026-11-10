import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * ⚠️ DEMO (rama demo/hindi). Lectura de la conversación ETT ↔ candidato. Todo
 * pasa por RPC SECURITY DEFINER: la base decide qué ve cada lado.
 */

export type ConversationStatus = 'pending' | 'open' | 'declined' | 'hired';

export type ConversationSummary = {
  id: string;
  status: ConversationStatus;
  origin: 'outreach' | 'application';
  jobId: string | null;
  candidateId: string;
  candidateName: string;
  agencyName: string;
  jobTitle: string | null;
  lastBody: string | null;
  lastSender: 'agency' | 'candidate' | null;
  lastAt: string | null;
};

export type ConversationJob = {
  id: string;
  slug: string;
  city: string | null;
  title: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: 'hour' | 'month' | null;
  shifts: string[];
  weekly_hours: number | null;
  housing_provided: boolean;
  transport_provided: boolean;
  start_date: string | null;
};

export type ConversationMessage = {
  id: string;
  sender: 'agency' | 'candidate';
  mine: boolean;
  body: string;
  masked: boolean;
  created_at: string;
};

export type ConversationDocument = {
  id: string;
  slug: string;
  name: string | null;
  mime: string;
};

export type Conversation = {
  id: string;
  side: 'agency' | 'candidate' | 'admin';
  status: ConversationStatus;
  origin: 'outreach' | 'application';
  candidate_id: string;
  candidate_name: string;
  agency_name: string;
  job: ConversationJob | null;
  contact: {
    email: string | null;
    phone: string | null;
    documents: ConversationDocument[];
  } | null;
  messages: ConversationMessage[];
};

export async function listConversations(
  locale: string,
): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('demo_list_conversations', {
    p_locale: locale,
  });
  if (error) throw new Error(`Conversaciones: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status as ConversationStatus,
    origin: row.origin as ConversationSummary['origin'],
    jobId: row.job_id,
    candidateId: row.candidate_id,
    candidateName: row.candidate_name,
    agencyName: row.agency_name,
    jobTitle: row.job_title,
    lastBody: row.last_body,
    lastSender: row.last_sender as ConversationSummary['lastSender'],
    lastAt: row.last_at,
  }));
}

export async function getConversation(
  id: string,
  locale: string,
): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('demo_get_conversation', {
    p_conversation_id: id,
    p_locale: locale,
  });
  if (error) throw new Error(`Conversación: ${error.message}`);
  return (data as Conversation | null) ?? null;
}

export async function conversationWith(
  candidateId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('demo_conversation_for', {
    p_candidate_id: candidateId,
  });
  if (error) throw new Error(`Conversación con candidato: ${error.message}`);
  return (data as string | null) ?? null;
}

export async function listAgencyJobs(
  locale: string,
): Promise<{ id: string; title: string; city: string | null }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('demo_agency_jobs', {
    p_locale: locale,
  });
  if (error) throw new Error(`Ofertas de la agencia: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title ?? '',
    city: row.city,
  }));
}

/** La conversación que el candidato ya tiene por esta oferta, si se postuló. */
export async function myApplication(jobId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('demo_my_application', {
    p_job_id: jobId,
  });
  if (error) throw new Error(`Postulación: ${error.message}`);
  return (data as string | null) ?? null;
}
