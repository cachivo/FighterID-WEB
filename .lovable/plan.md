
# Plan: Estabilización del Sistema y Unificación de Idioma

## Problemas Identificados

### 1. VIOLACIÓN CRÍTICA: Win Rate/Porcentaje de Victorias en el Código

El sistema muestra **win rate** y **porcentaje de victorias** en múltiples lugares, lo cual viola las reglas del sistema de ranking que establecen claramente:

> ⚠️ "No hay win rate. No hay porcentaje de victorias. Rankings son 100% basados en puntos."

**Archivos afectados:**

| Archivo | Problema |
|---------|----------|
| `src/pages/FighterProfile.tsx` | Muestra `{winPercentage}% Victorias` (líneas 199, 379) |
| `src/hooks/useFighterHistory.tsx` | Calcula `winPercentage` (línea 71) |
| `src/hooks/useCombinedFighterRecord.tsx` | Retorna `winPercentage` (línea 65) |
| `src/components/FighterMiniature.tsx` | Muestra "Efectividad: X%" (líneas 128-134) |
| `src/components/EnhancedFighterID.tsx` | Muestra `{winPercentage}% Victorias` (línea 165) |
| `src/components/AdminAnalytics.tsx` | Muestra "X% win rate" (línea 304) |
| `src/pages/social/UserProfile.tsx` | Etiqueta "Win Rate" (línea 321) |
| `src/components/admin/AIAssistant/ChatWidget.tsx` | Muestra "Win Rate" (línea 133) |

---

### 2. Textos en Inglés que Requieren Traducción

**Términos encontrados:**

| Inglés | Español Correcto |
|--------|------------------|
| "Win Rate" | Eliminar (no usar porcentajes) |
| "Stance" | "Guardia" |
| "Fighters" | "Peleadores" |
| "Loading..." | "Cargando..." |
| "Error" | "Error" (correcto) |
| "Success" | "Éxito" |
| "Failed" | "Falló" |
| "Please" | "Por favor" |

---

### 3. Problemas de Estabilidad Potenciales

**A. Errores asíncronos no manejados**

El `App.tsx` no tiene un manejador global de promesas rechazadas, lo que puede causar pantallas blancas:

```typescript
// FALTA en App.tsx
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    console.error("Error no manejado:", event.reason);
    toast.error("Ocurrió un error. Intenta nuevamente.");
    event.preventDefault();
  };
  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);
```

**B. Timeout de 8 segundos puede ser insuficiente**

En conexiones lentas, el timeout de 8s en `useLicenseAuth.tsx` puede cortar la carga prematuramente.

---

## Solución Propuesta

### Fase 1: Eliminar Win Rate/Porcentajes (CRÍTICO)

**1.1 Modificar `src/pages/FighterProfile.tsx`**

Reemplazar:
```tsx
// ANTES (INCORRECTO)
<Trophy className="h-4 w-4 text-green-600" />
{winPercentage}% Victorias
```

Por:
```tsx
// DESPUÉS (CORRECTO)
<Trophy className="h-4 w-4 text-green-600" />
{currentRecord.wins} Victoria{currentRecord.wins !== 1 ? 's' : ''}
```

**1.2 Modificar `src/components/FighterMiniature.tsx`**

Eliminar la barra de progreso de "Efectividad" y reemplazar con conteo de peleas:
```tsx
// ANTES
<span>Efectividad:</span>
<span>{winPercentage}%</span>

// DESPUÉS
<span>Peleas Totales:</span>
<span>{totalFights}</span>
```

**1.3 Modificar `src/components/EnhancedFighterID.tsx`**

Cambiar porcentaje por texto de victorias:
```tsx
// ANTES
{calculateRecord(recordType).winPercentage}% Victorias

// DESPUÉS
{calculateRecord(recordType).wins} Victoria{calculateRecord(recordType).wins !== 1 ? 's' : ''} Registradas
```

**1.4 Modificar `src/pages/social/UserProfile.tsx`**

Cambiar label de "Win Rate":
```tsx
// ANTES
<div>Win Rate</div>

// DESPUÉS  
<div>Victorias</div>
```

**1.5 Actualizar hooks para no calcular porcentajes**

En `useFighterHistory.tsx` y `useCombinedFighterRecord.tsx`:
- Mantener `winPercentage` en la interfaz por compatibilidad pero documentar como deprecado
- No mostrar el valor en ninguna UI

