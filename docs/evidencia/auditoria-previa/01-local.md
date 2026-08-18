# 01 · Local — build, rutas, invariantes, HTML, seguridad y calidad

> **Medición: 2026-08-18.** Commit `ed214e8`, árbol limpio (`git status --porcelain`
> vacío). Base de datos local (`pnpm db:start`), entorno `.env.test` (ADR-17).
>
> Secuencia previa, la del ADR-11, para no medir contra un servidor viejo:
>
> ```bash
> lsof -ti tcp:3210 | xargs -r kill -9   # → "PUERTO 3210 LIBRE"
> rm -rf .next && pnpm build:local       # con el servidor ya parado
> ```

---

## 1. `next build` — rutas prerenderizadas

```bash
rm -rf .next && pnpm build:local
node -e "const m=require('./.next/prerender-manifest.json');const r=Object.keys(m.routes).sort();console.log(r.length);console.log(r.join('\n'))"
```

**53 entradas en `prerender-manifest.json`**, de las que **48 son páginas de
idioma** (las otras 5 son `/_global-error`, `/_not-found`, `/favicon.ico`,
`/robots.txt` y `/sitemap.xml`).

La lista entera, ruta por ruta, **todas `●` (SSG)**:

| Familia                          | `es`                                                                                           | `en`                                                                                     | Nº     |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| Home                             | `/es`                                                                                          | `/en`                                                                                    | 2      |
| Listado de vacantes              | `/es/jobs`                                                                                     | `/en/jobs`                                                                               | 2      |
| Vacantes                         | `/es/jobs/almacen-berlin-turnos`, `/es/jobs/logistica-hamburgo`, `/es/jobs/produccion-leipzig` | ídem en `/en/jobs/…`                                                                     | 6      |
| Listado de oportunidades         | `/es/opportunities`                                                                            | `/en/opportunities`                                                                      | 2      |
| Oportunidades                    | `/es/opportunities/alemania/{almacen,logistica,produccion,carnico,agricola}`                   | `/en/opportunities/germany/{warehouse,logistics,production,meat-processing,agriculture}` | 10     |
| Landing de país                  | `/es/work/alemania`                                                                            | `/en/work/germany`                                                                       | 2      |
| Landing país+sector              | `/es/work/alemania/{almacen,logistica,produccion}`                                             | `/en/work/germany/{warehouse,logistics,production}`                                      | 6      |
| Landing con alojamiento          | `/es/work/alemania/with-housing`                                                               | `/en/work/germany/with-housing`                                                          | 2      |
| Landing de ciudad                | `/es/work/city/{berlin,leipzig,hamburgo}`                                                      | `/en/work/city/{berlin,leipzig,hamburgo}`                                                | 6      |
| `(auth)` — estáticas y `noindex` | `/es/{login,signup,check-email,forgot-password,reset-password}`                                | `/en/{login,signup,check-email,forgot-password,reset-password}`                          | 10     |
| **Total páginas `●`**            |                                                                                                |                                                                                          | **48** |

> Los segmentos que se ven arriba son los **internos** (`/es/jobs`,
> `/es/opportunities`, `/es/work/…`). La URL pública es la traducida
> (`/es/ofertas`, `/es/oportunidades`, `/es/trabajo/…`), y es la que se usa en
> las comprobaciones de cabeceras y HTML.

Y **`ƒ` (dinámicas), como exige ADR-11**, tal cual salen en el build:

```
ƒ /[locale]/account
ƒ /[locale]/admin
ƒ /[locale]/admin/[candidateId]
ƒ /[locale]/agency
ƒ /[locale]/onboarding
ƒ /api/auth/callback
ƒ /api/documents/[id]
```

Ninguna ruta pública sale `ƒ`, y ninguna privada sale `●`.

> **Nota de contexto:** las 3 vacantes y las 6 landings de sector/ciudad
> existen **porque la base local tiene vacantes sembradas**. En producción el
> catálogo está vacío y esas 14 páginas no existen (ver `02-produccion.md`).
> Las 5 oportunidades no dependen de la base: viven en
> `src/lib/opportunities.ts` (ADR-30), y por eso están en los dos sitios.

---

## 2. Cabeceras del ADR-11 sobre `pnpm start:local -p 3210`

```bash
pnpm start:local -p 3210
curl -sI localhost:3210<ruta>
```

### Públicas — `x-nextjs-cache: HIT`, sin cabecera de sesión, sin `Set-Cookie`

| Ruta                                 | HTTP | `x-nextjs-cache` | `x-ett-session-checked` | `Set-Cookie` |
| ------------------------------------ | ---- | ---------------- | ----------------------- | ------------ |
| `/es`                                | 200  | HIT              | —                       | —            |
| `/en`                                | 200  | HIT              | —                       | —            |
| `/es/ofertas`                        | 200  | HIT              | —                       | —            |
| `/en/jobs`                           | 200  | HIT              | —                       | —            |
| `/es/oportunidades`                  | 200  | HIT              | —                       | —            |
| `/en/opportunities`                  | 200  | HIT              | —                       | —            |
| `/es/oportunidades/alemania/almacen` | 200  | HIT              | —                       | —            |
| `/es/registro`                       | 200  | HIT              | —                       | —            |
| `/en/signup`                         | 200  | HIT              | —                       | —            |
| `/es/entrar`                         | 200  | HIT              | —                       | —            |
| `/es/trabajo/alemania`               | 200  | HIT              | —                       | —            |
| `/es/trabajo/alemania/almacen`       | 200  | HIT              | —                       | —            |
| `/es/trabajo/ciudad/berlin`          | 200  | HIT              | —                       | —            |
| `/robots.txt`                        | 200  | HIT              | —                       | —            |
| `/sitemap.xml`                       | 200  | HIT              | —                       | —            |

