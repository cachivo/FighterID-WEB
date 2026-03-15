ALTER TABLE fighter_profiles
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE fight_telemetry_events
  ADD COLUMN IF NOT EXISTS body_hit boolean,
  ADD COLUMN IF NOT EXISTS face_hit boolean,
  ADD COLUMN IF NOT EXISTS speed_ms numeric,
  ADD COLUMN IF NOT EXISTS extension_m numeric,
  ADD COLUMN IF NOT EXISTS elbow_angle numeric,
  ADD COLUMN IF NOT EXISTS model_version text;