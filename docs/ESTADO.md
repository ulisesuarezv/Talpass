# Estado del proyecto — punto de retomada

> ## ✅ 2026-08-21 — la C2 está cerrada: desplegada y verificada
>
> **Fase C2 · Sistema visual.** `https://talpass.eu` deja de ser la escala de
> grises de serie de shadcn: hay paleta, hay tipografía de marca, hay una escala
> tipográfica con un nombre por papel, y existen por fin el estado de carga y el
> de error, que **no había ninguno en toda la aplicación**.
>
> **`dpl_Anm4HViZFm9NMxdX6sDc5TSBjSrp`**, aliased a `talpass.eu` y leído de
> `pnpm exec vercel inspect talpass.eu` **antes** de mirar ninguna cabecera.
>
> ⚠️ Ese identificador **acredita esta verificación con fecha, no lo que se
> sirve hoy**: en cuanto alguien redespliegue, el alias se mueve. Para saber cuál
> está vivo se ejecuta el comando.
>
> **`origin/main` está en `37eb925`, subido y al día.** En este proyecto subir y
> desplegar son dos actos distintos y hubo que hacer los dos.
>
> ### 🔴 Y hubo que desplegar DOS veces, porque el primero rompió el 307
>
> **El primer despliegue pasó todas las comprobaciones locales y aun así rompió
> el control negativo de ADR-11 y ADR-13.** `/es/cuenta` sin sesión devolvía
> **200** —57 KB de cuerpo, con el esqueleto de carga dentro y un
> `<meta http-equiv="refresh">`— en vez del **307** desde el borde.
>
> Lo causaba el `loading.tsx` que traía esta misma fase: abre una frontera de
> `Suspense`, y con ella Next **confirma el 200 y empieza a emitir antes de
> ejecutar la página**, así que el `redirect()` de `requireCandidate` ya no podía
> fijar un código de estado. Arreglado moviendo el estado de carga a
> `(public)/loading.tsx`, donde ninguna ruta redirige. **ADR-41.**
>
> 👉 **La lección de método, que vale para toda fase futura:** esto **no se caza
> mirando la pantalla**, porque el usuario acababa en el mismo sitio. Se caza
> mirando el **código de estado**. Y no lo cazó ninguna prueba, ni el LCP, ni las
> 60 comprobaciones de maquetación: lo cazó verificar contra producción.
>
> **Coste asumido:** `(private)` se queda **sin estado de carga**, que es donde
> más falta hacía. Un 307 roto es peor que un esqueleto que falta. El arreglo de
> verdad —subir la comprobación de sesión al `layout` de `(private)`, o
> resolverla en el proxy— toca autenticación y no es de una fase visual; está
> anotado en ADR-41.
>
> Evidencia completa en `docs/evidencia/fase-c2/`. ADR-38, 39, 40 y 41.
>
> ### Qué cambia para el candidato
>
> - **El sitio se parece a algo.** Primario teal-900, superficie de marca en la
>   caja que explica «qué ve una agencia de ti», y el naranja en un solo sitio
>   de la home: el hecho de que **no se le cobra nunca**, que hasta ahora era
>   gris pequeño debajo de dos botones.
> - **Se lee mejor en un móvil barato.** El texto de lectura sube de 14 a 15 px,
>   el gris del cuerpo pasa de **4,74:1 a 7,24:1**, el borde de un campo de
>   **1,35 a 3,68** —antes era prácticamente invisible— y el indicador de foco de
>   **1,9 a 5,23**.
> - **Se puede pulsar.** El botón principal pasa de 36 a **44 px**, que es lo que
>   piden las guías táctiles, y la casilla de consentimiento de 16 a 20 con área
>   de pulsación de 44.
> - **Ya no se queda en blanco.** Al navegar por la parte pública aparece un
>   esqueleto en vez de nada —en el área privada no, y eso es ADR-41—,
>   y si algo falla sale una pantalla en su idioma que dice que no es culpa suya,
>   que no ha perdido nada y qué hacer, con cabecera y pie — en vez de la página
>   de error de Next en inglés.
>
> ### Lo medido
>
> | Qué                                 | Antes           | Ahora                                  |
> | ----------------------------------- | --------------- | -------------------------------------- |
> | Colores de marca en la aplicación   | **ninguno**     | paleta completa en tokens, 0 en el JSX |
> | Pares de contraste comprobados      | 0 (a ojo)       | **40, con script que falla el build**  |
> | `--muted-foreground` sobre el fondo | 4,74            | **7,24**                               |
> | Borde de campo · foco               | 1,35 · 1,9      | **3,68 · 5,23**                        |
> | `loading.tsx` / `error.tsx`         | **0 / 0**       | **2 / 1**, demostrados con captura     |
> | Combinaciones de encabezado         | 13 a mano       | **una clase por papel**                |
> | Fuente en la ruta crítica           | Geist, 29.288 B | **General Sans, 23.904 B**             |
> | Rutas prerenderizadas               | 26              | **26**                                 |
>
> ### 🔴 Las tres cosas que la fase descubrió midiendo, y ninguna se veía a ojo
>
> 1. **La primera versión completa de la fase perdía 3–4 puntos en las seis
>    páginas.** No era ruido: las distribuciones no se solapaban. Bisecando salió
>    que **el color, la escala tipográfica, los 15 px, los botones grandes y los
>    acentos de marca cuestan exactamente cero**, y que todo el coste era de dos
>    sitios: la tipografía y los ficheros de estado.
> 2. **Lo que cuesta puntos son los bytes en la ruta crítica, no las
>    peticiones.** El General Sans variable son 38 KB en **un** fichero y cuesta
>    lo mismo que dos ficheros de 48 KB. El umbral cae entre los 29 KB de Geist
>    y los 38 del variable. Quitar el `preload` **empeora**. Se midieron seis
>    configuraciones (ADR-39) y solo una no toca el LCP: **la Regular sola**, que
>    además pesa 5,4 KB menos que el Geist que había.
> 3. **Un `loading.tsx` se paga en todas las páginas, se vea o no.** Con
>    `getTranslations` volvió dinámico el sitio entero —**26 rutas
>    prerenderizadas a 0**— porque no recibe `params` y acaba leyendo cabeceras.
>    Con `useTranslations` desde cliente se salva el estático pero se lleva un
>    `chunk` al paquete de todas las páginas: **+4,1 KB y dos peticiones**, un
>    punto y 0,14 s de LCP en la home. La salida fue **no traducir ahí**: el
>    nombre accesible viene por `aria-labelledby` de una etiqueta que pinta el
>    layout, y el componente se queda sin una línea de JavaScript. **ADR-40.**
>
> ### 🔴 Y una cosa que la licencia impidió hacer
>
> El prompt pedía **subsetear General Sans a `latin`**. **No se puede:** la ITF
> Free Font License v2.0 §02 prohíbe expresamente el subsetting y la conversión
> de formato, y §05 lo llama obra derivada. Lo que sí permite con todas las
> letras es el autoalojamiento. Se sirve el WOFF2 oficial íntegro y **no hizo
> falta**: la Regular oficial ya pesa menos que el subconjunto de Geist.
>
> ### El precio que hay que leer, porque es una decisión de Ulises
>
> **Los `font-semibold` los emboldece el navegador**, no son la Semibold de
> verdad. En un titular grande se nota al comparar. Traer la Semibold real cuesta
> **de 1 a 4 puntos de Lighthouse y 0,15–0,16 s de LCP**, sobre un sitio que ya
> está en 2,6–2,8 s con el umbral «bueno» de Core Web Vitals en 2,5. El fichero
> está a un `cp` del paquete de Fontshare. Cifras en ADR-39.
>
> ### La decisión sobre el modo oscuro: aplazado, y el bloque `.dark` se retira
>
> Era **inalcanzable** —no hay `ThemeProvider`, ni `next-themes`, ni un sitio
> donde se aplique la clase—. Se borra en vez de dejarlo con los grises viejos
> porque junto a un `:root` con la paleta nueva es un medio-estado que aparecería
> roto el día que alguien añadiese un interruptor. Y el motivo de fondo:
> **los 40 ratios están medidos contra fondo claro y no valen para el oscuro**;
> un tema oscuro obliga a rehacer la tabla entera, no a invertirla. Ojo además a
> ADR-11 y ADR-13: un interruptor en la cabecera volvería dinámicas **todas** las
> públicas. Razonado en ADR-38.
>
> ### 🔴 2026-08-21 — EL PROYECTO YA DESPLIEGA SOLO AL HACER `git push`
>
> **Esto contradice lo que dicen esta misma página, el roadmap y los cuatro
> prompts anteriores**, así que hay que leerlo antes de trabajar. La frase «este
> proyecto de Vercel no tiene integración con GitHub: un `git push` no despliega
> nada» **ya no es cierta**. Sigue escrita más abajo en los bloques históricos,
> que se dejan como estaban porque eran verdad cuando se escribieron.
>
> **Cómo se vio, y es concluyente.** Esta noche hubo cuatro despliegues de
> producción y solo dos los lancé yo con el CLI. Los dos que **no** lancé
> aparecieron justo después de mis dos `git push`, y son exactamente los dos que
> llevan el alias `…-git-main-…`; los del CLI no lo llevan:
>
> | Despliegue  | `dpl_`                             | Origen                |
> | ----------- | ---------------------------------- | --------------------- |
> | `2826g0mac` | `dpl_E4dYQr1PmY8mWnZ4EoYK8Sf8YQ3f` | `vercel --prod` (CLI) |
> | `3e6ludgtn` | `dpl_ARCUNtX6CJXA9wKWsXr3UrZS1UPk` | **`git push`**        |
> | `9mgexwd2h` | `dpl_Anm4HViZFm9NMxdX6sDc5TSBjSrp` | `vercel --prod` (CLI) |
> | `7tuh3kzz1` | `dpl_AyftLgvVcGKz2NyFAVFyyupDNVEu` | **`git push`**        |
>
> ❓ **Ulises: confírmalo.** Lo de arriba es una deducción por observación, muy
> sólida pero deducción. Si conectaste GitHub al proyecto, esto queda cerrado y
> hay que corregir los documentos que dicen lo contrario.
>
> ### ⚠️ Y la consecuencia, que es la que muerde
>
> **Un `git push` después de verificar sustituye en silencio lo que acabas de
> verificar.** Es justo lo que pasó aquí: el `dpl_Anm4…` que verifiqué a fondo
> dejó de servir el sitio cuando subí el commit de documentación, y el alias
> pasó a `dpl_Ayft…`.
>
> **Esta vez no rompió nada** —ese commit solo tocaba `docs/`, así que el build
> es idéntico: se recomprobó y el sitio vivo sigue dando 307 en `/es/cuenta`,
> `/es/admin` y `/en/account`, cero `meta refresh`, el mismo hash de fuente
> (`GeneralSans_Regular-s.p.25yjfdw5omr67.woff2`) y los 5 `h2` de la home—. Pero
> si el push hubiera llevado código, la verificación habría quedado invalidada
> sin que nadie se enterara.
>
> 👉 **Regla nueva para la sesión siguiente:** verifica **después** del último
> push, no antes, y vuelve a leer `vercel inspect talpass.eu` al terminar. Que un
> `dpl_` escrito en prosa caduque ya lo decía la documentación; ahora caduca
> también **por subir documentación**.
>
> ### ⚠️ Una cosa medida a medias, y es barata de cerrar
>
> **El Lighthouse de producción de esta noche no concluye.** Con el borde
> caliente, la home sale **98** de mediana en 7 pasadas (96–100), pero
> `/es/oportunidades/alemania/almacen` da un rango de **17 puntos sobre el mismo
> build y la misma URL** (83…100). Desglosado: **FCP 0,94 s y TTFB 19 ms
> constantes en las siete**, y lo único que oscila es el LCP. Con el servidor
> respondiendo igual, la varianza está en la estimación de ancho de banda de
> Lighthouse, no en el sitio.
>
> Tampoco hay una línea base válida contra producción: el método exige comparar
> con el árbol de justo antes **medido el mismo día y en la misma máquina**, y
> los despliegues anteriores están tras la protección de Vercel y responden 302
> a una petición anónima.
>
> 👉 **El veredicto de rendimiento se apoya en la medición local**, que sí cumple
> el método: mismo día, misma máquina, los dos árboles, y **las seis páginas
> empatan**. 👉 **Y queda pendiente, en una hora tranquila:** repasar Lighthouse
> contra producción. Si esa página sigue en 86 con FCP y TTFB constantes, hay
> algo que mirar; si sube a 98–100 como la home, era la red. Detalle en
> `docs/evidencia/fase-c2/04-produccion.md` §E.
>
> ### Lo que sigue abierto y esta fase no toca
>
> - **El estado de carga del área privada**, que ADR-41 dejó fuera con el arreglo
>   de verdad anotado. Es la deuda que deja esta fase.
> - **La Semibold**, con su precio arriba.
> - **El modo oscuro.**
> - 🟡 **`messages/<locale>.json` sigue pesando 37 KB** y viaja entero a todas
>   las páginas. ADR-37 lo resolvió para la home y ADR-33 para los legales; el
>   resto sigue igual. Es una tarea propia y no era esta.
> - 🟡 **`ettrecruiter.vercel.app` a 200** (hallazgo 8) y 🔴 **`/es/trabajo/**`
>   en 404 por no haber vacantes** (hallazgo 5). Los dos siguen igual.
> - 📝 La documentación dice que `(auth)` es `noindex, follow` y el código pone
>   `noindex, nofollow`. Sigue sin decidirse.

