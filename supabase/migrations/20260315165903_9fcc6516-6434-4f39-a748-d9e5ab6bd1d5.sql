DROP POLICY IF EXISTS "Public can read vision sync sessions" ON public.vision_sync_sessions;

CREATE POLICY "Public can read recent vision sync sessions"
  ON public.vision_sync_sessions
  FOR SELECT
  USING (created_at >= now() - interval '24 hours');