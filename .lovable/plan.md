

# Mejoras Nivel Producción — Vision Engine Sync

## Cambios

### 1. Migration SQL — UNIQUE constraint + device_id en select

```sql
-- Unique per fight+device to prevent collisions with 2 motors
CREATE UNIQUE INDEX IF NOT EXISTS idx_telemetry_fight_device 
  ON public.fight_telemetry_sessions (fight_id, device_id);

-- Drop old fight_id-only unique if exists (currently used by upsert onConflict)
-- The upsert will now use (fight_id, device_id) as conflict target
```

This solves the "2 motors same fight_id overwrite each other" problem.

### 2. Edge Function `ai-strike-ingest` — v3.2

- **`/heartbeat`**: Accept optional `fps`, `persons`, `latency_ms` metrics. Store in `fight_telemetry_sessions.metadata` JSONB field (or dedicated columns if migration adds them). Change upsert `onConflict` from `fight_id` to `fight_id, device_id`.
- **`/start`**: Same `onConflict` fix to `fight_id, device_id`.
- **`/health`**: Version bump to `3.2`.
- No backoff logic needed server-side — that's a motor (Python) responsibility.

### 3. Frontend hook `useVisionEngineStatus` — Metrics + robust threshold

- Add `fps` and `personsDetected` to the returned interface (read from session metadata via Realtime).
- Select `device_id` in the initial fetch query (currently missing from `.select()`).
- Threshold is already `10_000ms` which equals ~3× the 3s heartbeat interval — this is correct. No change needed, just confirming.

### 4. Component `VisionEngineIndicator` — Show metrics

- Display `device_id` when live (e.g., "Motor AI · PC-GYM-01_a3f9c2").
- Show FPS and persons detected when available from the hook.

## Files affected

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Add UNIQUE(fight_id, device_id), add `metadata` jsonb if missing |
| `supabase/functions/ai-strike-ingest/index.ts` | Fix onConflict, accept metrics in /heartbeat, v3.2 |
| `src/hooks/useVisionEngineStatus.ts` | Add device_id to select, return fps/persons from metadata |
| `src/components/VisionEngineIndicator.tsx` | Show device_id, FPS, persons count |

