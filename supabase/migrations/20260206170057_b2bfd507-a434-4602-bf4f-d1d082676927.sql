-- Normalizar categorías de peso en inglés a español en fighter_rankings
UPDATE fighter_rankings 
SET weight_class = CASE weight_class
  WHEN 'Bantamweight' THEN 'Peso Gallo'
  WHEN 'Featherweight' THEN 'Peso Pluma'
  WHEN 'Lightweight' THEN 'Peso Ligero'
  WHEN 'Peso Gallo (135 lbs)' THEN 'Peso Gallo'
  ELSE weight_class
END
WHERE weight_class IN ('Bantamweight', 'Featherweight', 'Lightweight', 'Peso Gallo (135 lbs)');

-- También en fighter_profiles por consistencia
UPDATE fighter_profiles 
SET weight_class = CASE weight_class
  WHEN 'Bantamweight' THEN 'Peso Gallo'
  WHEN 'Featherweight' THEN 'Peso Pluma'
  WHEN 'Lightweight' THEN 'Peso Ligero'
  WHEN 'Peso Gallo (135 lbs)' THEN 'Peso Gallo'
  ELSE weight_class
END
WHERE weight_class IN ('Bantamweight', 'Featherweight', 'Lightweight', 'Peso Gallo (135 lbs)');