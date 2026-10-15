CREATE SCHEMA IF NOT EXISTS arena_private;
REVOKE ALL ON SCHEMA arena_private FROM PUBLIC;
GRANT USAGE ON SCHEMA arena_private TO authenticated,service_role,anon;
ALTER FUNCTION public.save_arena_result(uuid,text,uuid,uuid,text,text,text,text,integer,integer,integer,jsonb,text) SET SCHEMA arena_private;
ALTER FUNCTION public.get_arena_history(uuid,integer,integer) SET SCHEMA arena_private;
CREATE FUNCTION public.save_arena_result(p_session_id uuid,p_bout_type text,p_red_fighter_id uuid,p_blue_fighter_id uuid,p_red_name text,p_blue_name text,p_winner_corner text,p_result_type text,p_round_number integer,p_round_config integer,p_round_duration_sec integer,p_rounds jsonb,p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$ SELECT arena_private.save_arena_result(p_session_id,p_bout_type,p_red_fighter_id,p_blue_fighter_id,p_red_name,p_blue_name,p_winner_corner,p_result_type,p_round_number,p_round_config,p_round_duration_sec,p_rounds,p_notes); $$;
REVOKE ALL ON FUNCTION public.save_arena_result(uuid,text,uuid,uuid,text,text,text,text,integer,integer,integer,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_arena_result(uuid,text,uuid,uuid,text,text,text,text,integer,integer,integer,jsonb,text) TO authenticated,service_role;
CREATE FUNCTION public.get_arena_history(p_fighter_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20)
RETURNS TABLE(verdict_id uuid,bout_type text,opponent_id uuid,opponent_name text,result_type text,outcome text,round_count integer,rounds jsonb,signed_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT * FROM arena_private.get_arena_history(p_fighter_id,p_offset,p_limit); $$;
REVOKE ALL ON FUNCTION public.get_arena_history(uuid,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_arena_history(uuid,integer,integer) TO anon,authenticated,service_role;