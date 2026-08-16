'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/auth/actions';
import { uploadDocumentAction } from '@/lib/candidate/document-actions';

/**
 * Subida de un documento desde el móvil.
 *
 * `capture="environment"` hace que el móvil ofrezca la cámara trasera
 * directamente para los tipos que son una foto, que es como se fotografía un
 * DNI. No se fuerza —el atributo es una sugerencia— porque el candidato que ya
 * tiene el archivo escaneado tiene que poder elegirlo del carrete igual.
 *
 * La validación de tipo y tamaño se repite en el servidor contra el catálogo.
 * La de aquí existe para no gastarle los datos móviles a alguien subiendo un
 * archivo que se va a rechazar de todos modos, no como barrera.
 */
export function DocumentUpload({
  typeId,
  acceptedMimeTypes,
  maxSizeBytes,
  photo,
  label,
}: {
  typeId: string;
  acceptedMimeTypes: string[];
  maxSizeBytes: number;
  /** Un DNI o un carné se fotografían; un CV se elige del archivo. */
  photo: boolean;
  label: string;
}) {
  const t = useTranslations('Account.documents');
  const tErrors = useTranslations('Auth.errors');

  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function submit(file: File) {
    if (file.size > maxSizeBytes) {
      setResult({ ok: false, error: 'fileTooLarge' });
      return;
    }

    const form = new FormData();
    form.set('typeId', typeId);
    form.set('file', file);

    startTransition(async () => {
      setResult(await uploadDocumentAction(null, form));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        className="sr-only"
        accept={acceptedMimeTypes.join(',')}
        capture={photo ? 'environment' : undefined}
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // El valor se limpia para que elegir dos veces el mismo archivo
          // vuelva a disparar el evento: tras un fallo, reintentar con el
          // mismo fichero es lo primero que hace cualquiera.
          event.target.value = '';
          if (file) submit(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          {pending ? t('uploading') : t('upload')}
        </Button>

        <span className="text-xs text-muted-foreground">
          {t('maxSize', {
            megabytes: Math.floor(maxSizeBytes / (1024 * 1024)),
          })}
        </span>
      </div>

      {result?.ok === false ? (
        <p className="text-sm text-destructive">{tErrors(result.error)}</p>
      ) : null}
    </div>
  );
}
