## Hallazgos

- Probé `cachivo@gmail.com` con la contraseña indicada en el preview: Supabase respondió `200` y la app entró correctamente a la home.
- Los logs de Auth confirman login exitoso para ese usuario; por tanto, ese intento no está fallando en Supabase.
- El texto crudo `Failed to fetch` todavía puede aparecer desde un flujo secundario: `resendConfirmation` devuelve el error crudo si falla la red, y la UI lo muestra directamente en un toast.
- También conviene endurecer `signUp` y los botones de limpieza de caché para que ningún flujo de auth vuelva a mostrar errores nativos del navegador.

## Plan de implementación

1. Normalizar errores de red de auth
   - Crear un helper pequeño en `useAuth.tsx` para detectar `Failed to fetch`, `Load failed`, `NetworkError`, `TypeError` y timeouts.
   - Reutilizarlo en `signIn`, `signUp`, `resetPassword` y `resendConfirmation`.

2. Corregir el origen más probable del popup crudo
   - Cambiar `resendConfirmation` para que nunca retorne el `Error` original del navegador.
   - Mostrar un mensaje en español, con variante específica para Lovable preview cuando aplique.

3. Ajustar la UI del error de red
   - Hacer que el bloque `networkError` muestre el mismo mensaje real devuelto por `signIn`, no una copia genérica distinta.
   - Cambiar “Limpiar caché y reintentar” para borrar solo caches `fighter-id-*`, no todos los caches del navegador.

4. Validación
   - Verificar en preview que el login con `cachivo@gmail.com` sigue llegando a Supabase y no muestra popup de error.
   - Revisar logs/red tras la prueba: si Supabase recibe `200`, queda confirmado que el backend y credenciales funcionan.

## Nota importante

Si el usuario ve `Failed to fetch` solo dentro del editor/preview pero no en `fighter-id.org`, es un bloqueo del sandbox/preview o del navegador, no un problema de credenciales ni de Supabase.