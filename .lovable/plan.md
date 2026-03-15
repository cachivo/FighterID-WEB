

# Add Missing Columns to `fighter_profiles` and `fight_telemetry_events`

## Problem
The AI vision engine tries to insert data with columns (`name`, `body_hit`, `face_hit`, `speed_ms`, `extension_m`, `elbow_angle`, `model_version`) that don't exist yet, causing DB insert errors.

## Change
One migration adding all missing columns:

```sql
ALTER TABLE fighter_profiles
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE fight_telemetry_events
  ADD COLUMN IF NOT EXISTS body_hit boolean,
  ADD COLUMN IF NOT EXISTS face_hit boolean,
  ADD COLUMN IF NOT EXISTS speed_ms numeric,
  ADD COLUMN IF NOT EXISTS extension_m numeric,
  ADD COLUMN IF NOT EXISTS elbow_angle numeric,
  ADD COLUMN IF NOT EXISTS model_version text;
```

No code changes needed — these are purely schema additions with nullable defaults.

