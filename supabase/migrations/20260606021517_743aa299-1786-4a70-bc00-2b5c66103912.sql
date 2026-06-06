
CREATE OR REPLACE FUNCTION public.get_fighter_record_history(p_fighter_id uuid)
RETURNS TABLE (
  verdict_id          uuid,
  signed_at           timestamptz,
  result_type         text,
  outcome             text,
  round_number        int,
  round_config        int,
  opponent_id         uuid,
  opponent_name       text,
  judge_user_id       uuid,
  judge_email         text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    v.id                                              AS verdict_id,
    v.signed_at,
    v.result_type,
    CASE
      WHEN v.result_type = 'no_contest'               THEN 'no_contest'
      WHEN v.result_type = 'draw'                     THEN 'draw'
      WHEN v.winner_fighter_id = p_fighter_id         THEN 'win'
      ELSE 'loss'
    END                                               AS outcome,
    v.round_number,
    v.round_config,
    CASE
      WHEN v.red_fighter_id = p_fighter_id THEN v.blue_fighter_id
      ELSE v.red_fighter_id
    END                                               AS opponent_id,
    TRIM(BOTH ' ' FROM COALESCE(fp.first_name, '') || ' ' || COALESCE(fp.last_name, '')) AS opponent_name,
    v.judge_user_id,
    u.email::text                                     AS judge_email
  FROM public.tm_verdict v
  LEFT JOIN public.fighter_profiles fp
    ON fp.id = CASE
                 WHEN v.red_fighter_id = p_fighter_id THEN v.blue_fighter_id
                 ELSE v.red_fighter_id
               END
  LEFT JOIN auth.users u
    ON u.id = v.judge_user_id
  WHERE v.records_updated = true
    AND (v.red_fighter_id = p_fighter_id OR v.blue_fighter_id = p_fighter_id)
  ORDER BY v.signed_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_fighter_record_history(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_fighter_record_history(uuid) TO authenticated;