> ## ✅ 2026-08-20 — la C1 está cerrada: desplegada y verificada
>
> **Fase C1 · Credibilidad.** En `https://talpass.eu` ya no hay una home que sea
> un hero y se acabe, ni un botón grande que lleve a una página vacía, ni una
> cabecera que empuje el móvil de lado.
>
> **`dpl_64afKgpF4rDcxSRGVvfkKUMXzKFv`**, aliased a `talpass.eu` y leído de
> `pnpm exec vercel inspect talpass.eu` **antes** de mirar ninguna cabecera.
>
> ⚠️ Ese identificador **acredita esta verificación con fecha, no lo que se
> sirve hoy**: en cuanto alguien redespliegue, el alias se mueve. Para saber
> cuál está vivo se ejecuta el comando.
>
> **Subido y desplegado, que en este proyecto son dos actos distintos y ninguno
> implica al otro.** `origin/main` está en `4d3c30d`, al día: el hallazgo 1 de
> la auditoría —«la fase 4b no existe fuera del portátil»— sigue cerrado.
>
> Evidencia completa en `docs/evidencia/fase-c1/`: la tabla de 40 cifras
> rellenada entera, el detalle local, el de producción, el de rendimiento y las
> capturas a 390 px.
>
> ### Qué cambia para el candidato
>
> - **La home responde.** Pasa de 1 `h1`, cero `h2` y 546 B de copy a cuatro
>   secciones que contestan, **leyendo solo la home y sin ejecutar
>   JavaScript**: qué hace Talpass, cómo funciona, **qué ve una agencia de ti y
>   qué no**, qué cuesta, en qué punto está y quién responde del sitio — con el
>   nombre y la ciudad del responsable, sacados de `config/controller.ts`.
> - **El argumento de confianza más fuerte del proyecto sale del sótano.**
>   `/legal/datos-y-agencias` enumeraba campo a campo qué ve una ETT y qué no,
>   enterrado en un documento legal. Ahora está resumido en la home y
>   **enlazado, no duplicado**: el que manda sigue siendo el texto legal.
> - **Ya no se lee «Fase de construcción» lo primero.** No se ha sustituido por
>   una promesa: el estado real —hoy no hay ninguna vacante publicada— se cuenta
>   entero en su propia sección, donde informa en vez de disculparse. El pie
>   decía lo mismo y ahora lleva el nombre del responsable.
> - **Los diez enlaces de `(auth)` ya no se anuncian como la home.** Título y
>   descripción propios en `es` y `en`, con canónica, y el `noindex` intacto. Es
>   lo que se ve al compartir el registro por WhatsApp, que es como se va a
>   compartir esto.
> - **La cabecera cabe en el móvil.** Medía 453 px a 390 de viewport y empujaba
>   el documento entero de lado. Ahora 390/390 —comprobado contra producción, no
>   solo en local— y también 320/320.
>
> ### Lo medido contra el sitio vivo
>
> | Qué                           | Antes                   | Ahora                                    |
> | ----------------------------- | ----------------------- | ---------------------------------------- |
> | Encabezados de la home        | 1 `h1`, **0 `h2`**      | **1 `h1`, 5 `h2`, 6 `h3`**               |
> | «Fase de construcción»        | lo primero que se leía  | **0 apariciones**                        |
> | `/es/ofertas` en la home      | **×2** en el cuerpo     | **×1**, y es la de la cabecera           |
> | `/es/oportunidades`           | ×1, secundario          | **×3**, y es el botón primario           |
> | `(auth)` con título propio    | 0 de 10                 | **10 de 10**, con canónica y `noindex`   |
> | Públicas sin sesión ni cookie | 15/15                   | **15/15**                                |
> | `/es/cuenta`                  | 307 + `dub1`            | **307 + `dub1`** — ADR-11/13/32 en pie   |
> | `JobPosting` en oportunidades | 0                       | **0** en las 10 páginas — ADR-30 intacto |
> | Lighthouse móvil producción   | 97 / 98 / 100 / 98 / 97 | **100 / 100 / 100 / 98 / 99**            |
>
> **Ninguna página de rendimiento empeora y cuatro mejoran**, incluida la home,
> que es la que se reescribió entera.
>
> ### La decisión de producto, y está razonada en un ADR
>
> **ADR-36: el botón más llamativo lleva a lo que tiene contenido, y lo decide la
> base de datos.** Sin vacantes, el primario va a `/oportunidades` —cinco
> perfiles con cifras, fuente y fecha—; con al menos una, pasa a `/ofertas`
> solo. **No se retira `/ofertas`** (habría destruido la ruta que el día que haya
> ETT es la principal) y **no se inventa nada** (ADR-30 intacto: `JobPosting` en
> oportunidades sigue en 0, comprobado en las 10 páginas de producción).
>
> El mecanismo es **ADR-35**: la home lee `listPublishedJobs`. Así no hay copy
> que envejezca solo — el día que se publique una vacante, la home se corrige
> sola. Sigue siendo estática y cacheada: la lectura no toca cookies.
>
> ### Tres cosas que la fase descubrió y no estaban en el guion
>
> 1. 🔴 **Una pasada de Lighthouse por página no sirve para cerrar nada.**
>    Midiendo el mismo build dos veces seguidas salen notas distintas: la banda
>    de ruido es de **±3 puntos** y el LCP salta entre 2,0 y 2,8 s. La primera
>    vuelta de esta sesión pareció una regresión de 2-3 puntos y **no lo era**.
>    Todas las cifras nuevas son mediana de 3 pasadas, y las dos páginas dudosas
>    se remidieron con 7: `registro` empata y `ofertas` sale mejor.
> 2. 🔴 **En producción, además, el borde frío parece una regresión.** Recién
>    desplegado, `/es/oportunidades` medía **93** —cinco puntos por debajo de la
>    línea base, y con las tres pasadas de acuerdo entre sí, así que tampoco
>    parecía ruido—. Las ocho pasadas seguidas de esa página fueron
>    `93, 94, 93, 96, 100, 98, 100, 100`: con el borde ya caliente la mediana es
>    **100** y el LCP baja de 2,9 s a 1,5 s. 👉 **Calentar con tres `curl` y
>    comprobar que responde `HIT` antes de la primera medición.**
> 3. 🔴 **El copy largo no puede vivir en `messages/<locale>.json`. ADR-37.**
>    `NextIntlClientProvider` serializa el fichero entero en **todas** las
>    páginas, así que los 3,8 KB de argumentario de la home viajaban a cada
>    oportunidad y a cada landing, donde nadie los pinta — y costaban puntos en
>    páginas que la fase no tocaba. El copy se movió a `messages/home/`, cargado
>    con `createTranslator` desde un módulo `server-only`, igual que los legales.
>    Resultado: la home pesa 13 KB más de contenido y **no pierde un punto**.
>
> 👉 **Lo que la C2 tiene que llevarse de aquí:** medir con mediana de 3 como
> mínimo, calentar el borde en producción, y **mirar el LCP antes que la nota**.
> En local casi todo el sitio está en 2,4–2,8 s con el umbral «bueno» en 2,5, y
> la C2 trae **una fuente nueva** (General Sans, local), que es exactamente lo
> que cruza ese borde sin que la nota baje mucho.
>
> ⚠️ **Y una trampa de método que costó dos mediciones falsas:**
> `pkill -f "next start"` **no mata** el servidor de `pnpm start:local`. El
> puerto 3210 se queda con el proceso viejo, el nuevo `start` falla en silencio y
> se acaba midiendo el build anterior creyendo que es el nuevo. Se mata con
> `kill -9 $(lsof -ti tcp:3210)`, y se comprueba con un `grep` de algo que solo
> esté en el build que se quiere medir.
>
> ### Lo que sube de la línea base sin que lo hiciera esta fase
>
> - **Migraciones: 18 / 18**, sin huecos. La `20260816120000_verification` ya
>   está aplicada en producción (fila 30 de la auditoría, que decía 18/17).
> - **Variables de Vercel: 11 / 11.** `RESEND_API_KEY` y `EMAIL_FROM` están
>   puestas (fila 31, que decía «faltan 2»).
> - **`format:check` limpio** (fila 17, que fallaba).
>
> ### Lo que sigue abierto y esta fase no toca
>
> - 🟡 **`ettrecruiter.vercel.app` sirve el sitio a 200 y es rastreable**
>   (hallazgo 8). Mitigado porque su canónica apunta al apex. Es configuración
>   de dominio, no credibilidad. **Anotado, no arreglado.**
> - 🔴 **`/es/trabajo/**` es 404 en producción** (hallazgo 5). Es ADR-23
>   funcionando: 0 vacantes ⇒ 0 landings. **No se arregla con código, se arregla
>   con una ETT.**
> - 📝 **La documentación dice que `(auth)` es `noindex, follow` y el código
>   pone `noindex, nofollow`.** Ya era así antes de la C1. Alguien tiene que
>   decidir cuál de las dos es la buena.
> - **La C2 entera**: tipografía, escala, color, espaciado, componentes y
>   estados de carga/error. La paleta y General Sans están elegidas y **no se han
>   aplicado aquí**, a propósito.

