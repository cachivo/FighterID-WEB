
-- ============================================================
-- SPARC (Sparring Performance Assessment & Ranking Circuit)
-- Parallel ecosystem - never touches official records/rankings
-- ============================================================

-- ---------- ENUMS ----------
CREATE TYPE sparc_discipline AS ENUM ('MMA', 'BOXING');
CREATE TYPE sparc_fight_state AS ENUM (
  'CREATED','READY','WAITING_JUDGES','ACTIVE','ROUND_BREAK',
  'VOTING_OPEN','VOTING_CLOSED','FINISHED','RESULT_CONFIRMED','ARCHIVED'
);
CREATE TYPE sparc_round_state AS ENUM ('PENDING','ACTIVE','ENDED','VOTING_OPEN','VOTING_CLOSED','FINALIZED');
CREATE TYPE sparc_vote_choice AS ENUM ('red','blue','draw','abstain');
CREATE TYPE sparc_vote_status AS ENUM ('DRAFT','SUBMITTED','CONFIRMED');
CREATE TYPE sparc_member_role AS ENUM ('admin','judge','coach','observer');
CREATE TYPE sparc_presence_status AS ENUM ('online','away','reconnecting','offline');

-- ---------- TABLES ----------

CREATE TABLE public.sparc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline sparc_discipline NOT NULL,
  name TEXT NOT NULL,
  host_gym_id UUID,
  starts_at TIMESTAMPTZ,
  state TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sparc_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_events TO authenticated;
GRANT ALL ON public.sparc_events TO service_role;
ALTER TABLE public.sparc_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_events_read_all" ON public.sparc_events FOR SELECT USING (true);
CREATE POLICY "sparc_events_insert_auth" ON public.sparc_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sparc_events_update_creator" ON public.sparc_events FOR UPDATE TO authenticated
  USING (created_by IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid()));

CREATE TABLE public.sparc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.sparc_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  time_master_offset_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sparc_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_sessions TO authenticated;
GRANT ALL ON public.sparc_sessions TO service_role;
ALTER TABLE public.sparc_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_sessions_read_all" ON public.sparc_sessions FOR SELECT USING (true);
CREATE POLICY "sparc_sessions_write_auth" ON public.sparc_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sparc_session_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sparc_sessions(id) ON DELETE CASCADE,
  app_user_id UUID NOT NULL,
  role sparc_member_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, app_user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_session_members TO authenticated;
GRANT ALL ON public.sparc_session_members TO service_role;
ALTER TABLE public.sparc_session_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_members_read_auth" ON public.sparc_session_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "sparc_members_write_auth" ON public.sparc_session_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sparc_fights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sparc_sessions(id) ON DELETE CASCADE,
  discipline sparc_discipline NOT NULL,
  red_fighter_id UUID,
  blue_fighter_id UUID,
  red_name TEXT NOT NULL,
  blue_name TEXT NOT NULL,
  weight_class TEXT,
  rounds_planned INTEGER NOT NULL DEFAULT 3,
  round_duration_s INTEGER NOT NULL DEFAULT 180,
  vote_window_s INTEGER NOT NULL DEFAULT 30,
  state sparc_fight_state NOT NULL DEFAULT 'CREATED',
  current_round INTEGER NOT NULL DEFAULT 0,
  order_idx INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sparc_fights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_fights TO authenticated;
