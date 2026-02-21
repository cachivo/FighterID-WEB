
-- =====================================================================
-- FASE 2: Expandir Events y Organizations
-- =====================================================================

-- 1. Expand ranking_organizations with contact, permissions, verification
ALTER TABLE public.ranking_organizations
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS can_create_events boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_sanction_fights boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Honduras';

-- Create unique index on slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ranking_organizations_slug 
  ON public.ranking_organizations(slug) WHERE slug IS NOT NULL;

-- 2. Expand bdg_event with organization, venue details, workflow status, approval
ALTER TABLE public.bdg_event
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.ranking_organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Honduras',
  ADD COLUMN IF NOT EXISTS poster_url text,
  ADD COLUMN IF NOT EXISTS rules_document_url text,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_fights integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_attendees integer;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bdg_event_state ON public.bdg_event(state);
CREATE INDEX IF NOT EXISTS idx_bdg_event_organization ON public.bdg_event(organization_id);
CREATE INDEX IF NOT EXISTS idx_bdg_event_start_time ON public.bdg_event(start_time);

-- 3. Create event_officials table (officials assigned to events)
CREATE TABLE IF NOT EXISTS public.event_officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.bdg_event(id) ON DELETE CASCADE,
  official_id uuid NOT NULL REFERENCES public.officials(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'judge', 'referee', 'doctor', 'timekeeper', 'inspector'
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  notes text,
  UNIQUE(event_id, official_id, role)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_officials_event ON public.event_officials(event_id);
CREATE INDEX IF NOT EXISTS idx_event_officials_official ON public.event_officials(official_id);

-- 4. RLS for event_officials
ALTER TABLE public.event_officials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event officials are viewable by authenticated users"
  ON public.event_officials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage event officials"
  ON public.event_officials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'technical_coordinator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'technical_coordinator')
    )
  );

-- 5. RLS for ranking_organizations (ensure it's enabled and has policies)
ALTER TABLE public.ranking_organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict, then recreate
DO $$
BEGIN
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ranking_organizations' AND policyname = 'Organizations are viewable by everyone'
  ) THEN
    CREATE POLICY "Organizations are viewable by everyone"
      ON public.ranking_organizations FOR SELECT
      USING (true);
  END IF;

  -- Admin manage policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ranking_organizations' AND policyname = 'Admins can manage organizations'
  ) THEN
    CREATE POLICY "Admins can manage organizations"
      ON public.ranking_organizations FOR ALL
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
  END IF;
END $$;