> ## 🎨 2026-08-20 — el diseño se parte en dos fases, y con qué se hace
>
> **Decisión de Ulises.** El punto 6 («el pase de credibilidad», decidido el
> 2026-08-18) deja de ser una fase y pasa a ser dos: **C1 · Credibilidad** y
> **C2 · Sistema visual**, escritas con su alcance y su «hecho cuando» en
> `docs/02-ROADMAP.md`.
>
> **Por qué dos y no una:** C1 se cierra contra hechos medibles —la tabla de 40
> cifras de la auditoría— y C2 se juzga a ojo. Juntas, lo subjetivo contamina lo
> auditable, y aquí lo que no se mide no se cierra.
>
> **Y NO dependen del punto 4** — corregido el 2026-08-20 el mismo día que se
> escribió. El PM lo puso como precondición con el argumento de que «captar hacia
> un embudo que se para quema la captación». Ese argumento era bueno el
> 2026-08-18 y **se quedó flojo esa misma tarde**: con la migración aplicada y las
> variables puestas, quien llegue hoy se registra, completa el perfil y **sube sus
> documentos sin problema**; lo único que falta es que un admin los revise, que es
> un cuello de botella de operaciones y no de código. Y la captación que se podría
> «quemar» hoy casi no existe: Search Console sigue sin dar de alta.
>
> **No hay dependencia técnica**: la C1 toca la home, el eyebrow, los enlaces, los
> metadatos de `(auth)` y la cabecera; el punto 4 toca migración, correo y
> backoffice. **Cero ficheros en común**, y encima los hacen actores distintos —
> el punto 4 lo termina Ulises a mano, la C1 es una sesión de código. Serializarlos
> no gana nada.
>
> **La única coordinación es de calendario:** la C1 redespliega y toca la página de
> registro, así que el alta real del punto 4 no debe caer **en mitad** de ese
> despliegue. Antes o después, da igual.
>
> ### Los agentes: cuáles sí y cuáles no — reafirmado el 2026-08-20
>
> | Agente                                                       | Veredicto                                                                                      |
> | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
> | `layout-disruptivo` (anti-grid, Awwwards)                    | ❌ un layout roto empeora justo lo que se viene a arreglar                                     |
> | `gsap-senior-animator`, `r3f-scene-builder`, `shader-artist` | ❌ excluidos el 2026-08-18 y por ADR-10. El candidato entra con 4G                             |
> | `ui-polish`                                                  | ✅ tipografía responsive, jerarquía, estados. **En C2**                                        |
> | `visual-qa`                                                  | ✅ **el importante**: capturas, 390 px real, Lighthouse. Es lo que permite cerrar con medición |
> | `nextjs-app-router`                                          | ✅ para los metadatos de `(auth)`, que es el hallazgo 7                                        |
>
> **El razonamiento, para que nadie lo reabra por gusto:** «profesional» para un
> peón no es lo mismo que «profesional» para un diseñador. Lo que da seguridad a
> quien ya ha sido estafado por WhatsApp es un nombre real con domicilio, cifras
> con fuente y un «a ti no te cobramos nunca». No es movimiento. Y **Lighthouse
> 97–99 es un activo medido**: es lo primero que se pierde si entra la trilogía.
>
> ### Lo que se midió ese día y define el alcance de C1
>
> - La home: **1 `<h1>`, cero `<h2>`**, 546 bytes de copy.
> - 🔴 **El CTA principal lleva al vacío.** «Ver ofertas» aparece **dos veces** y
>   `/es/ofertas` responde «No hay / Sin resultados», con cero enlaces de
>   vacante. Es lo que más confianza destruye hoy, y **no es un problema de
>   diseño**.
> - 🔴 El eyebrow de la home dice **«Fase de construcción»**.
> - 🔴 Hallazgo 7 vivo: `/es/registro` sirve el título de la home y **sin
>   canónica** (recomprobado el 2026-08-20).
> - 🔴 La cabecera desborda a 390 px: el documento mide **453**.
> - ✅ Ya resuelto por los legales: la home dice quién responde y enlaza al
>   Impressum.
>
> ### La paleta y la tipografía, elegidas el 2026-08-20
>
> Primario `#0D9488`, primario dark `#134E4A`, acento `#F97316`, neutros, y
> **General Sans** (Fontshare — no está en Google Fonts, va local con
> `next/font/local`). Van a los tokens de `globals.css`, que ya existen; **no se
> escribe un color en el JSX**. Ficha completa en la C2 del roadmap.
>
> ⚠️ **Un aviso medido, y no cambia la paleta sino el reparto de papeles:**
> blanco sobre el acento `#F97316` da **2,80:1** y falla WCAG AA **incluso para
> texto grande**; blanco sobre el primario `#0D9488` da **3,74** y solo vale
> para texto grande e interfaz. El que aguanta texto es el primario dark
> `#134E4A` (**9,48**). Las salidas están calculadas en el roadmap: botón
> `#134E4A` con blanco, o naranja con **tinta encima** (6,37); naranja para
> texto solo en `#C2410C` (5,18). **Un botón que no se lee a pleno sol en un
> móvil barato no parece profesional, parece descuidado**, y esta fase existe
> justo para lo contrario.
>
> ### El prompt de la C1 está escrito — 2026-08-20
>
> `docs/prompts/fase-c1.md`. Se pega en una sesión nueva y limpia **cuando el
> punto 4 esté cerrado**, no antes. El de la C2 no se escribe todavía, a
> propósito: uno redactado hoy ignoraría lo que la C1 descubra.
>
> **Un matiz que el prompt corrige y conviene no volver a perder:** la página de
> ofertas vacía **no es un callejón sin salida**. Tiene un estado vacío honesto
> —«Todavía no hay vacantes publicadas», con el motivo y un botón a las
> oportunidades— en `jobs/page.tsx:84-97`, y está bien hecho. **No hay que
> rehacerlo.** El problema es de **jerarquía de CTA**: el botón más llamativo del
> sitio lleva a la página que dice que no hay nada, mientras `/oportunidades`
> —cinco perfiles con cifras, fuente y fecha— es el enlace secundario.
>
> **Pendiente de decisión de Ulises, y sigue abierta desde el 2026-08-18:**
> precisar **ADR-10** para que «sobrio y profesional» quede definido como
> **creíble** y no como vacío, y para que la política de agentes de arriba viva
> en un ADR y no solo aquí. Es una enmienda de un párrafo, no una sustitución.

> ## ✅ 2026-08-19 — los textos legales, publicados y vivos
>
> **Punto 3 del orden acordado: hecho, desplegado y verificado contra
> producción.** En `https://talpass.eu` ya no se pide un consentimiento sobre
> documentos que no existen.
>
> ### Lo que está hecho y medido
>
> - **Cinco documentos publicados en `es` y `en`**, con su fecha de versión y
>   diciendo, visible y no en letra pequeña, que los redacta el responsable y no
>   son un dictamen jurídico. Sin ninguna fórmula de «pendiente de revisión»,
>   por la decisión de Ulises: la captación no espera a un abogado.
>   Son los cuatro que se consienten **más el Impressum** (§5 DDG), que no es un
>   permiso sino la identificación del responsable.
> - **Ruta `/legal/[documento]`** con el segmento traducido
>   (`/es/legal/privacidad` ↔ `/en/legal/privacy`). Estáticas, cacheadas, sin
>   tocar la sesión y con metadatos propios — no los de la home, que es el
>   hallazgo 7. **ADR-33.**
> - **El cuerpo NO va en `messages/`, y está medido por qué.**
>   `NextIntlClientProvider` serializa el fichero entero en el HTML de **todas**
>   las páginas: la home son 52 KB y llevan dentro el backoffice y los correos.
>   Los documentos pesan 24,6 KB por idioma. Van a `messages/legal/`, que importa
>   solo la ruta legal; los títulos sí se quedan en `messages/` porque los enlaza
>   el pie en todas las páginas. Resultado: la home sube 6,4 KB en vez de 24, y
>   el cuerpo **no aparece** en su HTML (`grep` = 0).
> - **El consentimiento del registro, arreglado. ADR-34.** Cuatro enlaces
>   reales, uno por documento, que abren en pestaña nueva —verificado a 390×844
>   que el formulario relleno **no se pierde**—. `CONSENT_VERSIONS` sube a
>   `2026-08-19`, porque una versión que apunta a un texto inexistente no
>   acredita nada.
> - **Las casillas siguen siendo tres, a propósito y razonado.** Lo que la ley
>   exige consentir por separado —`data_sharing` y `audio_sharing`— ya tenía
>   casilla propia desde la fase 2. `terms` + `privacy` comparten casilla porque
>   ninguno es consentimiento del 6.1.a, y siguen siendo **dos filas** con su
>   versión cada una. Separarlos habría añadido una pulsación al alta desde el
>   móvil sin ganar granularidad legal.
> - **Datos del responsable en `src/config/controller.ts`**, no rociados por el
>   copy, y comprobados en el HTML con la `ß` y la diéresis.
> - `typecheck`, `lint`, `format:check` limpios · `test:security` 64 verdes ·
>   `drill` verde · `JobPosting` en `/oportunidades` = **0** · paridad `es`/`en`
>   limpia en los dos pares de ficheros.
>
> ### Desplegado y verificado
>
> **`dpl_2vHfuQdbqKGdAJwxjjcZ41CMJbSd`**, aliased a `talpass.eu` y confirmado
> con `vercel inspect` **antes** de leer ninguna cabecera.
>
> ⚠️ **Ese identificador acredita esta verificación, no lo que se sirve hoy.**
> Detectado el 2026-08-20: ya el mismo día 19 el alias había pasado a un
> redespliegue posterior, y el 20 volvió a moverse dos veces más. **No busques
> aquí cuál está vivo** —esta línea no puede saberlo—; pregúntaselo a quien sí:
>
> ```bash
> pnpm exec vercel inspect talpass.eu
> ```
>
> Lo verificado abajo sigue siendo cierto: se recomprobó el 2026-08-20 contra el
> despliegue vivo de ese momento —12 rutas legales a 200, los cuatro enlaces del
> registro, `dub1` en las funciones— y **ninguna de esas mediciones cambió**,
> porque todos esos despliegues son del mismo código.
>
> **La regla que sale de esto, y vale para toda la documentación:** un `dpl_`
> escrito en prosa **acredita una verificación con fecha**; nunca dice cuál está
> vivo, porque caduca en cuanto alguien redespliega. Escribir «el que sirve hoy
> es X» ha envejecido mal **tres veces en dos días**. Se acredita el `dpl_` de la
> medición, y para saber el vivo se ejecuta el comando.
>
> - **Las doce rutas a 200** en `es` y `en`, legibles sin ejecutar JavaScript.
> - `x-vercel-cache: HIT` + `x-nextjs-prerender: 1`, **sin**
>   `x-ett-session-checked` y **sin** `Set-Cookie`. Su `x-vercel-id` es `fra1::`
>   a secas: las sirve el borde sin llegar a ejecutar función.
> - **Control negativo intacto:** `/es/cuenta` sigue en 307 con
>   `x-ett-session-checked: 1` y con la función en **`dub1`**. ADR-11, ADR-13 y
>   ADR-32 siguen en pie después de este despliegue.
> - **El sitemap pasa de 7 a 13 URLs.**
> - **El Impressum enseña los seis campos** en el HTML servido.
> - **Y lo que motivaba la sesión:** el consentimiento del registro trae
>   **cuatro enlaces reales, uno por documento, y ni un `<strong>`**. El
>   hallazgo 3 está cerrado donde importa, que es donde se sirve.
>
> Detalle y tabla de cierre en `docs/evidencia/textos-legales/02-produccion.md`.
>
> ⚠️ **Lo que NO se comprobó, para que nadie lo dé por hecho:** el alta
> end-to-end se hizo a 390×844 **contra la base local**, no contra producción.
> Las cuatro filas de `consents` con la versión `2026-08-19` están demostradas
> en local. Ejercitar el alta real contra el remoto es del punto 4, que es donde
> van la migración y las dos variables de Vercel.
>
> ### Lo que la sesión encontró y no estaba en el guion
>
> - **La política dice que hoy NO se pide IBAN, ni dirección, ni teléfono, y es
>   cierto.** El prompt daba por hecho que se recogían. Las tablas existen desde
>   la fase 1 (`candidate_private`, con el IBAN cifrado), pero **ninguna pantalla
>   los escribe**: `grep` sobre `src` no encuentra un solo campo. Escribir que se
>   recogen habría sido copy falso en la dirección contraria, en la sesión que
>   viene justo de arreglar copy falso. El texto dice qué se recoge hoy y qué
>   pasará el día que se pidan.
> - **Tampoco hay botón de borrar la cuenta.** `data_deletion_requests` existe
>   con su RLS y no la usa nada. La política lo dice con todas las letras, y el
>   día que se construya **hay que subir la versión del texto**.
> - **La cabecera desborda en móvil, y ya lo hacía.** A 390 px el documento mide
>   **453**, por la cabecera (`header > div`), no por los legales. Comprobado que
>   la home, que esta sesión no toca, hace exactamente lo mismo. El pie nuevo con
>   sus cinco enlaces mide 390 y envuelve bien. **Va al rediseño (punto 6).**
> - **`parity.mjs` cazó algo real**: 8 divergencias entre `art. 6.1.b` y
>   `Art. 6(1)(b)`. No era un error de fondo, pero ocho divergencias fijas en la
>   salida habrían escondido la novena. Numeración unificada a `6.1(b)`, válida
>   en los dos idiomas. El script ahora acepta el par de ficheros por argumento
>   —se generalizó el que había en vez de escribir otro—.
>
> ### Decisiones que quedan escritas y le tocan a Ulises revisar
>
> - **Las filas de `consents` con versión vieja.** En la base local hay **24 con
>   versión `1`** (el valor de reserva del disparador) y **3 con `2026-08-14`**.
>   Ninguna acredita consentimiento informado, porque su texto no existió nunca.
>   **No se borran** —la fila prueba que hubo un acto—, y lo correcto es volver a
>   pedirlo en el siguiente acceso. **Ese flujo no se construye aquí.**
>   👉 **Antes de construir nada, mira cuántas cuentas reales hay en producción.**
>   Si son de prueba, el arreglo es borrarlas, no montar un reconsentimiento.
> - **La política se compromete a plazos que hoy se cumplen a mano**: 30 días
>   para el borrado, 3 años para consentimientos y aperturas, 1 año para
>   `email_log`. El texto lo admite expresamente en vez de fingir un proceso
>   automático. Programarlos queda en la fase 9.
> - **Sin banner de cookies, y es una decisión.** No hay analítica, ni
>   seguimiento, ni cookie de idioma; las públicas no ponen ni una `Set-Cookie`.
>   Sin cookies que consentir, un banner sería teatro. La política lo dice. Si
>   algún día entra analítica, el banner vuelve a ser tarea.
>
> **Fase 9 pasa a 🟡** en el roadmap: los textos y la página de «qué ve una ETT»
> ya no son suyos; le quedan la exportación, el borrado desde el producto y los
> plazos programados.

