-- Create storage bucket for coach avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('coaches', 'coaches', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view coach avatars
CREATE POLICY "Coach avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'coaches');

-- Policy: Admins can upload coach avatars
CREATE POLICY "Admins can upload coach avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coaches' AND
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Policy: Admins can update coach avatars
CREATE POLICY "Admins can update coach avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coaches' AND
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Policy: Admins can delete coach avatars
CREATE POLICY "Admins can delete coach avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'coaches' AND
  EXISTS (
    SELECT 1 FROM public.app_user 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);