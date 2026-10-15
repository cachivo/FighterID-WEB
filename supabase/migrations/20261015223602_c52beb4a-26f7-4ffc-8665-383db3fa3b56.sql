CREATE OR REPLACE FUNCTION arena_private.save_arena_result(p_session_id uuid, p_bout_type text, p_red_fighter_id uuid, p_blue_fighter_id uuid, p_red_name text, p_blue_name text, p_winner_corner text, p_result_type text, p_round_number integer, p_round_config integer, p_round_duration_sec integer, p_rounds jsonb, p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid:=auth.uid(); v_existing public.tm_verdict%ROWTYPE; v_id uuid; v_winner uuid; v_fighter record; v_column text; v_discipline text; v_level text; v_updated boolean:=false;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión' USING ERRCODE='42501'; END IF;
 IF p_session_id IS NULL OR p_bout_type NOT IN ('sparring','official') THEN RAISE EXCEPTION 'Tipo de sesión inválido'; END IF;
 IF p_bout_type='official' AND NOT (public.has_role(v_user,'admin') OR public.has_role(v_user,'super_admin') OR public.has_role(v_user,'judge') OR public.has_role(v_user,'official_judge')) THEN RAISE EXCEPTION 'Solo un juez o administrador puede registrar una pelea oficial' USING ERRCODE='42501'; END IF;
 IF p_red_fighter_id IS NULL AND p_blue_fighter_id IS NULL THEN RAISE EXCEPTION 'Selecciona al menos un peleador registrado'; END IF;
 IF p_red_fighter_id=p_blue_fighter_id THEN RAISE EXCEPTION 'Los peleadores deben ser distintos'; END IF;
 IF p_bout_type='official' AND (p_red_fighter_id IS NULL OR p_blue_fighter_id IS NULL) THEN RAISE EXCEPTION 'Una pelea oficial requiere dos peleadores registrados'; END IF;
 IF nullif(trim(p_red_name),'') IS NULL OR nullif(trim(p_blue_name),'') IS NULL THEN RAISE EXCEPTION 'Ambos nombres son obligatorios'; END IF;
 IF p_round_config NOT IN (3,5,8) OR p_round_duration_sec<=0 OR p_round_number<1 OR p_round_number>p_round_config OR jsonb_typeof(p_rounds) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rounds)<>p_round_number THEN RAISE EXCEPTION 'Rounds inválidos'; END IF;
 IF p_result_type NOT IN ('ko','tko','decision_unanimous','decision_split','decision_majority','draw','dq','no_contest') THEN RAISE EXCEPTION 'Resultado inválido'; END IF;
 IF p_result_type IN ('draw','no_contest') THEN
   IF p_winner_corner IS NOT NULL THEN RAISE EXCEPTION 'Este resultado no tiene ganador'; END IF;
 ELSIF p_winner_corner IS NULL OR p_winner_corner NOT IN ('red','blue') THEN RAISE EXCEPTION 'Selecciona una esquina ganadora'; END IF;
 IF p_bout_type='official' AND p_result_type IN ('decision_unanimous','decision_split','decision_majority','draw') AND p_round_number<>p_round_config THEN RAISE EXCEPTION 'Completa todos los rounds para una decisión oficial'; END IF;
 IF (p_red_fighter_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fighter_profiles WHERE id=p_red_fighter_id)) OR (p_blue_fighter_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fighter_profiles WHERE id=p_blue_fighter_id)) THEN RAISE EXCEPTION 'Peleador no encontrado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_session_id::text,0));
 SELECT * INTO v_existing FROM public.tm_verdict WHERE session_id=p_session_id;
 IF FOUND THEN
  IF v_existing.judge_user_id<>v_user THEN RAISE EXCEPTION 'Sesión no disponible' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('verdict_id',v_existing.id,'records_updated',v_existing.records_updated,'duplicate',true);
 END IF;
 v_winner:=CASE p_winner_corner WHEN 'red' THEN p_red_fighter_id WHEN 'blue' THEN p_blue_fighter_id ELSE NULL END;
 INSERT INTO public.tm_verdict(judge_user_id,red_fighter_id,blue_fighter_id,winner_fighter_id,result_type,round_number,round_config,round_duration_sec,rounds,notes,bout_type,session_id,red_name,blue_name)
 VALUES(v_user,p_red_fighter_id,p_blue_fighter_id,v_winner,p_result_type,p_round_number,p_round_config,p_round_duration_sec,p_rounds,p_notes,p_bout_type,p_session_id,p_red_name,p_blue_name) RETURNING id INTO v_id;
 IF p_bout_type='official' AND p_result_type<>'no_contest' THEN
  FOR v_fighter IN SELECT id,discipline,level FROM public.fighter_profiles WHERE id IN(p_red_fighter_id,p_blue_fighter_id) ORDER BY id FOR UPDATE LOOP
   v_column:=CASE WHEN p_result_type='draw' THEN 'draws' WHEN v_fighter.id=v_winner THEN 'wins' ELSE 'losses' END;
   v_discipline:=CASE v_fighter.discipline::text WHEN 'MMA' THEN 'mma_record_' WHEN 'Boxeo' THEN 'boxeo_record_' ELSE 'record_' END;
   v_level:=CASE lower(replace(replace(coalesce(v_fighter.level,''),'_',''),'-','')) WHEN 'amateur' THEN 'amateur_' WHEN 'semipro' THEN 'semi_pro_' WHEN 'semi pro' THEN 'semi_pro_' WHEN 'semiprofesional' THEN 'semi_pro_' WHEN 'professional' THEN 'pro_' WHEN 'profesional' THEN 'pro_' WHEN 'pro' THEN 'pro_' ELSE NULL END;
   -- Single increment on the official discipline record; trg_sync_official_record mirrors it to record_*.
   EXECUTE format('UPDATE public.fighter_profiles SET %I=coalesce(%I,0)+1,updated_at=now() WHERE id=$1',v_discipline||v_column,v_discipline||v_column) USING v_fighter.id;
   IF v_level IS NOT NULL THEN EXECUTE format('UPDATE public.fighter_profiles SET %I=coalesce(%I,0)+1 WHERE id=$1',v_level||v_column,v_level||v_column) USING v_fighter.id; END IF;
  END LOOP;
  v_updated:=true;
  UPDATE public.tm_verdict SET records_updated=true WHERE id=v_id;
 END IF;
 RETURN jsonb_build_object('verdict_id',v_id,'records_updated',v_updated,'duplicate',false);
END; $$;
REVOKE ALL ON FUNCTION arena_private.save_arena_result(uuid,text,uuid,uuid,text,text,text,text,integer,integer,integer,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION arena_private.save_arena_result(uuid,text,uuid,uuid,text,text,text,text,integer,integer,integer,jsonb,text) TO authenticated,service_role;