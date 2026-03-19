ALTER TABLE public.ai_inference_sessions
  ADD COLUMN IF NOT EXISTS device_id text,
  ALTER COLUMN source_url SET DEFAULT 'unknown',
  ALTER COLUMN source_url DROP NOT NULL,
  ALTER COLUMN model_version SET DEFAULT 'unknown',
  ALTER COLUMN model_version DROP NOT NULL;