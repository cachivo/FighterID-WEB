-- Enroll missing Amateur Boxers in HHF_AMATEUR ranking
-- These 4 boxers have discipline='Boxeo', level='Amateur' but no ranking entry

INSERT INTO fighter_rankings (fighter_id, organization_id, level, weight_class, points, is_active)
VALUES 
  -- Aaron Irias (Amateur, Peso Gallo)
  ('ebe3c93b-62b1-41d2-85ee-7b981045b71c', '232544c6-de1f-4eb0-b05a-549960d8909f', 'Amateur', 'Peso Gallo', 0, true),
  -- Adiel Eduardo Espinoza (Amateur, Peso Pluma)
  ('82841ce3-7176-421b-95dc-a2249b52ea9f', '232544c6-de1f-4eb0-b05a-549960d8909f', 'Amateur', 'Peso Pluma', 0, true),
  -- Kevin Josué Calona Zelaya (Amateur, Peso Mosca)
  ('03577271-fec7-482e-b342-c83e671bdbe0', '232544c6-de1f-4eb0-b05a-549960d8909f', 'Amateur', 'Peso Mosca', 0, true),
  -- Michael Cabrera (Amateur, Peso Pluma)
  ('b9523962-6c92-4075-b644-dd2b7cd314b6', '232544c6-de1f-4eb0-b05a-549960d8909f', 'Amateur', 'Peso Pluma', 0, true)
ON CONFLICT (fighter_id, organization_id) DO UPDATE SET
  is_active = true,
  level = EXCLUDED.level,
  weight_class = EXCLUDED.weight_class;