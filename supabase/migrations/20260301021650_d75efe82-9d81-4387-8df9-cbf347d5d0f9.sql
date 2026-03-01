
-- Drop and recreate admin_update_fighter_profile with correct return type
DROP FUNCTION IF EXISTS public.admin_update_fighter_profile(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.admin_update_fighter_profile(p_fighter_id uuid, p_profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer;
  v_discipline text;
  v_level text;
  v_weight_class text;
  v_points integer;
BEGIN
  v_discipline := p_profile_data->>'discipline';
  v_level := p_profile_data->>'level';
  v_weight_class := p_profile_data->>'weight_class';

  UPDATE fighter_profiles
  SET
    first_name = CASE WHEN p_profile_data ? 'first_name' THEN p_profile_data->>'first_name' ELSE first_name END,
    last_name = CASE WHEN p_profile_data ? 'last_name' THEN p_profile_data->>'last_name' ELSE last_name END,
    nickname = CASE WHEN p_profile_data ? 'nickname' THEN p_profile_data->>'nickname' ELSE nickname END,
    country = CASE WHEN p_profile_data ? 'country' THEN p_profile_data->>'country' ELSE country END,
    height_cm = CASE WHEN p_profile_data ? 'height_cm' THEN (p_profile_data->>'height_cm')::integer ELSE height_cm END,
    weight_kg = CASE WHEN p_profile_data ? 'weight_kg' THEN (p_profile_data->>'weight_kg')::numeric ELSE weight_kg END,
    reach_cm = CASE WHEN p_profile_data ? 'reach_cm' THEN (p_profile_data->>'reach_cm')::integer ELSE reach_cm END,
    weight_class = CASE WHEN p_profile_data ? 'weight_class' THEN p_profile_data->>'weight_class' ELSE weight_class END,
    fighting_style = CASE WHEN p_profile_data ? 'fighting_style' THEN p_profile_data->>'fighting_style' ELSE fighting_style END,
    stance = CASE WHEN p_profile_data ? 'stance' THEN p_profile_data->>'stance' ELSE stance END,
    gym_name = CASE WHEN p_profile_data ? 'gym_name' THEN p_profile_data->>'gym_name' ELSE gym_name END,
    gym_id = CASE 
      WHEN p_profile_data ? 'gym_id' AND p_profile_data->>'gym_id' IS NOT NULL AND p_profile_data->>'gym_id' != '' 
        THEN (p_profile_data->>'gym_id')::uuid 
      WHEN p_profile_data ? 'gym_id' THEN NULL 
      ELSE gym_id 
    END,
    level = CASE WHEN p_profile_data ? 'level' THEN p_profile_data->>'level' ELSE level END,
    discipline = CASE 
      WHEN p_profile_data ? 'discipline' 
           AND p_profile_data->>'discipline' IS NOT NULL 
           AND p_profile_data->>'discipline' != '' 
      THEN (p_profile_data->>'discipline')::discipline 
      ELSE discipline 
    END,
    gender = CASE WHEN p_profile_data ? 'gender' THEN p_profile_data->>'gender' ELSE gender END,
    birthdate = CASE WHEN p_profile_data ? 'birthdate' AND p_profile_data->>'birthdate' != '' THEN (p_profile_data->>'birthdate')::date ELSE birthdate END,
    birthplace = CASE WHEN p_profile_data ? 'birthplace' THEN p_profile_data->>'birthplace' ELSE birthplace END,
    bio = CASE WHEN p_profile_data ? 'bio' THEN p_profile_data->>'bio' ELSE bio END,
    avatar_url = CASE WHEN p_profile_data ? 'avatar_url' THEN p_profile_data->>'avatar_url' ELSE avatar_url END,
    boxrec_url = CASE WHEN p_profile_data ? 'boxrec_url' THEN p_profile_data->>'boxrec_url' ELSE boxrec_url END,
    tapology_url = CASE WHEN p_profile_data ? 'tapology_url' THEN p_profile_data->>'tapology_url' ELSE tapology_url END,
    record_wins = CASE WHEN p_profile_data ? 'record_wins' THEN (p_profile_data->>'record_wins')::integer ELSE record_wins END,
    record_losses = CASE WHEN p_profile_data ? 'record_losses' THEN (p_profile_data->>'record_losses')::integer ELSE record_losses END,
    record_draws = CASE WHEN p_profile_data ? 'record_draws' THEN (p_profile_data->>'record_draws')::integer ELSE record_draws END,
    record_type = CASE WHEN p_profile_data ? 'record_type' THEN p_profile_data->>'record_type' ELSE record_type END,
    mma_record_wins = CASE WHEN p_profile_data ? 'mma_record_wins' THEN (p_profile_data->>'mma_record_wins')::integer ELSE mma_record_wins END,
    mma_record_losses = CASE WHEN p_profile_data ? 'mma_record_losses' THEN (p_profile_data->>'mma_record_losses')::integer ELSE mma_record_losses END,
    mma_record_draws = CASE WHEN p_profile_data ? 'mma_record_draws' THEN (p_profile_data->>'mma_record_draws')::integer ELSE mma_record_draws END,
    boxeo_record_wins = CASE WHEN p_profile_data ? 'boxeo_record_wins' THEN (p_profile_data->>'boxeo_record_wins')::integer ELSE boxeo_record_wins END,
    boxeo_record_losses = CASE WHEN p_profile_data ? 'boxeo_record_losses' THEN (p_profile_data->>'boxeo_record_losses')::integer ELSE boxeo_record_losses END,
    boxeo_record_draws = CASE WHEN p_profile_data ? 'boxeo_record_draws' THEN (p_profile_data->>'boxeo_record_draws')::integer ELSE boxeo_record_draws END,
    martial_arts = CASE
      WHEN p_profile_data ? 'martial_arts' AND p_profile_data->'martial_arts' IS NOT NULL AND jsonb_typeof(p_profile_data->'martial_arts') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(p_profile_data->'martial_arts'))
      ELSE martial_arts
    END,
    blood_type = CASE WHEN p_profile_data ? 'blood_type' THEN p_profile_data->>'blood_type' ELSE blood_type END,
    document_type = CASE WHEN p_profile_data ? 'document_type' THEN p_profile_data->>'document_type' ELSE document_type END,
    document_number = CASE WHEN p_profile_data ? 'document_number' THEN p_profile_data->>'document_number' ELSE document_number END,
    emergency_contact_name = CASE WHEN p_profile_data ? 'emergency_contact_name' THEN p_profile_data->>'emergency_contact_name' ELSE emergency_contact_name END,
    emergency_contact_relation = CASE WHEN p_profile_data ? 'emergency_contact_relation' THEN p_profile_data->>'emergency_contact_relation' ELSE emergency_contact_relation END,
    emergency_contact_phone = CASE WHEN p_profile_data ? 'emergency_contact_phone' THEN p_profile_data->>'emergency_contact_phone' ELSE emergency_contact_phone END,
    medical_conditions = CASE WHEN p_profile_data ? 'medical_conditions' THEN p_profile_data->>'medical_conditions' ELSE medical_conditions END,
    medical_allergies = CASE WHEN p_profile_data ? 'medical_allergies' THEN p_profile_data->>'medical_allergies' ELSE medical_allergies END,
    insurance_company = CASE WHEN p_profile_data ? 'insurance_company' THEN p_profile_data->>'insurance_company' ELSE insurance_company END,
    insurance_policy = CASE WHEN p_profile_data ? 'insurance_policy' THEN p_profile_data->>'insurance_policy' ELSE insurance_policy END,
    updated_at = now()
  WHERE id = p_fighter_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'Fighter profile not found: %', p_fighter_id;
  END IF;

  IF v_discipline IS NOT NULL AND v_discipline != '' THEN
    UPDATE fighter_rankings fr
    SET
      weight_class = COALESCE(v_weight_class, fr.weight_class),
      level = COALESCE(v_level, fr.level),
      updated_at = now()
    FROM ranking_organizations ro
    WHERE fr.fighter_id = p_fighter_id
      AND fr.organization_id = ro.id
      AND ro.discipline = v_discipline;
  END IF;
END;
$$;
