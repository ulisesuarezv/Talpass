# 03 · Las pantallas — 390 y 1280 px, y los estados que antes no existían

> **Medición: 2026-08-20**, contra el build de producción de la fase servido en
> `localhost:3210` con la base local sembrada (`pnpm seed:demo`: 3 vacantes
> publicadas y 4 candidatos, uno por estado de verificación).

## A · Desbordamiento horizontal: 30 rutas × 2 anchos, cero

No es una impresión, es una medición. Cada ruta se carga en un `iframe` del
ancho exacto y se compara `document.documentElement.scrollWidth` con el ancho
del marco. **Si un solo elemento se saliera, `scrollWidth` sería mayor.**

**60 comprobaciones, 60 iguales.** A 390 px todas miden 390; a 1280, 1280.

Las 30 rutas, que son la superficie entera del producto:

| Área         | Rutas                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pública `es` | `/es` · `/es/oportunidades` · dos perfiles de mercado · `/es/ofertas` · una vacante · `/es/trabajo/alemania` · landing de sector · de alojamiento · de ciudad |
| Legal        | `/es/legal` · `/es/legal/privacidad` · `/es/legal/impressum`                                                                                                  |
| `(auth)`     | `/es/entrar` · `/es/registro` · `/es/revisa-tu-correo` · `/es/recuperar-acceso` · `/es/nueva-contrasena`                                                      |
| `(private)`  | `/es/cuenta` · `/es/completar-perfil` · `/es/admin` · `/es/agency`                                                                                            |
| 404          | `/es/no-existe`                                                                                                                                               |
| `en`         | `/en` · `/en/opportunities` · `/en/jobs` · `/en/signup` · `/en/login` · `/en/legal/privacy` · `/en/account`                                                   |

⚠️ **Lo que esto NO acredita:** que cada pantalla esté _bien compuesta_. Acredita
que ninguna se sale. Lo primero son las capturas de abajo, y se juzgan a ojo —
que es exactamente por lo que la C1 y la C2 se partieron en dos fases.

## B · Las capturas

| Fichero                     | Qué enseña                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `390-home.png`              | La home entera. Antetítulo teal, primario teal-900, la caja de confianza en la superficie de marca y el aviso de «no se te cobra nunca» en la de acento |
| `1280-home.png`             | La misma a escritorio                                                                                                                                   |
| `390-oportunidades.png`     | Listado de perfiles de mercado, con las cifras en `--primary`                                                                                           |
| `1280-oportunidades.png`    | Ídem a escritorio                                                                                                                                       |
| `390-una-oportunidad.png`   | Un perfil: la cifra de salario ya no es un `text-lg` negro entre grises                                                                                 |
| `390-registro.png`          | El alta: campos con borde visible, casillas de 20 px y CTA de 44                                                                                        |
| `1280-legal-privacidad.png` | Un documento legal, que es la superficie de lectura larga                                                                                               |
| `390-cuenta.png`            | El área privada del candidato — donde sube sus documentos                                                                                               |
| `390-admin.png`             | El backoffice, que hasta ahora no había mirado nadie con criterio visual                                                                                |
| `390-estado-carga.png`      | 🔴 El estado de carga. **No existía.**                                                                                                                  |
| `390-estado-error.png`      | 🔴 El estado de error. **No existía.**                                                                                                                  |

## C · Los dos estados, demostrados y no declarados

El criterio de la fase decía «se demuestran, no se declaran», así que **ninguna
de las dos capturas está simulada**: las dos son el componente real renderizado
por Next en un build de producción.

**Cómo se provocaron.** Se instrumentó temporalmente `(private)/account/page.tsx`
con un interruptor de entorno —`DEMO_C2=throw` lanza un error, `DEMO_C2=slow`
espera 45 s—, se compiló, se fotografió y **se revirtió**. La instrumentación no
está en el árbol: `grep -rn "DEMO_C2" src/` = **0**.

- **Carga** (`390-estado-carga.png`): navegación de cliente desde la home a
  `/es/cuenta`, que es ruta dinámica. Se comprobó en la propia página que la
  región viva existe y dice lo que tiene que decir:
  `role="status"` con texto **«Cargando…»** y **7** elementos
  `[data-slot=skeleton]`.
- **Error** (`390-estado-error.png`): un `throw` real durante el render del
  servidor. La captura enseña que **conserva cabecera y pie**, que el copy está
  en español y que sale la **referencia del fallo** (`801932577` en esa toma),
  que es el `digest` que Next escribe también en el log del servidor — sin él,
  un informe de fallo es «no me iba».

**Antes de esta fase, las dos pantallas eran la página de error genérica de
Next: en inglés, sin cabecera, sin pie y sin forma de volver.** En un producto
cuyo problema es que podría parecer un fraude, ese es el peor momento posible
para que el sitio deje de parecerse a sí mismo.

## D · El tercer estado, el vacío, no se ha tocado

`/es/ofertas` sin vacantes ya tenía un estado vacío honesto —«Todavía no hay
vacantes publicadas», con el motivo y un botón a las oportunidades— desde la
fase C1. **Está bien hecho y ADR-36 dice que no se toca.** Se ha comprobado que
la paleta nueva no lo rompe, y nada más.

## E · Lo que no se ha podido fotografiar, y por qué

**El onboarding (`/es/completar-perfil`) no tiene captura propia.** Los cuatro
candidatos de la semilla ya tienen el perfil completo, así que la ruta redirige a
`/es/cuenta`, y crear una cuenta nueva pasa por confirmar el correo. **Sí está
medida**: entra en las 60 comprobaciones de desbordamiento de arriba, en los dos
anchos, y su componente (`onboarding-wizard.tsx`) recibió el sistema tipográfico
como el resto —el antetítulo pasó a `.type-eyebrow` en la misma pasada—. Queda
anotado como lo único de la superficie que se ha verificado por medición y no
también a ojo.
