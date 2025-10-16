-- Update request_fighter_license function to handle empty strings gracefully
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
  v_fighter_id uuid;
  v_license_id uuid;
  v_existing_profile_id uuid;
  v_license_number text;
BEGIN
  -- Get authenticated user
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuario no autenticado'
    );
  END IF;

  -- Get app_user_id
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_user_id = v_auth_user_id;

  IF v_app_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Perfil de usuario no encontrado'
    );
  END IF;

  -- Check for existing active fighter profile
  SELECT id INTO v_existing_profile_id
  FROM public.fighter_profiles
  WHERE user_id = v_app_user_id
  AND active = true
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL THEN
    -- Get license number if exists
    SELECT license_number INTO v_license_number
    FROM public.fighter_profiles
    WHERE id = v_existing_profile_id;

    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ya tienes una Fighter ID activa' || COALESCE(' (' || v_license_number || ')', ''),
      'existing_profile_id', v_existing_profile_id
    );
  END IF;

  -- Create fighter profile with NULLIF for empty strings
  INSERT INTO public.fighter_profiles (
    user_id,
    first_name,
    last_name,
    nickname,
    country,
    gender,
    birthdate,
    birthplace,
    document_type,
    document_number,
    height_cm,
    weight_kg,
    reach_cm,
    blood_type,
    weight_class,
    fighting_style,
    stance,
    level,
    gym_name,
    discipline,
    martial_arts,
    record_wins,
    record_losses,
    record_draws,
    record_type,
    boxrec_url,
    tapology_url,
    medical_conditions,
    medical_allergies,
    insurance_company,
    insurance_policy,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relation,
    bio,
    avatar_url,
    active
  ) VALUES (
    v_app_user_id,
    NULLIF(p_fighter_profile_data->>'first_name', ''),
    NULLIF(p_fighter_profile_data->>'last_name', ''),
    NULLIF(p_fighter_profile_data->>'nickname', ''),
    COALESCE(NULLIF(p_fighter_profile_data->>'country', ''), 'HN'),
    NULLIF(p_fighter_profile_data->>'gender', ''),
    (NULLIF(p_fighter_profile_data->>'birthdate', ''))::date,
    NULLIF(p_fighter_profile_data->>'birthplace', ''),
    NULLIF(p_fighter_profile_data->>'document_type', ''),
    NULLIF(p_fighter_profile_data->>'document_number', ''),
    (NULLIF(p_fighter_profile_data->>'height_cm', ''))::integer,
    (NULLIF(p_fighter_profile_data->>'weight_kg', ''))::numeric,
    (NULLIF(p_fighter_profile_data->>'reach_cm', ''))::integer,
    NULLIF(p_fighter_profile_data->>'blood_type', ''),
    NULLIF(p_fighter_profile_data->>'weight_class', ''),
    NULLIF(p_fighter_profile_data->>'fighting_style', ''),
    NULLIF(p_fighter_profile_data->>'stance', ''),
    NULLIF(p_fighter_profile_data->>'level', ''),
    NULLIF(p_fighter_profile_data->>'gym_name', ''),
    (NULLIF(p_fighter_profile_data->>'discipline', ''))::discipline,
    CASE 
      WHEN jsonb_typeof(p_fighter_profile_data->'martial_arts') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(p_fighter_profile_data->'martial_arts'))
      ELSE NULL
    END,
    COALESCE((NULLIF(p_fighter_profile_data->>'record_wins', ''))::integer, 0),
    COALESCE((NULLIF(p_fighter_profile_data->>'record_losses', ''))::integer, 0),
    COALESCE((NULLIF(p_fighter_profile_data->>'record_draws', ''))::integer, 0),
    NULLIF(p_fighter_profile_data->>'record_type', ''),
    NULLIF(p_fighter_profile_data->>'boxrec_url', ''),
    NULLIF(p_fighter_profile_data->>'tapology_url', ''),
    NULLIF(p_fighter_profile_data->>'medical_conditions', ''),
    NULLIF(p_fighter_profile_data->>'medical_allergies', ''),
    NULLIF(p_fighter_profile_data->>'insurance_company', ''),
    NULLIF(p_fighter_profile_data->>'insurance_policy', ''),
    NULLIF(p_fighter_profile_data->>'emergency_contact_name', ''),
    NULLIF(p_fighter_profile_data->>'emergency_contact_phone', ''),
    NULLIF(p_fighter_profile_data->>'emergency_contact_relation', ''),
    NULLIF(p_fighter_profile_data->>'bio', ''),
    NULLIF(p_fighter_profile_data->>'avatar_url', ''),
    true
  ) RETURNING id INTO v_fighter_id;

  -- Create fighter license
  INSERT INTO public.fighter_licenses (
    fighter_id,
    license_level,
    discipline,
    status,
    created_by
  ) VALUES (
    v_fighter_id,
    COALESCE((p_license_data->>'license_level')::license_level, 'AMATEUR'::license_level),
    (NULLIF(p_license_data->>'discipline', ''))::discipline,
    'PENDING_REVIEW'::license_status,
    v_auth_user_id
  ) RETURNING id INTO v_license_id;

  -- Create license documents if provided
  IF jsonb_array_length(p_document_urls) > 0 THEN
    INSERT INTO public.license_documents (license_id, document_type, file_url)
    SELECT 
      v_license_id,
      doc->>'type',
      doc->>'url'
    FROM jsonb_array_elements(p_document_urls) AS doc;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Solicitud de licencia enviada correctamente',
    'fighter_id', v_fighter_id,
    'license_id', v_license_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error al procesar solicitud: ' || SQLERRM
    );
END;
$$;