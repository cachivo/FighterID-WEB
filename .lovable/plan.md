

# Plan: Corregir Récords Desactualizados en Rankings

## Problema Detectado

El componente `Ranking.tsx` muestra récords incorrectos porque:

1. **Boxeadores**: Los campos `boxeo_record_*` están en `0-0-0` pero los datos reales están en `record_wins/losses/draws`
2. **Algunos MMA**: Desincronización entre campos específicos y legacy
3. **No hay fallback**: A diferencia de `FighterCard.tsx`, el ranking no usa campos legacy como respaldo

### Datos de Ejemplo

| Peleador | Disciplina | boxeo_record | record (legacy) | Muestra |
|----------|------------|--------------|-----------------|---------|
| Kevin Calona | Boxeo | 0-0-0 | 6-3-0 | 0-0-0 (incorrecto) |
| Aaron Irias | Boxeo | 0-0-0 | 3-1-0 | 0-0-0 (incorrecto) |
| Willis Yang | Boxeo | 0-0-0 | 1-1-1 | 0-0-0 (incorrecto) |

---

## Solucion en 2 Fases

### Fase 1: Correccion Inmediata en Codigo

**Archivo:** `src/hooks/useOrganizationRanking.tsx`

Agregar campos legacy al query de Supabase para tener fallback:

```tsx
// Agregar a la consulta fighter_profiles
fighter_profiles!inner (
  first_name,
  last_name,
  nickname,
  avatar_url,
  country,
  mma_record_wins,
  mma_record_losses,
  mma_record_draws,
  boxeo_record_wins,
  boxeo_record_losses,
  boxeo_record_draws,
  record_wins,      // NUEVO - legacy fallback
  record_losses,    // NUEVO
  record_draws      // NUEVO
)
```

**Archivo:** `src/components/sections/Ranking.tsx`

Implementar logica de fallback inteligente (mismo patron que FighterCard.tsx):

```tsx
// Lineas 188-197 - Logica actual SIN fallback
const wins = rankingData?.discipline === 'MMA' 
  ? ranking.fighter.mma_record_wins 
  : ranking.fighter.boxeo_record_wins;

// NUEVA LOGICA con fallback
const getRecordWithFallback = (ranking, discipline) => {
  if (discipline === 'MMA') {
    const mmaWins = ranking.fighter.mma_record_wins || 0;
    const mmaLosses = ranking.fighter.mma_record_losses || 0;
    const mmaDraws = ranking.fighter.mma_record_draws || 0;
    // Si MMA record esta vacio, usar legacy
    if (mmaWins === 0 && mmaLosses === 0 && mmaDraws === 0) {
      return {
        wins: ranking.fighter.record_wins || 0,
        losses: ranking.fighter.record_losses || 0,
        draws: ranking.fighter.record_draws || 0
      };
    }
    return { wins: mmaWins, losses: mmaLosses, draws: mmaDraws };
  } else {
    // Boxeo
    const boxWins = ranking.fighter.boxeo_record_wins || 0;
    const boxLosses = ranking.fighter.boxeo_record_losses || 0;
    const boxDraws = ranking.fighter.boxeo_record_draws || 0;
    // Si Boxeo record esta vacio, usar legacy
    if (boxWins === 0 && boxLosses === 0 && boxDraws === 0) {
      return {
        wins: ranking.fighter.record_wins || 0,
        losses: ranking.fighter.record_losses || 0,
        draws: ranking.fighter.record_draws || 0
      };
    }
    return { wins: boxWins, losses: boxLosses, draws: boxDraws };
  }
};
```

---

### Fase 2: Migracion de Datos (Recomendada)

Normalizar la base de datos para que los campos especificos contengan los datos correctos:

```sql
-- Migrar records de boxeadores a campos especificos
UPDATE fighter_profiles
SET 
  boxeo_record_wins = COALESCE(record_wins, 0),
  boxeo_record_losses = COALESCE(record_losses, 0),
  boxeo_record_draws = COALESCE(record_draws, 0)
WHERE discipline = 'Boxeo'
  AND (boxeo_record_wins IS NULL OR boxeo_record_wins = 0)
  AND (record_wins > 0 OR record_losses > 0 OR record_draws > 0);
```

Esta migracion es opcional si se implementa el fallback en codigo.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useOrganizationRanking.tsx` | Agregar campos legacy al query + interface |
| `src/components/sections/Ranking.tsx` | Implementar logica de fallback |

---

## Cambios Tecnicos Detallados

### useOrganizationRanking.tsx

**1. Actualizar interface RankingEntry (lineas 4-19):**
```tsx
export interface RankingEntry {
  // ... campos existentes ...
  fighter: {
    // ... campos existentes ...
    // Agregar campos legacy:
    record_wins: number | null;
    record_losses: number | null;
    record_draws: number | null;
  };
}
```

**2. Actualizar query SQL (lineas 71-83):**
Agregar `record_wins`, `record_losses`, `record_draws` a la seleccion de fighter_profiles.

**3. Actualizar transformacion de datos (lineas 124-136):**
Mapear los nuevos campos legacy en el objeto fighter.

### Ranking.tsx

**1. Crear helper function (antes de linea 184):**
```tsx
const getRecordWithFallback = (fighter: RankingEntry['fighter'], discipline: 'MMA' | 'Boxeo') => {
  if (discipline === 'MMA') {
    const hasSpecificRecord = (fighter.mma_record_wins || 0) + (fighter.mma_record_losses || 0) + (fighter.mma_record_draws || 0) > 0;
    if (hasSpecificRecord) {
      return { wins: fighter.mma_record_wins || 0, losses: fighter.mma_record_losses || 0, draws: fighter.mma_record_draws || 0 };
    }
  } else {
    const hasSpecificRecord = (fighter.boxeo_record_wins || 0) + (fighter.boxeo_record_losses || 0) + (fighter.boxeo_record_draws || 0) > 0;
    if (hasSpecificRecord) {
      return { wins: fighter.boxeo_record_wins || 0, losses: fighter.boxeo_record_losses || 0, draws: fighter.boxeo_record_draws || 0 };
    }
  }
  // Fallback a legacy
  return { wins: fighter.record_wins || 0, losses: fighter.record_losses || 0, draws: fighter.record_draws || 0 };
};
```

**2. Reemplazar logica actual (lineas 188-197):**
```tsx
const record = getRecordWithFallback(ranking.fighter, rankingData?.discipline || 'MMA');
const { wins, losses, draws } = record;
```

---

## Resultado Esperado

### Antes (Actual)
| Peleador | Muestra |
|----------|---------|
| Kevin Calona (Boxeo) | 0-0-0 |
| Aaron Irias (Boxeo) | 0-0-0 |

### Despues (Corregido)
| Peleador | Muestra |
|----------|---------|
| Kevin Calona (Boxeo) | 6-3-0 |
| Aaron Irias (Boxeo) | 3-1-0 |

---

## Compatibilidad Movil

- Sin cambios visuales ni de layout
- Solo logica de datos
- Mantiene todas las clases responsivas existentes

---

## Beneficios

1. **Inmediato**: Los records se muestran correctamente sin esperar migracion
2. **Robusto**: Funciona con datos parcialmente migrados
3. **Consistente**: Misma logica que FighterCard.tsx
4. **Sin riesgo**: No modifica datos existentes en BD