> ## ✅ 2026-08-19 — el copy falso, corregido y desplegado
>
> **Punto 2 del orden acordado: hecho y vivo en `https://talpass.eu`.** Las
> cinco páginas de oportunidad ya no publican ninguna cifra que no salga de una
> oferta concreta del informe.
>
> - **Rango observado puro (ADR-31, ya escrita).** Almacén **15,69 – 17,50**
>   (R2, R4, R5), logística **15,69 – 17,50** (las mismas tres, que son las
>   únicas de su bloque con cifra) y producción **14,96 – 16,50** (R3, Dresde).
>   Se fueron el 18,00 y el 17,00, que salían de las reglas de redacción del
>   §2.1 y no de ninguna oferta. Cárnico y agrícola, intactos.
> - **`facts.basisObserved` reescrita** en `es` y `en`: ya no habla del suelo del
>   convenio, dice que los dos extremos son lo observado, con la fecha de
>   consulta interpolada desde `OPPORTUNITY_SOURCE_DATE`.
> - **R4 y R5 corregidos.** El `summary` de almacén ya no dice ser el perfil más
>   frecuente ni el mejor pagado —los dos eran falsos y contradecían a la ficha
>   de producción—: ahora se apoya en el certificado de carretilla, que sí está
>   verificado (§2.1, regla 3).
> - **El efecto del 2026-09-01, resuelto en el copy.**
>   `production.conditions[0]` dice que el rango es lo medido en su fecha y que
>   el suelo del convenio manda por encima. Sigue en la lista de B.3.
> - **B.2 ya estaba corregido** en el propio commit de la auditoría (`a71fba5`):
>   el §0 del informe dice «Once de las catorce». No había nada que hacer.
> - **R3 no se toca**, por la decisión de Ulises de abajo, y queda anotado junto
>   a los tres pares de campos en `src/lib/opportunities.ts`.
>
> Evidencia y tabla B.1 rellenada de nuevo en
> `docs/evidencia/correccion-copy/`.
>
> **Desplegado: `dpl_rQSDT7UzxqMPkHieAVfUVBsm15pB`**, confirmado con
> `vercel inspect talpass.eu` antes de leer ninguna cabecera. En producción, sin
> ejecutar JavaScript: las cifras nuevas en `es` y `en`, `x-vercel-cache: HIT`
> con `x-nextjs-prerender: 1` y sin `x-ett-session-checked` ni `Set-Cookie`, y
> cero `JobPosting`. Detalle en `docs/evidencia/correccion-copy/02-produccion.md`.
>
> **Lo siguiente es el punto 3: los textos legales y su ruta**, que arrastra el
> `<terms>` en negrita del registro y las cuatro fechas de `src/config/legal.ts`
> que hoy versionan documentos que no existen.

