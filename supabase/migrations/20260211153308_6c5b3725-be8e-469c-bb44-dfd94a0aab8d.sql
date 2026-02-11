
-- Assign super_admin role to cachivo@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('d9204e92-eb8c-4ed4-95b0-3b9dd8423bd7', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create bucket for system assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT DO NOTHING;

-- RLS for bucket
CREATE POLICY "Super admins can upload system assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'system-assets' 
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Super admins can update system assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'system-assets' 
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Super admins can delete system assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'system-assets' 
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Anyone can view system assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'system-assets');

-- Insert initial config values
INSERT INTO configuracion_sitio (clave, valor, descripcion) VALUES
('system_logo_url', '/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png', 'Logo principal del sistema'),
('system_ranking_bg_url', '/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png', 'Fondo de la seccion de ranking'),
('system_ucc_logo_url', '/lovable-uploads/ucc-logo-transparent.png', 'Logo de UCC'),
('system_hoodfights_logo_url', '/lovable-uploads/honduras-hoodfights-logo.png', 'Logo de Hoodfights'),
('system_octagon_bg_url', '/lovable-uploads/octagon-background.png', 'Fondo octagon para perfiles')
ON CONFLICT DO NOTHING;
