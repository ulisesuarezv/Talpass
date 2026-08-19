# Textos legales · verificación en producción

> **⚠️ PENDIENTE. Esta sesión no pudo desplegar.**
>
> El `vercel --prod` y las peticiones `curl` contra `https://talpass.eu` fueron
> **bloqueados por el clasificador de permisos del entorno**, no por un fallo
> del proyecto. El trabajo está terminado, verificado en local y commiteado
> (`79e6291`), pero **no está vivo**, y por tanto **el punto 3 no está cerrado**.
>
> Se deja escrito así a propósito. En este proyecto ya se marcó una fase ✅ con
> el criterio sin comprobar y hubo que revertirlo, y una auditoría encontró
> escrita la frase «Git y producción quedan sincronizados» cuando `origin` iba
> cuatro commits por detrás. No se repite.

## Lo único que sí se comprobó contra producción

Antes de escribir en la política que el tratamiento ocurre en la UE — se hizo
al principio de la sesión, cuando la petición todavía pasaba:

```
$ curl -sS -D - -o /dev/null https://talpass.eu/es/cuenta | grep -i x-vercel-id
HTTP/2 307
x-ett-session-checked: 1
x-vercel-id: fra1::dub1::bj8xs-1787151329676-50e90ab6f86f
```

**`dub1`, no `iad1`.** ADR-32 sigue vivo en producción, el control negativo de
`/es/cuenta` (307 + cabecera de sesión) está intacto, y la afirmación de la
política sobre la UE está respaldada.

## Qué hay que ejecutar para cerrar el punto 3

```bash
vercel --prod
vercel inspect talpass.eu          # el ID tiene que ser el del despliegue nuevo
```

**Anotar el ID del despliegue y confirmar que se mira el nuevo antes de dar por
buena una sola cabecera.**

Después, y solo después:

```bash
# 1. Las doce rutas responden 200 en los dos idiomas
for u in /es/legal /es/legal/impressum /es/legal/privacidad /es/legal/terminos \
         /es/legal/datos-y-agencias /es/legal/audio-en-ingles \
         /en/legal /en/legal/impressum /en/legal/privacy /en/legal/terms \
         /en/legal/data-and-agencies /en/legal/english-audio; do
  curl -s -o /dev/null -w "$u %{http_code}\n" https://talpass.eu$u
done

# 2. Estáticas y sin tocar la sesión.
#    OJO: en producción `x-nextjs-cache` NO existe. Next 16 sobre Vercel lo
#    expresa como `x-vercel-cache` + `x-nextjs-prerender: 1`. Razonado en
#    docs/evidencia/correccion-copy/02-produccion.md; no se redescubre.
curl -sI https://talpass.eu/es/legal/impressum | grep -iE 'x-vercel-cache|x-nextjs-prerender|x-ett-session-checked|set-cookie'

# 3. Control negativo: la ruta privada sigue como estaba
curl -sI https://talpass.eu/es/cuenta | grep -iE 'HTTP|x-ett-session-checked'

# 4. El sitemap: hoy son 7 URLs, tienen que quedar 13
curl -s https://talpass.eu/sitemap.xml | grep -c "<url>"
curl -s https://talpass.eu/sitemap.xml | grep -oE '<loc>[^<]*legal[^<]*</loc>'

# 5. El Impressum se lee sin ejecutar JavaScript, con los cuatro campos
curl -s https://talpass.eu/es/legal/impressum \
  | grep -oE 'José Ulises Suárez Victoria|Theodor-Heuss-Straße 16|37075|Göttingen|kayaosv@gmail.com'

# 6. ADR-30 sigue intacto
curl -s https://talpass.eu/es/oportunidades | grep -ci "JobPosting"   # 0
```

## Tabla que queda por rellenar

| Comprobación                        | Esperado                                              | Resultado |
| ----------------------------------- | ----------------------------------------------------- | --------- |
| ID del despliegue                   | el nuevo, confirmado con `vercel inspect`             | ⬜        |
| 12 rutas legales, `es` y `en`       | 200                                                   | ⬜        |
| Cabeceras de una ruta legal         | `x-vercel-cache` cacheado + `x-nextjs-prerender: 1`   | ⬜        |
| Cabeceras de una ruta legal         | **sin** `x-ett-session-checked`, **sin** `Set-Cookie` | ⬜        |
| Control negativo `/es/cuenta`       | 307 **con** `x-ett-session-checked: 1`                | ⬜        |
| `/sitemap.xml`                      | 13 URLs (hoy 7)                                       | ⬜        |
| Impressum sin JavaScript            | nombre + calle + CP + ciudad + correo                 | ⬜        |
| `JobPosting` en `/es/oportunidades` | 0                                                     | ⬜        |
