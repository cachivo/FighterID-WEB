
-- 1. Lock down telemetry session tokens (drop public SELECT)
DROP POLICY IF EXISTS "Public read telemetry sessions" ON public.fight_telemetry_sessions;
DROP POLICY IF EXISTS "Anyone update telemetry sessions" ON public.fight_telemetry_sessions;
DROP POLICY IF EXISTS "Anyone insert telemetry sessions" ON public.fight_telemetry_sessions;

CREATE POLICY "Authenticated read telemetry sessions"
ON public.fight_telemetry_sessions
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated insert telemetry sessions"
ON public.fight_telemetry_sessions
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update telemetry sessions"
ON public.fight_telemetry_sessions
FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

-- 2. Lock down vision sync sessions
DROP POLICY IF EXISTS "Public can read recent vision sync sessions" ON public.vision_sync_sessions;

CREATE POLICY "Authenticated read recent vision sync sessions"
ON public.vision_sync_sessions
FOR SELECT TO authenticated
USING (created_at >= (now() - interval '24 hours'));

-- 3. Remove anon insert on station rate limits (server-side only via service role)
DROP POLICY IF EXISTS "rate_limits_anon_insert" ON public.station_rate_limits;

-- 4. Add admin check inside settle_market_payouts
CREATE OR REPLACE FUNCTION public.settle_market_payouts(p_market_id uuid, p_winning_outcome_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_market RECORD;
  v_total_pool NUMERIC;
  v_winning_pool NUMERIC;
  v_net_pool NUMERIC;
  v_ticket RECORD;
  v_payout NUMERIC;
  v_wallet_id UUID;
BEGIN
  -- Authorization: only admins may settle markets
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can settle markets';
  END IF;

  SELECT * INTO v_market FROM public.market WHERE id = p_market_id;
  SELECT COALESCE(SUM(pool), 0) INTO v_total_pool FROM public.outcome WHERE market_id = p_market_id;
  SELECT COALESCE(pool, 0) INTO v_winning_pool FROM public.outcome WHERE id = p_winning_outcome_id;
  v_net_pool := v_total_pool * (1 - v_market.rake);

  FOR v_ticket IN
    SELECT * FROM public.bet_ticket
    WHERE market_id = p_market_id AND outcome_id = p_winning_outcome_id AND status = 'ACCEPTED'
  LOOP
    IF v_winning_pool > 0 THEN
      v_payout := v_ticket.stake * (v_net_pool / v_winning_pool);
    ELSE
      v_payout := v_ticket.stake;
    END IF;
    v_payout := GREATEST(v_payout, v_ticket.stake);

    SELECT id INTO v_wallet_id FROM public.wallet WHERE user_id = v_ticket.user_id AND currency = 'BDG';

    UPDATE public.wallet SET balance = balance + v_payout WHERE id = v_wallet_id;
    UPDATE public.bet_ticket
       SET status = 'WON', payout_amount = v_payout, settled_at = now()
     WHERE id = v_ticket.id;

    INSERT INTO public.wallet_tx (wallet_id, kind, amount, reference_id, meta)
    VALUES (v_wallet_id, 'BET_PAYOUT', v_payout, v_ticket.id,
            jsonb_build_object('market_id', p_market_id, 'payout_ratio', v_payout / v_ticket.stake));
  END LOOP;

  UPDATE public.bet_ticket
     SET status = 'LOST', settled_at = now()
   WHERE market_id = p_market_id AND outcome_id != p_winning_outcome_id AND status = 'ACCEPTED';

  UPDATE public.market SET state = 'settled' WHERE id = p_market_id;

  INSERT INTO public.settlement (market_id, winning_outcome_id, total_pool, total_rake, total_payout, settled_by, result_type)
  VALUES (p_market_id, p_winning_outcome_id, v_total_pool, v_total_pool * v_market.rake, v_net_pool, auth.uid(), 'WIN');
END;
$function$;

-- 5. Revoke EXECUTE on settlement from anon/authenticated; admin RPC must go through service role or has admin check (kept as belt-and-braces)
REVOKE EXECUTE ON FUNCTION public.settle_market_payouts(uuid, uuid) FROM anon, authenticated;
