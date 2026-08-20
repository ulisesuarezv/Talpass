# PROMPT — Fase C2 · Sistema visual

> Pegar en una sesión nueva y limpia. Es la segunda de las dos fases de diseño decididas el 2026-08-20. **La C1 está cerrada, desplegada y verificada** (`docs/evidencia/fase-c1/`, ADR-35, ADR-36, ADR-37, y ADR-10 precisada). Esta fase se apoya en ella y **no la deshace**.
>
> No depende del punto 4 del orden acordado. La única coordinación es de calendario: esta fase redespliega producción, así que el alta real end-to-end no debe caer en mitad de tu despliegue.

---

Eres el desarrollador de este proyecto. Antes de escribir nada, lee `CLAUDE.md`, `docs/ESTADO.md` (empieza por el bloque de cierre de la C1), `docs/00-PROJECT.md` (ADR-01…37, y con atención **ADR-10 ya precisada** —«sobrio y profesional» es **creíble**, con el presupuesto de velocidad intacto—, **ADR-11** y **ADR-13** sobre el proxy, y **ADR-37** sobre dónde vive el copy largo), `docs/CONVENTIONS.md`, y la ficha **Fase C2** de `docs/02-ROADMAP.md`.

Y lee entero `docs/evidencia/fase-c1/03-rendimiento.md`. **No es opcional**: te ahorra descubrir por tu cuenta que una pasada de Lighthouse no vale para cerrar nada, y te dice exactamente contra qué estás jugando.

Tu tarea: **aplicar el sistema visual —color y tipografía— sin gastar el presupuesto de velocidad ni romper la credibilidad que acaba de ganarse.**

## 0. Qué es esta fase, y qué la hace difícil

La C1 puso contenido: la home responde por qué esto no es un fraude, la cabecera cabe en el móvil y los CTA llevan a donde hay algo. **Lo que no tiene el sitio es identidad visual**: hoy los tokens son la escala de grises pura de shadcn (`--primary: oklch(0.205 0 0)`, es decir casi negro) y **no hay ni un color de marca en toda la aplicación**.

Esta fase pone el color y la tipografía elegidos por Ulises. Es la capa que hace que algo **se lea** como profesional, una vez que ya es creíble.

**Y es más difícil de lo que parece, por dos motivos que están medidos**, no intuidos:

1. **El contraste de la paleta no da**, y hay que reasignar papeles. §2.
2. **El LCP está en el borde y tú traes una fuente nueva.** §3.

Si sales de esta fase con un sitio más bonito y un LCP peor, **la has suspendido**. ADR-10 es explícita: velocidad por encima del espectáculo, y es puerta dura, no aspiración.

## 1. Entorno y límites

```bash
pnpm db:start
pnpm seed:demo
pnpm dev:local
```

Contra la base local (ADR-17). **Nada de escrituras contra producción.**

**El despliegue es tuyo**, y esto no está hecho hasta estar vivo en `https://talpass.eu`. Este proyecto de Vercel **no tiene integración con GitHub**: un `git push` no despliega nada, y «desplegado» y «subido» son dos hechos distintos.

En producción **`x-nextjs-cache` no existe**: es `x-vercel-cache` + `x-nextjs-prerender: 1`. Justo tras desplegar verás `PRERENDER` en vez de `HIT` porque el borde está frío, y **eso cuesta puntos de Lighthouse de verdad** — la C1 midió `/es/oportunidades` en 93 recién desplegado y en 100 con el borde caliente. No confundas eso con una regresión tuya.

**El `dpl_` que acredites se lee de `pnpm exec vercel inspect talpass.eu`** al terminar de verificar, no del que devuelva el despliegue. Un `dpl_` escrito en un documento acredita una medición con fecha; nunca dice cuál está vivo.

## 2. El color — la paleta está elegida y el contraste ya está calculado

| Papel         | Color     | Equivalente |
| ------------- | --------- | ----------- |
| Primario      | `#0D9488` | teal-600    |
| Primario dark | `#134E4A` | teal-900    |
| Acento        | `#F97316` | orange-500  |

**Los tokens ya existen** en `src/app/globals.css` (`--primary`, `--accent`, `--background`…, en OKLCH). **Ahí es donde va la paleta.** Ni un color en el JSX, igual que la marca sale de `src/config/site.ts` (ADR-12).

### 2.1 El contraste, medido el 2026-08-20 — y no es negociable

WCAG AA exige **4,5:1** en texto normal y **3:1** en texto grande y en elementos de interfaz.

