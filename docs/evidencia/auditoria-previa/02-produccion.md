# 02 · Producción — lo que sirve hoy `https://talpass.eu`

> **Medición: 2026-08-18.** Solo lectura: `curl`, `vercel inspect`,
> `vercel ls`, `vercel env ls` y `supabase migration list --linked`. No se ha
> escrito nada en producción.

---

## 1. Qué despliegue está vivo, y si coincide con `origin`

```bash
pnpm exec vercel inspect talpass.eu
```

| Dato                    | Valor                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Despliegue              | `dpl_14Fw5ScwWntESvy6wTGkjaEiEYJR`                                                                          |
| Proyecto                | `ulisesuarezvs-projects/ettrecruiter`                                                                       |
| Estado                  | ● Ready · target `production`                                                                               |
| Creado                  | 2026-08-17 13:44 CEST (~11 h antes de esta medición)                                                        |
| Alias                   | `talpass.eu`, `www.talpass.eu`, `ettrecruiter.vercel.app`, `ettrecruiter-ulisesuarezvs-projects.vercel.app` |
| Región de las funciones | **`iad1`** (Washington, EE. UU.)                                                                            |

Es el mismo `dpl_14Fw…` que `docs/ESTADO.md` da por desplegado, así que lo que
sirve producción es la corrección de la etiqueta salarial. Correcto.

### 🔴 Pero `origin/main` NO contiene lo que está desplegado

```bash
git fetch origin
git rev-parse HEAD origin/main
git log --oneline origin/main..HEAD
git ls-tree -r --name-only origin/main | grep -c opportunities   # 0
git ls-tree -r --name-only HEAD        | grep -c opportunities   # 6
```

| Referencia    | Commit    | Contiene la fase 4b |
| ------------- | --------- | ------------------- |
| `HEAD` local  | `ed214e8` | **sí** (6 ficheros) |
| `origin/main` | `8ca97a4` | **no** (0 ficheros) |

**`origin/main` va 4 commits por detrás**, y los cuatro son la fase 4b entera y
su verificación:

```
ed214e8 Prompt de la auditoría previa al rediseño
2ae6686 Estado: desplegada la corrección de la etiqueta salarial
5e30922 Auditoría posterior a la 4b: quitadas las contradicciones y escrito qué le toca al PM
c416f9f Fase 4b: oportunidades de mercado y el sitio abierto a Google
```

Consecuencia exacta: **el código que sirve `https://talpass.eu` hoy existe en un
solo sitio, el portátil.** No hay integración con GitHub, así que el despliegue
se hizo desde local sin pasar por `origin`. `docs/ESTADO.md` afirma «Git y
producción quedan sincronizados» (punto 1 de «Si retomas como PM»): **eso es
falso respecto a `origin`.** Era cierto en el sentido de «lo desplegado está
commiteado», no en el de «está subido».

> Vercel no guarda metadatos de git en estos despliegues (no aparece `commit` en
> `vercel inspect`), así que la equivalencia entre `dpl_14Fw…` y `2ae6686` no se
> puede demostrar con un SHA. Lo que sí se demuestra es que **`origin/main` no
> puede ser el origen de este despliegue**, porque no tiene las páginas que
> producción sirve.

### Despliegues de producción recientes

```bash
pnpm exec vercel ls --prod
```

| Edad | Despliegue                           |
| ---- | ------------------------------------ |
| 11 h | `ettrecruiter-apx2it5ol…` ← **vivo** |
| 12 h | `ettrecruiter-mghvkwmjr…`            |
| 12 h | `ettrecruiter-mp3pe2y1a…`            |
| 2 d  | `ettrecruiter-9jyglf88b…`            |
| 4 d  | `ettrecruiter-at3ia1bux…`            |

---

## 2. `/robots.txt`

```bash
curl -s https://talpass.eu/robots.txt
```

```
User-Agent: *
Allow: /
Disallow: /es/completar-perfil
Disallow: /en/onboarding
Disallow: /es/cuenta
Disallow: /en/account
Disallow: /es/agency
Disallow: /en/agency
Disallow: /es/admin
Disallow: /en/admin
Disallow: /completar-perfil
Disallow: /onboarding
Disallow: /cuenta
Disallow: /account
Disallow: /agency
Disallow: /admin

Sitemap: https://talpass.eu/sitemap.xml
```

`Allow: /` confirmado — la bandera `NEXT_PUBLIC_ALLOW_INDEXING` está haciendo
efecto en el despliegue vivo. 15 `Disallow`, todos de zona privada.

