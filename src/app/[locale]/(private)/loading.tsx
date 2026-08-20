import { PageLoading } from '@/components/page-loading';

/**
 * El área privada es `force-dynamic` y pasa por sesión (ADR-13), así que aquí
 * la espera es real en **toda** visita, no solo al navegar: es la pantalla que
 * ve el candidato mientras el servidor comprueba quién es y lee su perfil, y es
 * justo la parte del producto donde pasa el rato subiendo documentos.
 */
export default function PrivateLoading() {
  return <PageLoading />;
}
