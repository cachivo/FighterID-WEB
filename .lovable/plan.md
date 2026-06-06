Do I know what the issue is? Sí: el login no está fallando por una credencial o tabla de Supabase en el código actual. En la prueba directa sobre `https://fighter-id.org/auth`, Supabase respondió correctamente al endpoint `/auth/v1/token` con un error normal de credenciales inválidas, no con `Failed to fetch`. Eso significa que el navegador sí puede llegar a Supabase desde el dominio publicado. El fallo persistente viene de uno de estos dos escenarios: el preview/editor de Lovable interceptando fetches, o un Service Worker/cache/navegador/red del usuario bloqueando `*.supabase.co`.

Plan de corrección:

1. Separar claramente login y creación de cuenta
   - Quitar la dependencia del flujo automático como camino principal.
   - Dejar dos acciones explícitas: `Iniciar sesión` y `Crear cuenta`.
   - Evitar que un fallo de detección de email mande al usuario al flujo equivocado.

2. Desactivar el Service Worker de app-shell para auth
   - Reemplazar el `public/sw.js` actual por un Service Worker tipo kill-switch que limpie solo caches de Fighter ID y se desregistre.
   - Esto elimina una fuente persistente de errores de red en navegadores que ya instalaron una versión vieja.
   - Mantener manifest/iconos, pero quitar el cache offline que puede interferir con auth.

3. Blindar el registro del Service Worker
   - En `src/main.tsx`, no registrar SW en preview, iframe, Lovable dev domains, ni `/auth`.
   - Si existe un SW viejo en esos contextos, desregistrarlo automáticamente.

4. Mejorar el mensaje de error real en login
   - Si Supabase devuelve `invalid_credentials`, mostrar credenciales incorrectas.
   - Si hay `Failed to fetch`, mostrar una pantalla/alerta más directa: “Prueba en fighter-id.org, no en preview; limpia caché si estás en el dominio publicado”.
   - Mantener el botón de limpiar caché, pero sin borrar caches de terceros indiscriminadamente.

5. Validación después del cambio
   - Probar `/auth` en `fighter-id.org` con una credencial falsa: debe responder `Credenciales incorrectas`, no quedarse cargando.
   - Probar que el preview no registre Service Worker.
   - Confirmar que el login ya no mezcla cuenta nueva con cuenta existente desde la UI.

Archivos a tocar:
- `public/sw.js`
- `src/main.tsx`
- `src/pages/Auth.tsx`
- `src/hooks/useAuth.tsx`