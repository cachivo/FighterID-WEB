-- Función completa para crear registro de Fighter ID con toda la información
-- CORRECCIÓN: Parámetros obligatorios primero, opcionales después
CREATE OR REPLACE FUNCTION public.create_complete_fighter_registration(
  -- Parámetros OBLIGATORIOS (sin DEFAULT)
  p_auth_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_country text,
  p_weight_class text,
  
  -- Parámetros OPCIONALES (con DEFAULT) - TODOS al final
  p_nickname text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_birthdate date DEFAULT NULL,
  p_birthplace text DEFAULT NULL,
  p_document_type text DEFAULT NULL,
  p_document_number text DEFAULT NULL,
  p_height_cm integer DEFAULT NULL,
  p_weight_kg numeric DEFAULT NULL,
  p_reach_cm integer DEFAULT NULL,
  p_blood_type text DEFAULT NULL,
  p_martial_arts text[] DEFAULT '{}',
  p_gym_name text DEFAULT NULL,
  p_stance text DEFAULT NULL,
  p_level text DEFAULT 'AMATEUR',
  p_fighting_style text DEFAULT NULL,
  p_discipline text DEFAULT NULL,
  p_record_wins integer DEFAULT 0,
  p_record_losses integer DEFAULT 0,
  p_record_draws integer DEFAULT 0,
  p_medical_allergies text DEFAULT NULL,
  p_medical_conditions text DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL,
  p_emergency_contact_relation text DEFAULT NULL,
  p_insurance_company text DEFAULT NULL,
  p_insurance_policy text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_user_id uuid;
  v_fighter_id uuid;
  v_license_id uuid;
  v_license_number text;
BEGIN
  -- 1. Verificar/crear app_user
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_user_id = p_auth_user_id;
  
  IF v_app_user_id IS NULL THEN
    INSERT INTO public.app_user (
      auth_user_id, email, handle, first_name, last_name, phone, country
    ) VALUES (
      p_auth_user_id, p_email, SPLIT_PART(p_email, '@', 1), 
      p_first_name, p_last_name, p_phone, p_country
    ) RETURNING id INTO v_app_user_id;
  ELSE
    -- Actualizar info básica si ya existe
    UPDATE public.app_user
    SET first_name = p_first_name,
        last_name = p_last_name,
        phone = p_phone,
        country = p_country,
        updated_at = now()
    WHERE id = v_app_user_id;
  END IF;
  
  -- 2. Crear perfil completo de fighter
  INSERT INTO public.fighter_profiles (
    user_id,
    first_name, last_name, nickname,
    country, gender,
    birthdate, birthplace,
    document_type, document_number,
    height_cm, weight_kg, reach_cm, blood_type,
    weight_class, martial_arts, gym_name, stance, level, fighting_style, discipline,
    record_wins, record_losses, record_draws,
    medical_allergies, medical_conditions,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    insurance_company, insurance_policy,
    bio, avatar_url
  ) VALUES (
    v_app_user_id,
    p_first_name, p_last_name, NULLIF(p_nickname, ''),
    p_country, NULLIF(p_gender, ''),
    p_birthdate, NULLIF(p_birthplace, ''),
    NULLIF(p_document_type, ''), NULLIF(p_document_number, ''),
    NULLIF(p_height_cm, 0), NULLIF(p_weight_kg, 0), NULLIF(p_reach_cm, 0), NULLIF(p_blood_type, ''),
    p_weight_class, 
    CASE WHEN array_length(p_martial_arts, 1) > 0 THEN p_martial_arts ELSE NULL END,
    NULLIF(p_gym_name, ''), NULLIF(p_stance, ''), NULLIF(p_level, ''), 
    NULLIF(p_fighting_style, ''), 
    CASE WHEN p_discipline IS NOT NULL AND p_discipline != '' THEN p_discipline::discipline ELSE NULL END,
    COALESCE(p_record_wins, 0), COALESCE(p_record_losses, 0), COALESCE(p_record_draws, 0),
    NULLIF(p_medical_allergies, ''), NULLIF(p_medical_conditions, ''),
    NULLIF(p_emergency_contact_name, ''), NULLIF(p_emergency_contact_phone, ''), 
    NULLIF(p_emergency_contact_relation, ''),
    NULLIF(p_insurance_company, ''), NULLIF(p_insurance_policy, ''),
    NULLIF(p_bio, ''), NULLIF(p_avatar_url, '')
  ) RETURNING id INTO v_fighter_id;
  
  -- 3. Generar número de licencia
  v_license_number := public.generate_license_number();
  
  -- 4. Crear licencia en estado PENDING_REVIEW
  INSERT INTO public.fighter_licenses (
    fighter_id,
    license_number,
    status,
    license_level,
    is_primary,
    discipline
  ) VALUES (
    v_fighter_id,
    v_license_number,
    'PENDING_REVIEW',
    COALESCE(p_level, 'AMATEUR')::license_level,
    true,
    CASE 
      WHEN p_discipline IS NOT NULL AND p_discipline != '' THEN p_discipline::discipline
      WHEN array_length(p_martial_arts, 1) > 0 THEN p_martial_arts[1]::discipline
      ELSE NULL
    END
  ) RETURNING id INTO v_license_id;
  
  -- 5. Retornar IDs para confirmación
  RETURN jsonb_build_object(
    'success', true,
    'app_user_id', v_app_user_id,
    'fighter_id', v_fighter_id,
    'license_id', v_license_id,
    'license_number', v_license_number
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating fighter registration: %', SQLERRM;
END;
$$;