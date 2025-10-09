-- FASE 1: MIGRACIONES COMPLETAS
-- 1. Link Previews
CREATE TABLE IF NOT EXISTS public.link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  embed_type TEXT,
  embed_html TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_link_previews_url ON public.link_previews(url);
CREATE INDEX IF NOT EXISTS idx_link_previews_expires ON public.link_previews(expires_at);

ALTER TABLE public.link_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view link previews"
  ON public.link_previews FOR SELECT
  USING (true);

CREATE POLICY "System can insert link previews"
  ON public.link_previews FOR INSERT
  WITH CHECK (true);

-- 2. Video Processing Jobs
CREATE TABLE IF NOT EXISTS public.video_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  original_path TEXT NOT NULL,
  processed_path TEXT,
  thumbnail_path TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  resolution TEXT,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_jobs_post ON public.video_processing_jobs(post_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON public.video_processing_jobs(status);

ALTER TABLE public.video_processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their video jobs"
  ON public.video_processing_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_posts sp
      WHERE sp.id = video_processing_jobs.post_id
      AND (
        sp.author_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid())
        OR auth.uid() IN (SELECT auth_user_id FROM public.app_user WHERE is_admin = true)
      )
    )
  );

-- 3. Post Mentions
CREATE TABLE IF NOT EXISTS public.post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  mentioned_user_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentions_post ON public.post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user ON public.post_mentions(mentioned_user_id);

ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentions"
  ON public.post_mentions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create mentions"
  ON public.post_mentions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.app_user WHERE auth_user_id = auth.uid())
  );

-- 4. Post Hashtags
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_post ON public.post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.post_hashtags(hashtag);

ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hashtags"
  ON public.post_hashtags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create hashtags"
  ON public.post_hashtags FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.app_user WHERE auth_user_id = auth.uid())
  );

-- 5. Trending Hashtags
CREATE TABLE IF NOT EXISTS public.trending_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  period DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hashtag, period)
);

CREATE INDEX IF NOT EXISTS idx_trending_hashtags ON public.trending_hashtags(period DESC, count DESC);

ALTER TABLE public.trending_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trending hashtags"
  ON public.trending_hashtags FOR SELECT
  USING (true);

-- 6. Mejorar tabla post_comments (ya existe, solo agregamos índices)
CREATE INDEX IF NOT EXISTS idx_comments_post_active ON public.post_comments(post_id, created_at DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.post_comments(user_id);

-- 7. Trigger para actualizar trending hashtags
CREATE OR REPLACE FUNCTION public.update_trending_hashtags()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.trending_hashtags (hashtag, count, period)
  VALUES (NEW.hashtag, 1, CURRENT_DATE)
  ON CONFLICT (hashtag, period)
  DO UPDATE SET 
    count = trending_hashtags.count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_trending_on_hashtag_insert
  AFTER INSERT ON public.post_hashtags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trending_hashtags();

-- 8. Función para crear notificación de mención
CREATE OR REPLACE FUNCTION public.notify_mention()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar notificación para el usuario mencionado
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    metadata
  )
  SELECT 
    NEW.mentioned_user_id,
    'mention',
    'Te mencionaron en un post',
    'Alguien te mencionó en un post',
    '/social/posts/' || NEW.post_id,
    jsonb_build_object('post_id', NEW.post_id)
  WHERE NEW.mentioned_user_type = 'user';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER notify_on_mention
  AFTER INSERT ON public.post_mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mention();

-- 9. Índices de performance para feed
CREATE INDEX IF NOT EXISTS idx_social_posts_created_active ON public.social_posts(created_at DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_social_posts_author_type ON public.social_posts(author_type, created_at DESC);

-- 10. Realtime para nuevas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_mentions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_hashtags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trending_hashtags;