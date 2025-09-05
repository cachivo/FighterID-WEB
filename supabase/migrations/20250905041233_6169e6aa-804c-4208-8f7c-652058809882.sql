-- Crear función alternativa para actualización de peleadores
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v2(
  p_fighter_id uuid, 
  p_profile_data jsonb,
  p_admin_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- Verificar si el usuario proporcionado es admin
  SELECT is_admin INTO v_is_admin
  FROM public.app_user 
  WHERE id = p_admin_user_id;
  
  -- Si no se encuentra el usuario o no es admin, rechazar
  IF NOT FOUND OR v_is_admin IS FALSE THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin or does not exist';
  END IF;

  -- Actualizar el perfil con manejo mejorado de martial_arts y otros campos
  UPDATE public.fighter_profiles
  SET 
    first_name = COALESCE((p_profile_data->>'first_name')::text, first_name),
    last_name = COALESCE((p_profile_data->>'last_name')::text, last_name),
    nickname = COALESCE((p_profile_data->>'nickname')::text, nickname),
    country = COALESCE((p_profile_data->>'country')::text, country),
    weight_class = COALESCE((p_profile_data->>'weight_class')::text, weight_class),
    avatar_url = COALESCE((p_profile_data->>'avatar_url')::text, avatar_url),
    record_wins = COALESCE((p_profile_data->>'record_wins')::integer, record_wins),
    record_losses = COALESCE((p_profile_data->>'record_losses')::integer, record_losses),
    record_draws = COALESCE((p_profile_data->>'record_draws')::integer, record_draws),
    elo_rating = COALESCE((p_profile_data->>'elo_rating')::integer, elo_rating),
    -- Manejar martial_arts como array JSON
    martial_arts = CASE 
      WHEN p_profile_data ? 'martial_arts' THEN
        CASE 
          WHEN p_profile_data->'martial_arts' = 'null'::jsonb THEN NULL
          WHEN jsonb_typeof(p_profile_data->'martial_arts') = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
          ELSE martial_arts
        END
      ELSE martial_arts
    END,
    -- Manejar discipline: permite NULL y valida enum correctamente
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' THEN
        CASE 
          WHEN p_profile_data->>'discipline' IS NULL OR p_profile_data->>'discipline' = '' OR p_profile_data->>'discipline' = 'null' THEN NULL
          WHEN p_profile_data->>'discipline' IN ('MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro') THEN 
            (p_profile_data->>'discipline')::discipline_type
          ELSE discipline
        END
      ELSE discipline
    END,
    -- Manejar nuevos campos
    gender = CASE 
      WHEN p_profile_data ? 'gender' THEN
        CASE 
          WHEN p_profile_data->>'gender' IS NULL OR p_profile_data->>'gender' = '' OR p_profile_data->>'gender' = 'null' THEN NULL
          ELSE (p_profile_data->>'gender')::text
        END
      ELSE gender
    END,
    sherdog_url = CASE 
      WHEN p_profile_data ? 'sherdog_url' THEN
        CASE 
          WHEN p_profile_data->>'sherdog_url' IS NULL OR p_profile_data->>'sherdog_url' = '' OR p_profile_data->>'sherdog_url' = 'null' THEN NULL
          ELSE (p_profile_data->>'sherdog_url')::text
        END
      ELSE sherdog_url
    END,
    tapology_url = CASE 
      WHEN p_profile_data ? 'tapology_url' THEN
        CASE 
          WHEN p_profile_data->>'tapology_url' IS NULL OR p_profile_data->>'tapology_url' = '' OR p_profile_data->>'tapology_url' = 'null' THEN NULL
          ELSE (p_profile_data->>'tapology_url')::text
        END
      ELSE tapology_url
    END,
    stance = CASE 
      WHEN p_profile_data ? 'stance' THEN
        CASE 
          WHEN p_profile_data->>'stance' IS NULL OR p_profile_data->>'stance' = '' OR p_profile_data->>'stance' = 'null' THEN NULL
          ELSE (p_profile_data->>'stance')::text
        END
      ELSE stance
    END,
    level = CASE 
      WHEN p_profile_data ? 'level' THEN
        CASE 
          WHEN p_profile_data->>'level' IS NULL OR p_profile_data->>'level' = '' OR p_profile_data->>'level' = 'null' THEN NULL
          ELSE (p_profile_data->>'level')::text
        END
      ELSE level
    END,
    updated_at = now()
  WHERE id = p_fighter_id;
  
  -- Verificar que al menos una fila fue actualizada
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter profile not found with id: %', p_fighter_id;
  END IF;
END;
$function$;