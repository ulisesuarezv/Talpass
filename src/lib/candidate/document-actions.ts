'use server';

import { revalidatePath } from 'next/cache';

import type { ActionResult } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/validation';

/**
 * Subida de documentos del candidato.
 *
 * El archivo pasa por el servidor a propósito, en vez de ir del navegador
 * directo a storage: así el límite de tamaño y la lista de tipos aceptados se
 * comprueban en un sitio que el candidato no controla. El bucket los vuelve a
 * aplicar por su cuenta y la RLS de storage exige que la carpeta sea la suya —
 * son tres barreras, y ninguna sobra: un endpoint de subida sin límite es un
 * problema el primer día, no en la fase de endurecimiento.
 *
 * Nada aquí usa `service_role`: la subida ocurre con la sesión del propio
 * candidato. Si funcionara sin política que la ampare, sería un fallo del
 * schema, no de esta capa.
 */

/**
 * Techo absoluto, por debajo del `serverActions.bodySizeLimit` de
 * `next.config.ts`. El límite que manda es el del catálogo; este es la red por
 * si algún tipo de documento se configura con un tamaño disparatado.
 *
 * No se exporta: un fichero `'use server'` solo puede exportar funciones
 * asíncronas, y el navegador ya recibe el límite real de cada tipo.
 */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
};

function extensionFor(mimeType: string, fileName: string): string {
  const known = EXTENSIONS[mimeType];
  if (known) return known;

  const fromName = fileName.split('.').pop();
  return fromName && /^[a-z0-9]{1,5}$/i.test(fromName)
    ? fromName.toLowerCase()
    : 'bin';
}

/**
 * El navegador manda el tipo, así que no se puede creer sin más: llega en la
 * petición y el candidato puede escribir lo que quiera. Se compara contra el
 * catálogo, y storage lo vuelve a mirar por su cuenta al recibir el objeto.
 */
function mimeTypeOf(file: File): string {
  return (file.type || '').split(';')[0]!.trim().toLowerCase();
}

export async function uploadDocumentAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'sessionExpired' };

  const typeId = text(form, 'typeId');
  const file = form.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'fileMissing' };
  }

  // El tipo tiene que ser uno de los que pide un país abierto. Sin esta
  // comprobación, un `typeId` escrito a mano podría colar un documento de un
  // catálogo desactivado o de un mercado que todavía no existe.
  const { data: requirement } = await supabase
    .from('country_document_requirements')
    .select(
      'document_types!inner(id, slug, storage_bucket, accepted_mime_types, max_size_bytes, is_active), countries!inner(is_active)',
    )
    .eq('document_type_id', typeId)
    .eq('countries.is_active', true)
    .eq('document_types.is_active', true)
    .limit(1)
    .maybeSingle();

  const type = requirement?.document_types;
  if (!type) return { ok: false, error: 'documentTypeUnknown' };

  const mimeType = mimeTypeOf(file);
  if (!type.accepted_mime_types.includes(mimeType)) {
    return { ok: false, error: 'fileTypeNotAccepted' };
  }

  const limit = Math.min(type.max_size_bytes, MAX_UPLOAD_BYTES);
  if (file.size > limit) return { ok: false, error: 'fileTooLarge' };

  // Documento vigente del mismo tipo. Un aprobado no se pisa desde aquí: si el
  // candidato quiere cambiarlo, lo pide y el admin lo rechaza primero. Así el
  // sello de verificación no depende de un archivo que ya nadie ha mirado.
  const { data: live } = await supabase
    .from('candidate_documents')
    .select('id, status, storage_bucket, storage_path')
    .eq('candidate_id', user.id)
    .eq('document_type_id', type.id)
    .neq('status', 'rejected')
    .maybeSingle();

  if (live?.status === 'verified') {
    return { ok: false, error: 'documentAlreadyVerified' };
  }

  const path = `${user.id}/${type.slug}-${Date.now()}.${extensionFor(
    mimeType,
    file.name,
  )}`;

  const upload = await supabase.storage
    .from(type.storage_bucket)
    .upload(path, file, { contentType: mimeType, upsert: false });

  if (upload.error) return { ok: false, error: 'uploadFailed' };

  // Volver a subir un documento pendiente **actualiza la fila que ya existe**,
  // no crea otra. Hay un índice único parcial que impide dos documentos vivos
  // del mismo tipo, y además así no hay ni un instante en el que el candidato
  // se quede sin documento por un fallo a mitad de camino.
  const { error } = live
    ? await supabase
        .from('candidate_documents')
        .update({
          storage_bucket: type.storage_bucket,
          storage_path: path,
          mime_type: mimeType,
          size_bytes: file.size,
        })
        .eq('id', live.id)
    : await supabase.from('candidate_documents').insert({
        candidate_id: user.id,
        document_type_id: type.id,
        storage_bucket: type.storage_bucket,
        storage_path: path,
        mime_type: mimeType,
        size_bytes: file.size,
      });

  if (error) {
    // El archivo está arriba pero ninguna fila apunta a él: sin fila nadie lo
    // revisará nunca. Un objeto huérfano en un bucket privado es un dato
    // personal sin dueño ni caducidad, así que se retira.
    await supabase.storage.from(type.storage_bucket).remove([path]);
    return { ok: false, error: 'unexpected' };
  }

  if (live) {
    await supabase.storage
      .from(live.storage_bucket)
      .remove([live.storage_path]);
  }

  revalidatePath('/[locale]/(private)/account', 'page');
  return { ok: true, message: 'documentUploaded' };
}
