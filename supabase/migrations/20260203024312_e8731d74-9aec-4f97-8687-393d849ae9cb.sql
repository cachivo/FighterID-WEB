-- Agregar columnas para récords por disciplina
ALTER TABLE fighter_profiles 
ADD COLUMN IF NOT EXISTS mma_record_wins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS mma_record_losses integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS mma_record_draws integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS boxeo_record_wins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS boxeo_record_losses integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS boxeo_record_draws integer DEFAULT 0;

-- Migrar datos existentes a MMA (todos actuales son MMA)
UPDATE fighter_profiles 
SET 
  mma_record_wins = COALESCE(record_wins, 0),
  mma_record_losses = COALESCE(record_losses, 0),
  mma_record_draws = COALESCE(record_draws, 0)
WHERE mma_record_wins = 0 AND mma_record_losses = 0 AND mma_record_draws = 0;

-- Actualizar función admin_update_fighter_profile para manejar nuevos campos
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(p_fighter_id uuid, p_profile_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Verify caller is admin
  SELECT is_admin INTO v_is_admin FROM public.app_user WHERE auth_user_id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Temporarily bypass RLS for this transaction
  SET LOCAL row_security = off;

  -- Update fighter profile with robust NULL handling and safe enum casting
  UPDATE public.fighter_profiles
  SET
    -- Personal information
    first_name = COALESCE(NULLIF(p_profile_data->>'first_name', ''), first_name),
    last_name = COALESCE(NULLIF(p_profile_data->>'last_name', ''), last_name),
    nickname = CASE 
      WHEN p_profile_data->>'nickname' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'nickname', nickname)
    END,
    country = COALESCE(NULLIF(p_profile_data->>'country', ''), country),
    gender = CASE
      WHEN p_profile_data->>'gender' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'gender', gender)
    END,
    birthdate = CASE
      WHEN p_profile_data->>'birthdate' IN ('', 'null') THEN NULL
      ELSE COALESCE((p_profile_data->>'birthdate')::date, birthdate)
    END,
    birthplace = CASE
      WHEN p_profile_data->>'birthplace' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'birthplace', birthplace)
    END,

    -- Documentation
    document_type = CASE
      WHEN p_profile_data->>'document_type' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'document_type', document_type)
    END,
    document_number = CASE
      WHEN p_profile_data->>'document_number' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'document_number', document_number)
    END,

    -- Physical attributes
    height_cm = CASE
      WHEN (p_profile_data->>'height_cm')::integer = 0 THEN height_cm
      ELSE COALESCE((p_profile_data->>'height_cm')::integer, height_cm)
    END,
    weight_kg = CASE
      WHEN (p_profile_data->>'weight_kg')::numeric = 0 THEN weight_kg
      ELSE COALESCE((p_profile_data->>'weight_kg')::numeric, weight_kg)
    END,
    reach_cm = CASE
      WHEN (p_profile_data->>'reach_cm')::integer = 0 THEN reach_cm
      ELSE COALESCE((p_profile_data->>'reach_cm')::integer, reach_cm)
    END,
    blood_type = CASE
      WHEN p_profile_data->>'blood_type' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'blood_type', blood_type)
    END,

    -- Combat
    weight_class = COALESCE(NULLIF(p_profile_data->>'weight_class', ''), weight_class),
    fighting_style = CASE
      WHEN p_profile_data->>'fighting_style' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'fighting_style', fighting_style)
    END,
    stance = CASE
      WHEN p_profile_data->>'stance' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'stance', stance)
    END,
    level = CASE
      WHEN p_profile_data->>'level' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'level', level)
    END,
    gym_name = CASE
      WHEN p_profile_data->>'gym_name' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'gym_name', gym_name)
    END,

    -- Discipline (safe cast to enum "discipline")
    discipline = CASE
      WHEN p_profile_data ? 'discipline' THEN
        CASE
          WHEN p_profile_data->>'discipline' IN ('', 'null') THEN NULL
          WHEN p_profile_data->>'discipline' = ANY (ARRAY['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'])
            THEN (p_profile_data->>'discipline')::discipline
          ELSE discipline -- ignore invalid values
        END
      ELSE discipline
    END,

    -- Martial arts (jsonb array -> text[]), set NULL if empty array
    martial_arts = CASE
      WHEN p_profile_data ? 'martial_arts' THEN
        CASE
          WHEN jsonb_typeof(p_profile_data->'martial_arts') = 'array' THEN
            CASE WHEN jsonb_array_length(p_profile_data->'martial_arts') = 0 THEN NULL
                 ELSE ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
            END
          ELSE martial_arts
        END
      ELSE martial_arts
    END,

    -- Legacy Record (mantener para compatibilidad)
    record_wins = COALESCE((p_profile_data->>'record_wins')::integer, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::integer, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::integer, record_draws),
    record_type = CASE
      WHEN p_profile_data->>'record_type' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'record_type', record_type)
    END,

    -- MMA Record
    mma_record_wins = COALESCE((p_profile_data->>'mma_record_wins')::integer, mma_record_wins),
    mma_record_losses = COALESCE((p_profile_data->>'mma_record_losses')::integer, mma_record_losses),
    mma_record_draws = COALESCE((p_profile_data->>'mma_record_draws')::integer, mma_record_draws),

    -- Boxeo Record
    boxeo_record_wins = COALESCE((p_profile_data->>'boxeo_record_wins')::integer, boxeo_record_wins),
    boxeo_record_losses = COALESCE((p_profile_data->>'boxeo_record_losses')::integer, boxeo_record_losses),
    boxeo_record_draws = COALESCE((p_profile_data->>'boxeo_record_draws')::integer, boxeo_record_draws),

    -- External links
    boxrec_url = CASE
      WHEN p_profile_data->>'boxrec_url' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'boxrec_url', boxrec_url)
    END,
    tapology_url = CASE
      WHEN p_profile_data->>'tapology_url' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'tapology_url', tapology_url)
    END,

    -- Medical & insurance
    medical_conditions = CASE
      WHEN p_profile_data->>'medical_conditions' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'medical_conditions', medical_conditions)
    END,
    medical_allergies = CASE
      WHEN p_profile_data->>'medical_allergies' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'medical_allergies', medical_allergies)
    END,
    insurance_company = CASE
      WHEN p_profile_data->>'insurance_company' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'insurance_company', insurance_company)
    END,
    insurance_policy = CASE
      WHEN p_profile_data->>'insurance_policy' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'insurance_policy', insurance_policy)
    END,

    -- Emergency contact
    emergency_contact_name = CASE
      WHEN p_profile_data->>'emergency_contact_name' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'emergency_contact_name', emergency_contact_name)
    END,
    emergency_contact_phone = CASE
      WHEN p_profile_data->>'emergency_contact_phone' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'emergency_contact_phone', emergency_contact_phone)
    END,
    emergency_contact_relation = CASE
      WHEN p_profile_data->>'emergency_contact_relation' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'emergency_contact_relation', emergency_contact_relation)
    END,

    -- Bio & avatar
    bio = CASE
      WHEN p_profile_data->>'bio' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'bio', bio)
    END,
    avatar_url = CASE
      WHEN p_profile_data->>'avatar_url' IN ('', 'null') THEN NULL
      ELSE COALESCE(p_profile_data->>'avatar_url', avatar_url)
    END,

    -- Timestamp
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Ensure update happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter profile not found: %', p_fighter_id;
  END IF;
END;
$function$;