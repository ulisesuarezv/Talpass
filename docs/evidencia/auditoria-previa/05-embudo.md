# 05 · El embudo del candidato — qué puede hacer hoy, y dónde se para

> **Medición: 2026-08-18.** Recorrido **sobre el código** y sobre lo medido en
> `02-produccion.md`. **No se ha registrado a nadie en producción** ni se ha
> escrito en su base de datos.

---

## 1. El camino, paso a paso

| #   | Paso                        | ¿Funciona hoy en producción? | Qué le falta exactamente                                                             |
| --- | --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ |
| 1   | **Llegar** a `/es/registro` | ✅ sí                        | —                                                                                    |
| 2   | **Registro**                | ✅ sí                        | —                                                                                    |
| 3   | **Confirmación por correo** | ✅ sí                        | Lo manda **Supabase Auth**, no la aplicación, y su SMTP está configurado en el panel |
| 4   | **Aterrizaje del enlace**   | ✅ sí                        | `/api/auth/callback` canjea el código y redirige                                     |
| 5   | **Onboarding**              | ✅ sí                        | `/es/completar-perfil` responde 307 sin sesión, que es lo correcto                   |
| 6   | **Subida de documentos**    | 🔴 **rota, a medias**        | Falta la migración `20260816120000_verification.sql` — ver §3                        |
| 7   | **Revisión del admin**      | 🔴 **rota**                  | Misma migración: la apertura del documento no se puede registrar                     |
| 8   | **Pasar a `verified`**      | 🟡 posible, pero sin cola    | El admin puede aprobar; lo que no funciona es que el candidato **llegue** a la cola  |
| 9   | **Aviso al candidato**      | 🔴 **no sale**               | Faltan `RESEND_API_KEY` y `EMAIL_FROM` en Vercel                                     |
| 10  | **Aplicar a una vacante**   | ⬜ no existe                 | Es la **fase 5**, cuyo prompt sigue sin escribirse                                   |
| 11  | **Que haya a qué aplicar**  | 🔴 cero vacantes             | `/es/ofertas` sirve **0 enlaces** de vacante. Depende de que haya ETT                |

**Dónde se para de verdad:** un candidato que se registre hoy en
`https://talpass.eu` llega hasta completar su perfil, **y ahí se queda**. Si
sube un documento, no entra en ninguna cola y nadie recibe aviso de nada. Y
aunque llegara a `verified`, no hay ni una sola vacante a la que aplicar ni
existe todavía el botón de aplicar.

---

## 2. Los cuatro bloqueos, nombrados con precisión

### 🔴 B1 · La migración `supabase/migrations/20260816120000_verification.sql`

```bash
pnpm exec supabase migration list --linked
```

18 migraciones en el repositorio, **17 aplicadas en producción**. Falta esta, y
**es la única**. Lo que hace, y por tanto lo que hoy no existe en producción:

| Cambio                                                                                               | Qué rompe su ausencia                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alter table public.document_access_log alter column request_id drop not null`                       | El admin **no puede registrar que ha abierto un documento**: en producción `request_id` sigue siendo `not null` y solo hay `request_id` cuando la apertura nace de una solicitud de una ETT (ADR-05). El `insert` del backoffice falla → **ADR-25 no se cumple en producción**               |
| `create trigger candidate_documents_mark_under_review` (+ función `app.mark_candidate_under_review`) | **Subir un documento no pone al candidato en `pending`.** El candidato no puede escribir `verification_status` por sí mismo (disparador de la fase 1) y el admin no lo pone a mano: sin este disparador, **la cola de revisión del admin está siempre vacía aunque haya documentos subidos** |
| `create policy document_access_log_candidate_read_own_documents`                                     | El candidato **no ve quién ha abierto sus documentos**                                                                                                                                                                                                                                       |
| Dos índices                                                                                          | Solo rendimiento                                                                                                                                                                                                                                                                             |

Cómo se aplica (lo lanza Ulises, con `!`, porque la sesión no escribe en
producción):

```bash
! printf 'produccion\nY\n' | pnpm db:push:prod
```

### 🔴 B2 · Dos variables de entorno en Vercel

```bash
pnpm exec vercel env ls
```

| Variable         | Efecto de que falte                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RESEND_API_KEY` | `src/lib/email/send.ts:167` → «Sin transporte de correo: falta RESEND_API_KEY». **Ningún aviso de aprobado/rechazado sale**; queda registrado en `email_log` |
| `EMAIL_FROM`     | El remitente. Debe ser `no-reply@updates.talpass.eu`, el dominio verificado, **no** el apex                                                                  |

`SUPABASE_SERVICE_ROLE_KEY` **sí está** desde hace 4 días, aunque `ESTADO.md`
la siga listando como pendiente.

> Nota de diseño que sí funciona: el candidato **pasa a `verified` igual** aunque
> el correo no salga (ADR-26). El fallo se ve y queda en `email_log`; no bloquea
> la verificación.

### 🔴 B3 · Cero vacantes en producción

```bash
curl -s https://talpass.eu/es/ofertas | grep -o 'href="/es/ofertas/[^"]*"' | sort -u | wc -l   # 0
```

