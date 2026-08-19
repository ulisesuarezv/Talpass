/**
 * El responsable del tratamiento y titular del sitio.
 *
 * Va aquí y **no en el copy** por la misma razón que la marca (ADR-12): son
 * datos de una persona, no de un producto, y el día que cambien —un buzón en
 * el propio dominio, un cambio de domicilio, una sociedad en vez de una persona
 * física— tienen que cambiar en un solo sitio y no en diez frases traducidas.
 *
 * Datos reales, dados y confirmados por Ulises el 2026-08-19. **Persona
 * física, no sociedad.** Se copian literalmente, con la `ß` y la diéresis: un
 * Impressum con la dirección mal escrita no cumple el §5 DDG.
 *
 * `taxId` es el NIF español. **No es lo que pide un Impressum** —ahí iría la
 * USt-IdNr, y solo si se tiene—: sirve para identificar al responsable en la
 * política de privacidad y en el lado español. Mientras no haya USt-IdNr, no
 * se inventa y no se publica: el campo no existe en este objeto a propósito.
 *
 * El correo es una cuenta personal y **vale**: el §5 DDG pide una vía directa y
 * rápida, no un dominio propio. Cuando `talpass.eu` tenga buzón, se cambia esta
 * línea. Y cuenta con que una dirección publicada en un Impressum acaba
 * llenándose de spam: es el precio del documento.
 */
export const controller = {
  name: 'José Ulises Suárez Victoria',
  taxId: '50232706S',
  address: {
    street: 'Theodor-Heuss-Straße 16',
    postalCode: '37075',
    city: 'Göttingen',
    country: 'Alemania',
    countryEn: 'Germany',
  },
  email: 'kayaosv@gmail.com',
} as const;

/** El domicilio en una línea, para el copy que no lo maqueta por partes. */
export function controllerAddressLine(locale: 'es' | 'en'): string {
  const { street, postalCode, city, country, countryEn } = controller.address;
  return `${street}, ${postalCode} ${city}, ${locale === 'es' ? country : countryEn}`;
}
