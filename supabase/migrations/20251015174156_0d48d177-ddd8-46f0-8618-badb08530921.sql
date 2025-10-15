-- Fix admin_update_fighter_profile function - correct discipline cast
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(
  p_fighter_id uuid,
  p_profile_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Verificar que el usuario es admin
  SELECT is_admin INTO v_is_admin FROM app_user WHERE auth_user_id = auth.uid();
  
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update fighter profiles';
  END IF;

  -- Bypass RLS temporalmente para esta transacción
  SET LOCAL row_security = off;

  -- Actualizar el perfil con todos los campos
  UPDATE public.fighter_profiles
  SET
    -- Personales
    first_name = COALESCE(NULLIF(p_profile_data->>'first_name', ''), first_name),
    last_name = COALESCE(NULLIF(p_profile_data->>'last_name', ''), last_name),
    nickname = CASE 
      WHEN p_profile_data->>'nickname' = '' THEN NULL
      WHEN p_profile_data->>'nickname' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'nickname', nickname)
    END,
    country = COALESCE(NULLIF(p_profile_data->>'country', ''), country),
    gender = CASE
      WHEN p_profile_data->>'gender' = '' THEN NULL
      WHEN p_profile_data->>'gender' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'gender', gender)
    END,
    birthdate = CASE
      WHEN p_profile_data->>'birthdate' = '' THEN NULL
      WHEN p_profile_data->>'birthdate' = 'null' THEN NULL
      ELSE COALESCE((p_profile_data->>'birthdate')::date, birthdate)
    END,
    birthplace = CASE
      WHEN p_profile_data->>'birthplace' = '' THEN NULL
      WHEN p_profile_data->>'birthplace' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'birthplace', birthplace)
    END,
    
    -- Documentación
    document_type = CASE
      WHEN p_profile_data->>'document_type' = '' THEN NULL
      WHEN p_profile_data->>'document_type' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'document_type', document_type)
    END,
    document_number = CASE
      WHEN p_profile_data->>'document_number' = '' THEN NULL
      WHEN p_profile_data->>'document_number' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'document_number', document_number)
    END,
    
    -- Físicos
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
      WHEN p_profile_data->>'blood_type' = '' THEN NULL
      WHEN p_profile_data->>'blood_type' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'blood_type', blood_type)
    END,
    
    -- Combate
    weight_class = COALESCE(NULLIF(p_profile_data->>'weight_class', ''), weight_class),
    fighting_style = CASE
      WHEN p_profile_data->>'fighting_style' = '' THEN NULL
      WHEN p_profile_data->>'fighting_style' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'fighting_style', fighting_style)
    END,
    stance = CASE
      WHEN p_profile_data->>'stance' = '' THEN NULL
      WHEN p_profile_data->>'stance' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'stance', stance)
    END,
    level = CASE
      WHEN p_profile_data->>'level' = '' THEN NULL
      WHEN p_profile_data->>'level' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'level', level)
    END,
    gym_name = CASE
      WHEN p_profile_data->>'gym_name' = '' THEN NULL
      WHEN p_profile_data->>'gym_name' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'gym_name', gym_name)
    END,
    
    -- Disciplina (FIX: cast correcto a discipline_type)
    discipline = CASE
      WHEN p_profile_data->>'discipline' = '' THEN NULL
      WHEN p_profile_data->>'discipline' = 'null' THEN NULL
      WHEN p_profile_data->>'discipline' IS NOT NULL THEN (p_profile_data->>'discipline')::discipline_type
      ELSE discipline
    END,
    
    -- Martial arts (array)
    martial_arts = CASE
      WHEN p_profile_data->'martial_arts' IS NOT NULL THEN
        CASE
          WHEN jsonb_array_length(p_profile_data->'martial_arts') = 0 THEN NULL
          ELSE ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
        END
      ELSE martial_arts
    END,
    
    -- Récord
    record_wins = COALESCE((p_profile_data->>'record_wins')::integer, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::integer, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::integer, record_draws),
    record_type = CASE
      WHEN p_profile_data->>'record_type' = '' THEN NULL
      WHEN p_profile_data->>'record_type' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'record_type', record_type)
    END,
    
    -- Enlaces externos
    boxrec_url = CASE
      WHEN p_profile_data->>'boxrec_url' = '' THEN NULL
      WHEN p_profile_data->>'boxrec_url' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'boxrec_url', boxrec_url)
    END,
    tapology_url = CASE
      WHEN p_profile_data->>'tapology_url' = '' THEN NULL
      WHEN p_profile_data->>'tapology_url' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'tapology_url', tapology_url)
    END,
    
    -- Médico y seguros
    medical_conditions = CASE
      WHEN p_profile_data->>'medical_conditions' = '' THEN NULL
      WHEN p_profile_data->>'medical_conditions' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'medical_conditions', medical_conditions)
    END,
    medical_allergies = CASE
      WHEN p_profile_data->>'medical_allergies' = '' THEN NULL
      WHEN p_profile_data->>'medical_allergies' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'medical_allergies', medical_allergies)
    END,
    insurance_company = CASE
      WHEN p_profile_data->>'insurance_company' = '' THEN NULL
      WHEN p_profile_data->>'insurance_company' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'insurance_company', insurance_company)
    END,
    insurance_policy = CASE
      WHEN p_profile_data->>'insurance_policy' = '' THEN NULL
      WHEN p_profile_data->>'insurance_policy' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'insurance_policy', insurance_policy)
    END,
    
    -- Contacto de emergencia
    emergency_contact_name = CASE
      WHEN p_profile_data->>'emergency_contact_name' = '' THEN NULL
      WHEN p_profile_data->>'emergency_contact_name' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'emergency_contact_name', emergency_contact_name)
    END,
    emergency_contact_phone = CASE
      WHEN p_profile_data->>'emergency_contact_phone' = '' THEN NULL
      WHEN p_profile_data->>'emergency_contact_phone' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'emergency_contact_phone', emergency_contact_phone)
    END,
    emergency_contact_relation = CASE
      WHEN p_profile_data->>'emergency_contact_relation' = '' THEN NULL
      WHEN p_profile_data->>'emergency_contact_relation' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'emergency_contact_relation', emergency_contact_relation)
    END,
    
    -- Biografía y avatar
    bio = CASE
      WHEN p_profile_data->>'bio' = '' THEN NULL
      WHEN p_profile_data->>'bio' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'bio', bio)
    END,
    avatar_url = CASE
      WHEN p_profile_data->>'avatar_url' = '' THEN NULL
      WHEN p_profile_data->>'avatar_url' = 'null' THEN NULL
      ELSE COALESCE(p_profile_data->>'avatar_url', avatar_url)
    END,
    
    -- Timestamp
    updated_at = now()
  WHERE id = p_fighter_id;

  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter profile not found: %', p_fighter_id;
  END IF;
END;
$$;