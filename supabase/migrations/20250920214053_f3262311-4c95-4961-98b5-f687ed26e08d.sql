-- Drop the vw_round_leaderboard view to resolve security definer view warning
-- This view is not being used in the application and causes security linter warnings
-- because it joins tables with RLS policies

DROP VIEW IF EXISTS public.vw_round_leaderboard;