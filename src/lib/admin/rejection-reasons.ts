/**
 * Motivos de rechazo de un documento.
 *
 * Es una **lista cerrada de claves**, no texto libre, y se guarda la clave en
 * `candidate_documents.rejection_reason`. El motivo lo escribe un admin que
 * trabaja en español y lo lee un candidato que puede estar en cualquiera de los
 * idiomas del sitio: con texto libre, "la foto está borrosa" llegaría en
 * español a alguien que se registró en inglés. Guardando la clave, cada uno lo
 * lee en el suyo, aquí y en el correo (ADR-01).
 *
 * Precio asumido: el admin no puede matizar. Para el MVP —una persona
 * revisando documentos de identidad, con cinco fallos posibles— sobra; el día
 * que haga falta detalle, se añade una nota libre **junto** a la clave, no en
 * su lugar.
 */
export const REJECTION_REASONS = [
  'unreadable',
  'expired',
  'wrongDocument',
  'incomplete',
  'mismatch',
  'other',
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

export function isRejectionReason(
  value: string | null,
): value is RejectionReason {
  return (REJECTION_REASONS as readonly string[]).includes(value ?? '');
}
