
-- Migrate sparc_votes.source from TEXT to enum
ALTER TABLE public.sparc_votes
  ALTER COLUMN source DROP DEFAULT;
ALTER TABLE public.sparc_votes
  ALTER COLUMN source TYPE sparc_vote_source
  USING (CASE
    WHEN source IN ('human','ai','coach','hybrid','auto') THEN source::sparc_vote_source
    ELSE 'human'::sparc_vote_source
  END);
ALTER TABLE public.sparc_votes
  ALTER COLUMN source SET DEFAULT 'human'::sparc_vote_source;

ALTER TABLE public.sparc_votes
  ADD COLUMN IF NOT EXISTS source_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Multi-device binding
ALTER TABLE public.sparc_session_members
  ADD COLUMN IF NOT EXISTS active_device_id TEXT,
  ADD COLUMN IF NOT EXISTS active_device_label TEXT,
  ADD COLUMN IF NOT EXISTS device_bound_at TIMESTAMPTZ;

-- Quorum settings
ALTER TABLE public.sparc_sessions
  ADD COLUMN IF NOT EXISTS min_quorum_pct INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS min_quorum_absolute INTEGER;

-- Presence: last interaction
ALTER TABLE public.sparc_presence
  ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Ranking components
ALTER TABLE public.sparc_rankings
  ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS draws INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sparring_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_of_schedule NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recomputed_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.sparc_gym_rankings
  ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS draws INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sparring_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recomputed_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.sparc_coach_rankings
  ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS draws INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sparring_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recomputed_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Vote immutability trigger
CREATE OR REPLACE FUNCTION public.sparc_votes_block_locked()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'LOCKED' THEN
    RAISE EXCEPTION 'sparc_votes: vote is LOCKED (round_id=%, judge_id=%)', OLD.round_id, OLD.judge_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.status = 'LOCKED' THEN
    RAISE EXCEPTION 'sparc_votes: vote is LOCKED (round_id=%, judge_id=%)', OLD.round_id, OLD.judge_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_sparc_votes_block_locked ON public.sparc_votes;
CREATE TRIGGER trg_sparc_votes_block_locked
  BEFORE UPDATE OR DELETE ON public.sparc_votes
  FOR EACH ROW EXECUTE FUNCTION public.sparc_votes_block_locked();

