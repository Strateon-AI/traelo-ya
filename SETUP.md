# Tráelo Ya — estado del proyecto

## Decisión de arquitectura (confirmada con Yssa)
Sitio 100% estático. Se sacaron:
- El rastreo automático de pedidos (input + timeline) → ahora deriva a
  WhatsApp (`TrackingSection.tsx`, `lib/whatsapp.ts` → `orderStatusUrl`).
  La lógica de demo del timeline queda sin usar en `lib/tracking.ts` por si
  se retoma más adelante.
- El panel `/admin` y la API `/api/site-config` → no se justifican para un
  catálogo de 7 categorías que casi no cambia. Se sacaron `app/admin/`,
  `app/api/` y `lib/store.ts` enteros.

`next.config.ts` tiene `output: "export"`. `npm run build` genera la carpeta
`out/` — eso es lo que hay que subir al servidor, no el proyecto de Next
corriendo. `npm run lint` y `npm run build` pasan limpios.

## Cómo se edita el catálogo ahora
Todo vive en `data/default-site-config.ts` (nombre, precio de envío
referencial, foto, si aparece en el cotizador y/o en precios
referenciales). Cambiar algo ahí + `npm run build` + redesplegar `out/`.
No hay login ni edición en vivo desde el navegador.

## Cómo levantarlo en desarrollo
```
npm install
npm run dev        # http://localhost:3000
```

## Cómo generar el build para el servidor
```
npm run build       # genera out/
```
`out/` es una carpeta de HTML/CSS/JS/imágenes sin nada de Node — es lo que
va a `~/apps/<nombre-sitio>/public` en strateon-assistant-prod, siguiendo
el runbook de sitio estático (Caddy + file_server, sin contenedor).

## Pendiente antes de tocar el servidor
1. **Dominio**: sigue sin respuesta si Jeffer ya tiene uno o si arrancamos
   con un subdominio tipo `traeloya.strateonai.com` mientras tanto. El
   runbook del servidor exige que el DNS ya resuelva antes de tocar el
   Caddyfile — es el primer bloqueante real.
2. Comparar cada sección contra `Traelo_YA.png` en desktop y 390px y
   ajustar spacing/tamaños donde no calce (el hero ya está revisado, el
   resto no).
3. Fondo del hero, cajas y fotos de producto son placeholders marcados en
   el código — reemplazar con fotos reales.
4. Instagram/Facebook/TikTok del footer apuntan a "#" — faltan las URLs
   reales.
