# Alta de un desarrollador

Todo lo que hace falta para trabajar en Talpass está en este repositorio. **No
se necesita ninguna cuenta ni ningún secreto de producción**: el desarrollo
corre entero contra una Supabase local (ADR-17).

## 1. Leer, en este orden

1. `CLAUDE.md` — las reglas no negociables
2. `docs/ESTADO.md` — dónde está el proyecto y qué toca ahora
3. `docs/00-PROJECT.md` — negocio, roles y decisiones cerradas (ADR)
4. `docs/01-DATA-MODEL.md` — schema y matriz de acceso
5. `docs/CONVENTIONS.md` — naming, carpetas y el patrón servidor/cliente

## 2. Instalar

- **Node 24 o superior.** Los scripts `.mts` se ejecutan con Node directamente.
- **pnpm 11.5.1**: `corepack enable` lo coge de `package.json`.
- **Docker Desktop** (u OrbStack), arrancado antes de levantar la base.
- **CLI de Supabase**: `brew install supabase/tap/supabase`.

## 3. Arrancar

```bash
git clone https://github.com/ulisesuarezv/Talpass.git && cd Talpass
pnpm install
cp .env.test.example .env.test   # valores locales, públicos y fijos
pnpm db:start                    # Postgres, Auth, Storage y Mailpit en Docker
pnpm db:reset                    # schema y migraciones desde cero
pnpm seed:demo                   # admin, 2 ETTs, 4 candidatos y 5 vacantes
pnpm dev:local                   # http://localhost:3000
```

- **Cuentas de demostración:** las crea `seed:demo`. La contraseña de todas es
  `DEMO_PASSWORD`, en `scripts/seed-demo.mts`. Por ejemplo `admin@talpass.test`,
  `owner@nordlicht.test` o `carlos@talpass.test`.
- **Correos:** en local no salen a internet. Llegan a Mailpit,
  http://127.0.0.1:54324.
- **Comprobar que la base va:** `pnpm db:status`.

**Usa siempre `pnpm dev:local`, nunca `pnpm dev`.** `pnpm dev` lee
`.env.local`, que apunta a producción. Ese fichero no se comparte con nadie: si
no lo tienes, es lo correcto.

## 4. Cómo se entrega el trabajo

- **Nunca se trabaja en `main`.** Cada cambio va en una rama y llega a `main`
  por pull request.
- **`main` está protegida:** sin una aprobación, el pull request no se fusiona.
- **Fusionar en `main` despliega a producción** (`talpass.eu`) en segundos.
- **Antes de pedir revisión:** `pnpm lint`, `pnpm typecheck` y, si tocas la
  base o el acceso a datos, `pnpm test:security`.
- **Cambios de schema:** solo con migraciones en `supabase/migrations/`, nunca
  desde el panel. Ver `docs/CONVENTIONS.md`.
- **Producción:** las migraciones y los despliegues a producción los hace el
  responsable del proyecto. Ningún comando `:prod` se lanza sin él.
