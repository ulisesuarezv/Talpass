# 01 · Contraste — los 40 pares que pinta la aplicación

> **Generado el 2026-08-20** con `pnpm check:contrast --md`. El script está en
> `scripts/check-contrast.mts` y lee los tokens de `src/app/globals.css`: **no
> hay una copia de la paleta en la evidencia**, así que esta tabla no puede
> quedar desfasada sin que el comando falle.

## Qué se comprueba y contra qué umbral

WCAG 2.1 AA: **4,5:1** en texto normal, **3:1** en texto grande y en elementos
de interfaz (1.4.11 — bordes de campo, indicador de foco).

**Por qué 40 pares y no los 4 de la ficha del roadmap.** Los cuatro que se
calcularon a mano el 2026-08-20 son los de la paleta contra blanco. Lo que pinta
la aplicación es otra cosa:

- **Superficies con alfa.** `bg-muted/40` sobre `--background` no es `--muted`:
  es una mezcla, y el ratio hay que calcularlo contra la mezcla. El script
  compone `source-over` contra el fondo real, no contra blanco.
- **`--muted-foreground`**, que aparece **114 veces** en `src/` y es el par que
  más veces se pinta en todo el sitio. No estaba en la tabla de cuatro.
- **Bordes de campo y anillo de foco**, que antes de esta fase daban **1,35** y
  **1,9** y no aparecían en ninguna tabla porque no son texto.

## 🔴 Los tres fallos que esto cazó y a ojo no se ven

1. **`--input` daba 1,35.** El borde de un campo es lo único que dice dónde se
   escribe, y `oklch(0.922 0 0)` sobre blanco es prácticamente invisible en un
   móvil a pleno sol. Ahora **3,68**.
2. **`--ring` daba 1,9.** El indicador de foco no señalaba nada. Ahora **5,23**.
3. **`--destructive` falló dos veces seguidas.** Con red-600 no llegaba a 4,5
   sobre `--background`; con red-700 seguía fallando en un par que a mano no se
   mira nunca — el botón destructivo pinta `text-destructive` sobre
   `bg-destructive/20` **en hover**, o sea el rojo sobre sí mismo al 20 %, y ahí
   daba **4,39**. Hizo falta bajar a red-800. Ahora **5,54**.

El tercero es el que justifica el script: nadie iba a calcular a mano el
contraste de un color contra una mezcla de sí mismo al 20 % sobre el fondo.

## La tabla

