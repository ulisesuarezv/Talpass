import { NextResponse, type NextRequest } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * El único sitio del proyecto que firma la URL de un documento privado.
 *
 * Nada de lo que hay en `candidate-documents` ni en `candidate-audio` se sirve
 * con una URL pública ni con una autenticada directa: se firma aquí, con vida
 * corta, **después** de comprobar quién pide qué (ADR-05). Que la firma y el
 * registro de la apertura ocurran en el mismo paso no es comodidad — es lo que
 * hace que el registro valga como prueba.
 *
 * Quién puede abrir hoy:
 *   · el propio candidato, sus documentos;
 *   · el admin, para revisarlos, y **su apertura queda registrada** igual que
 *     la de una ETT.
 *
 * La ETT no entra por aquí. Su acceso nace de un consentimiento concreto y con
 * ventana propia, y se construye en la fase 7; hasta entonces, la lectura por
 * consentimiento existe en la RLS pero no tiene puerta de aplicación.
 *
 * Vive bajo `/api` para no atravesar i18n ni el proxy de sesión (ADR-11).
 */

/** Vida de la firma. Lo justo para abrir el archivo, no para compartirlo. */
const SIGNED_URL_TTL_SECONDS = 60;

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? (forwarded.split(',')[0]?.trim() ?? null) : null;
}

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

  // La fila llega por RLS: el candidato solo alcanza las suyas y el admin
  // todas. Si la política no lo deja pasar, aquí no hay documento y se
  // responde 404 — no 403, que confirmaría que existe.
  const { data: document } = await supabase
    .from('candidate_documents')
    .select('id, candidate_id, storage_bucket, storage_path')
    .eq('id', id)
    .maybeSingle();

  if (!document) return new NextResponse(null, { status: 404 });

  const isOwner = document.candidate_id === user.id;

  if (!isOwner) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin')
      return new NextResponse(null, { status: 404 });

    // `document_access_log` no tiene política de INSERT para ningún rol, ni
    // siquiera para el admin: la escribe el servidor. `request_id` va nulo
    // porque esta apertura no nace de un consentimiento de ADR-05, sino de la
    // revisión — y aun así se registra.
    const { error } = await createAdminClient()
      .from('document_access_log')
      .insert({
        request_id: null,
        document_id: document.id,
        opened_by: user.id,
        ip: clientIp(request),
        user_agent: request.headers.get('user-agent'),
      });

    // Sin registro no se abre. Es el orden correcto: la prueba de la apertura
    // no puede depender de que el paso siguiente salga bien.
    if (error) return new NextResponse(null, { status: 500 });
  }

  const { data: signed, error } = await supabase.storage
    .from(document.storage_bucket)
    .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS);

  if (error || !signed) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(signed.signedUrl, {
    // La respuesta lleva una URL firmada dentro: no la cachea nadie.
    headers: { 'cache-control': 'no-store' },
  });
}
