-- Add gym invite_code column for trainer self-join flow
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate codes for existing gyms that don't have one
UPDATE public.gyms
SET invite_code = 'GYM-' || upper(substring(md5(random()::text || id::text) from 1 for 6))
WHERE invite_code IS NULL;

-- RPC: trainer requests to join a gym via code (creates inactive gym_staff row)
CREATE OR REPLACE FUNCTION public.request_join_gym(p_gym_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gym_id UUID;
  v_app_user_id UUID;
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT id INTO v_app_user_id FROM public.app_user WHERE auth_user_id = v_auth_user_id;
  IF v_app_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No profile found. Complete your profile first.');
  END IF;

  SELECT id INTO v_gym_id FROM public.gyms WHERE invite_code = p_gym_code;
  IF v_gym_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid gym code');
  END IF;

  INSERT INTO public.gym_staff (gym_id, user_id, role, active)
  VALUES (v_gym_id, v_app_user_id, 'COACH', false)
  ON CONFLICT (gym_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'gym_id', v_gym_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_join_gym(TEXT) TO authenticated;