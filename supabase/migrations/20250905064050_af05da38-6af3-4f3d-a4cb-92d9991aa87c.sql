-- Fix discipline type conversion issue in admin_update_fighter_profile_v2
CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile_v2(p_fighter_id uuid, p_profile_data jsonb, p_admin_user_id uuid)
 RETURNS void
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

  -- Actualizar el perfil con manejo completo de todos los campos
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
    
    -- Handle martial_arts as JSON array
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
    
    -- Handle discipline enum type - simplified approach
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' AND p_profile_data->>'discipline' IS NOT NULL 
           AND p_profile_data->>'discipline' != '' AND p_profile_data->>'discipline' != 'null' THEN
        (p_profile_data->>'discipline')::discipline_type
      ELSE discipline
    END,
    
    -- Handle critical fields for Fighter ID completion
    document_type = CASE 
      WHEN p_profile_data ? 'document_type' THEN
        CASE 
          WHEN p_profile_data->>'document_type' IS NULL OR p_profile_data->>'document_type' = '' OR p_profile_data->>'document_type' = 'null' THEN NULL
          ELSE (p_profile_data->>'document_type')::text
        END
      ELSE document_type
    END,
    
    document_number = CASE 
      WHEN p_profile_data ? 'document_number' THEN
        CASE 
          WHEN p_profile_data->>'document_number' IS NULL OR p_profile_data->>'document_number' = '' OR p_profile_data->>'document_number' = 'null' THEN NULL
          ELSE (p_profile_data->>'document_number')::text
        END
      ELSE document_number
    END,
    
    birthdate = CASE 
      WHEN p_profile_data ? 'birthdate' THEN
        CASE 
          WHEN p_profile_data->>'birthdate' IS NULL OR p_profile_data->>'birthdate' = '' OR p_profile_data->>'birthdate' = 'null' THEN NULL
          ELSE (p_profile_data->>'birthdate')::date
        END
      ELSE birthdate
    END,
    
    blood_type = CASE 
      WHEN p_profile_data ? 'blood_type' THEN
        CASE 
          WHEN p_profile_data->>'blood_type' IS NULL OR p_profile_data->>'blood_type' = '' OR p_profile_data->>'blood_type' = 'null' THEN NULL
          ELSE (p_profile_data->>'blood_type')::text
        END
      ELSE blood_type
    END,
    
    -- Handle physical attributes
    height_cm = CASE 
      WHEN p_profile_data ? 'height_cm' THEN
        CASE 
          WHEN p_profile_data->>'height_cm' IS NULL OR p_profile_data->>'height_cm' = '' OR p_profile_data->>'height_cm' = 'null' THEN NULL
          ELSE (p_profile_data->>'height_cm')::integer
        END
      ELSE height_cm
    END,
    
    weight_kg = CASE 
      WHEN p_profile_data ? 'weight_kg' THEN
        CASE 
          WHEN p_profile_data->>'weight_kg' IS NULL OR p_profile_data->>'weight_kg' = '' OR p_profile_data->>'weight_kg' = 'null' THEN NULL
          ELSE (p_profile_data->>'weight_kg')::numeric
        END
      ELSE weight_kg
    END,
    
    reach_cm = CASE 
      WHEN p_profile_data ? 'reach_cm' THEN
        CASE 
          WHEN p_profile_data->>'reach_cm' IS NULL OR p_profile_data->>'reach_cm' = '' OR p_profile_data->>'reach_cm' = 'null' THEN NULL
          ELSE (p_profile_data->>'reach_cm')::integer
        END
      ELSE reach_cm
    END,
    
    fighting_style = CASE 
      WHEN p_profile_data ? 'fighting_style' THEN
        CASE 
          WHEN p_profile_data->>'fighting_style' IS NULL OR p_profile_data->>'fighting_style' = '' OR p_profile_data->>'fighting_style' = 'null' THEN NULL
          ELSE (p_profile_data->>'fighting_style')::text
        END
      ELSE fighting_style
    END,
    
    gym_name = CASE 
      WHEN p_profile_data ? 'gym_name' THEN
        CASE 
          WHEN p_profile_data->>'gym_name' IS NULL OR p_profile_data->>'gym_name' = '' OR p_profile_data->>'gym_name' = 'null' THEN NULL
          ELSE (p_profile_data->>'gym_name')::text
        END
      ELSE gym_name
    END,
    
    -- Handle medical fields
    medical_conditions = CASE 
      WHEN p_profile_data ? 'medical_conditions' THEN
        CASE 
          WHEN p_profile_data->>'medical_conditions' IS NULL OR p_profile_data->>'medical_conditions' = '' OR p_profile_data->>'medical_conditions' = 'null' THEN NULL
          ELSE (p_profile_data->>'medical_conditions')::text
        END
      ELSE medical_conditions
    END,
    
    medical_allergies = CASE 
      WHEN p_profile_data ? 'medical_allergies' THEN
        CASE 
          WHEN p_profile_data->>'medical_allergies' IS NULL OR p_profile_data->>'medical_allergies' = '' OR p_profile_data->>'medical_allergies' = 'null' THEN NULL
          ELSE (p_profile_data->>'medical_allergies')::text
        END
      ELSE medical_allergies
    END,
    
    -- Handle other existing fields
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
    
    -- Handle emergency contact fields
    emergency_contact_name = CASE 
      WHEN p_profile_data ? 'emergency_contact_name' THEN
        CASE 
          WHEN p_profile_data->>'emergency_contact_name' IS NULL OR p_profile_data->>'emergency_contact_name' = '' OR p_profile_data->>'emergency_contact_name' = 'null' THEN NULL
          ELSE (p_profile_data->>'emergency_contact_name')::text
        END
      ELSE emergency_contact_name
    END,
    
    emergency_contact_relation = CASE 
      WHEN p_profile_data ? 'emergency_contact_relation' THEN
        CASE 
          WHEN p_profile_data->>'emergency_contact_relation' IS NULL OR p_profile_data->>'emergency_contact_relation' = '' OR p_profile_data->>'emergency_contact_relation' = 'null' THEN NULL
          ELSE (p_profile_data->>'emergency_contact_relation')::text
        END
      ELSE emergency_contact_relation
    END,
    
    emergency_contact_phone = CASE 
      WHEN p_profile_data ? 'emergency_contact_phone' THEN
        CASE 
          WHEN p_profile_data->>'emergency_contact_phone' IS NULL OR p_profile_data->>'emergency_contact_phone' = '' OR p_profile_data->>'emergency_contact_phone' = 'null' THEN NULL
          ELSE (p_profile_data->>'emergency_contact_phone')::text
        END
      ELSE emergency_contact_phone
    END,
    
    -- Handle bio field
    bio = CASE 
      WHEN p_profile_data ? 'bio' THEN
        CASE 
          WHEN p_profile_data->>'bio' IS NULL OR p_profile_data->>'bio' = '' OR p_profile_data->>'bio' = 'null' THEN NULL
          ELSE (p_profile_data->>'bio')::text
        END
      ELSE bio
    END,
    
    updated_at = now()
  WHERE id = p_fighter_id;
  
  -- Verificar que al menos una fila fue actualizada
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fighter profile not found with id: %', p_fighter_id;
  END IF;
END;
$function$;