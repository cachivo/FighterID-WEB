CREATE OR REPLACE FUNCTION public.check_email_exists_fn(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))
  ) OR EXISTS (
    SELECT 1 FROM public.app_user WHERE email = lower(trim(p_email))
  );
$$;