| Primer plano                     | Sobre                              | Papel    | Ratio     | Mínimo | Dónde se pinta                      |
| -------------------------------- | ---------------------------------- | -------- | --------- | ------ | ----------------------------------- |
| `--foreground` #0F172A           | background #F8FAFC                 | texto    | **17,06** | 4,50   | ✅ cuerpo de toda pantalla          |
| `--card-foreground` #0F172A      | card #FFFFFF                       | texto    | **17,85** | 4,50   | ✅ `Card`                           |
| `--popover-foreground` #0F172A   | popover #FFFFFF                    | texto    | **17,85** | 4,50   | ✅ `Select`                         |
| `--foreground` #0F172A           | muted #F1F5F9                      | texto    | **16,30** | 4,50   | ✅ `bg-muted` con texto normal      |
| `--foreground` #0F172A           | muted/40 sobre fondo #F5F8FB       | texto    | **16,75** | 4,50   | ✅ home §privacidad                 |
| `--foreground` #0F172A           | muted/30 sobre fondo #F6F9FB       | texto    | **16,83** | 4,50   | ✅ onboarding                       |
| `--foreground` #0F172A           | brand-soft #F0FDFA                 | texto    | **17,12** | 4,50   | ✅ caja de marca                    |
| `--foreground` #0F172A           | brand-accent-soft #FFF7ED          | texto    | **16,81** | 4,50   | ✅ aviso de acento                  |
| `--secondary-foreground` #0F172A | secondary #F1F5F9                  | texto    | **16,30** | 4,50   | ✅ botón secundario                 |
| `--accent-foreground` #0F172A    | muted #F1F5F9                      | texto    | **16,30** | 4,50   | ✅ hover de `select`                |
| `--brand-accent-ink` #0F172A     | brand-accent #F97316               | texto    | **6,37**  | 4,50   | ✅ tinta sobre naranja              |
| `--muted-foreground` #475569     | background #F8FAFC                 | texto    | **7,24**  | 4,50   | ✅ 114 usos en `src/`               |
| `--muted-foreground` #475569     | card #FFFFFF                       | texto    | **7,58**  | 4,50   | ✅ `CardDescription`                |
| `--muted-foreground` #475569     | popover #FFFFFF                    | texto    | **7,58**  | 4,50   | ✅ placeholder de `select`          |
| `--muted-foreground` #475569     | muted #F1F5F9                      | texto    | **6,92**  | 4,50   | ✅ badge fantasma en hover          |
| `--muted-foreground` #475569     | muted/40 sobre fondo #F5F8FB       | texto    | **7,11**  | 4,50   | ✅ home §privacidad                 |
| `--muted-foreground` #475569     | muted/50 sobre tarjeta #F8FAFC     | texto    | **7,24**  | 4,50   | ✅ `CardFooter`                     |
| `--muted-foreground` #475569     | muted/30 sobre fondo #F6F9FB       | texto    | **7,15**  | 4,50   | ✅ onboarding                       |
| `--muted-foreground` #475569     | brand-soft #F0FDFA                 | texto    | **7,27**  | 4,50   | ✅ caja de marca                    |
| `--muted-foreground` #475569     | brand-accent-soft #FFF7ED          | texto    | **7,14**  | 4,50   | ✅ aviso de acento                  |
| `--primary-foreground` #FFFFFF   | primary #134E4A                    | texto    | **9,47**  | 4,50   | ✅ botón y badge principal          |
| `--primary` #134E4A              | background #F8FAFC                 | texto    | **9,06**  | 4,50   | ✅ `text-primary`, enlaces          |
| `--primary` #134E4A              | card #FFFFFF                       | texto    | **9,47**  | 4,50   | ✅ enlace dentro de tarjeta         |
| `--primary-foreground` #FFFFFF   | brand-strong #0F766E               | texto    | **5,47**  | 4,50   | ✅ blanco sobre teal-700            |
| `--brand-strong` #0F766E         | background #F8FAFC                 | texto    | **5,23**  | 4,50   | ✅ antetítulo, `.type-eyebrow`      |
| `--brand-strong` #0F766E         | brand-soft #F0FDFA                 | texto    | **5,25**  | 4,50   | ✅ antetítulo sobre marca           |
| `--brand-accent-strong` #C2410C  | background #F8FAFC                 | texto    | **4,95**  | 4,50   | ✅ texto en naranja                 |
| `--brand-accent-strong` #C2410C  | brand-accent-soft #FFF7ED          | texto    | **4,88**  | 4,50   | ✅ aviso de acento                  |
| `--brand` #0D9488                | background #F8FAFC                 | interfaz | **3,58**  | 3,00   | ✅ icono, borde y regla de marca    |
| `--brand` #0D9488                | card #FFFFFF                       | interfaz | **3,74**  | 3,00   | ✅ icono dentro de tarjeta          |
| `--destructive` #991B1B          | background #F8FAFC                 | texto    | **7,94**  | 4,50   | ✅ error de formulario              |
| `--destructive` #991B1B          | card #FFFFFF                       | texto    | **8,31**  | 4,50   | ✅ error dentro de tarjeta          |
| `--destructive` #991B1B          | destructive/10 sobre fondo #EFE4E6 | texto    | **6,67**  | 4,50   | ✅ botón destructivo                |
| `--destructive` #991B1B          | destructive/20 sobre fondo #E5CDCF | texto    | **5,54**  | 4,50   | ✅ destructivo en hover             |
| `--input` #748399                | background #F8FAFC                 | interfaz | **3,68**  | 3,00   | ✅ borde de campo, `Input`          |
| `--input` #748399                | card #FFFFFF                       | interfaz | **3,85**  | 3,00   | ✅ campo dentro de tarjeta          |
| `--ring` #0F766E                 | background #F8FAFC                 | interfaz | **5,23**  | 3,00   | ✅ indicador de foco                |
| `--ring` #0F766E                 | card #FFFFFF                       | interfaz | **5,47**  | 3,00   | ✅ foco dentro de tarjeta           |
| `--primary` #134E4A              | background #F8FAFC                 | interfaz | **9,06**  | 3,00   | ✅ `border-primary` (radio marcado) |
| `--destructive` #991B1B          | background #F8FAFC                 | interfaz | **7,94**  | 3,00   | ✅ borde de campo inválido          |

**40 pares comprobados, 40 pasan.** El más justo: `--brand` sobre background, **3,58**.

## Lo que queda justo, y por qué se acepta

**`--brand` (`#0D9488`) sobre el fondo da 3,58**, y es el par más ajustado de
los 40. Pasa el 3:1 de interfaz con margen suficiente, pero **no llega a 4,5**:
por eso el teal-600 **no aparece nunca como texto** en el sistema. Donde hay
texto teal está `--brand-strong` (`#0F766E`, 5,23) o `--primary` (`#134E4A`,
9,06). Es el reparto de papeles que describe ADR-38.

**`#F97316` no está en la tabla como primer plano de nada**, y tampoco es un
olvido: sobre blanco da **2,80** y el ratio de contraste es simétrico, así que
el naranja no vale ni como texto grande ni como elemento de interfaz **en
ningún sentido**. Solo aparece como superficie —con tinta encima, 6,37— y como
regla decorativa, que no lleva información y no le aplica 1.4.11.

## Lo que esta tabla NO acredita

- **El modo oscuro.** Todos estos ratios son contra fondo claro. El bloque
  `.dark` se ha retirado y el modo oscuro queda fuera de alcance (ADR-38); quien
  lo retome tiene que volver a pasar el comprobador con `--background` oscuro,
  no invertir la tabla.
- **Los pares que no existen todavía.** El script recorre lo que pinta la
  aplicación hoy. Una pantalla nueva con una combinación nueva hay que añadirla
  a la lista de `pairs`, y ese es el mantenimiento que pide.
