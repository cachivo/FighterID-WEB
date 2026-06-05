## Goal

Make Time Master work for anyone on any device with zero coordination: whoever opens Time Master IS the judge. They pick the two fighters, run the timer, and submit the verdict — their authenticated user id + timestamp is the digital signature on the record. Admins can later edit/delete results from the admin panel.

## Changes

### 1. UI — `src/pages/TimeMaster.tsx`
- Remove the "Juez" fighter selector, the "Sala multi-dispositivo" card, room code copy, `PresenceBar`, and all `useTimeMasterMatch` wiring.
- Add a compact "Juez" header strip showing the current authenticated user (name + avatar) with the line "Actúas como juez oficial. Tu firma digital quedará registrada al subir el resultado." If not logged in, show a CTA to log in — uploading records requires auth.
- Keep Red/Blue fighter selectors, config, timer, controls, result dialog, record-update dialog exactly as they are.

### 2. Verdict persistence — `src/hooks/useTimeMaster.ts`
- In `finishMatch` (or a new `submitVerdict`), when the user confirms "update records", write one row to a new `tm_verdict` table with: `judge_user_id = auth.uid()`, `red_fighter_id`, `blue_fighter_id`, `winner_fighter_id`, `result_type`, `round_number`, `notes`, `round_config`, `round_duration_sec`, `records_updated`, `signed_at = now()`. This row is the digital signature + timestamp audit log; the existing `fighter_profiles` win/loss/draw update continues to run alongside.
- If the judge declines to upload, still insert the `tm_verdict` row with `records_updated = false` so we have a full audit trail (optional — confirm in step 4).

### 3. Database — new migration
- Create `public.tm_verdict` with the columns above and standard `id/created_at/updated_at`.
- GRANT `SELECT, INSERT` to `authenticated`, `ALL` to `service_role`. No anon access.
- Enable RLS. Policies:
  - INSERT: `auth.uid() = judge_user_id`.
  - SELECT: the judge can read their own rows; admins (via existing `has_role(auth.uid(),'admin')` / `super_admin`) can read all.
  - UPDATE/DELETE: admins only — this is what powers "admin can later edit/delete mistakes".
- Drop the unused multi-device pieces: `DROP FUNCTION public.tm_submit_verdict`, `DROP TABLE public.tm_match` (created in the previous migration, never adopted in the simplified flow).

### 4. Cleanup — remove dead multi-device code
- Delete `src/pages/TimeMasterJoin.tsx`, `src/hooks/useTimeMasterMatch.ts`, `src/components/time-master/PresenceBar.tsx`, `src/components/time-master/JudgeVerdictPanel.tsx`.
- Remove the `/time-master/join` route from `src/App.tsx` and the exports from `src/components/time-master/index.ts`.

### 5. Admin edit/delete (scaffolding only, full UI later)
- Note in the plan that the admin panel page to list/edit/delete `tm_verdict` rows is a follow-up; this plan only ships the table + RLS so admins can already manage rows from the Supabase dashboard. Confirm if you want the admin UI now or as a separate task.

## Open question
- Should a declined upload still write a `tm_verdict` row (full audit) or write nothing (only signed updates are stored)?
