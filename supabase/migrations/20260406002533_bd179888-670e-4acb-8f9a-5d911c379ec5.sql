DROP VIEW IF EXISTS public.vision_fight_context CASCADE;

CREATE VIEW public.vision_fight_context AS
SELECT 
  f.id AS fight_id, f.event_id, f.fight_number, f.status, f.weight_class,
  fp1.id AS fighter_a_id,
  COALESCE(NULLIF(fp1.name,''), CONCAT_WS(' ',fp1.first_name,fp1.last_name)) AS fighter_a_name,
  fp1.nickname AS fighter_a_nickname,
  fp1.weight_class AS fighter_a_weight,
  fp1.avatar_url AS fighter_a_avatar,
  fp1.record_wins AS fighter_a_wins,
  fp1.record_losses AS fighter_a_losses,
  fp1.record_draws AS fighter_a_draws,
  fp2.id AS fighter_b_id,
  COALESCE(NULLIF(fp2.name,''), CONCAT_WS(' ',fp2.first_name,fp2.last_name)) AS fighter_b_name,
  fp2.nickname AS fighter_b_nickname,
  fp2.weight_class AS fighter_b_weight,
  fp2.avatar_url AS fighter_b_avatar,
  fp2.record_wins AS fighter_b_wins,
  fp2.record_losses AS fighter_b_losses,
  fp2.record_draws AS fighter_b_draws,
  e.name AS event_name,
  e.start_time AS event_date,
  e.venue AS event_venue
FROM fights f
LEFT JOIN fighter_profiles fp1 ON f.fighter_a_id = fp1.id
LEFT JOIN fighter_profiles fp2 ON f.fighter_b_id = fp2.id
LEFT JOIN bdg_event e ON f.event_id = e.id;