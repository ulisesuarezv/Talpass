import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // Fuerza el uso de `@/i18n/navigation`: `next/link` y `next/navigation`
      // no conocen los pathnames localizados y romperían /es/ofertas ↔ /en/jobs.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message:
                "Usa `Link` de '@/i18n/navigation' para respetar el idioma y los pathnames localizados.",
            },
            {
              name: 'next/navigation',
              importNames: [
                'redirect',
                'permanentRedirect',
                'useRouter',
                'usePathname',
              ],
              message:
                "Usa la versión de '@/i18n/navigation'. `notFound` y `useParams` sí pueden importarse de aquí.",
            },
          ],
        },
      ],
    },
  },

  // Los ficheros de i18n son justamente los que envuelven las APIs de Next.
  {
    files: ['src/i18n/**'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // `eslint-config-prettier` al final: apaga las reglas de formato.
  prettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Lo escribe `supabase start`; no es código del proyecto.
    'supabase/.temp/**',
    // Generado por `pnpm db:types`.
    'src/lib/supabase/database.types.ts',
  ]),
]);

export default eslintConfig;