| Combinación                          | Ratio     | Veredicto                        |
| ------------------------------------ | --------- | -------------------------------- |
| Blanco sobre acento `#F97316`        | **2,80**  | 🔴 **falla incluso para grande** |
| Blanco sobre primario `#0D9488`      | **3,74**  | 🟡 solo texto grande e interfaz  |
| Blanco sobre primario dark `#134E4A` | **9,48**  | ✅                               |
| Tinta `#0F172A` sobre blanco         | **17,85** | ✅                               |

**Esto no cambia la paleta: cambia el reparto de papeles.** Las salidas ya están calculadas, úsalas:

- **Botón principal:** fondo `#134E4A` con texto blanco (**9,48**) — o fondo acento `#F97316` con **tinta `#0F172A`** encima (**6,37**), que conserva el naranja.
- **Texto o enlace en naranja sobre blanco:** `#C2410C` (orange-700), **5,18**. El `#F97316` **no vale para texto**.
- **Blanco sobre verde**, si lo necesitas: `#0F766E` (teal-700), **5,47**.
- **`#0D9488` y `#F97316` se quedan** para superficies, bordes, iconos y titulares grandes, que es donde cumplen.

> **Y el motivo no es la norma, es el encargo.** Un botón que no se lee a pleno sol en un móvil barato **no parece profesional: parece descuidado**. El candidato de este producto mira la pantalla en la calle. El contraste aquí es parte del trabajo, no una casilla de accesibilidad.

### 2.2 El modo oscuro — decisión que tienes que tomar, no heredar

`globals.css:88` define un bloque `.dark` completo… **y es inalcanzable**: no hay `ThemeProvider`, ni `next-themes`, ni un solo sitio donde se aplique la clase `dark`. Los 12 usos de `dark:` que hay en `src/` están **todos dentro de los componentes de serie de shadcn**, no en pantallas de este proyecto.

Si metes la paleta solo en `:root` y dejas `.dark` con la escala de grises vieja, creas un medio-estado incoherente que hoy nadie ve y que aparecerá el día que alguien añada un interruptor.

**Decide explícitamente y escríbelo**, con dos salidas razonables: dejar el modo oscuro fuera del alcance y **decirlo en el bloque `.dark`** en un comentario, o definir la paleta también ahí — lo que **duplica el trabajo de contraste**, porque los ratios de arriba son contra blanco y no valen. Recomendación: aplazarlo, porque el presupuesto de contraste ya está justo. Pero es tu decisión y va razonada.

## 3. La tipografía — General Sans, y es lo que más riesgo tiene

**General Sans**, de Fontshare (ITF). Hoy el proyecto carga **`Geist` por `next/font/google`** en `src/app/[locale]/layout.tsx:2`, con `variable: '--font-sans'`.

**General Sans no está en Google Fonts.** Va **local, con `next/font/local`**, y los ficheros al repositorio. Comprueba la licencia de Fontshare antes de commitear nada, y deja escrito qué permite.

**Y aquí está el peligro de esta fase, medido por la C1:**

> El LCP mediano del sitio está en **2,4–2,8 s**, y el umbral «bueno» de Core Web Vitals es **2,5 s**. Casi todo el sitio está justo en el borde, y ya lo estaba antes. **Una fuente en el camino crítico es exactamente lo que cruza ese borde sin que la nota baje mucho.**

Por eso: subsetea a **`latin`**, carga **solo los pesos que uses de verdad** —cada peso extra es carga en el camino crítico—, `display: 'swap'`, y comprueba que `next/font` la está **preacargando y autoalojando** de verdad mirando el HTML servido, no la configuración.

👉 **Mira el LCP antes que la nota.** Una fase que deja la nota igual y el LCP en 2,7 s ha empeorado el sitio.

## 4. El resto del sistema

- **Escala tipográfica**: tamaños, pesos e interlineado coherentes. Hoy cada pantalla elige sus clases a mano.
- **Espaciado y radios**: `--radius` ya existe y de él se derivan seis escalones. Úsalos.
- **Los componentes de `src/components/ui/`** (11) son de serie de shadcn. Ahí es donde se aplica el sistema, **una vez cada uno**, no pantalla por pantalla.
- **Los tres estados que hoy no existen.** No hay **ni un `loading.tsx` ni un `error.tsx`** en toda la aplicación; `not-found.tsx` sí (dos). El estado vacío existe en `/jobs` y **está bien hecho: no lo toques** (ADR-36). Los que faltan son carga y error, y son los que ve alguien con mala conexión — o sea, el candidato de este producto.

**La superficie son 21 páginas.** Cúbrelas de verdad: pública, `(auth)`, y también `(private)` —onboarding, cuenta, admin—, que es donde el candidato pasa el rato de subir sus documentos y donde hoy no ha mirado nadie con criterio visual.

