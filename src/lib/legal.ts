import 'server-only';

import { controller, controllerAddressLine } from '@/config/controller';
import type { LegalDocument } from '@/config/legal';
import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';

/**
 * El **cuerpo** de los textos legales: se carga aquí y no desde `messages/`
 * (ADR-33).
 *
 * El motivo es medido, no estético. `NextIntlClientProvider` serializa el
 * fichero de mensajes **entero** en el HTML de todas las páginas: hoy la home
 * son 52 KB y llevan dentro el backoffice y las plantillas de correo. Meter
 * cinco documentos legales ahí los pondría en el camino crítico de un candidato
 * que entra con 4G desde el móvil, en todas las páginas, para que los lea una
 * de cada mil visitas. Contra ADR-10.
 *
 * Estos ficheros los importa **solo** la ruta legal, que es un Server
 * Component, así que el texto no viaja a ningún sitio donde no se esté leyendo.
 * La regla de `CONVENTIONS.md` —cero texto en el JSX, el copy en un fichero por
 * idioma— se cumple igual: cambia qué fichero, no que el copy viva fuera del código.
 *
 * **Lo corto sí está en `messages/`**, en el namespace `Legal`: los títulos de
 * los documentos, sus metadatos y las etiquetas comunes. Los enlaza el pie en
 * todas las páginas y el registro, que es cliente, así que ahí sí tienen que
 * estar; y así ningún título se escribe dos veces.
 *
 * Que los dos idiomas no diverjan lo comprueba `parity.mjs`, al que se le pasa
 * este par de ficheros igual que al de `messages/`.
 */

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

export type LegalBody = {
  /** Una frase que dice de qué va el documento, antes del primer epígrafe. */
  summary: string;
  sections: LegalSection[];
};

export type LegalContent = { documents: Record<LegalDocument, LegalBody> };

/**
 * Los únicos huecos que el copy legal puede interpolar.
 *
 * Son exactamente los datos que `CLAUDE.md` prohíbe hardcodear —la marca y el
 * dominio— y los del responsable, que viven en `config/controller.ts` para
 * poder cambiarse en un sitio. Todo lo demás se escribe literal: un texto legal
 * con lógica dentro es un texto que nadie puede leer para saber qué dice.
 */
function tokens(locale: Locale): Record<string, string> {
  return {
    brand: siteConfig.name,
    controllerName: controller.name,
    controllerTaxId: controller.taxId,
    controllerAddress: controllerAddressLine(locale),
    controllerEmail: controller.email,
    domain: new URL(siteConfig.url).host,
  };
}

function fill(text: string, values: Record<string, string>): string {
  return text.replace(
    /\{(\w+)\}/g,
    (match, key: string) => values[key] ?? match,
  );
}

/** El cuerpo de un documento, ya interpolado. */
export async function getLegalBody(
  locale: Locale,
  document: LegalDocument,
): Promise<LegalBody> {
  const content = (await import(`../../messages/legal/${locale}.json`))
    .default as LegalContent;
  const values = tokens(locale);
  const source = content.documents[document];

  return {
    summary: fill(source.summary, values),
    sections: source.sections.map((section) => ({
      heading: fill(section.heading, values),
      paragraphs: section.paragraphs?.map((p) => fill(p, values)),
      items: section.items?.map((item) => fill(item, values)),
    })),
  };
}
