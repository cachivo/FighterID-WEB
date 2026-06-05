-- Drop unused multi-device pieces
DROP FUNCTION IF EXISTS public.tm_submit_verdict(uuid, uuid, text, text, boolean);
DROP TABLE IF EXISTS public.tm_match CASCADE;

-- Verdict audit log: judge = authenticated user submitting from Time Master
CREATE TABLE public.tm_verdict (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_user_id uuid NOT NULL,
  red_fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE RESTRICT,
  blue_fighter_id uuid NOT NULL REFERENCES public.fighter_profiles(id) ON DELETE RESTRICT,
  winner_fighter_id uuid REFERENCES public.fighter_profiles(id) ON DELETE SET NULL,
  result_type text NOT NULL,
  round_number int NOT NULL,
  notes text,
  round_config int NOT NULL,
  round_duration_sec int NOT NULL,
  records_updated boolean NOT NULL DEFAULT false,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tm_verdict_distinct_corners CHECK (red_fighter_id <> blue_fighter_id)
);

GRANT SELECT, INSERT ON public.tm_verdict TO authenticated;
GRANT ALL ON public.tm_verdict TO service_role;

ALTER TABLE public.tm_verdict ENABLE ROW LEVEL SECURITY;

CREATE POLICY "judge can insert own verdict"
  ON public.tm_verdict FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = judge_user_id);

CREATE POLICY "judge can read own verdicts"
  ON public.tm_verdict FOR SELECT TO authenticated
  USING (auth.uid() = judge_user_id);

CREATE POLICY "admins can read all verdicts"
  ON public.tm_verdict FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "admins can update verdicts"
  ON public.tm_verdict FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "admins can delete verdicts"
  ON public.tm_verdict FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_tm_verdict_updated_at
  BEFORE UPDATE ON public.tm_verdict
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tm_verdict_judge ON public.tm_verdict(judge_user_id, signed_at DESC);
CREATE INDEX idx_tm_verdict_red ON public.tm_verdict(red_fighter_id);
CREATE INDEX idx_tm_verdict_blue ON public.tm_verdict(blue_fighter_id);