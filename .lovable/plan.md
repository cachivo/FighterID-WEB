
# Plan de Corrección: Sincronización de Récords con Ranking

## Diagnóstico Completo

### Error Crítico Identificado
La función `admin_update_fighter_profile` está fallando con el error:
```
column "discipline" of relation "fighter_rankings" does not exist
```

**Causa raíz:** La función intenta sincronizar la columna `discipline` a la tabla `fighter_rankings`, pero esa columna **no existe** en esa tabla. La tabla `fighter_rankings` solo tiene: `id`, `fighter_id`, `organization_id`, `weight_class`, `level`, `ranking_position`, `points`, `is_champion`, `is_active`, `last_fight_date`, `created_at`, `updated_at`.

### Problemas Adicionales Encontrados
1. **Trigger faltante**: No existe un trigger que recalcule los `points` en `fighter_rankings` cuando se actualizan los récords en `fighter_profiles`
2. **Bug visual** (línea 877 de FighterEditModal.tsx): El mensaje "Selecciona una disciplina" revisa `martial_arts` en lugar de `discipline`

---

## Solución Propuesta

### Fase 1: Corregir la función RPC (Crítico)

Actualizar `admin_update_fighter_profile` para:
1. **Eliminar** la sincronización de `discipline` a `fighter_rankings` (columna no existe)
2. **Agregar** sincronización de `points` basados en los récords según la disciplina de la organización

**Lógica de puntos** (según memoria del proyecto):
- Victoria: +3 puntos
- Empate: +1 punto  
- Derrota: -1 punto

```sql
-- Código corregido (extracto)
UPDATE fighter_rankings fr
SET 
  level = v_new_level,
  weight_class = v_new_weight_class,
  -- NO discipline (columna no existe)
  -- Recalcular puntos basados en récord por disciplina
  points = CASE 
    WHEN ro.discipline = 'MMA' THEN 
      (COALESCE(NEW.mma_record_wins, 0) * 3) + 
      (COALESCE(NEW.mma_record_draws, 0) * 1) - 
      (COALESCE(NEW.mma_record_losses, 0) * 1)
    WHEN ro.discipline = 'Boxeo' THEN 
      (COALESCE(NEW.boxeo_record_wins, 0) * 3) + 
      (COALESCE(NEW.boxeo_record_draws, 0) * 1) - 
      (COALESCE(NEW.boxeo_record_losses, 0) * 1)
    ELSE fr.points
  END,
  updated_at = now()
FROM ranking_organizations ro
WHERE fr.fighter_id = p_fighter_id 
  AND fr.organization_id = ro.id
  AND fr.is_active = true;
```

### Fase 2: Crear Trigger de Sincronización de Récords

Crear el trigger `sync_record_to_rankings_trigger` que:
- Se dispara cuando cambian campos `*_record_*` en `fighter_profiles`
- Recalcula automáticamente los `points` en todos los rankings activos del peleador
- Usa la disciplina de cada organización para determinar qué récord aplicar

```sql
CREATE OR REPLACE FUNCTION sync_record_to_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular puntos en todos los rankings activos
  UPDATE fighter_rankings fr
  SET points = CASE 
    WHEN ro.discipline = 'MMA' THEN 
      (COALESCE(NEW.mma_record_wins, 0) * 3) + 
      (COALESCE(NEW.mma_record_draws, 0) * 1) - 
      (COALESCE(NEW.mma_record_losses, 0) * 1)
    WHEN ro.discipline = 'Boxeo' THEN 
      (COALESCE(NEW.boxeo_record_wins, 0) * 3) + 
      (COALESCE(NEW.boxeo_record_draws, 0) * 1) - 
      (COALESCE(NEW.boxeo_record_losses, 0) * 1)
    ELSE fr.points
  END
  FROM ranking_organizations ro
  WHERE fr.fighter_id = NEW.id 
    AND fr.organization_id = ro.id
    AND fr.is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que observa cambios en récords
CREATE TRIGGER sync_record_to_rankings_trigger
AFTER UPDATE OF mma_record_wins, mma_record_losses, mma_record_draws,
               boxeo_record_wins, boxeo_record_losses, boxeo_record_draws
ON fighter_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_record_to_rankings();
```

### Fase 3: Corregir Bug Visual en FighterEditModal

**Archivo:** `src/components/admin/FighterEditModal.tsx`  
**Línea:** 877

```tsx
// ANTES (bug)
{(!formData.martial_arts || formData.martial_arts.length === 0) && (

// DESPUÉS (correcto)
{!formData.discipline && (
```

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| SQL Migration | Corregir función RPC + Crear trigger |
| `FighterEditModal.tsx` | Corregir condición línea 877 |

## Secuencia de Implementación

1. **Migración SQL** - Corregir función RPC (soluciona el error de guardado inmediatamente)
2. **Migración SQL** - Crear trigger de sincronización de puntos
3. **FighterEditModal.tsx** - Corregir condición de mensaje

## Resultado Esperado

- Los perfiles se guardarán correctamente (error de columna resuelto)
- Los récords se guardarán en `fighter_profiles`
- Los puntos se actualizarán automáticamente en `fighter_rankings` según el récord y la disciplina
- El mensaje visual mostrará correctamente cuando falta seleccionar disciplina