---

## 3. `/sitemap.xml`

```bash
curl -s https://talpass.eu/sitemap.xml > sitemap.xml
grep -o '<loc>[^<]*</loc>' sitemap.xml | wc -l   # 7
grep -c 'xhtml:link' sitemap.xml                 # 21
```

**7 URLs**, y **21 `xhtml:link` = 3 por entrada** (`es`, `en`, `x-default`).
Ninguna entrada se queda sin alternates.

| #   | `<loc>`                                                   |
| --- | --------------------------------------------------------- |
| 1   | `https://talpass.eu/es`                                   |
| 2   | `https://talpass.eu/es/oportunidades`                     |
| 3   | `https://talpass.eu/es/oportunidades/alemania/almacen`    |
| 4   | `https://talpass.eu/es/oportunidades/alemania/logistica`  |
| 5   | `https://talpass.eu/es/oportunidades/alemania/produccion` |
| 6   | `https://talpass.eu/es/oportunidades/alemania/carnico`    |
| 7   | `https://talpass.eu/es/oportunidades/alemania/agricola`   |

### Los 14 destinos de los alternates devuelven 200

No basta con que la URL esté escrita; se ha pedido cada una:

```bash
grep -o 'href="[^"]*"' sitemap.xml | sed 's/href="//;s/"//' | sort -u \
  | while read u; do printf '%-60s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' "$u")"; done
```

**14/14 a 200.** Las 7 `es` y las 7 `en`. El emparejamiento es real, no
declarativo.

---

## 4. `hreflang` recíproco con `x-default`

```bash
curl -s https://talpass.eu<ruta> | grep -o '<link rel="alternate" hrefLang="[^"]*" href="[^"]*"'
```

| Página medida                               | `hreflang=es`        | `hreflang=en`                         | `x-default`          |
| ------------------------------------------- | -------------------- | ------------------------------------- | -------------------- |
| `/es/oportunidades` (listado)               | `/es/oportunidades`  | `/en/opportunities`                   | `/es/oportunidades`  |
| `/en/opportunities` (listado, el recíproco) | `/es/oportunidades`  | `/en/opportunities`                   | `/es/oportunidades`  |
| `/es/oportunidades/alemania/almacen`        | `…/alemania/almacen` | `/en/opportunities/germany/warehouse` | `…/alemania/almacen` |
| `/en/opportunities/germany/warehouse`       | `…/alemania/almacen` | `…/germany/warehouse`                 | `…/alemania/almacen` |

**Recíproco y simétrico en los dos sentidos**, con `x-default` apuntando siempre
al `es` (el `defaultLocale`). Y las cuatro URLs implicadas **existen y devuelven
200** (comprobado en el punto 3, no solo escritas).

> Detalle sin consecuencia: el atributo se serializa como `hrefLang` (con `L`
> mayúscula) porque lo emite React. HTML no distingue mayúsculas en nombres de
> atributo, así que Google lo lee igual. **No es un fallo**, pero conviene
> saberlo antes de escribir un `grep 'hreflang='` que devuelva cero y asustar.

---

## 5. Canónicas y dominios (ADR-12)

| Página                                | `<link rel="canonical">`                                |
| ------------------------------------- | ------------------------------------------------------- |
| `/es`                                 | `https://talpass.eu/es`                                 |
| `/en`                                 | `https://talpass.eu/en`                                 |
| `/es/oportunidades`                   | `https://talpass.eu/es/oportunidades`                   |
| `/en/opportunities`                   | `https://talpass.eu/en/opportunities`                   |
| `/es/oportunidades/alemania/almacen`  | `https://talpass.eu/es/oportunidades/alemania/almacen`  |
| `/en/opportunities/germany/warehouse` | `https://talpass.eu/en/opportunities/germany/warehouse` |
| `/es/ofertas`                         | `https://talpass.eu/es/ofertas`                         |
| `/en/jobs`                            | `https://talpass.eu/en/jobs`                            |
| **`/es/registro`**                    | **🔴 ninguna** — ver abajo                              |

Todas en el **apex**, ninguna en `www`. ✅

| Dominio                      | Comportamiento                               |
| ---------------------------- | -------------------------------------------- |
| `www.talpass.eu/es`          | **308** → `https://talpass.eu/es` ✅         |
| `www.talpass.eu/robots.txt`  | **308** → `https://talpass.eu/robots.txt` ✅ |
| `ettrecruiter.vercel.app/es` | **200** — no redirige                        |