> ## 📋 2026-08-18 — auditoría previa hecha, y el rumbo cambia
>
> **Lee esto primero y no actúes sobre los bloques de abajo sin haberlo leído.**
> Los de más abajo son ciertos en lo suyo, pero este los reordena.
>
> **Se ha pasado una auditoría al proyecto entero.** Entregable en
> `docs/evidencia/auditoria-previa/` (6 ficheros), y su `00-resumen.md` abre con
> **una tabla de 40 cifras con el comando que produce cada una**. Esa tabla es la
> línea base del rediseño: la auditoría posterior la vuelve a rellenar columna a
> columna. **No la reinventes; rellénala.**
>
> **Decisión de Ulises, 2026-08-18: se replantea el orden del roadmap y se hace
> un pase de credibilidad sobre las páginas públicas.** El motivo no es estético.
> La home son 375 bytes de copy, un `h1` y cero `h2`; no hay ni una cara, ni
> quién hay detrás, ni un texto legal. Un peón que se plantea subir su DNI y su
> IBAN a un dominio que no conoce, en un sector lleno de estafas, **no tiene con
> qué decidir que esto no es un fraude**. Eso es lo que se arregla, y por eso es
> medible.
>
> **El roadmap no se renumera: se corta en dos vías.** Nada se tira, nada cambia
> de número.
>
> - **Vía A — espera a la ETT** (fases 3, 4, 5, 6, 7): construidas y verificadas,
>   congeladas donde están. Se retoman el día que haya ETT.
> - **Vía B — captar y retener candidatos, ahora**: corregir el copy falso ·
>   textos legales · desbloquear la verificación en producción · el campo de
>   sector de destino en el onboarding · el pase de credibilidad.
>
> **Los textos legales dejan de ser fase 9** y entran en la vía B: caen dentro de
> la superficie del rediseño y son parte del problema de confianza, no un
> trámite posterior.
>
> **Pendiente de decisión de Ulises: precisar ADR-10** — el presupuesto de
> velocidad se queda intacto y "sobrio y profesional" pasa a definirse como
> **creíble**, no como vacío. Es una enmienda de un párrafo, no una sustitución.
> Y **nada de GSAP, R3F ni shaders**: hay agentes instalados para eso en la
> máquina y en este proyecto restan. El candidato entra con 4G desde el móvil.
>
> ### Lo que la auditoría encontró, por orden de gravedad
>
> **Estado al 2026-08-19, recomprobado contra producción:** resueltos 1, 2 (cuatro
> de cinco), 3 y 4. **Siguen vivos 5, 6, 7 y 8**, los cuatro verificados hoy:
> `/es/trabajo/alemania` da 404, `vercel env ls` no trae `RESEND_API_KEY` ni
> `EMAIL_FROM`, `/es/registro` sigue sirviendo el título de la home sin canónica,
> y `ettrecruiter.vercel.app` sigue a 200.
>
> 1. ~~**La fase 4b no existía fuera del portátil.**~~ **✅ RESUELTO HOY.**
>    `origin/main` iba 4 commits por detrás y **no tenía ni uno de los 6 ficheros
>    de `opportunities`**: el sitio que Google está indexando existía solo en
>    local. Hecho `git push`; `origin/main` = `a71fba5` y verificado que los 6
>    ficheros están. La frase "Git y producción quedan sincronizados" que este
>    documento tenía escrita **era falsa** y la escribió el PM.
> 2. ~~**Cinco atribuciones falsas vivas en producción.**~~ ✅ **CUATRO
>    RESUELTAS el 2026-08-19** (ADR-31, `docs/evidencia/correccion-copy/`). **La
>    quinta —el alojamiento y el transporte— sigue publicada a propósito**: es
>    la excepción consciente de Ulises, ver «La decisión de las cifras». El texto
>    original se conserva porque describe la fuente: La peor: los
>    perfiles de **almacén, logística y producción** publican "Alojamiento / En
>    algunas ofertas" y "Transporte / En algunas ofertas" sobre una investigación
>    cuyo dato es **0 de 14 lo ofrecen y 14 de 14 callan**. No es una etiqueta mal
>    puesta como la que se cazó al cerrar la 4b: **es un hecho inventado**, y cae
>    justo en las dos casillas que son la apuesta del producto. Las otras cuatro:
>    dos techos salariales etiquetados "observado" que salen de las **reglas de
>    redacción** del informe (18,00 en almacén y 17,00 en producción; nunca se
>    observaron) y dos frases de la ficha de almacén que contradicen a la de
>    producción. Detalle en `04-superficie-copy.md` §B.1.
> 3. ~~**El registro pide aceptar unos Términos que no existen.**~~ ✅
>    **RESUELTO el 2026-08-19** (ADR-33 y ADR-34,
>    `docs/evidencia/textos-legales/`): 12 rutas legales vivas, enlaces reales en
>    el registro y `CONSENT_VERSIONS` en `2026-08-19`. Era: No hay ninguna
>    ruta legal (`/es/privacidad`, `/es/terminos`, `/es/legal` son 404), la
>    casilla obligatoria pone los Términos **en negrita en vez de enlazarlos**
>    (`<terms>` → `<strong>`), y `src/config/legal.ts` versiona con fecha
>    `2026-08-14` cuatro documentos que no están en el repositorio.
> 4. ~~**Las funciones se ejecutan en Estados Unidos.**~~ ✅ **RESUELTO el
>    2026-08-19** (ADR-32, `vercel.json` → `dub1`), verificado ruta por ruta.
>    Era: La cabecera
>    `x-vercel-id` de una ruta privada empieza por `fra1::iad1::`: el borde está
>    en Fráncfort y **la función en Washington**,
>    contra una base de datos en Irlanda. Con ADR-29 la subida de documentos
>    **pasa por el servidor**, así que hoy un DNI transita por `iad1`. Choca de
>    frente con ADR-09 ("los datos personales de ciudadanos UE no salen de la
>    UE"). No lo cubre ningún ADR y no hay `vercel.json` ni `regions`. El arreglo
>    es una línea de configuración y un redespliegue; la decisión de si es
>    urgente es de Ulises.
> 5. 🔴 **`/es/trabajo/**` es 404 entero en producción** (0 vacantes ⇒ 0
>    landings, ADR-23). Funciona como está diseñado, pero **ningún documento lo
>    decía** y el roadmap sigue presentando las landings como entregadas. La
>    superficie indexable real de producción eran **7 URLs** (hoy **13**, tras los
>    legales), y el "landing 97"
>    del roadmap **no se puede reproducir donde se sirve**: el rediseño mide en
>    local para tener las seis páginas.
> 6. ~~🟡 **Faltan DOS variables en Vercel, no tres.**~~ ✅ **RESUELTO el
>    2026-08-20**: `RESEND_API_KEY` y `EMAIL_FROM` puestas, 11 variables en
>    `production`, y con un redespliegue **posterior** a ellas, que es lo que
>    hace que la función las lea.
> 7. 🟡 **Las páginas de `(auth)` no tienen metadatos propios**: `/es/registro`
>    sirve el título y la descripción **de la home**, sin canónica y con el
>    `hreflang` apuntando a la home. Cae dentro del rediseño.
> 8. 🟡 **`ettrecruiter.vercel.app` sirve el sitio entero a 200 y es rastreable**
>    en vez de redirigir. Mitigado porque su canónica apunta al apex.
>
> ### La decisión de las cifras — **tomada el 2026-08-19 por Ulises**
>
> Estaba abierta desde el día 18 y ya no lo está. Dos partes, y no van en la
> misma dirección:
>
> **1. Los salarios pasan a rango observado puro.** Se abandona la fórmula mixta
> "suelo del convenio + techo observado": los dos extremos salen de las ofertas
> analizadas. Almacén y producción bajan (18,00 y 17,00 eran reglas de redacción
> del informe, no observaciones) y logística también se revisa, porque su mínimo
> era el del convenio. El suelo del convenio no se va de la página: sigue en el
> bloque `Opportunities.agreement`, que es su sitio. Queda como **ADR-31**, que
> escribe la sesión de la corrección.
>
> ⚠️ **Efecto con fecha:** producción arrancará en 14,96 €/h, y **el 2026-09-01
> el suelo legal pasa a 15,33 €/h**. Ese día la ficha enseñará un mínimo por
> debajo del suelo legal, al lado de un bloque que anuncia el 15,33. No es falso
> —es lo medido el 2026-08-16 y la página publica su fecha— pero **tiene que
> leerse como lo que es**, y entra en la lista con fecha de B.3.
>
> **2. Alojamiento y transporte se quedan en "En algunas ofertas".** El hallazgo
> R3 —el más grave de la auditoría— **no se corrige**. La fuente dice
> **0 de 14 lo ofrecen y 14 de 14 callan**; la página seguirá diciendo "en
> algunas". Motivo dado por Ulises: estas páginas son un reclamo temporal para
> captar las primeras 30 personas y "en tres días esto dará igual".
>
> Queda escrito aquí, y no como ADR, porque **un ADR es una regla que se sigue y
> esto es una excepción consciente y temporal**. El PM planteó dos veces que la
> fuente dice cero; Ulises lo reafirmó. Se anota también junto al código, para
> que dentro de un mes nadie lo tome por un descuido.
>
> Lo que conviene no perder de vista: las páginas están **indexadas desde el
> 2026-08-17**, así que lo que se lea estos días entra en el índice de Google
> aunque el copy cambie después. **Revisar esta excepción es una tarea viva, no
> un asunto cerrado.**
>
> ### El responsable del tratamiento — cerrado el 2026-08-19
>
> ```
> José Ulises Suárez Victoria · NIF 50232706S
> Theodor-Heuss-Straße 16, 37075 Göttingen (Alemania)
> kayaosv@gmail.com
> ```
>
> Persona física. **Completo: nada bloquea el despliegue de los legales.** Va a
> un módulo de configuración, no al copy. Reside en Alemania, así que el
> documento que manda es un **Impressum (§5 DDG)**, no un aviso legal español;
> el NIF identifica al responsable pero no es lo que pide el Impressum (ahí iría
> la USt-IdNr, y solo si se tiene).
>
> **Decisión de Ulises, 2026-08-19: la captación no espera a una revisión
> legal.** Los textos los redacta el responsable y salen publicados y en vigor.
> Los documentos dicen que no son un dictamen jurídico —eso se queda, porque es
> cierto—, pero **no llevan ninguna fórmula de «pendiente de revisión»**. El PM
> planteó el riesgo; Ulises lo asumió y pidió no volver sobre ello.
>
> ✅ **La dependencia con la región queda resuelta antes** — decisión de Ulises
> del 2026-08-19: primero la región, luego los legales. Ver el bloque de
> `vercel.json` más abajo. En cuanto ese despliegue esté vivo, la política de
> privacidad **sí puede afirmar que el tratamiento ocurre en la UE**; hasta
> entonces, no.

> ### 🗓️ Tarea con fecha: **2026-09-01**
>
> Ese día sube el convenio a 15,33 €/h y hay que revisar **la lista de B.3 de la
> auditoría** (`docs/evidencia/auditoria-previa/04-superficie-copy.md`), que
> desde el 2026-08-19 incluye un punto más:
>
> - **El mínimo de producción, 14,96 €/h**, queda por debajo del suelo legal
>   vigente. El copy ya lo explica (`production.conditions[0]`), pero hay que
>   releerlo ese día y decidir si se mantiene o se rehace la medición.
> - `Opportunities.disclosure.source` pasa a hablar en pasado de una subida que
>   ya habrá ocurrido.
> - `agreement.body` y los `conditions[0]` de cárnico y agrícola interpolan
>   `AGREEMENT_FLOOR`, así que se corrigen solos: lo que caduca es el texto que
>   los rodea, no la cifra.
> - La excepción de alojamiento y transporte (arriba) es buen momento para
>   revisarla también.
>
> ### ✅ La región, cerrada el 2026-08-19 — las funciones corren en Dublín
>
> Era el hallazgo 4 de la auditoría: `x-vercel-id` de `/es/cuenta` empezaba por
> **`fra1::iad1::`** —borde en Fráncfort, **función en Washington**— contra una
> base en Irlanda. Con ADR-29 el archivo del candidato pasa por el servidor, así
> que un DNI transitaba por Estados Unidos, contra ADR-09.
>
> `vercel.json` con `"regions": ["dub1"]` y **ADR-32**, que razona por qué
> Dublín y no Fráncfort: `dub1` es `eu-west-1`, **la misma región de AWS donde
> está Supabase**, y lo que domina la latencia de una ruta privada son las idas
> y venidas función↔base, no la distancia al candidato.
>
> Desplegado por Ulises: **`dpl_6TMu6yXKRiP9bCpsuXyzsatCHFVU`**, aliased a
> `talpass.eu`. Verificado con `curl` sobre producción:
>
> | Ruta                                         | `x-vercel-id`  | Qué es                                     |
> | -------------------------------------------- | -------------- | ------------------------------------------ |
> | `/es`, `/es/oportunidades`, ficha de almacén | `fra1::…`      | estáticas: las sirve el borde, sin función |
> | `/es/cuenta`, `/es/admin`                    | `fra1::dub1::` | borde Fráncfort, **función Dublín**        |
> | `/api/auth/callback`                         | `fra1::dub1::` | ídem                                       |
> | **`/api/documents/[id]`**                    | `fra1::dub1::` | **la vía del DNI: ya no toca EEUU**        |
>
> Tres peticiones seguidas a `/es/cuenta` dieron `dub1` las tres. **Ni un
> `iad1` en ninguna ruta.** Control negativo intacto: `/es/cuenta` 307 con
> `x-ett-session-checked: 1`, y `/es/oportunidades` 200 con
> `x-vercel-cache: PRERENDER` y **sin** cabecera de sesión ni `Set-Cookie`
> (ADR-11, ADR-13).
>
> ℹ️ El log de construcción dice `Running build in Washington – iad1`: esa es la
> **máquina que compila**, no dónde corre el código, no la cambia `regions` y no
> trata datos de nadie. Lo que importa es el runtime, y está en Dublín.
>
> **Consecuencia inmediata: la política de privacidad ya puede afirmar que el
> tratamiento ocurre en la UE.** Los legales quedan desbloqueados.
>
> ⚠️ **Lo que NO se comprobó, para que nadie lo dé por hecho:** un flujo con
> **sesión real** —entrar, `/es/cuenta`, abrir un documento en el backoffice—.
> La sesión solo pudo ver 307 y 401, que es lo que devuelve sin credenciales, y
> el A/B contra el despliegue anterior **no se pudo hacer**: su URL está tras la
> protección de despliegue y responde 302 en el borde sin ejecutar la
> aplicación. Así que **hay dirección demostrada pero no magnitud medida**.
>
> Ulises decidió el 2026-08-19 no hacer esa prueba a mano y pasar a los legales.
> No queda al aire: **el criterio de cierre del prompt de los legales incluye un
> alta completa end-to-end desde el móvil**, que ejercita sesión y escritura con
> credenciales reales. Si eso falla, mirar la región antes que los legales.

> ### El orden acordado — nada de diseño hasta que esto esté
>
> 1. ~~`git push`~~ ✅ hecho el 2026-08-18.
> 2. ~~**Corregir el copy falso y redesplegar.**~~ ✅ **hecho el 2026-08-19**
>    con `docs/prompts/correccion-copy.md`, desplegado y verificado contra
>    producción. Ver el bloque de arriba y `docs/evidencia/correccion-copy/`.
> 3. ~~**Los textos legales y su ruta.**~~ ✅ **hecho el 2026-08-19** (ADR-33 y
>    ADR-34; verificado contra `dpl_2vHfuQ…`, y el alias ha cambiado varias veces
>    desde entonces sin cambiar el código — ver el aviso del bloque de arriba),
>    desplegado y verificado contra
>    producción. Ver el bloque de arriba y `docs/evidencia/textos-legales/`.
>    Lo siguiente era el punto 4, del que el 2026-08-20 se hicieron la
>    migración, las dos variables y el redespliegue; **queda solo el alta real**.
>    3.5. ~~**La región de las funciones**~~ ✅ **hecho el 2026-08-19** (ADR-32,
>    `dpl_6TMu6yXKRiP9bCpsuXyzsatCHFVU`). Se adelantó al punto 3 por decisión de
>    Ulises, para que la política de privacidad se escriba ya sin rodeos.
> 4. **Desbloquear la verificación en producción**: ~~`db:push:prod` de
>    `20260816120000_verification.sql`~~ ✅ · ~~las dos variables~~ ✅ ·
>    ~~redespliegue~~ ✅ — **todo el 2026-08-20**. 🔴 **Queda el alta real**, y la
>    bloquea que **no haya ningún admin en producción**: ver «El primer
>    administrador».
> 5. **El campo de sector/ciudad de destino en el onboarding** — antes de captar,
>    no después: pedírselo a 30 personas ya captadas es hacerlas volver.
> 6. **El pase de credibilidad** — **partido en dos fases el 2026-08-20**:
>    **C1 · Credibilidad** (lo que destruye confianza, auditable contra la tabla
>    de 40 cifras) y **C2 · Sistema visual** (tipografía, color, escala,
>    estados). Fichas completas con su «hecho cuando» en `docs/02-ROADMAP.md`.
>    **No dependen del punto 4 y pueden correr en paralelo** (corregido el
>    2026-08-20; ver el bloque de diseño arriba). Solo hay que evitar que el alta
>    real caiga en mitad de un despliegue de la C1.
>
> ### Lo siguiente — **el punto 4, y es de Ulises**
>
> Los puntos 2, 3 y 3.5 están hechos, desplegados y verificados. **Lo que toca es
> el punto 4: desbloquear la verificación en producción.** No lleva prompt de
> código: son escrituras y llaves, y las lanza Ulises.
>
> ✅ **La migración, hecha y verificada el 2026-08-20.** Ulises lanzó
> `pnpm db:push:prod` y el PM lo comprobó con `supabase migration list --linked`,
> no con el mensaje del script: **18 locales y 18 remotas, `local` y `remote`
> idénticos y sin huecos**. `20260816120000_verification` ya tiene su lado
> remoto. Producción está al día con el repositorio por primera vez desde la
> fase 4.
>
> ✅ **Las dos variables, puestas y verificadas el 2026-08-20.**
> `vercel env ls production` da **11**, y `RESEND_API_KEY` y `EMAIL_FROM` están.
> Y lo que importa tanto como ponerlas: **el redespliegue es posterior a ellas**
> —se comprobó que el que había era 8 minutos anterior y por tanto no las veía—.
> Sin regresiones: públicas sin cabecera de sesión ni `Set-Cookie`, control
> negativo en 307 con la función en `dub1`, sitemap 13, `JobPosting` 0.
>
> ⚠️ **Quedaron también en `Preview`**, a diferencia del resto de variables, que
> son solo `production`. Un despliegue de preview manda ahora **correos reales**
> desde el remitente de producción. Este proyecto ya se quemó con esto el
> 2026-08-16. Conviene dejarlas solo en `Production`.
>
> ℹ️ **`EMAIL_FROM` no era el bloqueante que decía la auditoría.**
> `src/lib/email/send.ts:51` es `process.env.EMAIL_FROM ?? 'no-reply@updates.talpass.eu'`:
> ya caía en el remitente correcto. La que bloqueaba de verdad es
> `RESEND_API_KEY`, que no tiene reserva.
>
> 🔴 **Lo que SIGUE ABIERTO y es lo único que queda del punto 4: el alta real
> contra producción.** Y tiene un bloqueo que se descubrió el 2026-08-20:
> **no existe ninguna cuenta de administrador en producción** —hay un solo perfil
> y es `candidate`—, así que los pasos de revisar y aprobar no se pueden
> recorrer. No es un olvido: el perfil nace siempre `candidate` a propósito, y
> el primer admin solo se crea desde una conexión privilegiada. **Hacen falta dos
> cuentas**, porque `role` es una sola columna. Cómo se hace, en «El primer
> administrador», más abajo.
>
> Después van el punto 5 (sector/ciudad de destino en el onboarding) y el 6 (el
> pase de credibilidad y su auditoría contra la tabla de 40 cifras).

> ## ✅ Fase 4b cerrada, 2026-08-17 — el sitio ya está abierto a Google
>
> El pollo y huevo **está roto por el lado del candidato**. Se publicaron **cinco
> perfiles de mercado** en `/es/oportunidades` ↔ `/en/opportunities` —almacén,
> logística, producción, cárnico y agrícola—, sacados de
> `docs/investigacion/ofertas-mercado.md` y del convenio de la Zeitarbeit, **sin
> una sola línea de `JobPosting` y sin fingir que hay vacantes abiertas**.
>
> **`NEXT_PUBLIC_ALLOW_INDEXING` está ENCENDIDA en producción.** `/robots.txt` ya
> no dice `Disallow: /` y el sitemap pasó de **2 URLs a 7**. Es la primera vez
> que el sitio es rastreable.
>
> Dos despliegues, en ese orden: `dpl_C5jM3MRvPU49pSugvnusD99LowDr` (el
> contenido) y `dpl_BTmB7MvesM7E65iDJNXvyeEbaM4U` (la bandera, que se hornea en
> el build y por eso exige redesplegar). Verificación completa contra
> `https://talpass.eu` en `docs/evidencia/fase-4b/02-produccion.md`.
>
> **Decisión nueva: ADR-30.** Una oportunidad no es una vacante y no puede llegar
> a serlo: no hay tabla, no hay migración y no hay camino de código hasta `jobs`.
> Y **ADR-16 y ADR-23 quedaron corregidas** el mismo día: la bandera ya no exige
> vacantes reales, y una página indexable sin vacante detrás no contradice
> ADR-23.
>
> **Las fases 3 y 4 siguen 🟡** y esta fase **no las cierra**: su criterio pide el
> Rich Results Test sobre una vacante real. Todo lo de la sección "El día que
> haya ETT" sigue vigente palabra por palabra, pero como el guion de ese día.
>
> **Siguiente paso real: conseguir la primera ETT.** Ya hay algo que enseñarle
> —un sitio indexado y una lista que empieza a llenarse—, que es exactamente lo
> que no había ayer.
>
> ⚠️ **Y el activo se enfría.** Esto acumula registros de gente esperando una
> vacante que todavía no existe: cuanto más tarde la ETT, menos vale la lista.
> No lo arregla el código, condiciona el calendario comercial.

> Última actualización: **2026-08-16**. **La fase 4 está construida y verificada
> en local**: subida de documentos, grabación de audio, backoffice de revisión,
> el primer correo propio de la aplicación y una vía para publicar vacantes
> reales. Se queda en 🟡 por **un solo criterio**: que exista una vacante real
> **publicada en producción**, que es una escritura deliberada y la hace Ulises.
> Esa misma vacante es la que desbloquea la fase 3 entera (Rich Results Test).
> ~~Y la bandera de indexación, que sigue APAGADA~~ — **caducado el 2026-08-17**:
> la bandera la encendió la fase 4b y ya no depende de que haya vacantes
> (ADR-16, corregida).
> ~~**Siguiente paso: publicar las primeras ofertas reales**~~ — **caducado el
> 2026-08-17**, ver el aviso de arriba. Sigue siendo el guion del día que haya
> ETT, y por eso no se borra.
> El detalle de cada fase está en `docs/02-ROADMAP.md`; las decisiones, en `docs/00-PROJECT.md`.

---

## Dónde estamos

**Fases 0, 1 y 2 cerradas. Las fases 3 y 4 están construidas y verificadas, y
las dos esperan a lo mismo: una vacante real en producción.** La 3 la necesita
para el Google Rich Results Test; la 4, porque su criterio de "hecho cuando"
incluye que el admin haya podido publicar una. No es trabajo de código: la vía
existe, está probada y documentada.

**Pero desde el 2026-08-17 se sabe que eso no depende de ponerse a ello, sino de
que exista una ETT** — una vacante real es de una agencia real. Por eso las dos
están bloqueadas y por eso existe la 4b: para conseguir los candidatos con los
que se cierra esa ETT.

| Fase                    | Estado                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| 0 · Fundaciones         | ✅ desplegada en producción                                                                          |
| 1 · Datos y seguridad   | ✅ 36 tablas, RLS probada                                                                            |
| 2 · Auth y onboarding   | ✅ registro real end-to-end                                                                          |
| 3 · Vacantes + SEO      | 🟡 **bloqueada hasta que haya ETT** — Rich Results Test sobre vacante real                           |
| 4 · Verificación        | 🟡 **bloqueada hasta que haya ETT** — publicar una vacante real                                      |
| **4b · Oportunidades**  | **✅ cerrada 2026-08-17 — 5 perfiles vivos y el sitio abierto a Google**                             |
| **Vía B**               | **🟢 es donde se trabaja hoy** — ver «El orden acordado», arriba                                     |
| **C1 · Credibilidad**   | **✅ cerrada 2026-08-20** — desplegada y verificada; ADR-35, 36, 37 y ADR-10 precisada               |
| **C2 · Sistema visual** | **⬜ vía B, y es lo siguiente** — prompt listo en `docs/prompts/fase-c2.md`; ojo al LCP en 2,4–2,8 s |
| **5 · Aplicaciones**    | **⬜ congelada en la vía A** — su prompt sigue sin escribirse, a propósito                           |
| 6, 7, 8, 10             | ⬜ vía A, congeladas hasta que haya ETT                                                              |
| **9 · GDPR y legal**    | **🟡 los textos legales salieron de aquí y están vivos** (ADR-33, ADR-34)                            |

### Lo que dejó la fase 4 (2026-08-16, verificado contra la base local)

| Verificación                      | Resultado                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Ciclo completo en móvil (390×844) | 4 documentos → **rechazo con motivo** → vuelve a subir → aprobación → `verified` |
| Aviso al candidato                | leído en Mailpit, en **su** idioma, aprobado y rechazado                         |
| Registro de aperturas             | una fila por apertura del admin, con IP y user-agent (ADR-25)                    |
| URL firmada                       | 60 s, emitida en servidor tras comprobar permiso; sin sesión, **404**            |
| Sin credencial de correo          | el candidato **igual pasa a `verified`**; el fallo se ve y queda en `email_log`  |
| `test:security` · `:drill`        | **64/64** y el simulacro en verde                                                |
| Rutas públicas                    | `HIT`, sin cabecera de sesión ni `Set-Cookie`; privadas `ƒ`                      |
| Publicar una vacante              | idempotente, en el listado sin JavaScript y con su landing de ciudad             |

Evidencia en `docs/evidencia/fase-4/`. ADR nuevos: **25** (registro de aperturas
del admin), **26** (un solo punto de envío de correo), **27** (motivos de rechazo
como claves), **28** (publicar vacantes por fichero) y **29** (la subida pasa por
el servidor).

**Marca:** Talpass · **dominio canónico:** https://talpass.eu (apex; `www`
redirige, ADR-12) · `ettrecruiter.vercel.app` sigue respondiendo como dominio antiguo

