ALTER TABLE public.fights
  ADD COLUMN IF NOT EXISTS live_round integer,
  ADD COLUMN IF NOT EXISTS live_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS live_updated_at timestamptz;

ALTER TABLE public.tm_verdict
  ADD COLUMN IF NOT EXISTS fight_id uuid REFERENCES public.fights(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tm_verdict_fight ON public.tm_verdict(fight_id) WHERE fight_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.arena_sync_event_fight(p_fight_id uuid, p_status text, p_round integer, p_scores jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Solo administradores' USING ERRCODE='42501';
  END IF;
  IF p_status NOT IN ('scheduled','live') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
  IF p_scores IS NOT NULL AND jsonb_typeof(p_scores) <> 'array' THEN RAISE EXCEPTION 'Puntajes inválidos'; END IF;
  UPDATE public.fights SET status = p_status, live_round = p_round,
    live_scores = coalesce(p_scores, live_scores), live_updated_at = now()
  WHERE id = p_fight_id AND status <> 'completed';
END; $$;

CREATE OR REPLACE FUNCTION public.arena_link_event_fight(p_session_id uuid, p_fight_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.tm_verdict%ROWTYPE; f public.fights%ROWTYPE;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Solo administradores' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v FROM public.tm_verdict WHERE session_id = p_session_id AND judge_user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Resultado no encontrado'; END IF;
  SELECT * INTO f FROM public.fights WHERE id = p_fight_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pelea del evento no encontrada'; END IF;
  IF v.red_fighter_id IS DISTINCT FROM f.fighter_a_id OR v.blue_fighter_id IS DISTINCT FROM f.fighter_b_id THEN
    RAISE EXCEPTION 'Los peleadores no coinciden con la cartelera';
  END IF;
  UPDATE public.tm_verdict SET fight_id = p_fight_id WHERE id = v.id;
  UPDATE public.fights SET status = 'completed', winner_id = v.winner_fighter_id,
    finish_method = v.result_type, finish_round = v.round_number,
    live_round = v.round_number, live_scores = coalesce(v.rounds,'[]'::jsonb), live_updated_at = now()
  WHERE id = p_fight_id;
END; $$;

REVOKE ALL ON FUNCTION public.arena_sync_event_fight(uuid,text,integer,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.arena_link_event_fight(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arena_sync_event_fight(uuid,text,integer,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arena_link_event_fight(uuid,uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.fights;

CREATE OR REPLACE FUNCTION public.get_sparring_summary(p_fighter_id uuid)
RETURNS TABLE(wins bigint, losses bigint, draws bigint, total bigint, rounds bigint, finishes bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    count(*) FILTER (WHERE winner_fighter_id = p_fighter_id),
    count(*) FILTER (WHERE winner_fighter_id IS NOT NULL AND winner_fighter_id <> p_fighter_id),
    count(*) FILTER (WHERE result_type = 'draw'),
    count(*),
    coalesce(sum(round_number),0),
    count(*) FILTER (WHERE winner_fighter_id = p_fighter_id AND result_type IN ('ko','tko'))
  FROM public.tm_verdict
  WHERE bout_type = 'sparring' AND (red_fighter_id = p_fighter_id OR blue_fighter_id = p_fighter_id);
$$;
GRANT EXECUTE ON FUNCTION public.get_sparring_summary(uuid) TO anon, authenticated;