Con ello, y por ADR-23, **las 16 landings de `/es/trabajo/**` son 404** (medido
en `02-produccion.md` §7). No es un fallo: es la consecuencia de que no haya
ETT. Pero significa que hoy la superficie pública que Google puede indexar son
**7 URLs**.

### ⬜ B4 · No existe «aplicar»

Es la fase 5, y su prompt está sin escribir a propósito.

---

## 3. Los huecos de confianza y legales

### 🔴 L1 · No existe ninguna ruta legal

```bash
grep -n "privacy\|terms\|legal\|cookies" src/i18n/routing.ts    # sin coincidencias
curl -s -o /dev/null -w '%{http_code}' https://talpass.eu/es/privacidad   # 404
curl -s -o /dev/null -w '%{http_code}' https://talpass.eu/es/terminos     # 404
curl -s -o /dev/null -w '%{http_code}' https://talpass.eu/es/legal        # 404
```

`src/i18n/routing.ts` declara **17 rutas** y **ninguna es legal**: no hay
términos, ni política de privacidad, ni aviso de cookies, ni página de contacto.
Las tres URLs candidatas devuelven **404 en producción**.

### 🔴 L2 · La casilla de consentimiento **no enlaza a nada, lo pone en negrita**

`src/components/auth/signup-form.tsx:80-83`:

```tsx
label={t.rich('consents.terms', {
  brand: siteConfig.name,
  terms: (chunks) => <strong>{chunks}</strong>,
})}
```

La clave `Auth.consents.terms` dice: «He leído y acepto los `<terms>`Términos de
uso y la Política de Privacidad`</terms>` de {brand}.» — y `<terms>` se
convierte en **`<strong>`**, no en un `Link`. Verificado en el HTML servido de
producción:

```bash
curl -s https://talpass.eu/es/registro | grep -o 'He leído y acepto[^<]*<[^>]*>[^<]*'
# He leído y acepto los <strong>Términos de uso y la Política de Privacidad
curl -s https://talpass.eu/es/registro | grep -c 'href="/es/privacidad"\|href="/es/terminos"'
# 0
```

**Es un consentimiento obligatorio (`REQUIRED_CONSENTS` incluye `terms` y
`privacy`) sobre unos textos que el candidato no puede leer porque no existen.**
Bajo GDPR, un consentimiento informado exige que la información esté
disponible. Es el hueco legal más serio del embudo, y es de los que se arreglan
escribiendo dos páginas, no refactorizando.

### 🔴 L3 · `src/config/legal.ts` versiona documentos que no existen

```ts
export const CONSENT_VERSIONS = {
  terms: '2026-08-14',
  privacy: '2026-08-14',
  data_sharing: '2026-08-14',
  audio_sharing: '2026-08-14',
} as const;
```

Las cuatro versiones se graban en la fila del consentimiento y en los metadatos
del registro (`SIGNUP_CONSENT_VERSION`). El comentario del propio fichero dice
qué se juega: «lo que hay que poder demostrar es **qué decía el texto** que
aceptó esa persona». **Hoy no hay texto: `2026-08-14` no apunta a ningún
documento**, ni en el repositorio ni en producción.

```bash
grep -rl "Términos de uso\|Política de Privacidad" docs/ content/ public/   # ningún documento
grep -rl "2026-08-14" docs/                                                 # solo docs/00-PROJECT.md
```

No existe ningún fichero con el texto de los términos ni de la privacidad — ni
en `docs/`, ni en `content/`, ni en `public/`. La mecánica de versionado está
bien construida; le falta el objeto que versiona.

### 🟡 L4 · El registro no tiene identidad propia

Medido en `02-produccion.md` §5: `/es/registro` sirve el `<title>` y la
`description` de la home, sin canónica, y con `hreflang` apuntando a la home.
El `noindex, nofollow` es deliberado (`(auth)/layout.tsx`), pero el título es el
que ve el candidato en la pestaña y en cualquier enlace que comparta. Ninguna
página de `(auth)` define `generateMetadata`.

### 🟡 L5 · El pie no dice nada

`Footer.rights` = «Talpass · Proyecto en construcción» — **47 bytes, y es el pie
entero**. Sin enlaces legales, sin contacto, sin razón social. Es el sitio donde
un candidato busca a quién le está dando su DNI.

---

## 4. Lo que sí funciona y conviene no romper en el rediseño

- El registro, la confirmación por correo de Supabase, el aterrizaje del enlace
  y el onboarding **funcionan en producción hoy**.
- La subida pasa por el servidor (ADR-29) y **no usa `service_role`**: la RLS
  decide, y por eso la batería de seguridad prueba el camino real.
- Las URLs firmadas viven 60 s y se emiten en servidor tras comprobar permiso.
- `/es/cuenta`, `/es/admin`, `/es/agency` y `/es/completar-perfil` devuelven
  **307** con `x-ett-session-checked: 1` en producción: el proxy protege, y solo
  ahí.
- Los cuatro consentimientos son casillas separadas y **ninguna viene marcada**.
