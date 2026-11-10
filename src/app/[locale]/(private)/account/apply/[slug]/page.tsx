import { ArrowLeftIcon, MapPinIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Composer } from '@/components/demo/client';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireCandidate } from '@/lib/auth/session';
import { applyAction } from '@/lib/demo/actions';
import { myApplication } from '@/lib/demo/conversations';
import { getJobBySlug } from '@/lib/jobs';

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Inbox.apply' });
  return { title: t('meta'), robots: { index: false } };
}

/**
 * ⚠️ DEMO (rama demo/hindi). Postularse a una oferta: el primer mensaje del
 * candidato abre la conversación con la ETT que la publica.
 */
export default async function ApplyPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  await requireCandidate(locale);

  const [t, job] = await Promise.all([
    getTranslations({ locale, namespace: 'Inbox.apply' }),
    getJobBySlug(slug, locale as Locale),
  ]);

  const back = (
    <Link
      href={{ pathname: '/jobs/[slug]', params: { slug } }}
      className="inline-flex min-h-11 items-center gap-1.5 type-meta text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      {job?.title ?? slug}
    </Link>
  );

  if (!job) {
    return (
      <div className="container-page flex max-w-2xl flex-col gap-4 py-6">
        {back}
        <p className="type-body">{t('notFound')}</p>
      </div>
    );
  }

  const existing = await myApplication(job.id);
  const place = [job.city, job.countryName].filter(Boolean).join(', ');

  return (
    <div className="container-page flex max-w-2xl flex-col gap-5 py-6">
      {back}
      <header className="flex flex-col gap-1">
        <h1 className="type-h2">{t('title')}</h1>
        <p className="type-h4">{job.title}</p>
        <p className="inline-flex items-center gap-1.5 type-meta text-muted-foreground">
          <MapPinIcon aria-hidden className="size-4" />
          {place} · {job.hiringOrganization}
        </p>
      </header>

      {existing ? (
        <section className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-4">
          <p className="type-body">{t('already')}</p>
          <Button asChild>
            <Link
              href={{
                pathname: '/account/messages/[conversationId]',
                params: { conversationId: existing },
              }}
            >
              {t('open')}
            </Link>
          </Button>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
          <p className="type-meta text-muted-foreground">
            {t('body', { agency: job.hiringOrganization })}
          </p>
          <p className="type-meta font-medium">{t('message')}</p>
          <Composer
            action={applyAction}
            hidden={{ locale, jobId: job.id }}
            placeholder={t('message')}
            sendLabel={t('send')}
            defaultValue={t('template')}
            rows={5}
          />
          <p className="type-caption text-muted-foreground">
            {t('templateNote')}
          </p>
        </section>
      )}
    </div>
  );
}
