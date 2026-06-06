## Goal
Resolver el "Failed to fetch" al iniciar sesión en `fighter-id.org/auth`, que casi siempre lo causa un Service Worker viejo cacheado o una extensión bloqueando Supabase.

## Plan

1. **Forzar actualización del Service Worker**
   - Subir la versión del SW de `v10` a `v11` en `public/sw.js` para invalidar caches previos.
   - En el registro del SW (`src/main.tsx`), llamar a `registration.update()` al cargar y enviar `SKIP_WAITING` cuando haya una versión nueva, recargando una sola vez.

2. **Mensaje de error más claro en login**
   - En `useAuth.signIn`, detectar específicamente `TypeError: Failed to fetch` y devolver un mensaje guiado: "No pudimos conectar con el servidor. Desactiva bloqueadores/extensiones o intenta en modo incógnito."

3. **Botón de auto-reparación en la pantalla `/auth`**
   - Si el login falla por red, mostrar un botón "Limpiar caché y reintentar" que: desregistre todos los Service Workers, borre `caches`, y recargue la página. Esto soluciona el caso clásico de SW corrupto sin pedirle al usuario que entre a DevTools.

## Technical details
- `public/sw.js`: bump de versión.
- `src/main.tsx`: añadir lógica de update + skipWaiting + reload controlado.
- `src/hooks/useAuth.tsx`: nuevo `errorCode: 'network'` con mensaje específico.
- `src/pages/Auth.tsx`: estado local para detectar error de red y renderizar el botón de auto-reparación.