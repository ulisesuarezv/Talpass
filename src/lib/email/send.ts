import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * El ÚNICO punto de envío de correo de la aplicación (fase 4).
 *
 * Hasta ahora todo el correo salía de Supabase Auth —confirmación de registro y
 * recuperación de contraseña—, que no pasa por aquí. El aviso de verificación
 * aprobada o rechazada es el primer correo que manda el producto, y se monta
 * como un solo punto a propósito: la fase 8 tiene que dar forma a las
 * plantillas y afinar el log, no desmontar envíos repartidos por las acciones.
 *
 * Lo que esta función garantiza y la fase 8 no debe perder:
 *   · **No lanza nunca.** Devuelve el resultado. Un fallo de correo no puede
 *     tumbar la operación que lo dispara: si el admin aprueba a un candidato,
 *     el candidato queda aprobado aunque el proveedor esté caído.
 *   · **Deja rastro siempre**, en `email_log`, con `sent` o `failed` y el
 *     motivo. Un fallo que solo existe en la consola del servidor no es
 *     visible para nadie.
 *   · **No conoce ni un texto.** El asunto y el cuerpo llegan traducidos desde
 *     `messages/` (ADR-01).
 *
 * Transporte, elegido por entorno y sin condicionales repartidos:
 *   · `EMAIL_DEV_INBOX_URL` (Mailpit, solo local) → se entrega ahí y no sale a
 *     internet. Es lo que permite probar el ciclo entero sin credencial real.
 *   · si no, la API de Resend con `RESEND_API_KEY`.
 */

export type EmailTemplate =
  'candidate_verification_approved' | 'candidate_verification_rejected';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  template: EmailTemplate;
  locale: string;
  /** Para poder cruzar el envío con la persona. Se copia el correo igualmente. */
  profileId?: string | null;
};

export type SendEmailResult =
  { ok: true; providerId: string | null } | { ok: false; error: string };

function sender(): { email: string; name: string } {
  return {
    // El remitente es configuración, como la marca (ADR-12). El dominio
    // verificado en Resend es `updates.talpass.eu`, no el apex: un remitente
    // fuera de un dominio verificado se rechaza entero.
    email: process.env.EMAIL_FROM ?? 'no-reply@updates.talpass.eu',
    name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Talpass',
  };
}

async function deliverToDevInbox(
  inboxUrl: string,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const from = sender();

  const response = await fetch(`${inboxUrl.replace(/\/$/, '')}/api/v1/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      From: { Email: from.email, Name: from.name },
      To: [{ Email: input.to }],
      Subject: input.subject,
      Text: input.text,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `Buzón de desarrollo: ${response.status} ${await response.text()}`,
    };
  }

  const body = (await response.json().catch(() => null)) as {
    ID?: string;
  } | null;

  return { ok: true, providerId: body?.ID ?? null };
}

async function deliverWithResend(
  apiKey: string,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const from = sender();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: `${from.name} <${from.email}>`,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    name?: string;
  } | null;

  if (!response.ok) {
    return {
      ok: false,
      error: `Resend ${response.status}: ${body?.message ?? body?.name ?? 'sin detalle'}`,
    };
  }

  return { ok: true, providerId: body?.id ?? null };
}

async function record(
  input: SendEmailInput,
  result: SendEmailResult,
): Promise<void> {
  // `email_log` no tiene política de INSERT para ningún rol: es traza del
  // servidor, igual que `document_access_log`.
  const supabase = createAdminClient();

  const { error } = await supabase.from('email_log').insert({
    profile_id: input.profileId ?? null,
    recipient_email: input.to,
    template: input.template,
    locale: input.locale,
    provider_id: result.ok ? result.providerId : null,
    status: result.ok ? 'sent' : 'failed',
    error: result.ok ? null : result.error,
    sent_at: result.ok ? new Date().toISOString() : null,
  });

  if (error) {
    // Si ni siquiera se puede registrar el envío, queda la consola del
    // servidor. No se propaga: seguimos sin poder tumbar la operación de
    // arriba por un problema de trazabilidad.
    console.error('[email] no se pudo registrar el envío en email_log', error);
  }
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  let result: SendEmailResult;

  try {
    const devInbox = process.env.EMAIL_DEV_INBOX_URL;
    const apiKey = process.env.RESEND_API_KEY;

    if (devInbox) {
      result = await deliverToDevInbox(devInbox, input);
    } else if (apiKey) {
      result = await deliverWithResend(apiKey, input);
    } else {
      result = {
        ok: false,
        error:
          'Sin transporte de correo: falta RESEND_API_KEY (o EMAIL_DEV_INBOX_URL en local).',
      };
    }
  } catch (error) {
    result = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (!result.ok) {
    console.error(`[email] ${input.template} → ${input.to}: ${result.error}`);
  }

  await record(input, result);

  return result;
}