🟡 **El dominio antiguo sirve el sitio entero a 200**, con su propio
`/robots.txt` en `Allow: /` y su propio `/sitemap.xml`. Mitigado: su
`canonical` apunta al apex (`https://talpass.eu/es`) y su sitemap declara URLs
del apex. Es duplicado rastreable, no duplicado canónico. `ESTADO.md` ya lo
documenta («sigue respondiendo como dominio antiguo»), pero **no está escrito
que sea rastreable en vez de redirigir**, y eso es una decisión, no un detalle.

### 🔴 `/es/registro` y `/en/signup` no tienen metadatos propios

```bash
curl -s https://talpass.eu/es/registro | grep -o 'rel="canonical"[^>]*'          # (vacío)
curl -s https://talpass.eu/es/registro | grep -o '<link rel="alternate" hrefLang="[^"]*" href="[^"]*"'
```

- **Sin canónica.**
- `hreflang=es` → `https://talpass.eu/es` y `hreflang=en` → `https://talpass.eu/en`
  — es decir, **apuntan a la home**, no a `/es/registro` ↔ `/en/signup`. Sin
  `x-default`.
- `<title>` y `<meta name="description">` son **los de la home**
  («Talpass — Empleo en Europa para hispanohablantes»).
- `robots: noindex, nofollow` (esto sí es deliberado: `(auth)/layout.tsx`).

Causa: ninguna página de `(auth)` define `generateMetadata`, así que hereda la
del layout raíz. El `noindex` limita el daño SEO, pero **el título que ve el
candidato en la pestaña y en cualquier enlace compartido del registro es el de
la home** — y el registro es una de las páginas que el rediseño toca.

---

## 6. `JobPosting` = 0 en las cinco oportunidades, `es` y `en`

```bash
curl -s https://talpass.eu<ruta> | grep -c 'JobPosting'
```

| Página                                | `JobPosting` |
| ------------------------------------- | ------------ |
| `/es/oportunidades` (listado)         | 0            |
| `/es/oportunidades/alemania/almacen`  | 0            |
| `/en/opportunities` (listado)         | 0            |
| `/en/opportunities/germany/warehouse` | 0            |

Comprobado también en el build local sobre los **12** ficheros HTML de
oportunidad: 0 (ver `01-local.md` §4). ADR-30 se cumple en producción.

---

## 7. Cabeceras

```bash
curl -sI https://talpass.eu<ruta>
```

| Ruta                                 | HTTP                   | `x-vercel-cache` | `x-ett-session-checked` | `Set-Cookie` |
| ------------------------------------ | ---------------------- | ---------------- | ----------------------- | ------------ |
| `/es`                                | 200                    | HIT (age 40121)  | —                       | —            |
| `/en`                                | 200                    | HIT              | —                       | —            |
| `/es/ofertas`                        | 200                    | HIT              | —                       | —            |
| `/es/oportunidades`                  | 200                    | HIT              | —                       | —            |
| `/es/oportunidades/alemania/almacen` | 200                    | HIT              | —                       | —            |
| `/es/registro`                       | 200                    | HIT              | —                       | —            |
| **`/es/cuenta`**                     | **307** → `/es/entrar` | MISS             | **`1`**                 | —            |

`cache-control` de una pública: `public, max-age=0, must-revalidate` (el CDN
cachea, el navegador revalida — es lo esperado con ISR).

**Ninguna pública filtra sesión ni cookie en producción.** ADR-11 y ADR-13 en
verde.

### Códigos de todas las rutas probadas

| Ruta                                              | Código  | Nota                            |
| ------------------------------------------------- | ------- | ------------------------------- |
| `/es`, `/en`                                      | 200     |                                 |
| `/es/ofertas`, `/es/oportunidades`                | 200     |                                 |
| `/es/registro`, `/en/signup`, `/es/entrar`        | 200     |                                 |
| `/es/cuenta`, `/es/admin`, `/es/completar-perfil` | 307     | → `/es/entrar`                  |
| **`/es/trabajo/alemania`**                        | **404** | 🔴 ver abajo                    |
| **`/es/trabajo/alemania/almacen`**                | **404** |                                 |
| **`/es/trabajo/ciudad/berlin`**                   | **404** |                                 |
| `/es/privacidad`, `/es/terminos`, `/es/legal`     | 404     | no existen (ver `05-embudo.md`) |

### 🔴 Las 16 landings de ADR-23 no existen en producción

Son derivadas de las vacantes vivas, y en producción hay **cero vacantes**:

