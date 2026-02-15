
# Mejoras al Flujo de Recuperacion de Contrasena

## Problema
1. La opcion "Olvidaste tu contrasena?" solo es visible en el paso de login. Si el usuario no llega a ese paso (por ejemplo, si la verificacion de email falla o usa un email incorrecto), nunca ve la opcion de recuperacion.
2. Las paginas de "Recuperar Contrasena" (`/auth/forgot-password`) y "Nueva Contrasena" (`/auth/reset-password`) no tienen el logo de Fighter ID, rompiendo la consistencia visual.

## Cambios Propuestos

### 1. Agregar enlace de recuperacion al paso de Email (paso 1)
En `src/pages/Auth.tsx`, agregar un enlace discreto debajo del boton "Continuar" en el paso de email:
- Texto: "Olvidaste tu contrasena?" con icono `HelpCircle`
- Enlace directo a `/auth/forgot-password`
- Estilo sutil (`text-sm text-muted-foreground`) para no distraer del flujo principal

### 2. Agregar logo de Fighter ID a ForgotPassword
En `src/pages/auth/ForgotPassword.tsx`:
- Importar `fighterIdLogo from '@/assets/fighter-id-logo-auth.png'`
- Agregar `<img>` centrado en el `CardHeader` antes del titulo "Recuperar Contrasena"

### 3. Agregar logo de Fighter ID a ResetPassword
En `src/pages/auth/ResetPassword.tsx`:
- Importar `fighterIdLogo from '@/assets/fighter-id-logo-auth.png'`
- Agregar `<img>` centrado en el `CardHeader` antes del titulo "Nueva Contrasena"
- Tambien agregar el logo en la pantalla de "Verificando enlace..." (estado de carga)

## Resultado Visual Esperado

### Paso de Email (Auth.tsx)
```text
+------------------------------------------+
|          [FIGHTER ID LOGO]               |
|       Acceso a Fighter ID               |
|   Ingresa tu email para continuar        |
|                                          |
|  Email: [________________]               |
|  [       Continuar       ]               |
|                                          |
|  ? Olvidaste tu contrasena?              |
+------------------------------------------+
```

### Pagina Forgot Password
```text
+------------------------------------------+
|          [FIGHTER ID LOGO]               |
|       Recuperar Contrasena               |
|  Ingresa tu email y te enviaremos un     |
|  enlace para restablecer tu contrasena   |
|                                          |
|  Email: [________________]               |
|  [  Enviar enlace de recuperacion  ]     |
|                                          |
|  <- Volver al inicio de sesion           |
+------------------------------------------+
```

## Seccion Tecnica

### Archivo: `src/pages/Auth.tsx`
- En el paso `email` (despues del boton "Continuar", alrededor de la linea 251), agregar un `Button variant="link"` con enlace a `/auth/forgot-password`

### Archivo: `src/pages/auth/ForgotPassword.tsx`
- Importar el logo: `import fighterIdLogo from '@/assets/fighter-id-logo-auth.png'`
- En el `CardHeader` (linea 97-101), agregar `<img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mx-auto mb-2" />` antes del `CardTitle`

### Archivo: `src/pages/auth/ResetPassword.tsx`
- Importar el logo: `import fighterIdLogo from '@/assets/fighter-id-logo-auth.png'`
- En el `CardHeader` (linea 156-160), agregar la misma imagen del logo
- En el estado de carga/verificacion (linea 141-150), agregar el logo tambien
