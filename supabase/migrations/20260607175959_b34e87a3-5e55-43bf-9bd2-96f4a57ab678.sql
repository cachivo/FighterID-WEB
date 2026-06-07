INSERT INTO public.app_user (auth_user_id, email, handle, created_at, updated_at)
SELECT
  au.id,
  au.email,
  -- Sanitized email-prefix + short suffix from the auth uuid to guarantee uniqueness
  regexp_replace(split_part(au.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g')
    || '_' || substr(replace(au.id::text, '-', ''), 1, 8) AS handle,
  COALESCE(au.created_at, now()),
  now()
FROM auth.users au
LEFT JOIN public.app_user ap ON ap.auth_user_id = au.id
WHERE ap.id IS NULL
  AND au.email IS NOT NULL;