```bash
curl -s https://talpass.eu/es/ofertas | grep -o 'href="/es/ofertas/[^"]*"' | sort -u | wc -l   # 0
```

Por tanto `/es/trabajo/**` es **404 entero** hoy. Esto **no es un fallo nuevo**
—es ADR-23 funcionando— pero tiene dos consecuencias que no están escritas en
ninguna parte:

1. **La línea base de rendimiento «landing 97» no se puede medir contra
   producción**, porque la página no existe. Ver `03-rendimiento.md`.
2. La superficie pública indexable real de producción son **7 URLs**: la home y
   las 6 páginas de oportunidad. `/es/ofertas` existe pero va en
   `noindex, follow` (deliberado, catálogo vacío) y no está en el sitemap.

---

## 8. Migraciones

```bash
pnpm exec supabase migration list --linked
ls supabase/migrations/*.sql | wc -l
```

| Dónde                     | Cuántas |
| ------------------------- | ------- |
| En el repositorio (local) | **18**  |
| Aplicadas en producción   | **17**  |

**Falta exactamente una, por nombre:**

```
20260816120000_verification.sql
```

Las 17 primeras coinciden `local` ↔ `remote` sin huecos
(`20260813120100` … `20260814100100`). La 18ª sale con `"remote":""`.

Coincide con lo que `ESTADO.md` anuncia («producción está al día hasta la fase 3»).
Lo que hace esa migración y qué rompe su ausencia está en `05-embudo.md` §3.

---

## 9. Variables de entorno en Vercel

```bash
pnpm exec vercel env ls
grep -rhoE "process\.env\.[A-Z_0-9]+" src scripts next.config.ts | sed 's/.*env\.//' | sort -u
```

Todas las de `Production` son **Sensitive**, así que solo se verifica que
existen; el efecto se comprueba en el HTML desplegado (punto 2: `Allow: /`).

### Las 9 que existen en `production`

| Variable                           | Creada |
| ---------------------------------- | ------ |
| `NEXT_PUBLIC_ALLOW_INDEXING`       | 12 h   |
| `NEXT_PUBLIC_SITE_URL`             | 2 d    |
| `NEXT_PUBLIC_SITE_NAME`            | 2 d    |
| `NEXT_PUBLIC_SUPABASE_URL`         | 4 d    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | 4 d    |
| `SUPABASE_SERVICE_ROLE_KEY`        | 4 d    |
| `TALPASS_ENCRYPTION_KEYS`          | 2 d    |
| `TALPASS_ENCRYPTION_ACTIVE_KEY_ID` | 2 d    |
| `TALPASS_BLIND_INDEX_KEY`          | 2 d    |

### Las que el código necesita y NO están en `production`

El código lee 12 variables. De las 12, **2 faltan**:

| Variable         | Para qué                                                        | Efecto de que falte                                                                                          |
| ---------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `RESEND_API_KEY` | el aviso de aprobado/rechazado que manda la aplicación (ADR-26) | `src/lib/email/send.ts:167` — «Sin transporte de correo». No sale ningún correo propio; queda en `email_log` |
| `EMAIL_FROM`     | remitente `no-reply@updates.talpass.eu`                         | ídem                                                                                                         |

`EMAIL_DEV_INBOX_URL` no está, y **es correcto**: es solo de local (Mailpit).

### 🟡 `ESTADO.md` dice que faltan tres, y faltan dos

`docs/ESTADO.md` → «El día que haya ETT» → paso 4 lista tres variables:
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` y `EMAIL_FROM`. **La primera ya
está puesta** (`Production`, hace 4 días). La tabla del ESTADO está desfasada.

---

## 10. Región de las funciones

`vercel inspect` da las funciones en **`iad1`** (Washington). No hay `vercel.json`
ni `vercel.ts` en el repositorio, ni `regions` en `next.config.ts`:

```bash
cat vercel.json vercel.ts 2>/dev/null    # no existen
grep -n "region" next.config.ts          # sin coincidencias
```

Las públicas son estáticas y se sirven desde el CDN, así que esto no afecta al
SEO ni al rendimiento medido. Pero **la ruta privada, el proxy de sesión y
`/api/documents/[id]` se ejecutan en EE. UU. contra una base de datos en la UE**:
cada lectura de documento cruza el Atlántico dos veces, y `CLAUDE.md` sitúa
Supabase en región EU por una razón que no es la latencia. **No está anotado en
ninguna parte** y no lo cubre ningún ADR.
