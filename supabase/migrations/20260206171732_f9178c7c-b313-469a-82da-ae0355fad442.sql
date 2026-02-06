-- =============================================================================
-- FIX: Corregir tipo de disciplina en admin_update_fighter_profile
-- Y crear user_update_fighter_profile para sincronización de usuarios
-- =============================================================================

-- Recrear admin_update_fighter_profile con el tipo CORRECTO (discipline, no competition_discipline)
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(p_fighter_id uuid, p_profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security = off
AS $function$
DECLARE
  v_old_discipline TEXT;
  v_new_discipline TEXT;
  v_old_level TEXT;
  v_new_level TEXT;
  v_old_weight_class TEXT;
  v_new_weight_class TEXT;
BEGIN
  -- Solo admins pueden usar esta función
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Obtener valores actuales para comparación
  SELECT discipline::TEXT, level, weight_class 
  INTO v_old_discipline, v_old_level, v_old_weight_class
  FROM public.fighter_profiles WHERE id = p_fighter_id;

  -- Extraer nuevos valores del JSON
  v_new_discipline := p_profile_data->>'discipline';
  v_new_level := p_profile_data->>'level';
  v_new_weight_class := p_profile_data->>'weight_class';

  -- Actualizar el perfil del peleador
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE(p_profile_data->>'first_name', first_name),
    last_name = COALESCE(p_profile_data->>'last_name', last_name),
    nickname = CASE 
      WHEN p_profile_data ? 'nickname' THEN p_profile_data->>'nickname'
      ELSE nickname 
    END,
    country = COALESCE(p_profile_data->>'country', country),
    weight_class = COALESCE(v_new_weight_class, weight_class),
    height_cm = COALESCE((p_profile_data->>'height_cm')::INTEGER, height_cm),
    weight_kg = COALESCE((p_profile_data->>'weight_kg')::NUMERIC, weight_kg),
    reach_cm = COALESCE((p_profile_data->>'reach_cm')::INTEGER, reach_cm),
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' THEN p_profile_data->>'fighting_style'
      ELSE fighting_style 
    END,
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' THEN p_profile_data->>'gym_name'
      ELSE gym_name 
    END,
    bio = CASE 
      WHEN p_profile_data ? 'bio' THEN p_profile_data->>'bio'
      ELSE bio 
    END,
    avatar_url = CASE 
      WHEN p_profile_data ? 'avatar_url' THEN p_profile_data->>'avatar_url'
      ELSE avatar_url 
    END,
    -- TIPO CORRECTO: discipline (no competition_discipline)
    discipline = CASE
      WHEN p_profile_data ? 'discipline' THEN
        CASE
          WHEN v_new_discipline IS NULL OR v_new_discipline = '' OR v_new_discipline = 'null' THEN discipline
          WHEN v_new_discipline = ANY (ARRAY['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'])
            THEN v_new_discipline::discipline
          ELSE discipline
        END
      ELSE discipline
    END,
    level = CASE 
      WHEN p_profile_data ? 'level' THEN 
        CASE 
          WHEN v_new_level IS NULL OR v_new_level = '' THEN level
          ELSE v_new_level
        END
      ELSE level 
    END,
    martial_arts = CASE 
      WHEN p_profile_data ? 'martial_arts' THEN 
        ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
      ELSE martial_arts 
    END,
    gender = CASE 
      WHEN p_profile_data ? 'gender' THEN p_profile_data->>'gender'
      ELSE gender 
    END,
    boxrec_url = CASE 
      WHEN p_profile_data ? 'boxrec_url' THEN p_profile_data->>'boxrec_url'
      ELSE boxrec_url 
    END,
    tapology_url = CASE 
      WHEN p_profile_data ? 'tapology_url' THEN p_profile_data->>'tapology_url'
      ELSE tapology_url 
    END,
    record_type = CASE 
      WHEN p_profile_data ? 'record_type' THEN p_profile_data->>'record_type'
      ELSE record_type 
    END,
    stance = CASE 
      WHEN p_profile_data ? 'stance' THEN p_profile_data->>'stance'
      ELSE stance 
    END,
    -- Records discipline-specific
    mma_record_wins = COALESCE((p_profile_data->>'mma_record_wins')::INTEGER, mma_record_wins),
    mma_record_losses = COALESCE((p_profile_data->>'mma_record_losses')::INTEGER, mma_record_losses),
    mma_record_draws = COALESCE((p_profile_data->>'mma_record_draws')::INTEGER, mma_record_draws),
    boxeo_record_wins = COALESCE((p_profile_data->>'boxeo_record_wins')::INTEGER, boxeo_record_wins),
    boxeo_record_losses = COALESCE((p_profile_data->>'boxeo_record_losses')::INTEGER, boxeo_record_losses),
    boxeo_record_draws = COALESCE((p_profile_data->>'boxeo_record_draws')::INTEGER, boxeo_record_draws),
    -- Legacy records
    record_wins = COALESCE((p_profile_data->>'record_wins')::INTEGER, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::INTEGER, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::INTEGER, record_draws),
    -- Phase 1: Critical Safety Information
    birthdate = CASE 
      WHEN p_profile_data ? 'birthdate' THEN (p_profile_data->>'birthdate')::DATE
      ELSE birthdate 
    END,
    birthplace = CASE 
      WHEN p_profile_data ? 'birthplace' THEN p_profile_data->>'birthplace'
      ELSE birthplace 
    END,
    blood_type = CASE 
      WHEN p_profile_data ? 'blood_type' THEN p_profile_data->>'blood_type'
      ELSE blood_type 
    END,
    emergency_contact_name = CASE 
      WHEN p_profile_data ? 'emergency_contact_name' THEN p_profile_data->>'emergency_contact_name'
      ELSE emergency_contact_name 
    END,
    emergency_contact_phone = CASE 
      WHEN p_profile_data ? 'emergency_contact_phone' THEN p_profile_data->>'emergency_contact_phone'
      ELSE emergency_contact_phone 
    END,
    emergency_contact_relation = CASE 
      WHEN p_profile_data ? 'emergency_contact_relation' THEN p_profile_data->>'emergency_contact_relation'
      ELSE emergency_contact_relation 
    END,
    medical_allergies = CASE 
      WHEN p_profile_data ? 'medical_allergies' THEN p_profile_data->>'medical_allergies'
      ELSE medical_allergies 
    END,
    medical_conditions = CASE 
      WHEN p_profile_data ? 'medical_conditions' THEN p_profile_data->>'medical_conditions'
      ELSE medical_conditions 
    END,
    insurance_company = CASE 
      WHEN p_profile_data ? 'insurance_company' THEN p_profile_data->>'insurance_company'
      ELSE insurance_company 
    END,
    insurance_policy = CASE 
      WHEN p_profile_data ? 'insurance_policy' THEN p_profile_data->>'insurance_policy'
      ELSE insurance_policy 
    END,
    document_type = CASE 
      WHEN p_profile_data ? 'document_type' THEN p_profile_data->>'document_type'
      ELSE document_type 
    END,
    document_number = CASE 
      WHEN p_profile_data ? 'document_number' THEN p_profile_data->>'document_number'
      ELSE document_number 
    END,
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Sincronizar cambios a fighter_rankings si cambian nivel, peso, o disciplina
  IF (v_new_level IS NOT NULL AND v_new_level != '' AND v_new_level IS DISTINCT FROM v_old_level)
     OR (v_new_weight_class IS NOT NULL AND v_new_weight_class IS DISTINCT FROM v_old_weight_class)
     OR (v_new_discipline IS NOT NULL AND v_new_discipline != '' AND v_new_discipline IS DISTINCT FROM v_old_discipline)
  THEN
    UPDATE public.fighter_rankings
    SET 
      level = COALESCE(v_new_level, level),
      weight_class = COALESCE(v_new_weight_class, weight_class),
      updated_at = now()
    WHERE fighter_id = p_fighter_id 
      AND is_active = true;
    
    RAISE NOTICE 'Synced level/weight/discipline to fighter_rankings for fighter %', p_fighter_id;
  END IF;
END;
$function$;

-- =============================================================================
-- Crear user_update_fighter_profile para que usuarios puedan editar su perfil
-- con sincronización automática a rankings
-- =============================================================================
CREATE OR REPLACE FUNCTION public.user_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security = off
AS $function$
DECLARE
  v_user_id UUID;
  v_owner_id UUID;
  v_old_level TEXT;
  v_new_level TEXT;
  v_old_weight_class TEXT;
  v_new_weight_class TEXT;
BEGIN
  -- Obtener user_id del caller
  SELECT id INTO v_user_id FROM public.app_user WHERE auth_user_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not found';
  END IF;
  
  -- Verificar propiedad del perfil
  SELECT user_id INTO v_owner_id FROM public.fighter_profiles WHERE id = p_fighter_id;
  
  IF v_owner_id IS NULL OR v_user_id != v_owner_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own profile';
  END IF;

  -- Obtener valores actuales para sincronización
  SELECT level, weight_class 
  INTO v_old_level, v_old_weight_class
  FROM public.fighter_profiles WHERE id = p_fighter_id;

  v_new_level := p_profile_data->>'level';
  v_new_weight_class := p_profile_data->>'weight_class';

  -- Actualizar perfil (solo campos permitidos para usuarios)
  UPDATE public.fighter_profiles
  SET 
    nickname = CASE 
      WHEN p_profile_data ? 'nickname' THEN p_profile_data->>'nickname'
      ELSE nickname 
    END,
    bio = CASE 
      WHEN p_profile_data ? 'bio' THEN p_profile_data->>'bio'
      ELSE bio 
    END,
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' THEN p_profile_data->>'fighting_style'
      ELSE fighting_style 
    END,
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' THEN p_profile_data->>'gym_name'
      ELSE gym_name 
    END,
    avatar_url = CASE 
      WHEN p_profile_data ? 'avatar_url' THEN p_profile_data->>'avatar_url'
      ELSE avatar_url 
    END,
    height_cm = COALESCE((p_profile_data->>'height_cm')::INTEGER, height_cm),
    weight_kg = COALESCE((p_profile_data->>'weight_kg')::NUMERIC, weight_kg),
    reach_cm = COALESCE((p_profile_data->>'reach_cm')::INTEGER, reach_cm),
    weight_class = COALESCE(v_new_weight_class, weight_class),
    level = CASE 
      WHEN p_profile_data ? 'level' AND v_new_level IS NOT NULL AND v_new_level != '' 
      THEN v_new_level
      ELSE level 
    END,
    martial_arts = CASE 
      WHEN p_profile_data ? 'martial_arts' THEN 
        ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
      ELSE martial_arts 
    END,
    stance = CASE 
      WHEN p_profile_data ? 'stance' THEN p_profile_data->>'stance'
      ELSE stance 
    END,
    boxrec_url = CASE 
      WHEN p_profile_data ? 'boxrec_url' THEN p_profile_data->>'boxrec_url'
      ELSE boxrec_url 
    END,
    tapology_url = CASE 
      WHEN p_profile_data ? 'tapology_url' THEN p_profile_data->>'tapology_url'
      ELSE tapology_url 
    END,
    -- Campos de seguridad (usuarios pueden actualizar su info de emergencia)
    blood_type = CASE 
      WHEN p_profile_data ? 'blood_type' THEN p_profile_data->>'blood_type'
      ELSE blood_type 
    END,
    emergency_contact_name = CASE 
      WHEN p_profile_data ? 'emergency_contact_name' THEN p_profile_data->>'emergency_contact_name'
      ELSE emergency_contact_name 
    END,
    emergency_contact_phone = CASE 
      WHEN p_profile_data ? 'emergency_contact_phone' THEN p_profile_data->>'emergency_contact_phone'
      ELSE emergency_contact_phone 
    END,
    emergency_contact_relation = CASE 
      WHEN p_profile_data ? 'emergency_contact_relation' THEN p_profile_data->>'emergency_contact_relation'
      ELSE emergency_contact_relation 
    END,
    medical_allergies = CASE 
      WHEN p_profile_data ? 'medical_allergies' THEN p_profile_data->>'medical_allergies'
      ELSE medical_allergies 
    END,
    medical_conditions = CASE 
      WHEN p_profile_data ? 'medical_conditions' THEN p_profile_data->>'medical_conditions'
      ELSE medical_conditions 
    END,
    insurance_company = CASE 
      WHEN p_profile_data ? 'insurance_company' THEN p_profile_data->>'insurance_company'
      ELSE insurance_company 
    END,
    insurance_policy = CASE 
      WHEN p_profile_data ? 'insurance_policy' THEN p_profile_data->>'insurance_policy'
      ELSE insurance_policy 
    END,
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Sincronizar cambios a fighter_rankings si cambia nivel o peso
  IF (v_new_level IS NOT NULL AND v_new_level != '' AND v_new_level IS DISTINCT FROM v_old_level)
     OR (v_new_weight_class IS NOT NULL AND v_new_weight_class IS DISTINCT FROM v_old_weight_class)
  THEN
    UPDATE public.fighter_rankings
    SET 
      level = COALESCE(v_new_level, level),
      weight_class = COALESCE(v_new_weight_class, weight_class),
      updated_at = now()
    WHERE fighter_id = p_fighter_id 
      AND is_active = true;
  END IF;
END;
$function$;