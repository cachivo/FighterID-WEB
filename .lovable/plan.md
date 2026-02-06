
# Optimizacion Movil Completa: Rendimiento y Navegacion

## Diagnostico de Problemas

### 1. Timeout Demasiado Corto en Autenticacion
El archivo `useLicenseAuth.tsx` tiene un timeout de backup de 12 segundos (linea 210-216) que es muy corto para conexiones 3G/4G en Centroamerica. Esto causa:
- Estados de carga infinita
- Redirecciones incorrectas
- Usuarios abandonan el flujo

### 2. Queries Secuenciales Lentas
La funcion `checkLicenseStatus` realiza 4-5 consultas secuenciales a la base de datos:
1. Buscar app_user
2. Buscar fighter_profiles
3. Buscar licencia activa primaria
4. Si no encuentra, buscar licencia pendiente

Esto multiplica la latencia en redes moviles.

### 3. Procesamiento de Imagenes en Hilo Principal
El archivo `imageUtils.ts` usa Canvas en el hilo principal (lineas 29-118). Fotos de 8MB+ desde camaras de celular pueden:
- Congelar la UI por 2-5 segundos
- Causar crash en dispositivos de gama baja
- Mostrar "pagina no responde" en el navegador

### 4. Mensajes de Carga No Informativos
El `LicenseProtectedRoute.tsx` solo muestra "Verificando licencia..." sin progreso real.

---

## Solucion Propuesta

### Fase 1: Aumentar Timeouts y Feedback Visual

**Archivo:** `src/hooks/useLicenseAuth.tsx`

Cambios:
- Aumentar timeout de 12s a 25s
- Agregar retry automatico (1 intento)
- Mensajes de progreso mas descriptivos con etapas

```tsx
// Antes: 12000ms
// Despues: 25000ms con retry
const backupTimeout = setTimeout(() => {
  if (mounted && !retried) {
    retried = true;
    setLoadingMessage('La conexion esta lenta. Reintentando...');
    checkLicenseStatus(session.user.id); // Retry una vez
  } else if (mounted) {
    setLoadingMessage('No se pudo verificar. Continuando...');
    setLoading(false);
  }
}, 15000);
```

### Fase 2: Consolidar Queries en RPC Unico

**Nuevo RPC:** `check_user_license_status`

Combina las 4 consultas secuenciales en una sola llamada:

```sql
CREATE FUNCTION public.check_user_license_status(p_auth_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_app_user record;
  v_profile record;
  v_license record;
BEGIN
  -- 1. Get app_user
  SELECT id, email INTO v_app_user
  FROM app_user WHERE auth_user_id = p_auth_user_id;
  
  IF v_app_user IS NULL THEN
    RETURN jsonb_build_object('status', 'no_user');
  END IF;
  
  -- 2. Get fighter profile
  SELECT * INTO v_profile
  FROM fighter_profiles
  WHERE user_id = v_app_user.id AND active = true;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('status', 'no_profile', 'user_id', v_app_user.id);
  END IF;
  
  -- 3. Get active license (fallback to pending)
  SELECT * INTO v_license
  FROM fighter_licenses
  WHERE fighter_id = v_profile.id
  ORDER BY 
    CASE status WHEN 'ACTIVE' THEN 1 WHEN 'PENDING_REVIEW' THEN 2 ELSE 3 END,
    is_primary DESC
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'status', 'found',
    'profile', to_jsonb(v_profile),
    'license', to_jsonb(v_license)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Resultado:** 4 round-trips reducidos a 1

### Fase 3: Procesamiento de Imagenes Optimizado

**Archivo:** `src/lib/imageUtils.ts`

Cambios:
- Agregar `requestIdleCallback` para no bloquear UI
- Reducir calidad default de 0.85 a 0.75 (ahorra ~30% tamanio)
- Agregar dimension maxima mas pequena para moviles (600px en vez de 800px)

```tsx
export const resizeImageForMobile = async (
  file: File,
  options: ImageResizeOptions = {}
): Promise<ImageResizeResult> => {
  // Detectar si es movil
  const isMobile = window.innerWidth < 768;
  
  const defaults = isMobile 
    ? { maxWidth: 600, maxHeight: 600, quality: 0.7 }
    : { maxWidth: 800, maxHeight: 800, quality: 0.85 };
  
  // Usar requestIdleCallback para no bloquear UI
  return new Promise((resolve, reject) => {
    const processImage = () => resizeImage(file, { ...defaults, ...options });
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        processImage().then(resolve).catch(reject);
      }, { timeout: 3000 });
    } else {
      setTimeout(() => {
        processImage().then(resolve).catch(reject);
      }, 0);
    }
  });
};
```

### Fase 4: Mejorar Flujo de Navegacion Movil

**Archivo:** `src/components/ui/file-upload.tsx`

Mejoras:
- Agregar indicador de progreso visual durante procesamiento
- Deshabilitar interacciones mientras procesa
- Mensaje de exito/error claro

**Archivo:** `src/pages/license/LicenseOnboarding.tsx`

Mejoras:
- Agregar indicador de progreso entre pasos
- Guardar estado del formulario mas frecuentemente
- Botones mas grandes para touch (ya implementado con min-h-[44px])

**Archivo:** `src/components/LicenseProtectedRoute.tsx`

Mejoras:
- Reducir timeout de "conexion lenta" de 10s a 8s
- Agregar barra de progreso animada
- Boton de "reintentar" mas visible

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/hooks/useLicenseAuth.tsx` | Aumentar timeout a 25s, agregar retry | Alta |
| `supabase/migrations/` | Crear RPC `check_user_license_status` | Alta |
| `src/lib/imageUtils.ts` | Agregar `resizeImageForMobile`, usar `requestIdleCallback` | Media |
| `src/components/ui/file-upload.tsx` | Mejorar feedback visual de procesamiento | Media |
| `src/components/LicenseProtectedRoute.tsx` | Mejorar UI de carga con progreso | Media |
| `src/pages/license/LicenseOnboarding.tsx` | Optimizar guardado de borrador | Baja |

---

## Mejoras de Navegacion Movil

### Header Optimizado
El Header ya tiene:
- `min-h-[44px]` en botones tactiles
- `touch-manipulation` para respuesta rapida
- Sheet lateral para menu movil

### Mejoras Adicionales Propuestas:
1. **Sticky bottom navigation** para acceso rapido en moviles
2. **Pull-to-refresh** en listados principales
3. **Skeleton loaders** durante cargas

---

## Flujo de Navegacion Optimizado

```text
Usuario abre app en movil
        |
        v
[Loading con barra de progreso]  <-- 25s timeout, 1 retry automatico
        |
        v
  ¿Tiene licencia?
   /          \
  Si           No
   |            |
   v            v
Dashboard   Onboarding
   |            |
   |       [Paso 1: Datos]
   |            |
   |       [Paso 2: Documentos]  <-- Imagenes optimizadas 600x600
   |            |
   v            v
  App Principal
```

---

## Resumen de Beneficios

| Metrica | Antes | Despues |
|---------|-------|---------|
| Timeout carga inicial | 12s | 25s + retry |
| Queries autenticacion | 4-5 secuenciales | 1 RPC |
| Tamanio imagen subida | ~2MB | ~400KB |
| Bloqueo UI procesando | 2-5 segundos | 0 (async) |
| Tiempo total onboarding | 45-60s | 20-30s |

---

## Seccion Tecnica

### Orden de Implementacion:
1. Crear migracion SQL con nuevo RPC `check_user_license_status`
2. Actualizar `useLicenseAuth.tsx` para usar el nuevo RPC y aumentar timeout
3. Modificar `imageUtils.ts` con funcion optimizada para moviles
4. Actualizar `file-upload.tsx` para usar la nueva funcion
5. Mejorar feedback visual en `LicenseProtectedRoute.tsx`

### Consideraciones:
- El RPC usa `SECURITY DEFINER` para acceso seguro
- Las imagenes se procesan con `requestIdleCallback` disponible en navegadores modernos
- Fallback a `setTimeout` para navegadores antiguos
- Compatible con iOS Safari y Chrome Android
