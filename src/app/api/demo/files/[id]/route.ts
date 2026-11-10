import { NextResponse, type NextRequest } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * ⚠️ DEMO (rama demo/hindi). Abre un papel del candidato para la ETT que lo ha
 * contratado en la demo. La base decide (`demo_hired_document`); el servidor
 * firma y deja la apertura registrada, como en `/api/documents/[id]`.
 */

/** Diez minutos: el reproductor de audio vuelve a pedir trozos al avanzar. */
const SIGNED_URL_TTL_SECONDS = 600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const { data } = await supabase.rpc('demo_hired_document', {
    p_document_id: id,
  });
  const file = data?.[0];
  if (!file) return new NextResponse(null, { status: 404 });

  const admin = createAdminClient();
  await admin.from('document_access_log').insert({
    request_id: null,
    document_id: id,
    opened_by: user.id,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    user_agent: request.headers.get('user-agent'),
  });

  const { data: signed, error } = await admin.storage
    .from(file.bucket)
    .createSignedUrl(file.path, SIGNED_URL_TTL_SECONDS);
  if (error || !signed) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(signed.signedUrl, {
    headers: { 'cache-control': 'no-store' },
  });
}
