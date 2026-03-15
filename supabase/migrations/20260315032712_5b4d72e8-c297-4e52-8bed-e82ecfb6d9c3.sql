
-- 1. Tabla ai_fight_results para stats finales del motor de visión
CREATE TABLE IF NOT EXISTS public.ai_fight_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.fights(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL,
  fighter_a_stats JSONB NOT NULL DEFAULT '{}',
  fighter_b_stats JSONB NOT NULL DEFAULT '{}',
  total_events INT NOT NULL DEFAULT 0,
  duration_seconds NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fight_id)
);

-- 2. Agregar columna ai_result a fights
ALTER TABLE public.fights ADD COLUMN IF NOT EXISTS ai_result JSONB;

-- 3. RLS: lectura pública, escritura solo service_role
ALTER TABLE public.ai_fight_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ai_fight_results"
  ON public.ai_fight_results FOR SELECT
  USING (true);

-- 4. Índice para búsqueda por fight_id
CREATE INDEX IF NOT EXISTS idx_ai_fight_results_fight_id ON public.ai_fight_results(fight_id);
