-- Unique index on normalized gym name (only active gyms)
CREATE UNIQUE INDEX IF NOT EXISTS gyms_nombre_normalized_unique 
ON public.gyms (LOWER(TRIM(nombre))) 
WHERE activo = true;