**15 de 15 en verde.** Ninguna pública filtra sesión ni cookie.

### Privadas — 307 y `x-ett-session-checked: 1`

| Ruta                   | HTTP | `x-ett-session-checked` |
| ---------------------- | ---- | ----------------------- |
| `/es/cuenta`           | 307  | `1`                     |
| `/en/account`          | 307  | `1`                     |
| `/es/admin`            | 307  | `1`                     |
| `/es/agency`           | 307  | `1`                     |
| `/es/completar-perfil` | 307  | `1`                     |

---

## 3. El HTML servido, sin ejecutar JavaScript

Esta es la comprobación que la letra del build **no** hace (la trampa del
`Suspense` con `useSearchParams` de la fase 3).

```bash
curl -s localhost:3210/es/oportunidades | grep -o 'href="/es/oportunidades/[^"]*"' | sort -u | wc -l
curl -s localhost:3210/en/opportunities | grep -o 'href="/en/opportunities/[^"]*"' | sort -u | wc -l
curl -s localhost:3210/es/ofertas       | grep -o 'href="/es/ofertas/[^"]*"'       | sort -u | wc -l
```

| Página              | Enlaces dentro del HTML | Detalle                                                                              |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `/es/oportunidades` | **5**                   | `alemania/{agricola,almacen,carnico,logistica,produccion}`                           |
| `/en/opportunities` | **5**                   | los cinco equivalentes                                                               |
| `/es/ofertas`       | **3**                   | `almacen-berlin-turnos`, `logistica-hamburgo`, `produccion-leipzig` — **base local** |

> El prompt anticipaba **cero** vacantes. En local son **3**, porque la base
> local está sembrada. **El cero es el de producción**, y ahí está medido:
> `curl -s https://talpass.eu/es/ofertas | grep -o 'href="/es/ofertas/[^"]*"' | sort -u | wc -l` → **0**.

### La home lleva su `h1` y sus CTA dentro del HTML servido

```bash
curl -s localhost:3210/es | grep -o '<h1[^>]*>[^<]*</h1>'
curl -s localhost:3210/es | grep -o 'href="[^"]*"' | sort | uniq -c | sort -rn
```

- `h1`: **presente** — «Trabajo en Europa, sin intermediarios opacos».
- CTA en el HTML: `href="/es/ofertas"` (×2), `href="/es/registro"`,
  `href="/es/oportunidades"`. Los tres destinos del embudo están servidos.
- **Hallazgo de estructura, no de regresión:** la home tiene **un solo
  encabezado en todo el documento** (`<h1>` ×1, cero `<h2>`, cero `<h3>`).
  Comando: `curl -s localhost:3210/es | grep -o '<h[1-6][^>]*>' | sed 's/ class=.*//' | sort | uniq -c`.
  Es una cifra a batir por el rediseño, no una que mantener.

---

## 4. `JobPosting` en las oportunidades: cero

Sobre **los ficheros del build**, no sobre el código:

```bash
find .next/server/app -path '*opportunities*' -name '*.html' | wc -l          # 12
find .next/server/app -path '*opportunities*' -name '*.html' -exec grep -l 'JobPosting' {} \; | wc -l   # 0
find .next/server/app -name '*.html' | wc -l                                  # 50
find .next/server/app -name '*.html' -exec grep -l 'JobPosting' {} \; | sort  # 6
```

| Recorrido                                 | Ficheros | Con `JobPosting` |
| ----------------------------------------- | -------- | ---------------- |
| HTML de oportunidades (`*opportunities*`) | **12**   | **0** ✅         |
| **Todos** los HTML del build              | **50**   | **6**            |

Los 6 son exactamente las páginas de vacante real, que sí deben llevarlo
(fase 3): `{es,en}/jobs/{almacen-berlin-turnos,logistica-hamburgo,produccion-leipzig}.html`.

ADR-30 se cumple: cero marcado de vacante en las 12 páginas de oportunidad.

---

## 5. Seguridad

| Comando                    | Resultado                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:security`       | **64 comprobaciones superadas**, 0 fallos                                                                                                             |
| `pnpm test:security:drill` | **el simulacro se pone rojo y vuelve al verde** — cada política rota es cazada por la batería, y cierra con «✓ todo restaurado y en verde» (salida 0) |

El simulacro rompe políticas a propósito (entre otras: la de consentimiento de
la ETT y el disparador que impide autoverificarse), comprueba que la batería lo
detecta y las restaura. Ninguna migración se toca.

---

## 6. Calidad

| Comando             | Salida | Resultado                                                                                      |
| ------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | 0      | limpio                                                                                         |
| `pnpm lint`         | 0      | limpio                                                                                         |
| `pnpm format:check` | **1**  | **falla** — un fichero: `docs/prompts/auditoria-previa.md` (el prompt de esta misma auditoría) |

> **No se ha arreglado**, por la regla 1. Es un fichero de documentación sin
> formatear con Prettier; ni `src/` ni `messages/` tienen nada pendiente. Se
> arregla con `pnpm format` cuando el PM lo decida.
