import 'server-only';

import { getTranslations } from 'next-intl/server';

import { siteConfig } from '@/config/site';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { sendEmail, type SendEmailResult } from '@/lib/email/send';

/**
 * El aviso al candidato de que su verificación se ha aprobado o rechazada.
 *
 * Va en el idioma del candidato —el de su `profiles.locale`, no el del admin
 * que pulsa el botón—, y el texto sale de `messages/` como cualquier otro copy
 * (ADR-01). Es funcional a propósito: texto plano, sin plantilla. Darle forma
 * es de la fase 8, que además lo centralizará; lo que no puede esperar es que
 * el candidato se entere de que ya puede aplicar.
 */

function assertLocale(value: string | null | undefined): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

export async function sendVerificationDecisionEmail(input: {
  profileId: string;
  email: string;
  locale: string | null;
  firstName: string;
  approved: boolean;
  /** Motivos de rechazo, ya traducidos por quien los escribió. */
  reasons?: string[];
}): Promise<SendEmailResult> {
  const locale = assertLocale(input.locale);
  const t = await getTranslations({ locale, namespace: 'Emails.verification' });

  const accountUrl =
    siteConfig.url.replace(/\/$/, '') +
    getPathname({ href: '/account', locale });

  if (input.approved) {
    return sendEmail({
      to: input.email,
      profileId: input.profileId,
      locale,
      template: 'candidate_verification_approved',
      subject: t('approved.subject', { brand: siteConfig.name }),
      text: t('approved.body', {
        name: input.firstName,
        brand: siteConfig.name,
        url: accountUrl,
      }),
    });
  }

  const reasons = (input.reasons ?? []).filter(Boolean);

  return sendEmail({
    to: input.email,
    profileId: input.profileId,
    locale,
    template: 'candidate_verification_rejected',
    subject: t('rejected.subject', { brand: siteConfig.name }),
    text:
      t('rejected.body', {
        name: input.firstName,
        brand: siteConfig.name,
        url: accountUrl,
      }) +
      (reasons.length > 0
        ? `\n\n${t('rejected.reasonsTitle')}\n${reasons
            .map((reason) => `- ${reason}`)
            .join('\n')}`
        : ''),
  });
}
