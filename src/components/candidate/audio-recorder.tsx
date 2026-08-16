'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/auth/actions';
import { uploadDocumentAction } from '@/lib/candidate/document-actions';

/**
 * Grabación de la presentación en inglés, en el propio navegador (ADR-18).
 *
 * Es el activo comercial de la bolsa: es lo que permite a una ETT juzgar el
 * inglés de alguien sin pedirle todavía sus documentos. Por eso el ciclo
 * grabar → escuchar → descartar → volver a grabar tiene que ser trivial: nadie
 * acierta a la primera hablando en un idioma que no es el suyo, y una
 * grabación que da vergüenza no se envía.
 *
 * Nada sube hasta que el candidato pulsa enviar. Y queda el camino de subir un
 * archivo ya grabado, para el navegador sin `MediaRecorder` o sin permiso de
 * micrófono — que en móvil es más común de lo que parece.
 */

/** El primero que soporte el navegador. Safari solo entiende `mp4`. */
const PREFERRED_TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg'];

const EXTENSION: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
};

function supportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return (
    PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
  );
}

export function AudioRecorder({
  typeId,
  acceptedMimeTypes,
  maxSizeBytes,
  label,
}: {
  typeId: string;
  acceptedMimeTypes: string[];
  maxSizeBytes: number;
  label: string;
}) {
  const t = useTranslations('Account.documents.audio');
  const tDocuments = useTranslations('Account.documents');
  const tErrors = useTranslations('Auth.errors');

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const [micDenied, setMicDenied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [take, setTake] = useState<{ blob: Blob; url: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  // En el servidor no hay `MediaRecorder`. Se lee como fuente externa —con
  // `false` como instantánea de servidor— en vez de con un efecto: así el
  // primer render del cliente ya coincide con el HTML y no hay parpadeo.
  const supported = useSyncExternalStore(
    () => () => {},
    () => supportedMimeType() !== null,
    () => false,
  );
  const canRecord = supported && !micDenied;

  // Una URL de objeto vive hasta que se revoca. Sin esto, cada intento
  // descartado se queda en memoria durante toda la sesión.
  useEffect(() => {
    return () => {
      if (take) URL.revokeObjectURL(take.url);
    };
  }, [take]);

  function discard() {
    if (take) URL.revokeObjectURL(take.url);
    setTake(null);
    setResult(null);
  }

  async function start() {
    setResult(null);

    const mimeType = supportedMimeType();
    if (!mimeType) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setResult({ ok: false, error: 'microphoneDenied' });
      setMicDenied(true);
      return;
    }

    discard();
    chunks.current = [];

    const instance = new MediaRecorder(stream, { mimeType });
    instance.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    instance.onstop = () => {
      // El micrófono se suelta en cuanto se para: dejar el indicador de
      // grabación encendido en el móvil asusta, y con razón.
      for (const track of stream.getTracks()) track.stop();

      const blob = new Blob(chunks.current, { type: mimeType });
      setTake({ blob, url: URL.createObjectURL(blob) });
      setRecording(false);
    };

    recorder.current = instance;
    instance.start();
    setRecording(true);
  }

  function stop() {
    recorder.current?.stop();
    recorder.current = null;
  }

  function submit(file: File) {
    if (file.size > maxSizeBytes) {
      setResult({ ok: false, error: 'fileTooLarge' });
      return;
    }

    const form = new FormData();
    form.set('typeId', typeId);
    form.set('file', file);

    startTransition(async () => {
      const outcome = await uploadDocumentAction(null, form);
      setResult(outcome);
      if (outcome.ok) discard();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{t('help')}</p>

      {canRecord ? (
        <div className="flex flex-wrap items-center gap-2">
          {recording ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={stop}
            >
              {t('stop')}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={start}
            >
              {take ? t('again') : t('record')}
            </Button>
          )}

          {recording ? (
            <span aria-live="polite" className="text-xs text-muted-foreground">
              {t('recording')}
            </span>
          ) : null}
        </div>
      ) : null}

      {take ? (
        <div className="flex flex-col gap-2">
          {/* Sin pista de subtítulos: es la voz del propio candidato,
              recién grabada y solo para que él la escuche antes de enviarla.
              No hay transcripción que ofrecer. */}
          <audio src={take.url} controls className="w-full" />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() =>
                submit(
                  new File(
                    [take.blob],
                    `audio.${EXTENSION[take.blob.type] ?? 'webm'}`,
                    { type: take.blob.type },
                  ),
                )
              }
            >
              {pending ? tDocuments('uploading') : t('send')}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={discard}
            >
              {t('discard')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          accept={acceptedMimeTypes.join(',')}
          aria-label={label}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) submit(file);
          }}
        />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => fileInput.current?.click()}
        >
          {t('uploadInstead')}
        </Button>

        <span className="text-xs text-muted-foreground">
          {tDocuments('maxSize', {
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
