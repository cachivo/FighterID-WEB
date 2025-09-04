-- Fase 1: Limpieza y sincronización de datos entre fighter_profiles y fighter_licenses
-- Corrigiendo tipo de discipline y valores de license_status

-- Primero, limpiar números de licencia ficticios en fighter_profiles
UPDATE public.fighter_profiles 
SET license_number = NULL,
    license_issued_date = NULL,
    license_expires_date = NULL,
    license_status = 'active'
WHERE active = true;

-- Crear licencias reales para cada perfil activo que no tenga una
INSERT INTO public.fighter_licenses (
  fighter_id,
  license_number,
  status,
  license_level,
  discipline,
  issued_at,
  expires_at,
  is_primary,
  created_at
)
SELECT DISTINCT
  fp.id as fighter_id,
  public.generate_license_number() as license_number,
  'ACTIVE'::license_status as status,
  'AMATEUR'::license_level as license_level,
  COALESCE(fp.discipline, 'MMA'::discipline) as discipline,  -- Corregido el tipo
  now() as issued_at,
  now() + interval '1 year' as expires_at,
  true as is_primary,
  now() as created_at
FROM public.fighter_profiles fp
WHERE fp.active = true 
  AND fp.id NOT IN (
    SELECT fl.fighter_id 
    FROM public.fighter_licenses fl 
    WHERE fl.fighter_id IS NOT NULL
  );

-- Actualizar fighter_profiles con los datos de las licencias reales
UPDATE public.fighter_profiles 
SET 
  license_number = fl.license_number,
  license_issued_date = fl.issued_at,
  license_expires_date = fl.expires_at,
  license_status = CASE 
    WHEN fl.status = 'ACTIVE' THEN 'active'
    WHEN fl.status = 'SUSPENDED' THEN 'suspended'
    WHEN fl.status = 'EXPIRED' THEN 'expired'
    ELSE 'active'
  END,
  primary_license_id = fl.id
FROM public.fighter_licenses fl
WHERE fl.fighter_id = fighter_profiles.id 
  AND fl.is_primary = true;

-- Eliminar perfiles huérfanos que no tienen user_id asociado
DELETE FROM public.fighter_profiles 
WHERE user_id IS NULL 
  AND first_name IN ('FERNANDO', 'WALLY', 'ISABEL', 'IRIS');

-- Crear constraints para prevenir futuros problemas
CREATE UNIQUE INDEX IF NOT EXISTS idx_fighter_primary_license 
ON public.fighter_licenses (fighter_id) 
WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_license_number 
ON public.fighter_licenses (license_number);

-- Función para mantener sincronización automática
CREATE OR REPLACE FUNCTION sync_fighter_license_data()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    UPDATE public.fighter_profiles 
    SET 
      license_number = NEW.license_number,
      license_issued_date = NEW.issued_at,
      license_expires_date = NEW.expires_at,
      license_status = CASE 
        WHEN NEW.status = 'ACTIVE' THEN 'active'
        WHEN NEW.status = 'SUSPENDED' THEN 'suspended'
        WHEN NEW.status = 'EXPIRED' THEN 'expired'
        ELSE 'active'
      END,
      primary_license_id = NEW.id
    WHERE id = NEW.fighter_id 
      AND NEW.is_primary = true;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.fighter_profiles 
    SET 
      license_number = NULL,
      license_issued_date = NULL,
      license_expires_date = NULL,
      license_status = 'active',
      primary_license_id = NULL
    WHERE primary_license_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS sync_fighter_license_trigger ON public.fighter_licenses;
CREATE TRIGGER sync_fighter_license_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.fighter_licenses
  FOR EACH ROW EXECUTE FUNCTION sync_fighter_license_data();