---

## El día que haya ETT — poner las primeras vacantes reales en producción

> **Esto ya NO es "lo primero al retomar"** (cambiado el 2026-08-17). Es el guion
> del día que Ulises firme una ETT, y hasta entonces **no se ejecuta ningún paso
> de esta sección**. Lo que toca antes es la fase 4b. Se conserva entero porque
> el día que toque vale palabra por palabra.
>
> Y ojo al paso 1: las ofertas tienen que ser **de esa ETT y confirmadas por
> ella**. `content/jobs/ejemplo-almacen-nuremberg.json` lleva una agencia
> inventada (`Franken Personal GmbH`) y es **solo un molde de formato**:
> publicarlo tal cual en producción es exactamente lo que la fase 4b existe para
> evitar.

Es lo que cierra **dos fases a la vez** (la 3 y la 4). ~~Y lo que abre el sitio a
Google~~ — eso ya lo hizo la fase 4b el 2026-08-17. No hay que escribir código:
hay que redactar ofertas y lanzar un comando.

### 1. Redactar las ofertas

Una por fichero, en `content/jobs/`. Copia
`content/jobs/ejemplo-almacen-nuremberg.json` y cambia lo que haga falta; el
formato entero, campo a campo, está en `docs/CONVENTIONS.md` → "Publicar una
vacante real". La investigación de mercado (`docs/prompts/investigacion-ofertas.md`)
es de dónde salen los rangos salariales, las ciudades y el vocabulario.

Prueba siempre primero en local, que no cuesta nada y es idempotente:

```bash
pnpm db:start && pnpm dev:local
pnpm job:publish content/jobs/mi-oferta.json
```

### 2. ~~Antes de publicar en producción: la migración de la fase 4~~ ✅ HECHO, 2026-08-20

> **Este paso ya no hay que darlo.** La migración se aplicó el 2026-08-20 dentro
> del punto 4 del orden acordado, sin esperar a la ETT, y el PM lo verificó con
> `supabase migration list --linked`: **18 / 18 sin huecos**. Se conserva el
> texto porque explica por qué hacía falta.

Producción estaba al día **hasta la fase 3**. La fase 4 añade una migración
(`20260816120000_verification.sql`) y sin ella el backoffice no funciona ahí.
Validada en local con `db:reset` desde cero, `test:security` 64/64 y el
simulacro en verde:

```bash
! printf 'produccion\nY\n' | pnpm db:push:prod
```

> Lo ejecuta Ulises con el prefijo `!`: el clasificador de permisos deniega las
> escrituras contra producción desde la sesión, y hace bien.

### 3. Publicar, y **desplegar después**

```bash
pnpm job:publish:prod content/jobs/mi-oferta.json    # pide teclear "produccion"
pnpm exec vercel --prod
```

**El despliegue no es opcional.** Las landings son estáticas y se derivan de las
vacantes vivas (ADR-23): una ciudad o un sector nuevos no tienen landing hasta
que se redespliega, aunque la vacante ya esté publicada y visible en su URL.
Y recuerda que **este proyecto de Vercel no tiene integración con GitHub**: un
`git push` no despliega nada (ver 3 bis, más abajo).

### 4. ~~Dos variables de entorno que faltan en Vercel~~ ✅ HECHO, 2026-08-20

> **Este paso ya no hay que darlo.** Las dos se pusieron el 2026-08-20 —11
> variables en `production`— con redespliegue posterior. Se conserva la tabla
> porque explica para qué sirve cada una.
>
> **Corregido antes, el 2026-08-18:** aquí decía **tres**.
> `SUPABASE_SERVICE_ROLE_KEY` ya estaba puesta desde el 2026-08-14.

Sin ellas el backoffice de la fase 4 no funcionaba en producción:

| Variable         | Para qué                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `RESEND_API_KEY` | el aviso de aprobado/rechazado **lo manda la aplicación**         |
| `EMAIL_FROM`     | `no-reply@updates.talpass.eu` (el dominio verificado, no el apex) |

> La clave de Resend **ya es válida** — se comprobó sin querer el 2026-08-16, ver
> "Cosas que no deben olvidarse". Es la misma que usa el SMTP del panel.

### 5. Y entonces sí: cerrar la fase 3 con el Rich Results Test

Con ofertas reales publicadas, se pasa una por
https://search.google.com/test/rich-results y se anota el resultado. **Eso es lo
único que le falta a la fase 3.**

> **La bandera de indexación ya no se enciende aquí** (2026-08-17): la enciende
> la fase 4b, y ADR-16 quedó corregida en consecuencia. Si al llegar a este paso
> la 4b ya se ejecutó, la bandera está puesta y estos dos comandos **ya se
> lanzaron**; volver a lanzarlos no rompe nada, pero no hace falta. Se dejan por
> si se llega aquí sin haber pasado por la 4b.

```bash
printf 'true' | pnpm exec vercel env add NEXT_PUBLIC_ALLOW_INDEXING production
pnpm exec vercel --prod
```

---

## Si retomas como PM — qué te toca

El método completo está en `docs/02-ROADMAP.md` → "Cómo trabajamos cada fase".
El resumen: **el PM no ejecuta**, redacta el prompt de cada fase en
`docs/prompts/fase-N.md`, y **verifica los cierres en vez de fiarse del
resumen**. Esta regla se ganó con dos errores reales: un resumen con 16
migraciones cuando eran 17, y una fase marcada ✅ mientras el propio resumen
admitía que su criterio no se había comprobado.

> **⚠️ Esta lista está superada desde el 2026-08-18.** El orden que manda es el
> del bloque de arriba ("El orden acordado"). Lo de aquí se conserva porque los
> puntos 3, 4 y 5 siguen vivos tal cual y porque los tachados dejan escrito qué
> falló, que es de donde salen las reglas de esta casa.

Lo que decía el 2026-08-17, con lo hecho desde entonces marcado:

0. ~~**Verificar el cierre de la 4b**~~ **✅ HECHO por el PM, 2026-08-17.** Se
   recomprobó de cero contra `https://talpass.eu`, sin fiarse de la evidencia de
   la sesión que construyó y desplegó (era juez y parte). Resultado: `robots.txt`
   con `Allow: /`, **las 10 páginas a 200 con `JobPosting = 0`** tras encender la
   bandera, sitemap de 7 URLs con alternates, `/es/ofertas` en `noindex, follow`,
   y **0 ficheros tocados en `supabase/`** —así se verificó "no toca la base" sin
   depender del test—. Commit `c416f9f`.

   > **Un fallo real que dejó la 4b, y que el PM cazó al verificar.** Tres
   > franjas salariales se publicaban con la etiqueta "Rango observado en las
   > ofertas analizadas" cuando eran **derivadas**: el suelo es el del convenio
   > (15,33 € desde el 2026-09-01), no el mínimo visto en la muestra (14,96 €).
   > Las cifras eran las correctas —copiar el 14,96 volvería la página falsa
   > sola en septiembre—, pero la etiqueta afirmaba una procedencia que no
   > tenía, en unas páginas cuya premisa entera es que cada dato es verificable.
   > Corregido en `messages/{es,en}.json` y en el comentario de `SalaryBasis`.
   > **La lección para el próximo PM: en esta fase lo que hay que auditar no son
   > las cifras, son las atribuciones.**

1. ~~**Desplegar la corrección de esa etiqueta.**~~ **✅ HECHO, 2026-08-17**
   (`dpl_14Fw5ScwWntESvy6wTGkjaEiEYJR`). Verificado: la etiqueta nueva viva en
   `es` y en `en`, **cero apariciones de la vieja**, y sin regresión —
   `JobPosting = 0`, `robots.txt` con `Allow: /` y el sitemap en 7 URLs.
   ~~**Git y producción quedan sincronizados.**~~ **Esta frase era falsa** y la
   escribió el PM: se comprobó producción y se dio por hecho `origin`. La
   auditoría del 2026-08-18 encontró `origin/main` **4 commits por detrás y sin
   la fase 4b entera**. Resuelto ese mismo día con `git push` (`a71fba5`).
   **La lección: "desplegado" y "subido" son dos hechos distintos, y en este
   proyecto —sin integración con GitHub— no se implican.**

2. ~~**Arreglar la contradicción del informe de mercado.**~~ **✅ HECHO,
   2026-08-18.** El §0 decía "ocho de las catorce exigen alemán" contra su propia
   tabla de recuento. Recontadas las 14 fichas una a una: son **once** —las 5 de
   Randstad, A1 y A5 de Adecco, las 4 de Tempton—, y las mudas son A2, A3 y A4.
   Corregido en el propio informe, con la nota de qué se cambió. **No afecta a
   nada vivo**: el código y el copy publicado ya usaban el 11.

