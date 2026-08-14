'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { setAudioConsentAction } from '@/lib/candidate/actions';

/**
 * Conceder o retirar el consentimiento de audio (ADR-18).
 *
 * Es un formulario con un botón y no un interruptor que se dispara al tocarlo:
 * conceder y retirar son actos con consecuencias legales y quedan escritos en
 * `consents`; un toque accidental al hacer scroll no puede ser uno de ellos.
 */
export function AudioConsentPanel({
  granted,
  grantedAt,
}: {
  granted: boolean;
  grantedAt: string | null;
}) {
  const t = useTranslations('Account.audioConsent');

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-medium">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('explainer')}</p>

      <p className="text-sm">
        <span className="text-muted-foreground">{t('state')}: </span>
        <span className="font-medium">
          {granted ? t('granted') : t('notGranted')}
        </span>
      </p>

      {granted && grantedAt ? (
        <p className="text-xs text-muted-foreground">
          {t('since', { date: grantedAt })}
        </p>
      ) : null}

      <form action={setAudioConsentAction}>
        <input type="hidden" name="grant" value={granted ? 'false' : 'true'} />
        <Button type="submit" variant={granted ? 'outline' : 'default'}>
          {granted ? t('revoke') : t('grant')}
        </Button>
      </form>
    </section>
  );
}
