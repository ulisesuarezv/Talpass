import { Skeleton } from '@/components/ui/skeleton';

/**
 * Estado de carga de una pantalla. Fase C2: antes de esta fase **no había ni un
 * `loading.tsx` en toda la aplicación**, así que al navegar de una página a
 * otra no pasaba nada visible hasta que llegaba la siguiente. En una conexión
 * buena eso son 80 ms y no se nota; en la 4G desde la que entra el candidato de
 * este producto son varios segundos en los que la pantalla anterior sigue ahí y
 * parece que el botón no ha funcionado.
 *
 * Es un esqueleto y no un giro de rueda a propósito: dice **cuánto** viene y
 * con qué forma, así que el salto al contenido real no mueve la página. Con un
 * `spinner` centrado, el contenido aparece de golpe y desplaza todo.
 *
 * ⚠️ **Solo lo pinta `(public)/loading.tsx`, y el área privada se quedó sin
 * él.** No es un olvido: una frontera de `Suspense` por encima del
 * `redirect()` de sesión convierte el 307 de `/es/cuenta` en un 200 con un
 * `meta refresh` dentro. Razonado en ADR-41, con el arreglo de verdad
 * anotado.
 *
 * 🔴 **Server Component sin una línea de JavaScript, y las dos cosas raras de
 * aquí abajo son por eso.** Este componente pinta en un `loading.tsx`, que entra
 * en el paquete de todas las páginas de su árbol. Las dos versiones anteriores
 * costaban LCP y las dos se descartaron midiendo (ADR-40, y el detalle en `docs/evidencia/fase-c2/02-rendimiento.md`):
 *
 * 1. Con `getTranslations`, un `loading.tsx` **vuelve dinámico el sitio
 *    entero** —no recibe `params`, así que no puede llamar a
 *    `setRequestLocale` y acaba leyendo cabeceras—. Las 26 rutas
 *    prerenderizadas pasaron a 0.
 * 2. Con `useTranslations` desde un Client Component el estático se salva,
 *    pero el fichero se lleva un `chunk` propio al paquete de todas las
 *    páginas: **+4,1 KB en dos peticiones más**, que en la home costaban un
 *    punto de Lighthouse y 0,14 s de LCP.
 *
 * La salida es no traducir aquí: la región de estado toma su nombre accesible
 * con `aria-labelledby` de una etiqueta que pinta el layout, que **sí** tiene
 * el idioma. El lector de pantalla dice «Cargando…» igual, en su idioma, y
 * esto no manda ni un byte de JavaScript al navegador.
 */
export function PageLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-labelledby="app-loading-label"
      className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12 sm:py-20"
    >
      <Skeleton className="h-8 w-3/4 sm:h-10" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-11 w-44 rounded-lg" />
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
