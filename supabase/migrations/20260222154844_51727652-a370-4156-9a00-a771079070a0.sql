
-- Create gym_invitations table
CREATE TABLE public.gym_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  email text NOT NULL,
  coach_name text,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_gym_invitation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.expires_at <= now() AND NEW.status = 'pending' THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_gym_invitation
  BEFORE INSERT OR UPDATE ON public.gym_invitations
  FOR EACH ROW EXECUTE FUNCTION public.validate_gym_invitation_status();

-- RLS
ALTER TABLE public.gym_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage gym_invitations"
  ON public.gym_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Users can read their own invitation by email
CREATE POLICY "Users can view own gym invitation"
  ON public.gym_invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can accept their own invitation
CREATE POLICY "Users can accept own gym invitation"
  ON public.gym_invitations
  FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'accepted'
  );

-- Create RPC to accept gym invitation (handles all linking)
CREATE OR REPLACE FUNCTION public.accept_gym_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_auth_user_id uuid;
  v_app_user_id uuid;
  v_gym_name text;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get and validate invitation
  SELECT * INTO v_invitation
  FROM public.gym_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitación no válida o expirada');
  END IF;

  -- Get or create app_user
  SELECT id INTO v_app_user_id FROM public.app_user WHERE auth_user_id = v_auth_user_id;
  IF v_app_user_id IS NULL THEN
    INSERT INTO public.app_user (auth_user_id, email, handle, first_name)
    VALUES (
      v_auth_user_id,
      v_invitation.email,
      'gym_' || substring(gen_random_uuid()::text, 1, 8),
      COALESCE(v_invitation.coach_name, 'Coach')
    )
    RETURNING id INTO v_app_user_id;
  END IF;

  -- Insert into gym_staff as OWNER (skip if already exists)
  INSERT INTO public.gym_staff (gym_id, user_id, role, active)
  VALUES (v_invitation.gym_id, v_app_user_id, 'OWNER', true)
  ON CONFLICT DO NOTHING;

  -- Assign gym_owner role (skip if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_auth_user_id, 'gym_owner')
  ON CONFLICT DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.gym_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;

  -- Get gym name for response
  SELECT nombre INTO v_gym_name FROM public.gyms WHERE id = v_invitation.gym_id;

  RETURN jsonb_build_object(
    'success', true,
    'gym_id', v_invitation.gym_id,
    'gym_name', v_gym_name
  );
END;
$$;
