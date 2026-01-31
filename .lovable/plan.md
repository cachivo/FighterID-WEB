
# Plan: Actualizar Página de Inicio de Sesión

## Cambios Requeridos

### 1. Actualizar Textos de la Página Auth

**Archivo:** `src/pages/Auth.tsx`

| Línea | Actual | Nuevo |
|-------|--------|-------|
| 278 | "Acceso a Batalla" | "Acceso a Fighter ID" |
| 279-281 | "Inicia sesión o regístrate para acceder a la plataforma" | "Inicia sesión o regístrate para acceder a tu perfil de peleador" |

### 2. Verificar Redirección Post-Confirmación

El código actual en `useAuth.tsx` ya configura:
```typescript
const redirectUrl = `${window.location.origin}/auth`;
```

Esto significa que después de confirmar el email, el usuario debería ser redirigido a `/auth`. Sin embargo, la URL completa de Supabase incluye parámetros adicionales.

**Verificación necesaria:** Confirmar que en Supabase Dashboard > Authentication > URL Configuration:
- Site URL esté configurado correctamente
- Redirect URLs incluya la URL del proyecto

### 3. Agregar Indicador Visual Post-Confirmación (Opcional)

Cuando el usuario llega a `/auth` desde la confirmación de email, podríamos mostrar un mensaje de bienvenida. El parámetro `type=signup` o similar viene en la URL después de confirmar.

**Cambio propuesto en `Auth.tsx`:**
- Detectar si el usuario viene de una confirmación de email
- Mostrar toast de "Email confirmado exitosamente"
- Pre-seleccionar la pestaña de "Iniciar Sesión"

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/Auth.tsx` | Cambiar título a "Acceso a Fighter ID" |
| `src/pages/Auth.tsx` | Actualizar descripción |
| `src/pages/Auth.tsx` | Detectar confirmación de email y mostrar mensaje |

## Sección Técnica

### Detección de Confirmación de Email

Supabase redirige con parámetros como `?type=signup` o incluye hash con tokens. Podemos detectar esto:

```typescript
useEffect(() => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const type = hashParams.get('type');
  
  if (type === 'signup' || type === 'email') {
    toast({
      title: '✅ Email confirmado',
      description: 'Tu cuenta ha sido verificada. Ahora puedes iniciar sesión.',
    });
    setActiveTab('signin');
  }
}, []);
```

### Configuración de Supabase Necesaria

Si la redirección no funciona, el usuario debe verificar en Supabase Dashboard:
1. **Authentication > URL Configuration**
2. **Site URL:** `https://fighterid.lovable.app` (o la URL de preview)
3. **Redirect URLs:** Agregar ambas URLs (preview y producción)