GRANT ALL ON public.sparc_fights TO service_role;
ALTER TABLE public.sparc_fights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_fights_read_all" ON public.sparc_fights FOR SELECT USING (true);
CREATE POLICY "sparc_fights_write_auth" ON public.sparc_fights FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sparc_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fight_id UUID NOT NULL REFERENCES public.sparc_fights(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  state sparc_round_state NOT NULL DEFAULT 'PENDING',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  voting_opens_at TIMESTAMPTZ,
  voting_closes_at TIMESTAMPTZ,
  winner sparc_vote_choice,
  red_votes INTEGER NOT NULL DEFAULT 0,
  blue_votes INTEGER NOT NULL DEFAULT 0,
  draw_votes INTEGER NOT NULL DEFAULT 0,
  abstain_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fight_id, idx)
);
GRANT SELECT ON public.sparc_rounds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_rounds TO authenticated;
GRANT ALL ON public.sparc_rounds TO service_role;
ALTER TABLE public.sparc_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_rounds_read_all" ON public.sparc_rounds FOR SELECT USING (true);
CREATE POLICY "sparc_rounds_write_auth" ON public.sparc_rounds FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sparc_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.sparc_rounds(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  choice sparc_vote_choice NOT NULL,
  client_vote_id UUID NOT NULL,
  status sparc_vote_status NOT NULL DEFAULT 'CONFIRMED',
  source TEXT NOT NULL DEFAULT 'human',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_vote_id),
  UNIQUE(round_id, judge_id)
);
GRANT SELECT, INSERT ON public.sparc_votes TO authenticated;
GRANT ALL ON public.sparc_votes TO service_role;
ALTER TABLE public.sparc_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_votes_read_auth" ON public.sparc_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "sparc_votes_insert_self" ON public.sparc_votes FOR INSERT TO authenticated
  WITH CHECK (judge_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid()));

CREATE TABLE public.sparc_vote_drafts (
  round_id UUID NOT NULL REFERENCES public.sparc_rounds(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  choice sparc_vote_choice NOT NULL,
  client_vote_id UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, judge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_vote_drafts TO authenticated;
GRANT ALL ON public.sparc_vote_drafts TO service_role;
ALTER TABLE public.sparc_vote_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_drafts_self" ON public.sparc_vote_drafts FOR ALL TO authenticated
  USING (judge_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid()))
  WITH CHECK (judge_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid()));

CREATE TABLE public.sparc_results (
  fight_id UUID PRIMARY KEY REFERENCES public.sparc_fights(id) ON DELETE CASCADE,
  winner sparc_vote_choice NOT NULL,
  method TEXT NOT NULL DEFAULT 'decision',
  red_rounds INTEGER NOT NULL DEFAULT 0,
  blue_rounds INTEGER NOT NULL DEFAULT 0,
  draw_rounds INTEGER NOT NULL DEFAULT 0,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sparc_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_results TO authenticated;
GRANT ALL ON public.sparc_results TO service_role;
ALTER TABLE public.sparc_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_results_read_all" ON public.sparc_results FOR SELECT USING (true);
CREATE POLICY "sparc_results_write_auth" ON public.sparc_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sparc_records (
  fighter_id UUID NOT NULL,
  discipline sparc_discipline NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  sparring_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (fighter_id, discipline)
);
GRANT SELECT ON public.sparc_records TO anon;
GRANT SELECT ON public.sparc_records TO authenticated;
GRANT ALL ON public.sparc_records TO service_role;
ALTER TABLE public.sparc_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_records_read_all" ON public.sparc_records FOR SELECT USING (true);

CREATE TABLE public.sparc_rankings (
  discipline sparc_discipline NOT NULL,
  weight_class TEXT NOT NULL DEFAULT 'OPEN',
  fighter_id UUID NOT NULL,
  points NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discipline, weight_class, fighter_id)
);
GRANT SELECT ON public.sparc_rankings TO anon, authenticated;
GRANT ALL ON public.sparc_rankings TO service_role;
ALTER TABLE public.sparc_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_rankings_read_all" ON public.sparc_rankings FOR SELECT USING (true);

CREATE TABLE public.sparc_gym_rankings (
  discipline sparc_discipline NOT NULL,
  gym_id UUID NOT NULL,
  points NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discipline, gym_id)
);
GRANT SELECT ON public.sparc_gym_rankings TO anon, authenticated;
GRANT ALL ON public.sparc_gym_rankings TO service_role;
ALTER TABLE public.sparc_gym_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_gym_rankings_read_all" ON public.sparc_gym_rankings FOR SELECT USING (true);

CREATE TABLE public.sparc_coach_rankings (
  discipline sparc_discipline NOT NULL,
  coach_id UUID NOT NULL,
  points NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discipline, coach_id)
);
GRANT SELECT ON public.sparc_coach_rankings TO anon, authenticated;
GRANT ALL ON public.sparc_coach_rankings TO service_role;
ALTER TABLE public.sparc_coach_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_coach_rankings_read_all" ON public.sparc_coach_rankings FOR SELECT USING (true);

