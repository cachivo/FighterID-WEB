

# Hardening Phase — Blindaje del Sistema

## Problema

El sistema es funcional (7.5/10) pero tiene 4 vulnerabilidades criticas que pueden corromper datos en produccion.

## Cambios

### 1. Migration SQL — 3 protecciones

**A. Unique index en `fight_results(fight_id)`** -- previene doble insert que duplicaria ranking y records.

**B. Idempotencia en trigger** -- `on_fight_result_inserted` debe verificar que la pelea no este ya `finished` antes de actualizar records/ranking. Si ya esta finished, skip silencioso (la pelea ya fue procesada).

**C. Normalizar status existentes** -- UPDATE en la misma migracion para estandarizar valores legacy (`ACTIVE` -> `active`, `FINISHED` -> `finished`, etc.).

### 2. Edge Function — Lifecycle estricto

**`/start`**:
- Cambiar `neq('status', 'finished')` por condicion explicita: solo permitir si status es `scheduled` o `ready`
- Usar `RETURNING` (via `.select()`) para verificar que el UPDATE realmente modifico una fila
- Si no modifico nada: devolver 409 "Fight already active or not ready"

**`/end`**:
- Antes de calcular stats, verificar que `fight.status === 'active'`
- Si no esta active: devolver 409 "Fight not active"
- Usar `upsert` con `onConflict: 'fight_id'` en `ai_fight_results` (ya lo hace) -- esto es idempotente para la tabla de AI stats
- Marcar pelea como `finished` directamente en `/end` (no depender solo del trigger de `fight_results`, ya que `/end` opera sobre `ai_fight_results` que es tabla diferente)

**Version bump**: 3.4

### 3. No se incluye

- **ENUM de status**: Requiere migracion pesada con ALTER COLUMN y cast de todos los valores legacy. Es un cambio de fase posterior, no de hardening.
- **Realtime para rankings**: Mejora UX, no de integridad. Fase posterior.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Unique index, trigger idempotente, normalizacion de status |
| `supabase/functions/ai-strike-ingest/index.ts` | `/start` estricto, `/end` con validacion, v3.4 |

