-- Function to enroll a fighter in a ranking organization
CREATE OR REPLACE FUNCTION public.enroll_fighter_in_ranking(
  p_fighter_id UUID,
  p_organization_code TEXT,
  p_level TEXT,
  p_weight_class TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_organization_id UUID;
  v_allowed_levels TEXT[];
  v_ranking_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Verify caller is admin
  SELECT is_admin INTO v_is_admin FROM public.app_user WHERE auth_user_id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can enroll fighters in rankings';
  END IF;

  -- Get organization ID and allowed levels
  SELECT id, allowed_levels INTO v_organization_id, v_allowed_levels
  FROM public.ranking_organizations
  WHERE code = p_organization_code AND is_active = true;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found or inactive: %', p_organization_code;
  END IF;

  -- Validate level is allowed for this organization
  IF NOT (p_level = ANY(v_allowed_levels)) THEN
    RAISE EXCEPTION 'Level "%" is not allowed for organization "%". Allowed: %', p_level, p_organization_code, v_allowed_levels;
  END IF;

  -- Check for existing enrollment (same fighter, org, level, weight class)
  IF EXISTS (
    SELECT 1 FROM public.fighter_rankings
    WHERE fighter_id = p_fighter_id
      AND organization_id = v_organization_id
      AND level = p_level
      AND weight_class = p_weight_class
  ) THEN
    RAISE EXCEPTION 'Fighter is already enrolled in this organization/level/weight class combination';
  END IF;

  -- Verify fighter exists and is active
  IF NOT EXISTS (SELECT 1 FROM public.fighter_profiles WHERE id = p_fighter_id AND active = true) THEN
    RAISE EXCEPTION 'Fighter not found or inactive: %', p_fighter_id;
  END IF;

  -- Create ranking entry with 0 initial points
  INSERT INTO public.fighter_rankings (
    fighter_id,
    organization_id,
    level,
    weight_class,
    points,
    is_active,
    ranking_position
  ) VALUES (
    p_fighter_id,
    v_organization_id,
    p_level,
    p_weight_class,
    0,
    true,
    NULL
  ) RETURNING id INTO v_ranking_id;

  RETURN v_ranking_id;
END;
$$;

-- Function to remove a fighter from a ranking
CREATE OR REPLACE FUNCTION public.remove_fighter_from_ranking(
  p_ranking_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verify caller is admin
  SELECT is_admin INTO v_is_admin FROM public.app_user WHERE auth_user_id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can remove fighters from rankings';
  END IF;

  -- Soft delete by setting is_active to false
  UPDATE public.fighter_rankings
  SET is_active = false
  WHERE id = p_ranking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ranking entry not found: %', p_ranking_id;
  END IF;
END;
$$;

-- Function to update a fighter's ranking level (e.g., promote from Amateur to Semi-pro)
CREATE OR REPLACE FUNCTION public.update_fighter_ranking_level(
  p_ranking_id UUID,
  p_new_level TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_organization_id UUID;
  v_allowed_levels TEXT[];
BEGIN
  -- Verify caller is admin
  SELECT is_admin INTO v_is_admin FROM public.app_user WHERE auth_user_id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update ranking levels';
  END IF;

  -- Get organization_id from ranking
  SELECT organization_id INTO v_organization_id
  FROM public.fighter_rankings
  WHERE id = p_ranking_id;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Ranking entry not found: %', p_ranking_id;
  END IF;

  -- Get allowed levels for the organization
  SELECT allowed_levels INTO v_allowed_levels
  FROM public.ranking_organizations
  WHERE id = v_organization_id;

  -- Validate new level is allowed
  IF NOT (p_new_level = ANY(v_allowed_levels)) THEN
    RAISE EXCEPTION 'Level "%" is not allowed for this organization. Allowed: %', p_new_level, v_allowed_levels;
  END IF;

  -- Update the level
  UPDATE public.fighter_rankings
  SET level = p_new_level
  WHERE id = p_ranking_id;
END;
$$;