CREATE TABLE public.sparc_presence (
  session_id UUID NOT NULL REFERENCES public.sparc_sessions(id) ON DELETE CASCADE,
  app_user_id UUID NOT NULL,
  status sparc_presence_status NOT NULL DEFAULT 'online',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (session_id, app_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sparc_presence TO authenticated;
GRANT ALL ON public.sparc_presence TO service_role;
ALTER TABLE public.sparc_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_presence_read_auth" ON public.sparc_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "sparc_presence_write_self" ON public.sparc_presence FOR ALL TO authenticated
  USING (app_user_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid()))
  WITH CHECK (app_user_id IN (SELECT id FROM public.app_user WHERE auth_user_id = auth.uid()));

CREATE TABLE public.sparc_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  session_id UUID,
  fight_id UUID,
  round_id UUID,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sparc_audit_log TO authenticated;
GRANT ALL ON public.sparc_audit_log TO service_role;
ALTER TABLE public.sparc_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_audit_read_auth" ON public.sparc_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "sparc_audit_insert_auth" ON public.sparc_audit_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.sparc_reconnections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  app_user_id UUID NOT NULL,
  disconnected_at TIMESTAMPTZ NOT NULL,
  reconnected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gap_ms INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT ON public.sparc_reconnections TO authenticated;
GRANT ALL ON public.sparc_reconnections TO service_role;
ALTER TABLE public.sparc_reconnections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sparc_reconnections_read_auth" ON public.sparc_reconnections FOR SELECT TO authenticated USING (true);
CREATE POLICY "sparc_reconnections_insert_auth" ON public.sparc_reconnections FOR INSERT TO authenticated WITH CHECK (true);

-- ---------- INDEXES ----------
CREATE INDEX idx_sparc_sessions_event ON public.sparc_sessions(event_id);
CREATE INDEX idx_sparc_fights_session ON public.sparc_fights(session_id);
CREATE INDEX idx_sparc_rounds_fight ON public.sparc_rounds(fight_id);
CREATE INDEX idx_sparc_votes_round ON public.sparc_votes(round_id);
CREATE INDEX idx_sparc_members_session ON public.sparc_session_members(session_id);
CREATE INDEX idx_sparc_members_user ON public.sparc_session_members(app_user_id);
CREATE INDEX idx_sparc_presence_session ON public.sparc_presence(session_id);
CREATE INDEX idx_sparc_audit_session ON public.sparc_audit_log(session_id, at DESC);
CREATE INDEX idx_sparc_rankings_pts ON public.sparc_rankings(discipline, weight_class, points DESC);

-- ---------- TRIGGERS: updated_at ----------
CREATE OR REPLACE FUNCTION public.sparc_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_sparc_events_touch BEFORE UPDATE ON public.sparc_events
  FOR EACH ROW EXECUTE FUNCTION public.sparc_touch_updated_at();
CREATE TRIGGER trg_sparc_sessions_touch BEFORE UPDATE ON public.sparc_sessions
  FOR EACH ROW EXECUTE FUNCTION public.sparc_touch_updated_at();
CREATE TRIGGER trg_sparc_fights_touch BEFORE UPDATE ON public.sparc_fights
  FOR EACH ROW EXECUTE FUNCTION public.sparc_touch_updated_at();

-- ---------- RPCS (single source of truth) ----------

CREATE OR REPLACE FUNCTION public.sparc_open_round(p_fight_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_idx INTEGER; v_round_id UUID; v_dur INTEGER;
BEGIN
  SELECT round_duration_s INTO v_dur FROM public.sparc_fights WHERE id = p_fight_id;
  IF v_dur IS NULL THEN RAISE EXCEPTION 'fight not found'; END IF;
  SELECT COALESCE(MAX(idx),0)+1 INTO v_idx FROM public.sparc_rounds WHERE fight_id = p_fight_id;
  INSERT INTO public.sparc_rounds(fight_id, idx, state, started_at)
    VALUES (p_fight_id, v_idx, 'ACTIVE', now()) RETURNING id INTO v_round_id;
  UPDATE public.sparc_fights SET state = 'ACTIVE', current_round = v_idx WHERE id = p_fight_id;
  INSERT INTO public.sparc_audit_log(fight_id, round_id, action, payload)
    VALUES (p_fight_id, v_round_id, 'round_opened', jsonb_build_object('idx', v_idx));
  RETURN v_round_id;
END; $$;

CREATE OR REPLACE FUNCTION public.sparc_open_voting(p_round_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fight UUID; v_window INTEGER;
BEGIN
  SELECT r.fight_id, f.vote_window_s INTO v_fight, v_window
    FROM public.sparc_rounds r JOIN public.sparc_fights f ON f.id = r.fight_id
    WHERE r.id = p_round_id;
  UPDATE public.sparc_rounds SET
    state = 'VOTING_OPEN',
    ended_at = COALESCE(ended_at, now()),
    voting_opens_at = now(),
    voting_closes_at = now() + (v_window || ' seconds')::interval
    WHERE id = p_round_id;
  UPDATE public.sparc_fights SET state = 'VOTING_OPEN' WHERE id = v_fight;
  INSERT INTO public.sparc_audit_log(fight_id, round_id, action) VALUES (v_fight, p_round_id, 'voting_opened');
END; $$;

CREATE OR REPLACE FUNCTION public.sparc_close_voting(p_round_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fight UUID; v_session UUID; v_red INT; v_blue INT; v_draw INT; v_abs INT; v_winner sparc_vote_choice;
BEGIN
  SELECT r.fight_id, f.session_id INTO v_fight, v_session
    FROM public.sparc_rounds r JOIN public.sparc_fights f ON f.id = r.fight_id WHERE r.id = p_round_id;
  -- auto-abstain non-voting judges
  INSERT INTO public.sparc_votes(round_id, judge_id, choice, client_vote_id, status, source)
    SELECT p_round_id, m.app_user_id, 'abstain', gen_random_uuid(), 'CONFIRMED', 'auto'
      FROM public.sparc_session_members m
      WHERE m.session_id = v_session AND m.role = 'judge'
        AND NOT EXISTS (SELECT 1 FROM public.sparc_votes v WHERE v.round_id = p_round_id AND v.judge_id = m.app_user_id);
  -- tally
  SELECT
    COUNT(*) FILTER (WHERE choice='red'),
    COUNT(*) FILTER (WHERE choice='blue'),
    COUNT(*) FILTER (WHERE choice='draw'),
    COUNT(*) FILTER (WHERE choice='abstain')
    INTO v_red, v_blue, v_draw, v_abs
    FROM public.sparc_votes WHERE round_id = p_round_id;
  v_winner := CASE
    WHEN v_red > v_blue AND v_red > v_draw THEN 'red'::sparc_vote_choice
    WHEN v_blue > v_red AND v_blue > v_draw THEN 'blue'::sparc_vote_choice
    ELSE 'draw'::sparc_vote_choice END;
  UPDATE public.sparc_rounds SET
    state='FINALIZED', red_votes=v_red, blue_votes=v_blue, draw_votes=v_draw,
    abstain_votes=v_abs, winner=v_winner WHERE id = p_round_id;
  UPDATE public.sparc_fights SET state='ROUND_BREAK' WHERE id = v_fight;
  INSERT INTO public.sparc_audit_log(fight_id, round_id, action, payload)
    VALUES (v_fight, p_round_id, 'voting_closed', jsonb_build_object('winner', v_winner));
END; $$;

CREATE OR REPLACE FUNCTION public.sparc_submit_vote(
  p_round_id UUID, p_choice sparc_vote_choice, p_client_vote_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_judge UUID; v_state sparc_round_state; v_id UUID;
BEGIN
  SELECT id INTO v_judge FROM public.app_user WHERE auth_user_id = auth.uid();
  IF v_judge IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  -- idempotency
  SELECT id INTO v_id FROM public.sparc_votes WHERE client_vote_id = p_client_vote_id;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  SELECT state INTO v_state FROM public.sparc_rounds WHERE id = p_round_id;
  IF v_state NOT IN ('VOTING_OPEN','ENDED') THEN RAISE EXCEPTION 'voting not open'; END IF;
  INSERT INTO public.sparc_votes(round_id, judge_id, choice, client_vote_id, status)
    VALUES (p_round_id, v_judge, p_choice, p_client_vote_id, 'CONFIRMED')
    ON CONFLICT (round_id, judge_id) DO NOTHING
    RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.sparc_votes WHERE round_id = p_round_id AND judge_id = v_judge;
  END IF;
  DELETE FROM public.sparc_vote_drafts WHERE round_id = p_round_id AND judge_id = v_judge;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.sparc_compute_result(p_fight_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_red INT; v_blue INT; v_draw INT; v_winner sparc_vote_choice; v_judge UUID;
BEGIN
  SELECT id INTO v_judge FROM public.app_user WHERE auth_user_id = auth.uid();
  SELECT
    COUNT(*) FILTER (WHERE winner='red'),
    COUNT(*) FILTER (WHERE winner='blue'),
    COUNT(*) FILTER (WHERE winner='draw')
    INTO v_red, v_blue, v_draw
    FROM public.sparc_rounds WHERE fight_id = p_fight_id AND state='FINALIZED';
  v_winner := CASE
    WHEN v_red > v_blue THEN 'red'::sparc_vote_choice
    WHEN v_blue > v_red THEN 'blue'::sparc_vote_choice
    ELSE 'draw'::sparc_vote_choice END;
  INSERT INTO public.sparc_results(fight_id, winner, red_rounds, blue_rounds, draw_rounds, confirmed_by)
    VALUES (p_fight_id, v_winner, v_red, v_blue, v_draw, v_judge)
    ON CONFLICT (fight_id) DO UPDATE SET winner=EXCLUDED.winner,
      red_rounds=EXCLUDED.red_rounds, blue_rounds=EXCLUDED.blue_rounds, draw_rounds=EXCLUDED.draw_rounds;
  UPDATE public.sparc_fights SET state='RESULT_CONFIRMED' WHERE id = p_fight_id;
  INSERT INTO public.sparc_audit_log(fight_id, action, payload)
    VALUES (p_fight_id, 'result_confirmed', jsonb_build_object('winner', v_winner));
END; $$;

CREATE OR REPLACE FUNCTION public.sparc_heartbeat(p_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID;
BEGIN
  SELECT id INTO v_user FROM public.app_user WHERE auth_user_id = auth.uid();
  IF v_user IS NULL THEN RETURN; END IF;
  INSERT INTO public.sparc_presence(session_id, app_user_id, status, last_seen)
    VALUES (p_session_id, v_user, 'online', now())
    ON CONFLICT (session_id, app_user_id) DO UPDATE SET status='online', last_seen=now();
END; $$;

CREATE OR REPLACE FUNCTION public.sparc_recover_session()
RETURNS TABLE(session_id UUID, fight_id UUID, round_id UUID, role sparc_member_role,
              fight_state sparc_fight_state, round_state sparc_round_state,
              voting_closes_at TIMESTAMPTZ, red_name TEXT, blue_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID;
BEGIN
  SELECT id INTO v_user FROM public.app_user WHERE auth_user_id = auth.uid();
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT s.id, f.id, r.id, m.role, f.state, r.state, r.voting_closes_at, f.red_name, f.blue_name
    FROM public.sparc_session_members m
    JOIN public.sparc_sessions s ON s.id = m.session_id
    JOIN public.sparc_fights f ON f.session_id = s.id
      AND f.state IN ('READY','WAITING_JUDGES','ACTIVE','ROUND_BREAK','VOTING_OPEN','VOTING_CLOSED')
    LEFT JOIN public.sparc_rounds r ON r.fight_id = f.id AND r.idx = f.current_round
    WHERE m.app_user_id = v_user
    ORDER BY f.updated_at DESC LIMIT 1;
END; $$;

-- ---------- AUTO-RANKING TRIGGER ----------
CREATE OR REPLACE FUNCTION public.sparc_apply_result() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fight RECORD; v_red_pts NUMERIC; v_blue_pts NUMERIC;
BEGIN
  SELECT * INTO v_fight FROM public.sparc_fights WHERE id = NEW.fight_id;
  v_red_pts := CASE NEW.winner WHEN 'red' THEN 3 WHEN 'draw' THEN 1 ELSE 0 END;
  v_blue_pts := CASE NEW.winner WHEN 'blue' THEN 3 WHEN 'draw' THEN 1 ELSE 0 END;
  -- records
  IF v_fight.red_fighter_id IS NOT NULL THEN
    INSERT INTO public.sparc_records(fighter_id, discipline, wins, losses, draws, sparring_count)
      VALUES (v_fight.red_fighter_id, v_fight.discipline,
        CASE NEW.winner WHEN 'red' THEN 1 ELSE 0 END,
        CASE NEW.winner WHEN 'blue' THEN 1 ELSE 0 END,
        CASE NEW.winner WHEN 'draw' THEN 1 ELSE 0 END, 1)
      ON CONFLICT (fighter_id, discipline) DO UPDATE SET
        wins = sparc_records.wins + CASE NEW.winner WHEN 'red' THEN 1 ELSE 0 END,
        losses = sparc_records.losses + CASE NEW.winner WHEN 'blue' THEN 1 ELSE 0 END,
        draws = sparc_records.draws + CASE NEW.winner WHEN 'draw' THEN 1 ELSE 0 END,
        sparring_count = sparc_records.sparring_count + 1, updated_at = now();
    INSERT INTO public.sparc_rankings(discipline, weight_class, fighter_id, points)
      VALUES (v_fight.discipline, COALESCE(v_fight.weight_class,'OPEN'), v_fight.red_fighter_id, v_red_pts)
      ON CONFLICT (discipline, weight_class, fighter_id) DO UPDATE
        SET points = sparc_rankings.points + v_red_pts, updated_at = now();
  END IF;
  IF v_fight.blue_fighter_id IS NOT NULL THEN
    INSERT INTO public.sparc_records(fighter_id, discipline, wins, losses, draws, sparring_count)
      VALUES (v_fight.blue_fighter_id, v_fight.discipline,
        CASE NEW.winner WHEN 'blue' THEN 1 ELSE 0 END,
        CASE NEW.winner WHEN 'red' THEN 1 ELSE 0 END,
        CASE NEW.winner WHEN 'draw' THEN 1 ELSE 0 END, 1)
      ON CONFLICT (fighter_id, discipline) DO UPDATE SET
        wins = sparc_records.wins + CASE NEW.winner WHEN 'blue' THEN 1 ELSE 0 END,
        losses = sparc_records.losses + CASE NEW.winner WHEN 'red' THEN 1 ELSE 0 END,
        draws = sparc_records.draws + CASE NEW.winner WHEN 'draw' THEN 1 ELSE 0 END,
        sparring_count = sparc_records.sparring_count + 1, updated_at = now();
    INSERT INTO public.sparc_rankings(discipline, weight_class, fighter_id, points)
      VALUES (v_fight.discipline, COALESCE(v_fight.weight_class,'OPEN'), v_fight.blue_fighter_id, v_blue_pts)
      ON CONFLICT (discipline, weight_class, fighter_id) DO UPDATE
        SET points = sparc_rankings.points + v_blue_pts, updated_at = now();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sparc_apply_result AFTER INSERT ON public.sparc_results
  FOR EACH ROW EXECUTE FUNCTION public.sparc_apply_result();

-- ---------- REALTIME ----------
ALTER TABLE public.sparc_fights REPLICA IDENTITY FULL;
ALTER TABLE public.sparc_rounds REPLICA IDENTITY FULL;
ALTER TABLE public.sparc_votes REPLICA IDENTITY FULL;
ALTER TABLE public.sparc_presence REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sparc_fights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sparc_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sparc_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sparc_presence;