-- Server clock
CREATE OR REPLACE FUNCTION public.sparc_server_time()
RETURNS TABLE(server_now TIMESTAMPTZ, server_epoch_ms BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT now(), (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT;
$$;
GRANT EXECUTE ON FUNCTION public.sparc_server_time() TO anon, authenticated;

-- Device claim
CREATE OR REPLACE FUNCTION public.sparc_claim_device(
  p_session_id UUID, p_device_id TEXT, p_device_label TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID; v_prev TEXT; v_member RECORD;
BEGIN
  SELECT id INTO v_user FROM public.app_user WHERE auth_user_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO v_member FROM public.sparc_session_members
    WHERE session_id = p_session_id AND app_user_id = v_user
    ORDER BY created_at DESC LIMIT 1;
  IF v_member.id IS NULL THEN RAISE EXCEPTION 'not a session member'; END IF;

  v_prev := v_member.active_device_id;

  UPDATE public.sparc_session_members
    SET active_device_id = p_device_id,
        active_device_label = p_device_label,
        device_bound_at = now()
    WHERE id = v_member.id;

  IF v_prev IS NOT NULL AND v_prev <> p_device_id THEN
    INSERT INTO public.sparc_audit_log(actor_id, session_id, action, payload)
      VALUES (v_user, p_session_id, 'DEVICE_TRANSFER',
        jsonb_build_object('previous', v_prev, 'current', p_device_id, 'label', p_device_label));
  ELSE
    INSERT INTO public.sparc_audit_log(actor_id, session_id, action, payload)
      VALUES (v_user, p_session_id, 'DEVICE_BOUND',
        jsonb_build_object('device', p_device_id, 'label', p_device_label));
  END IF;

  RETURN jsonb_build_object('ok', true, 'device_id', p_device_id, 'previous', v_prev);
END; $$;
GRANT EXECUTE ON FUNCTION public.sparc_claim_device(UUID, TEXT, TEXT) TO authenticated;

-- Submit vote (device-aware, window-aware, idempotent)
DROP FUNCTION IF EXISTS public.sparc_submit_vote(UUID, sparc_vote_choice, UUID);
CREATE OR REPLACE FUNCTION public.sparc_submit_vote(
  p_round_id UUID,
  p_choice sparc_vote_choice,
  p_client_vote_id UUID,
  p_device_id TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID; v_round RECORD; v_member RECORD; v_existing RECORD;
BEGIN
  SELECT id INTO v_user FROM public.app_user WHERE auth_user_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO v_existing FROM public.sparc_votes WHERE client_vote_id = p_client_vote_id;
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'status', v_existing.status, 'idempotent', true);
  END IF;

  SELECT r.*, f.session_id AS session_id INTO v_round
    FROM public.sparc_rounds r JOIN public.sparc_fights f ON f.id = r.fight_id
    WHERE r.id = p_round_id;
  IF v_round.id IS NULL THEN RAISE EXCEPTION 'round not found'; END IF;

  IF v_round.state <> 'VOTING_OPEN' OR (v_round.voting_closes_at IS NOT NULL AND now() > v_round.voting_closes_at) THEN
    RAISE EXCEPTION 'VOTING_CLOSED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_member FROM public.sparc_session_members
    WHERE session_id = v_round.session_id AND app_user_id = v_user AND role = 'judge'
    LIMIT 1;
  IF v_member.id IS NULL THEN RAISE EXCEPTION 'not a judge in this session'; END IF;

  IF v_member.active_device_id IS NOT NULL AND p_device_id IS NOT NULL
     AND v_member.active_device_id <> p_device_id THEN
    RAISE EXCEPTION 'DEVICE_NOT_BOUND' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.sparc_votes(round_id, judge_id, choice, client_vote_id, status, source, source_meta)
    VALUES (p_round_id, v_user, p_choice, p_client_vote_id, 'CONFIRMED', 'human',
            jsonb_build_object('device_id', p_device_id));

  INSERT INTO public.sparc_audit_log(actor_id, session_id, fight_id, round_id, action, payload)
    VALUES (v_user, v_round.session_id, v_round.fight_id, p_round_id, 'VOTE_CONFIRMED',
            jsonb_build_object('choice', p_choice, 'device_id', p_device_id));

  RETURN jsonb_build_object('ok', true, 'status', 'CONFIRMED');
END; $$;
GRANT EXECUTE ON FUNCTION public.sparc_submit_vote(UUID, sparc_vote_choice, UUID, TEXT) TO authenticated;

-- Close voting: auto-abstain + LOCK
CREATE OR REPLACE FUNCTION public.sparc_close_voting(p_round_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fight UUID; v_session UUID; v_red INT; v_blue INT; v_draw INT; v_abs INT; v_winner sparc_vote_choice;
BEGIN
  SELECT r.fight_id, f.session_id INTO v_fight, v_session
    FROM public.sparc_rounds r JOIN public.sparc_fights f ON f.id = r.fight_id WHERE r.id = p_round_id;

  INSERT INTO public.sparc_votes(round_id, judge_id, choice, client_vote_id, status, source)
    SELECT p_round_id, m.app_user_id, 'abstain', gen_random_uuid(), 'CONFIRMED', 'auto'
      FROM public.sparc_session_members m
      WHERE m.session_id = v_session AND m.role = 'judge'
        AND NOT EXISTS (SELECT 1 FROM public.sparc_votes v WHERE v.round_id = p_round_id AND v.judge_id = m.app_user_id);

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

  UPDATE public.sparc_votes SET status='LOCKED' WHERE round_id = p_round_id AND status <> 'LOCKED';

  UPDATE public.sparc_fights SET state='ROUND_BREAK' WHERE id = v_fight;
  INSERT INTO public.sparc_audit_log(fight_id, round_id, action, payload)
    VALUES (v_fight, p_round_id, 'voting_closed_and_locked', jsonb_build_object('winner', v_winner));
END; $$;

-- Quorum check
CREATE OR REPLACE FUNCTION public.sparc_session_quorum(p_session_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_registered INT; v_connected INT; v_pct INT; v_abs INT; v_required INT;
BEGIN
  SELECT min_quorum_pct, min_quorum_absolute INTO v_pct, v_abs
    FROM public.sparc_sessions WHERE id = p_session_id;
  SELECT COUNT(*) INTO v_registered FROM public.sparc_session_members
    WHERE session_id = p_session_id AND role = 'judge';
  SELECT COUNT(*) INTO v_connected FROM public.sparc_presence p
    JOIN public.sparc_session_members m ON m.session_id = p.session_id AND m.app_user_id = p.app_user_id
    WHERE p.session_id = p_session_id AND m.role = 'judge'
      AND p.status IN ('online','idle')
      AND p.last_seen > now() - interval '30 seconds';
  v_required := COALESCE(v_abs, GREATEST(1, CEIL(v_registered * v_pct / 100.0)::INT));
  RETURN jsonb_build_object(
    'registered', v_registered, 'connected', v_connected,
    'required', v_required, 'met', v_connected >= v_required
  );
END; $$;
GRANT EXECUTE ON FUNCTION public.sparc_session_quorum(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.sparc_open_voting(p_round_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_fight UUID; v_session UUID; v_window INTEGER; v_q JSONB;
BEGIN
  SELECT r.fight_id, f.vote_window_s, f.session_id INTO v_fight, v_window, v_session
    FROM public.sparc_rounds r JOIN public.sparc_fights f ON f.id = r.fight_id
    WHERE r.id = p_round_id;

  v_q := public.sparc_session_quorum(v_session);
  IF NOT (v_q->>'met')::boolean THEN
    RAISE EXCEPTION 'QUORUM_NOT_MET: % of % connected (required %)',
      v_q->>'connected', v_q->>'registered', v_q->>'required'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.sparc_rounds SET
    state = 'VOTING_OPEN',
    ended_at = COALESCE(ended_at, now()),
    voting_opens_at = now(),
    voting_closes_at = now() + (v_window || ' seconds')::interval
    WHERE id = p_round_id;
  UPDATE public.sparc_fights SET state = 'VOTING_OPEN' WHERE id = v_fight;
  INSERT INTO public.sparc_audit_log(fight_id, round_id, action, payload)
    VALUES (v_fight, p_round_id, 'voting_opened', v_q);
END; $$;

-- Auto-close expired rounds
CREATE OR REPLACE FUNCTION public.sparc_auto_close_expired_rounds()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; n INT := 0;
BEGIN
  FOR r IN
    SELECT id FROM public.sparc_rounds
     WHERE state = 'VOTING_OPEN' AND voting_closes_at IS NOT NULL AND voting_closes_at < now()
     LIMIT 50
  LOOP
    PERFORM public.sparc_close_voting(r.id);
    n := n + 1;
  END LOOP;
  RETURN n;
END; $$;
GRANT EXECUTE ON FUNCTION public.sparc_auto_close_expired_rounds() TO authenticated;

-- Heartbeat (drop old single-arg version, add new signature)
DROP FUNCTION IF EXISTS public.sparc_heartbeat(UUID);
CREATE OR REPLACE FUNCTION public.sparc_heartbeat(
  p_session_id UUID,
  p_device_id TEXT DEFAULT NULL,
  p_interacted BOOLEAN DEFAULT FALSE
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID;
BEGIN
  SELECT id INTO v_user FROM public.app_user WHERE auth_user_id = auth.uid();
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;

  INSERT INTO public.sparc_presence(session_id, app_user_id, status, last_seen, last_interaction, device_id)
    VALUES (p_session_id, v_user, 'online'::sparc_presence_status, now(), now(), p_device_id)
    ON CONFLICT (session_id, app_user_id) DO UPDATE
      SET last_seen = now(),
          last_interaction = CASE WHEN p_interacted THEN now() ELSE public.sparc_presence.last_interaction END,
          device_id = COALESCE(EXCLUDED.device_id, public.sparc_presence.device_id),
          status = CASE
            WHEN p_interacted OR EXTRACT(EPOCH FROM now() - public.sparc_presence.last_interaction) < 10 THEN 'online'::sparc_presence_status
            WHEN EXTRACT(EPOCH FROM now() - public.sparc_presence.last_interaction) < 60 THEN 'idle'::sparc_presence_status
            ELSE 'away'::sparc_presence_status
          END;

  PERFORM public.sparc_auto_close_expired_rounds();
  RETURN jsonb_build_object('ok', true, 'server_now', now());
END; $$;
GRANT EXECUTE ON FUNCTION public.sparc_heartbeat(UUID, TEXT, BOOLEAN) TO authenticated;

-- Emergency override
CREATE OR REPLACE FUNCTION public.sparc_admin_override(
  p_fight_id UUID, p_action TEXT, p_reason TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID; v_session UUID; v_round UUID; v_is_admin BOOLEAN;
BEGIN
  SELECT id INTO v_user FROM public.app_user WHERE auth_user_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF COALESCE(LENGTH(TRIM(p_reason)), 0) < 4 THEN
    RAISE EXCEPTION 'reason required (min 4 chars)';
  END IF;

  SELECT session_id INTO v_session FROM public.sparc_fights WHERE id = p_fight_id;
  IF v_session IS NULL THEN RAISE EXCEPTION 'fight not found'; END IF;

  v_is_admin := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (SELECT 1 FROM public.sparc_session_members
               WHERE session_id = v_session AND app_user_id = v_user AND role = 'admin');
  IF NOT v_is_admin THEN RAISE EXCEPTION 'not authorized'; END IF;

  SELECT id INTO v_round FROM public.sparc_rounds
    WHERE fight_id = p_fight_id ORDER BY idx DESC LIMIT 1;

  IF p_action = 'force_close_round' THEN
    UPDATE public.sparc_rounds SET state='ENDED', ended_at = COALESCE(ended_at, now())
      WHERE id = v_round AND state IN ('ACTIVE','PENDING');
  ELSIF p_action = 'force_close_voting' THEN
    PERFORM public.sparc_close_voting(v_round);
  ELSIF p_action = 'force_confirm_result' THEN
    PERFORM public.sparc_compute_result(p_fight_id);
  ELSIF p_action = 'force_advance_fight' THEN
    UPDATE public.sparc_fights SET state='FINISHED' WHERE id = p_fight_id;
  ELSE
    RAISE EXCEPTION 'unknown action: %', p_action;
  END IF;

  INSERT INTO public.sparc_audit_log(actor_id, session_id, fight_id, round_id, action, payload)
    VALUES (v_user, v_session, p_fight_id, v_round, 'EMERGENCY_OVERRIDE',
            jsonb_build_object('action', p_action, 'reason', p_reason));

  RETURN jsonb_build_object('ok', true, 'action', p_action);
END; $$;
GRANT EXECUTE ON FUNCTION public.sparc_admin_override(UUID, TEXT, TEXT) TO authenticated;

-- Recompute rankings
CREATE OR REPLACE FUNCTION public.sparc_recompute_rankings(p_discipline sparc_discipline)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INT;
BEGIN
  DELETE FROM public.sparc_rankings WHERE discipline = p_discipline;
  INSERT INTO public.sparc_rankings(discipline, weight_class, fighter_id, points, wins, losses, draws, sparring_count, last_recomputed_at)
  SELECT
    p_discipline,
    COALESCE(MAX(weight_class), 'OPEN'),
    fighter,
    SUM(CASE WHEN role = 'winner' THEN 3 WHEN role = 'draw' THEN 1 ELSE 0 END),
    COUNT(*) FILTER (WHERE role='winner'),
    COUNT(*) FILTER (WHERE role='loser'),
    COUNT(*) FILTER (WHERE role='draw'),
    COUNT(*),
    now()
  FROM (
    SELECT f.weight_class, f.red_fighter_id AS fighter,
      CASE r.winner WHEN 'red' THEN 'winner' WHEN 'blue' THEN 'loser' ELSE 'draw' END AS role
      FROM public.sparc_results r JOIN public.sparc_fights f ON f.id = r.fight_id
      WHERE f.discipline = p_discipline AND f.red_fighter_id IS NOT NULL
    UNION ALL
    SELECT f.weight_class, f.blue_fighter_id AS fighter,
      CASE r.winner WHEN 'blue' THEN 'winner' WHEN 'red' THEN 'loser' ELSE 'draw' END AS role
      FROM public.sparc_results r JOIN public.sparc_fights f ON f.id = r.fight_id
      WHERE f.discipline = p_discipline AND f.blue_fighter_id IS NOT NULL
  ) x
  GROUP BY fighter;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;
GRANT EXECUTE ON FUNCTION public.sparc_recompute_rankings(sparc_discipline) TO authenticated;

-- Computed-rank view (security_invoker so it respects caller RLS)
DROP VIEW IF EXISTS public.sparc_rankings_v;
CREATE VIEW public.sparc_rankings_v
WITH (security_invoker = true) AS
SELECT
  discipline, weight_class, fighter_id,
  points, wins, losses, draws, sparring_count, strength_of_schedule, last_recomputed_at,
  ROW_NUMBER() OVER (
    PARTITION BY discipline, weight_class
    ORDER BY points DESC, strength_of_schedule DESC, wins DESC, sparring_count DESC
  )::INTEGER AS rank
FROM public.sparc_rankings;
GRANT SELECT ON public.sparc_rankings_v TO anon, authenticated;

-- Executive dashboard view
DROP VIEW IF EXISTS public.sparc_event_dashboard_v;
CREATE VIEW public.sparc_event_dashboard_v
WITH (security_invoker = true) AS
SELECT
  s.id AS session_id,
  s.event_id,
  e.name AS event_name,
  e.discipline,
  s.name AS session_name,
  s.min_quorum_pct,
  s.min_quorum_absolute,
  (SELECT id FROM public.sparc_fights WHERE session_id = s.id
    AND state IN ('ACTIVE','VOTING_OPEN','ROUND_BREAK','WAITING_JUDGES')
    ORDER BY order_idx LIMIT 1) AS active_fight_id,
  (SELECT row_to_json(ff) FROM (
    SELECT id, red_name, blue_name, current_round, state, weight_class
      FROM public.sparc_fights WHERE session_id = s.id
        AND state IN ('ACTIVE','VOTING_OPEN','ROUND_BREAK','WAITING_JUDGES')
      ORDER BY order_idx LIMIT 1
  ) ff) AS active_fight,
  (SELECT row_to_json(rr) FROM (
    SELECT id, idx, state, started_at, voting_opens_at, voting_closes_at
      FROM public.sparc_rounds
      WHERE fight_id = (SELECT id FROM public.sparc_fights WHERE session_id = s.id
                          AND state IN ('ACTIVE','VOTING_OPEN','ROUND_BREAK','WAITING_JUDGES')
                          ORDER BY order_idx LIMIT 1)
      ORDER BY idx DESC LIMIT 1
  ) rr) AS current_round,
  (SELECT row_to_json(nf) FROM (
    SELECT id, red_name, blue_name FROM public.sparc_fights
      WHERE session_id = s.id AND state IN ('CREATED','READY')
      ORDER BY order_idx LIMIT 1
  ) nf) AS next_fight,
  (SELECT COUNT(*) FROM public.sparc_session_members WHERE session_id = s.id AND role = 'judge') AS judges_registered,
  (SELECT COUNT(*) FROM public.sparc_presence p
    JOIN public.sparc_session_members m ON m.session_id = p.session_id AND m.app_user_id = p.app_user_id
    WHERE p.session_id = s.id AND m.role = 'judge' AND p.status = 'online'
      AND p.last_seen > now() - interval '30 seconds') AS judges_online,
  (SELECT COUNT(*) FROM public.sparc_presence p
    JOIN public.sparc_session_members m ON m.session_id = p.session_id AND m.app_user_id = p.app_user_id
    WHERE p.session_id = s.id AND m.role = 'judge' AND p.status = 'idle') AS judges_idle,
  (SELECT COUNT(*) FROM public.sparc_presence p
    JOIN public.sparc_session_members m ON m.session_id = p.session_id AND m.app_user_id = p.app_user_id
    WHERE p.session_id = s.id AND m.role = 'judge' AND p.status = 'away') AS judges_away,
  (SELECT COUNT(*) FROM public.sparc_session_members m WHERE m.session_id = s.id AND m.role = 'judge')
    - (SELECT COUNT(*) FROM public.sparc_presence p
        JOIN public.sparc_session_members m ON m.session_id = p.session_id AND m.app_user_id = p.app_user_id
        WHERE p.session_id = s.id AND m.role = 'judge'
          AND p.last_seen > now() - interval '60 seconds') AS judges_offline,
  (SELECT MAX(submitted_at) FROM public.sparc_votes v
    JOIN public.sparc_rounds r ON r.id = v.round_id
    JOIN public.sparc_fights f ON f.id = r.fight_id
    WHERE f.session_id = s.id) AS last_vote_at,
  now() AS server_now
FROM public.sparc_sessions s
JOIN public.sparc_events e ON e.id = s.event_id;

GRANT SELECT ON public.sparc_event_dashboard_v TO authenticated;
