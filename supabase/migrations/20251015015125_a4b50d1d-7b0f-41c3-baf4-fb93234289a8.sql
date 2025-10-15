-- Tabla para guardar historial de campañas de email
CREATE TABLE IF NOT EXISTS public.email_campaign_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  recipient_filter TEXT NOT NULL DEFAULT 'all',
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.email_campaign_log ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver campañas
CREATE POLICY "Admins can view campaigns"
  ON public.email_campaign_log
  FOR SELECT
  USING (is_admin());

-- Política: Sistema puede insertar campañas
CREATE POLICY "System can insert campaigns"
  ON public.email_campaign_log
  FOR INSERT
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_email_campaigns_created_at 
  ON public.email_campaign_log(created_at DESC);

CREATE INDEX idx_email_campaigns_sent_by 
  ON public.email_campaign_log(sent_by);

COMMENT ON TABLE public.email_campaign_log IS 
  'Historial de todas las campañas de correo masivo enviadas desde la plataforma';