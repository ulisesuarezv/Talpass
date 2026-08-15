import { siteConfig } from '@/config/site';
import type { JobDetail } from '@/lib/jobs';

/**
 * `JobPosting` de schema.org (ADR-02) — el marcado del que se alimenta Google
 * Jobs, que es el canal de captación de coste cero del proyecto.
 *
 * Reglas que se siguen aquí y no son opcionales:
 *
 * - **Nada inventado.** Si la vacante no declara salario, no hay `baseSalary`;
 *   si no declara ciudad, no hay `addressLocality`. Un dato de relleno en el
 *   marcado es una penalización, no un adorno.
 * - **El empleador visible es el mismo que en la página.** Si la ETT no
 *   autoriza enseñar a su cliente, aquí tampoco aparece: el marcado no puede
 *   ser la puerta trasera por la que se filtra lo que la interfaz oculta.
 * - **`directApply: false`.** Aplicar exige cuenta verificada y todavía no
 *   existe (fase 5). Decir que sí se puede aplicar desde aquí sería mentirle a
 *   Google sobre la experiencia que va a encontrar el usuario.
 */
export function JobPostingJsonLd({
  job,
  url,
  description,
}: {
  job: JobDetail;
  url: string;
  description: string;
}) {
  const unitText =
    job.salaryPeriod === 'hour'
      ? 'HOUR'
      : job.salaryPeriod === 'month'
        ? 'MONTH'
        : null;

  const employmentType = ['TEMPORARY'];
  if (job.weeklyHours !== null) {
    employmentType.push(job.weeklyHours >= 35 ? 'FULL_TIME' : 'PART_TIME');
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: siteConfig.name,
      value: job.slug,
    },
    datePosted: job.publishedAt,
    ...(job.expiresAt ? { validThrough: job.expiresAt } : {}),
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.hiringOrganization,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(job.city ? { addressLocality: job.city } : {}),
        addressCountry: job.countryCode,
      },
    },
    industry: job.sectorName,
    url,
    directApply: false,
    ...(job.startDate ? { jobStartDate: job.startDate } : {}),
    ...(unitText && job.salaryMin !== null && job.salaryCurrency
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salaryCurrency,
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              ...(job.salaryMax !== null ? { maxValue: job.salaryMax } : {}),
              unitText,
            },
          },
        }
      : {}),
    ...(job.weeklyHours !== null
      ? {
          workHours: String(job.weeklyHours),
        }
      : {}),
    ...(job.benefits ? { jobBenefits: job.benefits } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // El objeto lo construye este servidor a partir de columnas tipadas, no
      // de HTML de nadie; aun así se escapa `<` para que un `</script>` dentro
      // de una descripción no pueda cerrar la etiqueta.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