---

### Fase 2: Unificación de Idioma a Español

**2.1 Términos a cambiar globalmente:**

```typescript
// src/pages/FighterProfile.tsx - línea 241
{ label: 'Stance', value: ... }  →  { label: 'Guardia', value: ... }

// src/pages/FighterProfile.tsx - línea 69
Volver a Fighters  →  Volver a Peleadores

// Múltiples archivos - toasts
title: "Error"  →  title: "Error" (ya correcto)
title: "Success"  →  title: "Éxito"
```

**2.2 Buscar y reemplazar sistemáticamente:**

| Patrón | Reemplazo |
|--------|-----------|
| `"Fighters"` (como label) | `"Peleadores"` |
| `"Stance"` | `"Guardia"` |
| `"Win Rate"` | Eliminar o `"Victorias"` |
| `"Loading"` | `"Cargando"` |

---

### Fase 3: Mejoras de Estabilidad

**3.1 Agregar manejador global de errores en `App.tsx`:**

```typescript
const App = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GLOBAL ERROR]', event.reason);
      event.preventDefault();
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return (
    // ... resto del código
  );
};
```

**3.2 Aumentar timeout en `useLicenseAuth.tsx` para conexiones lentas:**

```typescript
// De 8s a 12s con mensaje de progreso
const backupTimeout = setTimeout(() => {
  if (mounted) {
    console.warn('[TIMEOUT] Backup timeout triggered');
    setLoadingMessage('La carga está tardando más de lo esperado...');
    setLoading(false);
  }
}, 12000);
```

**3.3 Agregar try-catch defensivo en componentes de perfil:**

```typescript
// En getUserFighterProfile
try {
  const profile = await getUserFighterProfile();
  if (profile) {
    setProfile(profile);
  }
} catch (error) {
  console.error('Error cargando perfil:', error);
  toast({ 
    title: "Error", 
    description: "No se pudo cargar el perfil. Intenta refrescar la página.",
    variant: "destructive"
  });
}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/FighterProfile.tsx` | Eliminar winPercentage, traducir "Stance" → "Guardia", "Fighters" → "Peleadores" |
| `src/components/FighterMiniature.tsx` | Eliminar barra de efectividad, mostrar peleas totales |
| `src/components/EnhancedFighterID.tsx` | Eliminar porcentaje de victorias |
| `src/pages/social/UserProfile.tsx` | Cambiar "Win Rate" → "Victorias" |
| `src/components/admin/AIAssistant/ChatWidget.tsx` | Cambiar "Win Rate" → "Récord" |
| `src/components/AdminAnalytics.tsx` | Eliminar cálculo de win rate |
| `src/App.tsx` | Agregar manejador global de errores |
| `src/hooks/useLicenseAuth.tsx` | Aumentar timeout, mejorar mensajes |

---

## Resultado Esperado

1. **Sin porcentajes de victoria** en ninguna parte de la UI
2. **Idioma 100% español** en toda la aplicación
3. **Mayor estabilidad** con manejo de errores robusto
4. **Mejor UX** en conexiones lentas con mensajes de progreso

---

## Métricas de Éxito

| Métrica | Antes | Después |
|---------|-------|---------|
| Instancias de "win rate" | 9+ archivos | ✅ 0 |
| Textos en inglés visibles | Múltiples | ✅ Traducidos |
| Crashes reportados | Variable | ✅ Global error handler agregado |
| Timeout para carga | 8s | ✅ 12s |

---

## ✅ COMPLETADO (2024-02-05)

Cambios implementados:
- `FighterProfile.tsx`: Eliminado winPercentage, "Stance" → "Guardia", "Fighters" → "Peleadores"
- `FighterMiniature.tsx`: Eliminada barra de efectividad, ahora muestra peleas totales
- `EnhancedFighterID.tsx`: Eliminado porcentaje de victorias
- `UserProfile.tsx` (social): "Win Rate" → "Peleas"
- `ChatWidget.tsx`: "Win Rate" → "Victorias Promedio"
- `AdminAnalytics.tsx`: Eliminado cálculo de win rate
- `App.tsx`: Agregado manejador global de errores
- `useLicenseAuth.tsx`: Timeout aumentado de 8s a 12s
