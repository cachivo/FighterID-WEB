
# Plan: Optimización del Flujo de Registro de Fighter ID

## Diagnóstico del Problema

### Flujo Actual (Problemático)
```text
Usuario se registra
       ↓
Recibe email de confirmación
       ↓
Hace clic en "Confirmar mi cuenta"
       ↓
→ Llega a la página principal (/)  ← PROBLEMA
       ↓
Se pierde buscando cómo crear su perfil
```

### Problemas Identificados

| Archivo | Línea | Problema |
|---------|-------|----------|
| `useAuth.tsx` | 120 | `redirectUrl` apunta a `/license/auth` |
| `LicenseAuth.tsx` | 84 | Redirige a `/` cuando usuario está autenticado |
| `LicenseAuth.tsx` | 186 | Después de login, redirige a `/` |
| `AuthCallback.tsx` | 115 | Post-confirmación redirige a `/` |
| `send-signup-confirmation/index.ts` | 208 | `redirectTo` default es `/license/auth` |

### Evidencia en Logs
```text
[SIGNUP] Sending confirmation email: { 
  redirectTo: "https://fighter-id.org"  ← Sin ruta específica
}
```

---

## Solución Propuesta

### Flujo Corregido
```text
Usuario se registra
       ↓
Recibe email de confirmación  
       ↓
Hace clic en "Confirmar mi cuenta"
       ↓
→ Llega DIRECTO a /license/onboarding  ← SOLUCIÓN
       ↓
Comienza a llenar su perfil inmediatamente
```

---

## Cambios Requeridos

### 1. Edge Function de Confirmación
**Archivo:** `supabase/functions/send-signup-confirmation/index.ts`

Cambiar el `redirectTo` default:
```text
ANTES:  redirectTo = ${siteBase}/license/auth
DESPUÉS: redirectTo = ${siteBase}/license/onboarding
```

### 2. Callback de Autenticación
**Archivo:** `src/pages/AuthCallback.tsx`

Agregar lógica inteligente post-confirmación:
- Si el usuario acaba de confirmar su email → `/license/onboarding`
- Si ya tiene perfil activo → `/license/dashboard`
- Si tiene licencia pendiente → `/license/pending`

### 3. Hook de Autenticación Principal
**Archivo:** `src/hooks/useAuth.tsx`

Cambiar URL de redirección para registro:
```text
ANTES:  ${origin}/license/auth
DESPUÉS: ${origin}/license/onboarding
```

### 4. Página de Login de Licencias
**Archivo:** `src/pages/license/LicenseAuth.tsx`

Implementar redirección inteligente post-login:
- Verificar estado del usuario (perfil existente, licencia, etc.)
- Redirigir al lugar apropiado según su estado

---

## Sobre la Entrega de Correos (Spam)

### Análisis de Logs
```text
[EMAIL] ✓ Email sent successfully: {
  id: "92ea52d4-a041-45a3-a421-6a59197b11df",
  to: [ "ma*******@gmail.com" ],
  attempt: 1  ← Enviado al primer intento
}
```

Los correos se están enviando correctamente desde Resend.

### Posibles Causas de Spam

1. **Configuración DNS del dominio `fighter-id.org`**
   - Verificar registros SPF, DKIM y DMARC
   - Estos registros le dicen a Gmail/Outlook que los correos son legítimos

2. **Reputación del dominio**
   - Dominio nuevo puede tener baja reputación inicial
   - Se mejora con el tiempo y uso consistente

### Mejoras Propuestas al Email

| Mejora | Descripción |
|--------|-------------|
| Header List-Unsubscribe | Ayuda a evitar filtros de spam |
| Texto plano alternativo | Algunos filtros prefieren ver ambos formatos |
| Preheader optimizado | Mejora la visibilidad en bandeja de entrada |

---

## Archivos a Modificar

1. `supabase/functions/send-signup-confirmation/index.ts`
2. `src/pages/AuthCallback.tsx`
3. `src/hooks/useAuth.tsx`
4. `src/pages/license/LicenseAuth.tsx`

---

## Resultado Esperado

Después de implementar:

- Usuario confirma email → llega directo al formulario de onboarding
- Sin pasos intermedios que confundan
- Sin necesidad de buscar botones en la página principal
- Mejor experiencia en dispositivos móviles
- Reducción de abandono en el proceso de registro

---

## Verificación DNS Recomendada

Para mejorar entrega de correos, el usuario debe verificar en su proveedor de dominio:

```text
SPF:   v=spf1 include:_spf.resend.com ~all
DKIM:  Configurado en Resend Dashboard
DMARC: v=DMARC1; p=none; rua=mailto:admin@fighter-id.org
```