## 5. Lo que NO se toca

- **Nada de GSAP, R3F, shaders ni layout disruptivo.** Decisión de Ulises del 2026-08-18, reafirmada el 20 y ya dentro de ADR-10. Hay agentes instalados para eso en esta máquina y **en este proyecto restan**. **No los invoques.** Los que sí: **`ui-polish`** —esta fase es su sitio— y **`visual-qa`**, que es lo que te deja cerrar con medición.
- **Las rutas públicas no tocan la sesión** (ADR-11, ADR-13). Ojo especial: un interruptor de tema o cualquier estado en la cabecera **volvería dinámicas todas las públicas**. La C1 ya rechazó un menú desplegable por esto mismo; lee su comentario en `src/components/site-header.tsx`.
- **El contenido y la estructura de la C1.** No reescribas la home: los cinco `h2` y los seis `h3` responden preguntas concretas y están medidos. Vístelos.
- **Copy largo de pantalla de servidor no va a `messages/<locale>.json`** (ADR-37): `NextIntlClientProvider` serializa el fichero entero en **todas** las páginas. Si añades copy, sigue el patrón de `messages/home/`.
- **No toca la base de datos.**

## 6. Cómo se mide — heredado de la C1, y es obligatorio

1. **Mediana de 3 pasadas como mínimo.** Una pasada tiene una banda de ruido de **±3 puntos**, más ancha que cualquier efecto que puedas causar. Si dos versiones difieren, **7 pasadas** y enseña la distribución.
2. **Borde caliente** en producción. Calienta antes de medir.
3. **Compara contra el árbol de justo antes de esta fase, medido el mismo día y en la misma máquina.** Comparar contra una línea base de otra semana mezcla fases en una cifra.
4. **Registra el LCP junto a la nota**, siempre.

## 7. Hecho cuando

- **Ninguna combinación de texto baja de 4,5:1** y ninguna de interfaz de 3:1, **comprobado con un script que recorra los pares reales que pinta la aplicación** y cuya salida quede en la evidencia. No a ojo, y no solo los cuatro pares de §2.1.
- **El LCP no empeora** en ninguna página, y se enseña junto a la nota. Lighthouse móvil igual o mejor, con el método de §6.
- **Las 21 páginas se ven consistentes a 390 y 1280 px**, con capturas de `visual-qa`. Ninguna con desbordamiento horizontal.
- **Carga y error tienen tratamiento explícito** y se demuestran, no se declaran.
- **La fuente se sirve autoalojada y preacargada**, comprobado en el HTML servido, y su licencia queda escrita.
- **La decisión sobre el modo oscuro está tomada y razonada** (§2.2).
- **Sin regresión de caché ni de sesión**: públicas con `x-vercel-cache` y sin `x-ett-session-checked` ni `Set-Cookie`; `/es/cuenta` en 307 con la función en `dub1`.
- La C1 sigue en pie: home con 1 `h1` / 5 `h2` / 6 `h3`, cero «Fase de construcción», primario a `/oportunidades`, `(auth)` 10/10 con canónica, `JobPosting` = 0, sitemap 13.
- `typecheck`, `lint`, `format:check` limpios · `test:security` **64/64** · `drill` en verde · paridad `es`/`en`.

## 8. Fuera de alcance — anotar, no hacer

- **El modo oscuro**, si decides aplazarlo (§2.2).
- **`messages/<locale>.json` sigue pesando 37 KB** y viaja entero a todas las páginas. ADR-37 lo resolvió para la home y ADR-33 para los legales; **el resto sigue igual**. Es una tarea real y **no es esta**.
- **Hallazgos 5 y 8** de la auditoría previa (`/es/trabajo/**` en 404 por falta de vacantes; `ettrecruiter.vercel.app` a 200).
- **El punto 5**, el campo de sector/ciudad de destino en el onboarding. Si te lo cruzas: `candidate_sectors` es experiencia **pasada**, no preferencia de destino.

## 9. Al cerrar

1. Evidencia en `docs/evidencia/fase-c2/`: la tabla de contraste con su script, el rendimiento con LCP y método, y las capturas a 390 y 1280.
2. Marca la fase en `docs/02-ROADMAP.md` **solo si su «hecho cuando» está medido entero** — y marca **también la tabla de estado global de arriba del documento**, que en la C1 se quedó en ⬜ con la ficha ya cerrada. Si falta un criterio, se queda 🟡 y se dice cuál.
3. Decisiones nuevas a `docs/00-PROJECT.md` como ADR (van por la 38).
4. Actualiza `docs/ESTADO.md`: qué queda hecho, qué no, y qué debe saber la sesión siguiente.
