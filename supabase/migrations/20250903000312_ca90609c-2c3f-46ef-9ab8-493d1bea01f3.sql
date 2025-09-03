-- Crear tabla de combates/peleas para emparejar peleadores
CREATE TABLE public.fights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.bdg_event(id) ON DELETE CASCADE,
  fight_number INTEGER NOT NULL,
  fight_type TEXT NOT NULL DEFAULT 'AMATEUR', -- AMATEUR o PROFESSIONAL
  fighter_a_id UUID NOT NULL REFERENCES public.fighter_profiles(id),
  fighter_b_id UUID NOT NULL REFERENCES public.fighter_profiles(id),
  weight_class TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, live, finished, cancelled
  winner_id UUID REFERENCES public.fighter_profiles(id),
  finish_method TEXT, -- Decision, KO, TKO, Submission, etc.
  finish_round INTEGER,
  finish_time TEXT, -- formato MM:SS
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_fights_event_id ON public.fights(event_id);
CREATE INDEX idx_fights_fighter_a ON public.fights(fighter_a_id);
CREATE INDEX idx_fights_fighter_b ON public.fights(fighter_b_id);
CREATE INDEX idx_fights_status ON public.fights(status);

-- Habilitar RLS
ALTER TABLE public.fights ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Peleas públicas visible para todos" 
ON public.fights 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bdg_event e 
  WHERE e.id = fights.event_id 
  AND e.state IN ('live', 'finished')
));

CREATE POLICY "Event owners can manage fights" 
ON public.fights 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.bdg_event e 
  WHERE e.id = fights.event_id 
  AND e.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bdg_event e 
  WHERE e.id = fights.event_id 
  AND e.created_by = auth.uid()
));

-- Función para actualizar timestamps
CREATE TRIGGER update_fights_updated_at
BEFORE UPDATE ON public.fights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para importar peleadores masivamente
CREATE OR REPLACE FUNCTION public.import_fighter_data(
  p_first_name TEXT,
  p_last_name TEXT,
  p_nickname TEXT DEFAULT NULL,
  p_age INTEGER,
  p_birth_date DATE DEFAULT NULL,
  p_weight_lbs NUMERIC,
  p_record TEXT,
  p_height_text TEXT,
  p_academy TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'HN'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fighter_id UUID;
  v_wins INTEGER := 0;
  v_losses INTEGER := 0;
  v_draws INTEGER := 0;
  v_weight_kg NUMERIC;
  v_height_cm INTEGER;
  v_weight_class TEXT;
  v_elo_rating INTEGER := 1200;
BEGIN
  -- Parsear record (format: "W-L-D" o "DEBUT")
  IF p_record = 'DEBUT' THEN
    v_wins := 0;
    v_losses := 0;
    v_draws := 0;
  ELSE
    v_wins := COALESCE((string_to_array(p_record, '-'))[1]::INTEGER, 0);
    v_losses := COALESCE((string_to_array(p_record, '-'))[2]::INTEGER, 0);
    v_draws := COALESCE((string_to_array(p_record, '-'))[3]::INTEGER, 0);
  END IF;

  -- Convertir peso de libras a kg
  v_weight_kg := p_weight_lbs * 0.453592;

  -- Convertir altura de metros a cm
  v_height_cm := (REPLACE(p_height_text, ',', '.')::NUMERIC * 100)::INTEGER;

  -- Determinar categoría de peso (basado en libras para MMA)
  CASE 
    WHEN p_weight_lbs <= 115 THEN v_weight_class := 'Strawweight';
    WHEN p_weight_lbs <= 125 THEN v_weight_class := 'Flyweight';  
    WHEN p_weight_lbs <= 135 THEN v_weight_class := 'Bantamweight';
    WHEN p_weight_lbs <= 145 THEN v_weight_class := 'Featherweight';
    WHEN p_weight_lbs <= 155 THEN v_weight_class := 'Lightweight';
    WHEN p_weight_lbs <= 170 THEN v_weight_class := 'Welterweight';
    WHEN p_weight_lbs <= 185 THEN v_weight_class := 'Middleweight';
    WHEN p_weight_lbs <= 205 THEN v_weight_class := 'Light Heavyweight';
    ELSE v_weight_class := 'Heavyweight';
  END CASE;

  -- Calcular ELO basado en record
  IF v_wins > 0 OR v_losses > 0 THEN
    v_elo_rating := 1200 + (v_wins * 50) - (v_losses * 30);
    v_elo_rating := GREATEST(800, LEAST(2000, v_elo_rating));
  END IF;

  -- Insertar peleador
  INSERT INTO public.fighter_profiles (
    first_name,
    last_name,
    nickname,
    country,
    weight_class,
    height_cm,
    weight_kg,
    record_wins,
    record_losses,
    record_draws,
    elo_rating,
    fighting_style,
    bio
  ) VALUES (
    p_first_name,
    p_last_name,
    NULLIF(p_nickname, ''),
    p_country,
    v_weight_class,
    v_height_cm,
    v_weight_kg,
    v_wins,
    v_losses,
    v_draws,
    v_elo_rating,
    p_academy,
    CONCAT('Edad: ', p_age, ' años. Academia: ', COALESCE(p_academy, 'N/A'))
  ) RETURNING id INTO v_fighter_id;

  RETURN v_fighter_id;
END;
$$;