3. **Los cinco textos de las oportunidades caducan el 2026-09-01** —los perfiles
   de mercado, **no** los cinco documentos legales, que son otra cosa y no
   dependen del convenio—, cuando sube el convenio de la
   Zeitarbeit (15,33 → 15,87 €/h en abril de 2027). Los suelos publicados dejan
   de ser ciertos ese día. Es una revisión con fecha, no una tarea abierta.

4. **Decidir si las páginas siguen nombrando a Randstad, Adecco y Tempton.**
   Hoy los citan como fuente del análisis, y es honesto y da credibilidad. Pero
   son competidores, y algún día una ETT socia leerá esas páginas. Nadie tomó
   esa decisión explícitamente: se puede cambiar por "tres de las mayores ETTs
   de Alemania" sin perder nada. **Es decisión de Ulises, no del PM.**

5. **Vigilar que la lista de candidatos no se enfríe.** La 4b acumula registros
   de gente esperando vacantes que aún no existen. Cuanto más tarde la ETT, menos
   vale la lista, y eso no lo arregla el código. Si pasan semanas sin ETT, **es
   señal de replantear el orden del roadmap**, no de seguir construyendo fases.

> **Del 6 al 8: en espera hasta que haya una ETT firmada.** No son trabajo
> pendiente, son el guion de un día que todavía no ha llegado.

6. **Acompañar a Ulises en los cinco pasos de "El día que haya ETT"** — _en espera_. No los ejecuta el PM
   —las escrituras contra producción las lanza él con `!`— pero **cada uno se
   verifica al terminar**: `migration list --linked` tras el `db:push:prod`,
   `curl` del HTML y del sitemap tras el despliegue, `vercel env ls` tras las
   variables. Sirve de guion lo que ya se hizo el 2026-08-16.
7. **Cerrar las fases 3 y 4** en `docs/02-ROADMAP.md` cuando —y solo cuando— la
   vacante real esté publicada y el Rich Results Test la valide. Anotar el
   resultado del tester aquí.
8. **Redactar `docs/prompts/fase-5.md`** — con la 4b cerrada, es **el siguiente
   prompt de código**, y sigue sin escribirse a propósito: uno escrito hoy
   ignoraría lo que traiga la publicación de las primeras ofertas. Ojo a lo que
   la fase 4 dejó dicho: el backoffice **se amplía, no se rehace**, y al existir
   el aplicar hay que volver al `directApply: false` del `JobPosting` de la
   fase 3.

**Lo que el PM no debe hacer:** dar por hecho lo que diga un panel —Vercel llegó
a marcar "Valid Configuration" con el DNS roto—, ni aceptar un ✅ cuyo criterio
no se haya medido.

---

## Historia — el bloque de producción de la fase 3

**Cerrado el 2026-08-16.** Los cuatro pasos, más un quinto que no estaba en la
lista y resultó ser el que faltaba de verdad: **desplegar** (3 bis). Se deja
escrito porque explica cómo está montado el entorno y qué falló por el camino.

> **Todo lo que sigue en esta sección es una foto del 2026-08-16 y no describe
> el presente.** Verás frases como "la bandera sigue APAGADA" o "el sitemap son
> 2 URLs": eran ciertas ese día y dejaron de serlo el 2026-08-17, cuando la fase
> 4b abrió el sitio a Google. **No actúes sobre nada de aquí**; se conserva
> porque documenta cómo está montado el entorno y qué falla cuando se hace mal.

### 1. ~~Aplicar las tres migraciones pendientes a producción~~ ✅ HECHO, 2026-08-16

Ulises lo ejecutó desde la sesión y **el PM lo verificó**: `supabase migration
list --linked` devuelve **17 migraciones con `local` y `remote` idénticos y sin
huecos**, las tres nuevas incluidas. Producción está al día con el repositorio.

No se pudo repetir la auditoría de RLS contra producción desde la sesión —el
clasificador deniega usar la `service_role` contra producción, y hace bien—.
No hace falta: son las mismas tres migraciones validadas en local con `db:reset`
desde cero y `test:security` 57/57, y `grants.sql` contra el proyecto alojado es
el no-op que documentó la fase 2. Se recomprobará en la auditoría de la fase 10.

<details><summary>Cómo se hizo, por si hay que repetirlo</summary>

Validadas en local en esta misma sesión: `db:reset` desde cero, `test:security`
**57/57** y el simulacro en verde. `supabase migration list --linked` y un
`--dry-run` confirman que son exactamente estas tres y ninguna más:

```
20260814090000_grants.sql
20260814100000_onboarding.sql
20260814100100_signup_consents.sql
```

Ejecútalo tú, desde esta sesión, con el prefijo `!`:

```
! printf 'produccion\nY\n' | pnpm db:push:prod
```

> La sesión no pudo lanzarlo: el clasificador de permisos deniega las escrituras
> contra producción. **No es un fallo del proyecto**: el guardarraíl de
> `db:push:prod` funcionó, y encima de él hay otro. Lo ejecuta Ulises con `!`.

</details>

### 2. ~~Resend como SMTP de Supabase~~ ✅ HECHO, 2026-08-16

> **El dominio verificado en Resend es `updates.talpass.eu`, NO `talpass.eu`.**
> Es el único de la cuenta (`region: eu-west-1`, `sending: enabled`). Dar por
> hecho el dominio raíz costó dos intentos fallidos de alta el 2026-08-16: Resend
> rechaza cualquier envío cuyo remitente no esté en un dominio verificado, y
> GoTrue lo devuelve como `Error sending confirmation email` — un 500 opaco que
> desde la pantalla de registro se ve como un error genérico.
>
> Por eso el remitente es **`no-reply@updates.talpass.eu`**. Si algún día se
> quiere el raíz —se lee mejor en la bandeja del candidato—, hay que **añadir y
> verificar `talpass.eu` como dominio aparte** en Resend, con su DNS.

Configuración que funciona, en Authentication › Emails › SMTP Settings:

| Campo        | Valor                                             |
| ------------ | ------------------------------------------------- |
| Host / Port  | `smtp.resend.com` · `465`                         |
| Username     | `resend` — literalmente esa palabra, no el correo |
| Password     | una API key de Resend con permiso de envío        |
| Sender email | `no-reply@updates.talpass.eu`                     |
| Sender name  | `Talpass`                                         |

**Verificado contra producción el 2026-08-16**, llamando al `auth/v1/signup` con
la clave pública, igual que hace la aplicación:

| Verificación            | Resultado                                         |
| ----------------------- | ------------------------------------------------- |
| Alta por la API de Auth | 200 con `confirmation_sent_at`                    |
| Entrega                 | Resend marca los tres envíos como **`delivered`** |
| Remitente               | `"Talpass" <no-reply@updates.talpass.eu>`         |
| **Límite de envío**     | **3 altas en 16 segundos, ninguna rechazada**     |

Ese último dato es el que justificaba adelantar Resend de la fase 8 a la 3: con
el SMTP por defecto, el **segundo** correo de la misma hora ya rebotaba con
`over_email_send_rate_limit`. Ya no.

> **El asunto llega en inglés** ("Confirm your email address"): es la plantilla
> por defecto de Supabase. Las plantillas i18n son de la **fase 8**, así que
> hasta entonces un candidato hispanohablante recibe el correo en inglés. Está
> anotado, no es un fallo pendiente de esta fase.

> **Ojo, son dos cosas distintas.** El SMTP del panel solo mueve los correos que
> manda GoTrue —confirmación de registro y recuperación—. El aviso de
> "verificación aprobada / rechazada" lo manda **la aplicación** y va por la API
> de Resend con `RESEND_API_KEY`, que es otra vía aunque use la misma clave.
>
> Esa clave **es válida desde el 2026-08-16**. Hasta entonces `.env.local` tenía
> el hueco vacío de la fase 0, y la API la rechazaba con `API key is invalid`;
> se sustituyó al configurar el SMTP. Lo que falta es **ponerla en Vercel**, con
> `EMAIL_FROM` — están en "El día que haya ETT", paso 4.

### 3. ~~Las URLs de retorno en el panel de producción~~ ✅ HECHO, 2026-08-16

Authentication › URL Configuration, **todo con el apex y sin mezclar hosts**:

```
site_url                  https://talpass.eu
additional_redirect_urls  https://talpass.eu/**
```

Y en Vercel, `NEXT_PUBLIC_SITE_URL=https://talpass.eu` y
`NEXT_PUBLIC_SITE_NAME=Talpass`.

> **Sin esto el registro falla sin dar ningún error**: GoTrue ignora el
> `emailRedirectTo`, manda el enlace a la home y la sesión no se canjea nunca.
> La fase 2 perdió un rato descubriéndolo.
>
> **No se usa `supabase config push`** para esto, aunque exista: empujaría el
> `config.toml` local —con `site_url = http://localhost:3000`— y el resto del
> bloque `[auth]` encima de producción.

### 3 bis. Desplegar — descubierto el 2026-08-16

**La fase 3 estaba en `origin` pero no en producción.** El único despliegue vivo
era del 2026-08-13 (fases 0–2): `talpass.eu` servía el `<title>` "EttRecruiter",
el `hreflang` apuntaba a `ettrecruiter.vercel.app` y `/robots.txt` daba 404.

**Causa: el proyecto de Vercel no tiene integración con GitHub.** Un `git push`
no despliega nada; los despliegues son manuales con `pnpm exec vercel --prod`.
Conectar el repositorio es trabajo pendiente y evita que vuelva a pasar.

> **Cuidado con el orden.** El alta real del paso 4 contra un build antiguo no
> vale para cerrar nada: se prueba código que no es el que está en el repositorio.
> **Desplegar va siempre antes de verificar.**

Y faltaban en Vercel las **tres claves de cifrado** (`TALPASS_ENCRYPTION_KEYS`,
`TALPASS_ENCRYPTION_ACTIVE_KEY_ID`, `TALPASS_BLIND_INDEX_KEY`), que la fase 4
necesita para escribir `candidate_private`. Añadidas el 2026-08-16, junto con
`NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_SITE_NAME` reescritas con el apex y la marca.

> El proyecto fuerza _Sensitive_ en todas las variables, también en las
> `NEXT_PUBLIC_`, así que su valor **no se puede leer ni desde el panel ni con
> `vercel env pull`**. Se verifican mirando el HTML desplegado, no el panel.

**Desplegado el 2026-08-16** (`dpl_AHUq3dUG8D5hvM6ctJLYVX5Rqjw5`) y verificado
por el PM contra `https://talpass.eu`:

| Verificación          | Resultado en producción                                              |
| --------------------- | -------------------------------------------------------------------- |
| `<title>` y marca     | **Talpass**, ya no EttRecruiter                                      |
| Canónica y `hreflang` | apex en las tres: `es`, `en` y `x-default` — `SITE_URL` confirmada   |
| `/robots.txt`         | `Disallow: /` — correcto, la bandera sigue apagada (ADR-16)          |
| `/sitemap.xml`        | responde; **solo 2 URLs**, home y listado                            |
| `/es` y `/es/ofertas` | `HIT` / `PRERENDER`, **sin** `x-ett-session-checked` ni `Set-Cookie` |
| `/es/cuenta`          | 307 a `/es/entrar`, `x-ett-session-checked: 1`, `no-store`           |

**28 páginas estáticas frente a las 41 de local, y un sitemap de 2 URLs en vez
de 13.** No es un fallo: producción no tiene ni una vacante, así que no hay
páginas de detalle ni landings que derivar (ADR-23). Es exactamente el catálogo
vacío que la fase 4 viene a resolver.

### 4. ~~Alta real end-to-end~~ ✅ HECHO, 2026-08-16 — la bandera espera

Ulises se registró de verdad en `https://talpass.eu/es/registro`, recibió el
correo, lo confirmó **entrando con la sesión hecha** y completó el onboarding.
Con eso quedan probados por el camino real los tres pasos anteriores: las
migraciones, el SMTP de Resend y las URLs de retorno.

> **Cuidado al verificar esto con `curl`.** Una llamada directa a
> `auth/v1/signup` **no manda `emailRedirectTo`**, así que GoTrue confirma el
> correo pero devuelve al `site_url` a secas en vez de a `/api/auth/callback`,
> que es quien canjea el código por sesión. Se aterriza en la home sin sesión y
> parece que las URLs de retorno están mal cuando no lo están. **El retorno solo
> se valida desde el formulario**; el `curl` sirve para probar el envío y nada más.

