'use server';

import { revalidatePath } from 'next/cache';

import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * ⚠️ DEMO (rama demo/hindi). Acciones de la conversación. La comprobación de
 * quién puede hacer qué vive en las RPC, no aquí.
 */

function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function refresh() {
  revalidatePath('/[locale]', 'layout');
}

export async function startConversationAction(form: FormData) {
  const locale = str(form, 'locale');
  const candidateId = str(form, 'candidateId');
  const body = str(form, 'body');
  const jobId = str(form, 'jobId') || null;
  if (!body) return;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('demo_start_conversation', {
    p_candidate_id: candidateId,
    p_body: body,
    ...(jobId ? { p_job_id: jobId } : {}),
  });
  if (error) throw new Error(error.message);

  refresh();
  redirect({
    href: {
      pathname: '/agency/messages/[conversationId]',
      params: { conversationId: data as string },
    },
    locale,
  });
}

export async function sendMessageAction(form: FormData) {
  const conversationId = str(form, 'conversationId');
  const body = str(form, 'body');
  if (!body) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc('demo_send_message', {
    p_conversation_id: conversationId,
    p_body: body,
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function respondAction(form: FormData) {
  const conversationId = str(form, 'conversationId');
  const accept = str(form, 'accept') === 'yes';

  const supabase = await createClient();
  const { error } = await supabase.rpc('demo_respond', {
    p_conversation_id: conversationId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function hireAction(form: FormData) {
  const conversationId = str(form, 'conversationId');

  const supabase = await createClient();
  const { error } = await supabase.rpc('demo_hire', {
    p_conversation_id: conversationId,
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function applyAction(form: FormData) {
  const locale = str(form, 'locale');
  const jobId = str(form, 'jobId');
  const body = str(form, 'body');
  if (!body) return;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('demo_apply', {
    p_job_id: jobId,
    p_body: body,
  });
  if (error) throw new Error(error.message);

  refresh();
  redirect({
    href: {
      pathname: '/account/messages/[conversationId]',
      params: { conversationId: data as string },
    },
    locale,
  });
}
