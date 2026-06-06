
-- 1) Remove pre-existing duplicate verdicts (keep the row that updated records)
DELETE FROM public.tm_verdict t
USING public.tm_verdict k
WHERE t.id <> k.id
  AND t.judge_user_id   = k.judge_user_id
  AND t.red_fighter_id  = k.red_fighter_id
  AND t.blue_fighter_id = k.blue_fighter_id
  AND (t.signed_at AT TIME ZONE 'UTC')::date = (k.signed_at AT TIME ZONE 'UTC')::date
  AND t.records_updated = false
  AND k.records_updated = true;

-- 2) Atomic guard: one verdict per judge + pair + UTC day
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tm_verdict_judge_pair_day
  ON public.tm_verdict (
    judge_user_id,
    red_fighter_id,
    blue_fighter_id,
    ((signed_at AT TIME ZONE 'UTC')::date)
  );

-- 3) Update RPC to handle the unique_violation atomically
CREATE OR REPLACE FUNCTION public.save_fight_result(
  p_red_fighter_id     uuid,
  p_blue_fighter_id    uuid,
  p_winner_fighter_id  uuid,
  p_result_type        text,
  p_round_number       int,
  p_round_config       int,
  p_round_duration_sec int,
  p_rounds             jsonb,
  p_notes              text,
  p_update_records     boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge           uuid := auth.uid();
  v_verdict_id      uuid;
  v_loser           uuid;
  v_records_updated boolean := false;
  v_existing        uuid;
BEGIN
  IF v_judge IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_red_fighter_id IS NULL OR p_blue_fighter_id IS NULL THEN
    RAISE EXCEPTION 'both fighters are required';
  END IF;

  IF p_red_fighter_id = p_blue_fighter_id THEN
    RAISE EXCEPTION 'fighters must be distinct';
  END IF;

  -- Fast-path idempotency check (catches duplicates that already committed)
  SELECT id INTO v_existing
  FROM public.tm_verdict
  WHERE judge_user_id   = v_judge
    AND red_fighter_id  = p_red_fighter_id
    AND blue_fighter_id = p_blue_fighter_id
    AND (signed_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
  ORDER BY signed_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'verdict_id',       v_existing,
      'records_updated',  false,
      'duplicate',        true
    );
  END IF;

  BEGIN
    -- Insert FIRST so the unique index catches concurrent duplicates BEFORE we touch records
    INSERT INTO public.tm_verdict (
      judge_user_id, red_fighter_id, blue_fighter_id, winner_fighter_id,
      result_type, round_number, notes,
      round_config, round_duration_sec,
      records_updated, rounds
    ) VALUES (
      v_judge, p_red_fighter_id, p_blue_fighter_id, p_winner_fighter_id,
      p_result_type, p_round_number, p_notes,
      p_round_config, p_round_duration_sec,
      false, COALESCE(p_rounds, '[]'::jsonb)
    )
    RETURNING id INTO v_verdict_id;
  EXCEPTION WHEN unique_violation THEN
    -- A concurrent transaction already inserted the verdict for this judge/pair/day
    SELECT id INTO v_existing
    FROM public.tm_verdict
    WHERE judge_user_id   = v_judge
      AND red_fighter_id  = p_red_fighter_id
      AND blue_fighter_id = p_blue_fighter_id
      AND (signed_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
    ORDER BY signed_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
      'verdict_id',      v_existing,
      'records_updated', false,
      'duplicate',       true
    );
  END;

  IF p_update_records THEN
    IF p_result_type = 'draw' THEN
      UPDATE public.fighter_profiles
         SET record_draws = COALESCE(record_draws, 0) + 1,
             updated_at   = now()
       WHERE id = p_red_fighter_id;
      UPDATE public.fighter_profiles
         SET record_draws = COALESCE(record_draws, 0) + 1,
             updated_at   = now()
       WHERE id = p_blue_fighter_id;
      v_records_updated := true;

    ELSIF p_result_type = 'no_contest' THEN
      v_records_updated := false;

    ELSIF p_winner_fighter_id IS NOT NULL THEN
      v_loser := CASE
                   WHEN p_winner_fighter_id = p_red_fighter_id
                     THEN p_blue_fighter_id
                   ELSE p_red_fighter_id
                 END;
      UPDATE public.fighter_profiles
         SET record_wins = COALESCE(record_wins, 0) + 1,
             updated_at  = now()
       WHERE id = p_winner_fighter_id;
      UPDATE public.fighter_profiles
         SET record_losses = COALESCE(record_losses, 0) + 1,
             updated_at    = now()
       WHERE id = v_loser;
      v_records_updated := true;
    END IF;

    IF v_records_updated THEN
      UPDATE public.tm_verdict
         SET records_updated = true
       WHERE id = v_verdict_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'verdict_id',      v_verdict_id,
    'records_updated', v_records_updated,
    'duplicate',       false
  );
END;
$$;
