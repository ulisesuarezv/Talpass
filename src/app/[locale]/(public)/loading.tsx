import { PageLoading } from '@/components/page-loading';

/**
 * Estado de carga del árbol público, y **solo del público**. La colocación es
 * el resultado de una regresión que se cazó verificando en producción, no una
 * preferencia: está razonada en ADR-41.
 *
 * En resumen: un `loading.tsx` abre una frontera de `Suspense`, y Next confirma
 * el **200 y empieza a emitir** antes de ejecutar la página. Si debajo hay un
 * `redirect()` de sesión —como el `requireCandidate` de `(private)`— ya no
 * puede salir un **307**: degrada a un `<meta http-equiv="refresh">` dentro del
 * cuerpo. Aquí no pasa porque ninguna ruta pública redirige: son estáticas y no
 * tocan la sesión (ADR-11, ADR-13).
 *
 * Se ve al navegar entre páginas del sitio, que es cuando el App Router va a
 * buscar el siguiente segmento — en la 4G desde la que entra el candidato de
 * este producto, eso son segundos en los que antes no pasaba nada y parecía que
 * el botón no había funcionado.
 *
 * ⚠️ `PageLoading` es Server Component sin JavaScript por otra razón medida:
 * ADR-40.
 */
export default function PublicLoading() {
  return <PageLoading />;
}
