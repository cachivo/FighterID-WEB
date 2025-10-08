-- Función para que admins creen perfiles de peleadores sin user_id
CREATE OR REPLACE FUNCTION public.admin_create_fighter_profile(
  p_profile_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fighter_id uuid;
  v_license_number text;
BEGIN
  -- Solo admins pueden usar esta función
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create fighter profiles';
  END IF;

  -- Generar número de licencia si no existe
  v_license_number := COALESCE(
    (p_profile_data->>'license_number')::text,
    public.generate_license_number()
  );

  -- Crear perfil de peleador
  INSERT INTO public.fighter_profiles (
    first_name,
    last_name,
    nickname,
    country,
    weight_class,
    height_cm,
    weight_kg,
    reach_cm,
    record_wins,
    record_losses,
    record_draws,
    record_type,
    fighting_style,
    gym_name,
    bio,
    avatar_url,
    discipline,
    martial_arts,
    gender,
    level,
    birthdate,
    birthplace,
    blood_type,
    document_type,
    document_number,
    stance,
    license_number
  ) VALUES (
    (p_profile_data->>'first_name')::text,
    (p_profile_data->>'last_name')::text,
    NULLIF((p_profile_data->>'nickname')::text, ''),
    COALESCE((p_profile_data->>'country')::text, 'HN'),
    (p_profile_data->>'weight_class')::text,
    NULLIF((p_profile_data->>'height_cm')::integer, 0),
    NULLIF((p_profile_data->>'weight_kg')::numeric, 0),
    NULLIF((p_profile_data->>'reach_cm')::integer, 0),
    COALESCE((p_profile_data->>'record_wins')::integer, 0),
    COALESCE((p_profile_data->>'record_losses')::integer, 0),
    COALESCE((p_profile_data->>'record_draws')::integer, 0),
    COALESCE((p_profile_data->>'record_type')::text, 'Amateur'),
    NULLIF((p_profile_data->>'fighting_style')::text, ''),
    NULLIF((p_profile_data->>'gym_name')::text, ''),
    NULLIF((p_profile_data->>'bio')::text, ''),
    NULLIF((p_profile_data->>'avatar_url')::text, ''),
    CASE 
      WHEN (p_profile_data->>'discipline')::text IN ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro')
      THEN (p_profile_data->>'discipline')::discipline_type
      ELSE NULL
    END,
    CASE 
      WHEN p_profile_data->'martial_arts' IS NOT NULL AND jsonb_typeof(p_profile_data->'martial_arts') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
      ELSE ARRAY[]::text[]
    END,
    NULLIF((p_profile_data->>'gender')::text, ''),
    COALESCE((p_profile_data->>'level')::text, 'AMATEUR'),
    NULLIF((p_profile_data->>'birthdate')::date, NULL),
    NULLIF((p_profile_data->>'birthplace')::text, ''),
    NULLIF((p_profile_data->>'blood_type')::text, ''),
    NULLIF((p_profile_data->>'document_type')::text, ''),
    NULLIF((p_profile_data->>'document_number')::text, ''),
    NULLIF((p_profile_data->>'stance')::text, ''),
    v_license_number
  )
  RETURNING id INTO v_fighter_id;

  RETURN v_fighter_id;
END;
$$;