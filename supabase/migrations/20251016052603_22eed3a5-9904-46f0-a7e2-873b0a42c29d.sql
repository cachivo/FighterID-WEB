CREATE OR REPLACE FUNCTION public.request_fighter_license(
  p_fighter_profile_data jsonb,
  p_license_data jsonb DEFAULT '{}'::jsonb,
  p_document_urls jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
  v_app_user_id uuid;
  v_existing_fighter_id uuid;
  v_fighter_id uuid;
  v_license_id uuid;
  v_first_name text;
  v_last_name text;
  v_weight_class text;
BEGIN
  -- Get current auth user
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No autenticado');
  END IF;

  -- Get app_user_id and names from app_user table
  SELECT id, first_name, last_name 
  INTO v_app_user_id, v_first_name, v_last_name
  FROM public.app_user 
  WHERE auth_user_id = v_auth_user_id;
  
  IF v_app_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuario no encontrado en la base de datos');
  END IF;

  -- Validate that user has first_name and last_name in their profile
  IF v_first_name IS NULL OR TRIM(v_first_name) = '' OR v_last_name IS NULL OR TRIM(v_last_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Por favor completa tu nombre y apellido en tu perfil de usuario antes de solicitar una licencia');
  END IF;

  -- Validate weight_class from form data
  v_weight_class := NULLIF(TRIM(p_fighter_profile_data->>'weight_class'), '');
  IF v_weight_class IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Debes seleccionar una categoría de peso');
  END IF;

  -- Check for existing active fighter profile
  SELECT id INTO v_existing_fighter_id
  FROM public.fighter_profiles
  WHERE user_id = v_app_user_id AND active = true
  LIMIT 1;

  IF v_existing_fighter_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ya tienes un perfil de peleador activo', 'fighter_id', v_existing_fighter_id);
  END IF;

  -- Create fighter profile using app_user names and form data
  INSERT INTO public.fighter_profiles (
    user_id, first_name, last_name, nickname, country, gender, birthdate, birthplace,
    document_type, document_number, height_cm, weight_kg, reach_cm, blood_type,
    weight_class, fighting_style, stance, level, gym_name, discipline, martial_arts,
    record_wins, record_losses, record_draws, record_type, boxrec_url, tapology_url,
    medical_conditions, medical_allergies, insurance_company, insurance_policy,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    bio, avatar_url, active
  ) VALUES (
    v_app_user_id,
    v_first_name,
    v_last_name,
    NULLIF(TRIM(p_fighter_profile_data->>'nickname'), ''),
    COALESCE(NULLIF(TRIM(p_fighter_profile_data->>'country'), ''), 'HN'),
    NULLIF(TRIM(p_fighter_profile_data->>'gender'), ''),
    CASE WHEN NULLIF(TRIM(p_fighter_profile_data->>'birthdate'), '') IS NOT NULL THEN (p_fighter_profile_data->>'birthdate')::date ELSE NULL END,
    NULLIF(TRIM(p_fighter_profile_data->>'birthplace'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'document_type'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'document_number'), ''),
    CASE WHEN NULLIF(TRIM(p_fighter_profile_data->>'height_cm'), '') ~ '^[0-9]+$' THEN (p_fighter_profile_data->>'height_cm')::integer ELSE NULL END,
    CASE WHEN NULLIF(TRIM(p_fighter_profile_data->>'weight_kg'), '') ~ '^[0-9]+(\.[0-9]+)?$' THEN (p_fighter_profile_data->>'weight_kg')::numeric ELSE NULL END,
    CASE WHEN NULLIF(TRIM(p_fighter_profile_data->>'reach_cm'), '') ~ '^[0-9]+$' THEN (p_fighter_profile_data->>'reach_cm')::integer ELSE NULL END,
    NULLIF(TRIM(p_fighter_profile_data->>'blood_type'), ''),
    v_weight_class,
    NULLIF(TRIM(p_fighter_profile_data->>'fighting_style'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'stance'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'level'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'gym_name'), ''),
    CASE 
      WHEN NULLIF(TRIM(p_fighter_profile_data->>'discipline'), '') IN ('MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro')
      THEN (p_fighter_profile_data->>'discipline')::discipline
      ELSE NULL
    END,
    CASE WHEN jsonb_typeof(p_fighter_profile_data->'martial_arts') = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(p_fighter_profile_data->'martial_arts')) ELSE NULL END,
    CASE WHEN (p_fighter_profile_data->>'record_wins') ~ '^[0-9]+$' THEN (p_fighter_profile_data->>'record_wins')::integer ELSE 0 END,
    CASE WHEN (p_fighter_profile_data->>'record_losses') ~ '^[0-9]+$' THEN (p_fighter_profile_data->>'record_losses')::integer ELSE 0 END,
    CASE WHEN (p_fighter_profile_data->>'record_draws') ~ '^[0-9]+$' THEN (p_fighter_profile_data->>'record_draws')::integer ELSE 0 END,
    NULLIF(TRIM(p_fighter_profile_data->>'record_type'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'boxrec_url'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'tapology_url'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'medical_conditions'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'medical_allergies'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'insurance_company'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'insurance_policy'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'emergency_contact_name'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'emergency_contact_phone'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'emergency_contact_relation'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'bio'), ''),
    NULLIF(TRIM(p_fighter_profile_data->>'avatar_url'), ''),
    true
  ) RETURNING id INTO v_fighter_id;

  -- Create fighter license with generated license_number
  INSERT INTO public.fighter_licenses (
    fighter_id, license_level, status, discipline, created_by, license_number
  ) VALUES (
    v_fighter_id,
    COALESCE((p_license_data->>'license_level')::license_level, 'AMATEUR'::license_level),
    'PENDING_REVIEW'::license_status,
    CASE 
      WHEN NULLIF(TRIM(p_license_data->>'discipline'), '') IN ('MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro')
      THEN (p_license_data->>'discipline')::discipline
      ELSE NULL
    END,
    v_auth_user_id,
    public.generate_license_number()
  ) RETURNING id INTO v_license_id;

  -- Insert license documents correctly
  IF jsonb_array_length(p_document_urls) > 0 THEN
    INSERT INTO public.license_documents (
      license_id, document_type, file_path, file_name, uploaded_by
    )
    SELECT
      v_license_id,
      CASE WHEN lower(doc->>'type') IN ('identity','medical','photo','other') THEN lower(doc->>'type') ELSE 'identity' END,
      doc->>'url',
      regexp_replace(doc->>'url', '.*/', ''),
      v_auth_user_id
    FROM jsonb_array_elements(p_document_urls) AS doc;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Solicitud de licencia enviada correctamente', 'fighter_id', v_fighter_id, 'license_id', v_license_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error al procesar la solicitud: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_fighter_license(jsonb, jsonb, jsonb) TO authenticated;