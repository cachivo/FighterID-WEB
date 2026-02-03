-- Tabla para cola de emails
CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  campaign_id UUID REFERENCES public.email_campaign_log(id) ON DELETE SET NULL,
  scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  resend_id TEXT
);

-- Tabla para tracking de uso diario
CREATE TABLE public.email_daily_usage (
  date DATE PRIMARY KEY,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimización
CREATE INDEX idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_for);
CREATE INDEX idx_email_queue_campaign_id ON public.email_queue(campaign_id);
CREATE INDEX idx_email_queue_priority ON public.email_queue(priority, created_at);

-- Habilitar RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_daily_usage ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo admins pueden ver/modificar
CREATE POLICY "Admins can view email queue"
ON public.email_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can manage email queue"
ON public.email_queue FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can view daily usage"
ON public.email_daily_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can manage daily usage"
ON public.email_daily_usage FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_user
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Función helper para obtener/actualizar uso diario
CREATE OR REPLACE FUNCTION public.get_or_create_daily_usage(target_date DATE)
RETURNS public.email_daily_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_record public.email_daily_usage;
BEGIN
  SELECT * INTO usage_record FROM public.email_daily_usage WHERE date = target_date;
  
  IF NOT FOUND THEN
    INSERT INTO public.email_daily_usage (date, emails_sent)
    VALUES (target_date, 0)
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$;

-- Función para incrementar contador diario
CREATE OR REPLACE FUNCTION public.increment_daily_email_count(target_date DATE, increment_by INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.email_daily_usage (date, emails_sent, updated_at)
  VALUES (target_date, increment_by, now())
  ON CONFLICT (date) DO UPDATE
  SET emails_sent = public.email_daily_usage.emails_sent + increment_by,
      updated_at = now()
  RETURNING emails_sent INTO new_count;
  
  RETURN new_count;
END;
$$;