**La bandera sigue APAGADA, y ahora por otro motivo.** Decisión del 2026-08-16:
el alta ya funciona, pero producción no tiene ni una vacante y su sitemap son 2
URLs. Encenderla hoy es invitar a Google a rastrear un job board vacío —
justo lo que se quiso evitar al mover la publicación de vacantes reales a la
fase 4. **Se enciende al terminar la fase 4**, con ofertas reales publicadas, y
en la misma tacada se pasa el Rich Results Test y se cierra la fase 3 entera.

Cuando toque, son dos gestos y **el segundo no es opcional**:

```bash
printf 'true' | pnpm exec vercel env add NEXT_PUBLIC_ALLOW_INDEXING production
pnpm exec vercel --prod   # es NEXT_PUBLIC_: se hornea en el build
```

---

## Lo que la fase 3 dejó verificado

Todo contra la base local con `pnpm seed:demo` (3 vacantes publicadas):

| Verificación                       | Resultado                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `next build`                       | **41 páginas públicas `●`**; `account`, `agency`, `admin`, `onboarding` siguen `ƒ`    |
| Cabeceras (ADR-11)                 | públicas `x-nextjs-cache: HIT`, **sin** `x-ett-session-checked` ni `Set-Cookie`       |
| Vacantes en el HTML estático       | 3 enlaces en `/es/ofertas` sin ejecutar JavaScript                                    |
| `hreflang` recíproco               | `/es/trabajo/alemania/logistica` ↔ `/en/work/germany/logistics`, con `x-default`      |
| Enlazado interno en ambos sentidos | landing → 3 vacantes y 7 landings vecinas; vacante → sus 4 landings                   |
| `sitemap.xml`                      | 13 URLs, cada una con sus `xhtml:link` de `hreflang` y `x-default`                    |
| `JobPosting`                       | los 9 campos obligatorios de Google presentes y bien formados                         |
| Rendimiento móvil (Lighthouse, 4G) | listado **97** · detalle 95 · landing 97 — FCP 0,8 s, LCP 2,6 s, TBT 10 ms, CLS 0,001 |
| `test:security` / `:drill`         | 57/57 y el simulacro en verde                                                         |
| `typecheck` · `lint` · `format`    | limpios                                                                               |

**Lo único del guion de la fase que no se pudo cerrar**: pasar una vacante por
el **Google Rich Results Test**. Necesita una URL pública y producción no tiene
ni una vacante. El marcado se validó campo a campo contra los requisitos
documentados de Google, pero quien decide qué acepta Google es Google.

La vía para publicarlas la construyó la **fase 4** (`pnpm job:publish:prod`,
ADR-28), así que ya no falta código: falta **una ETT** cuyas ofertas publicar.
Está todo en "El día que haya ETT", arriba.

---

## Pendientes de Ulises (fuera del repositorio)

1. **Guardar el llavero de cifrado de `.env.local` en el gestor de contraseñas.**
   Es el único secreto del proyecto que **no se puede regenerar**: perderlo es
   perder los IBAN cifrados, por diseño. Lo más urgente de esta lista.
2. **Rotar la contraseña de la base de datos** — pasó por el chat. Está en
   `.env.local`, ignorado por git, así que es higiene, no urgencia.
3. **Conseguir la primera ETT.** Es lo único que desbloquea las fases 3 y 4, y
   desde el 2026-08-17 hay con qué enseñarse: el sitio está indexado y las
   oportunidades ya están captando. Cuando la haya, publicar sus vacantes reales
   —arriba—. ~~Subir la migración de la fase 4~~ y ~~poner las dos variables en
   Vercel~~ ✅ **hechas y verificadas el 2026-08-20** (18/18 y 11 variables), y
   ya no esperaban a la ETT desde el 2026-08-18, porque sin ellas no se puede
   verificar a nadie y una bolsa sin verificar no se le enseña a nadie.
   **Revisar los textos de las oportunidades** (`messages/es.json` y
   `messages/en.json`, namespace `Opportunities`): están vivos en producción y
   respondes tú de ellos. Y **caducan el 2026-09-01**, cuando suba el convenio.
4. **Dar de alta `talpass.eu` en Google Search Console y enviarle el sitemap**
   (`https://talpass.eu/sitemap.xml`). ⚠️ **Es lo que convierte la fase 4b en
   visitas, y solo puedes hacerlo tú**: exige verificar la propiedad del dominio.
   Encender la bandera el 2026-08-17 solo dejó de prohibirle el paso a Google;
   después de meses sirviendo `Disallow: /`, Google no tiene ningún motivo para
   volver pronto por su cuenta. Sin este gesto, el trabajo de la 4b tarda semanas
   en notarse. Search Console es además el único sitio donde se ve si Google
   **acepta** las páginas o las descarta, que es información que no da ningún
   `curl`.
5. **Conectar el repositorio de GitHub al proyecto de Vercel.** ⚠️ **Subió de
   prioridad el 2026-08-18.** Hoy los despliegues son manuales
   (`pnpm exec vercel --prod`), y esa desconexión ya ha fallado **en los dos
   sentidos**: la fase 3 pasó un día entero en `origin` sin llegar a producción,
   y la fase 4b pasó un día entero **en producción sin llegar a `origin`** —
   indexándose en Google desde un código que solo existía en tu portátil. Mientras
   no estén conectados, "desplegado" y "subido" hay que comprobarlos por separado.
6. **`talpass.com` queda aplazado por presupuesto.** Decisión consciente: es la
   mitigación del riesgo de ADR-12 y sigue pendiente. Revisarlo cuando haya caja.
7. **Ruido conocido en la bandeja y en Resend, nada que hacer.** Correos de
   "Confirm your email address" con alias `+smtp-probe-…` y `+talpassprobe…`,
   de las pruebas de envío; **sus cuentas se borraron el 2026-08-16 y se
   comprobó que ya no existen**. Y un envío a `maria@talpass.test`, de una
   prueba en local que heredó la clave real: rebotará, porque ese dominio no
   existe.

---

## El primer administrador — descubierto el 2026-08-20

**En producción no hay ninguna cuenta de admin.** Comprobado en lectura: hay
**un solo perfil y es `candidate`**. Eso bloquea el último criterio del punto 4,
porque los pasos de «aparecer en la cola», «abrir el documento» y «aprobar» no se
pueden recorrer sin un admin.

**No es un olvido, es un arranque en frío.** El perfil nace siempre como
`candidate` y el rol de los metadatos del registro **se ignora a propósito** —
cualquiera podría enviarse `{"role":"admin"}` al registrarse
(`app.handle_new_user`, en `20260813120300_identity.sql`). Cambiar el rol exige
`app.is_admin()` **o** una conexión privilegiada (`postgres`, `service_role`,
`supabase_admin`), y lo vigila el disparador
`profiles_guard_privileged_columns`. Sin admin, ningún admin puede crear el
primero.

**Hacen falta DOS cuentas, no una.** `role` es una sola columna
(`candidate | agency_member | admin`): un perfil es candidato **o** admin, nunca
las dos. `/account` y `/onboarding` solo admiten `candidate`; `/admin`, solo
`admin`. Promocionar la única cuenta candidata deja el recorrido sin candidato.

Se registra el segundo correo por el formulario y se promociona desde el **SQL
Editor del panel de Supabase**, que corre como `postgres` y por eso pasa el
disparador:

```sql
update public.profiles set role = 'admin' where email = '<correo>';
select email, role from public.profiles order by created_at;
```

> **Es un hueco del producto, no solo una tarea.** No hay ninguna vía dentro de
> la aplicación para crear el primer administrador, y hasta hoy no estaba escrito
> en ninguna parte. Quien monte este proyecto desde cero se estrella en el mismo
> sitio. Si algún día se resuelve, es un script con `service_role` o un
> `supabase/seed`, no una pantalla.

> **De paso, una pregunta que se puede cerrar casi gratis.** Si en producción hay
> **un solo perfil**, las 24 filas de `consents` con versión `1` y las 3 con
> `2026-08-14` que preocupaban el 2026-08-19 son casi con seguridad de la base
> **local**, no de producción — y entonces **no hay reconsentimiento que montar**,
> que era la decisión abierta de ADR-34. Se confirma con un
> `select version, count(*) from public.consents group by version;` en el mismo
> SQL Editor. El clasificador bloqueó esa consulta desde la sesión.

---

## Para trabajar en local, sea cual sea la fase

```bash
pnpm db:start        # OrbStack tiene que estar arrancado
pnpm seed:demo       # 3 vacantes publicadas: sin ellas el listado sale vacío
pnpm dev:local       # Next contra la base local
```

> **`seed:demo` y `job:publish` no son lo mismo y no compiten.** `seed:demo`
> llena la base local de datos de mentira para poder desarrollar, y **se niega a
> tocar producción**. `job:publish` (fase 4, ADR-28) publica **una oferta real**
> desde un fichero de `content/jobs/`, va a local por defecto y a producción solo
> si se lo pides a propósito. Para desarrollar, `seed:demo`; para publicar una
> oferta de verdad, `job:publish`.

**Se desarrolla contra la base local, no contra producción** (ADR-17). Hay dos
ficheros de entorno y no se mezclan: `.env.test` apunta a local y lo leen
`dev:local`, las semillas y los tests; `.env.local` apunta a producción. Si
falta `.env.test`, se crea con `cp .env.test.example .env.test`. Los correos de
prueba se leen en Mailpit, http://127.0.0.1:54324 — desde la fase 4, también los
que manda la propia aplicación.

> **Y no se mezclan… salvo lo que `.env.test` no declare.** Next lee `.env.local`
> para todo lo que no venga ya en el entorno, así que una variable que solo
> exista en producción se cuela en una ejecución local. Por eso `.env.test`
> lleva `RESEND_API_KEY=` **vacía**. Al añadir una variable de producción,
> añádela vacía a `.env.test` en la misma tacada.

Procedimiento completo en `docs/CONVENTIONS.md`.

---

## Decisiones abiertas, para cuando toquen

- **ADR-06** · ¿La ETT seguirá creando vacantes sin moderación? Se decide tras
  ver la calidad real de las ofertas de la primera ETT.
- **ADR-04** · `documents_requested` no se puede saltar. Si estorba en la fase 6,
  se cambia con una decisión, no con un parche.
- **ADR-19** · Los `grant` de tabla replican los amplios de Supabase por defecto.
  Afinarlos por tabla y operación es endurecimiento, fase 10.
- **ADR-24** · El listado lleva todas las vacantes publicadas en el HTML. Cuando
  el volumen lo pida, se pagina en servidor conservando el prerenderizado de la
  primera página. No antes.
- **Fase 7** · El audio se reproduce en la bolsa con URL firmada de ≤5 min y
  escucha registrada (ADR-18). El consentimiento ya se recoge y se revoca; **la
  fase 7 tiene que leerlo antes de firmar nada**.

---

## Cosas que no deben olvidarse

- **Las rutas públicas no tocan la sesión** (ADR-11, ADR-13), y desde la fase 3
  tampoco `searchParams` ni `useSearchParams`. Se verifica en cada fase con el
  procedimiento de `docs/CONVENTIONS.md`.
- **Que una ruta salga `●` en el build no garantiza que su HTML tenga
  contenido.** Un `Suspense` con `useSearchParams` dentro se prerenderiza vacío.
  Se mira también el HTML, no solo la letra del build.
- **Qué cliente de Supabase desde dónde** (ADR-22): si un fichero lo puede
  importar una ruta pública, no puede tocar `cookies()`. Tabla en
  `docs/CONVENTIONS.md`.
- **Nunca `db reset` ni el simulacro contra producción** (ADR-17). Los scripts ya
  se niegan solos.
- La marca no se escribe en el JSX: sale de `src/config/site.ts` (ADR-12).
- **Cero texto en el JSX, tampoco los errores.** Las Server Actions devuelven
  claves de traducción, no frases. Desde la fase 4 eso incluye el **motivo de
  rechazo de un documento**, que se guarda como clave (ADR-27).
- **Lo que `.env.test` no declara, se hereda de `.env.local`.** Costó un correo
  real enviado desde la cuenta de producción durante una prueba en local
  (2026-08-16). Variable de producción nueva ⇒ entrada vacía en `.env.test`.
- **`service_role` se salta la RLS entera.** Vive en `lib/supabase/admin.ts` y
  hoy solo escribe `document_access_log` y `email_log`, que no tienen política
  de INSERT para nadie. Si algo funciona con la sesión del usuario, va con la
  sesión del usuario: si no, los tests dejan de probar el camino real.
- **Comprueba a qué servidor le estás preguntando.** Un `next start` viejo
  pegado al puerto sirve un build anterior y parece un fallo del código;
  `pkill -f "next start"` no siempre lo mata. Procedimiento en
  `docs/CONVENTIONS.md`.
