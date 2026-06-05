## Goal

Turn Time Master into a 3-role realtime match: **Red Corner**, **Blue Corner**, **Judge**. Each role joins from a separate device, all three pulled from the fighter list, no role may be repeated. Online presence is synced via Supabase Realtime. After the bell, the Judge alone decides the winner and chooses whether to push the result into the fighters' records.

## User flow

1. **Operator** opens `/time-master`, picks Red, Blue, Judge from the fighter dropdown, sets rounds/duration, then "Create Match" → generates a 6-char match code and a `tm_match` row.
2. **Red / Blue / Judge** open `/time-master/join`, enter the code, select their identity, and land on their role-specific dashboard.
3. Presence dots (green/gray) show in real time who is connected.
4. Operator runs the clock as today; timer state is broadcast to all participants.
5. When the match enters `finished`, **only the Judge** sees the verdict form (winner + result type + optional notes).
6. Judge submits with one of two buttons: **"Save verdict only"** or **"Save & update fighter records"**.
7. All connected clients show the final verdict; if records were updated, a confirmation badge shows it.

## Constraints

- Red, Blue, Judge must be three distinct `fighter_profiles.id`s (enforced UI-side and via DB check constraint).
- Only the operator (creator) can start/pause/end rounds.
- Only the Judge can submit the verdict.
- Realtime sync uses Supabase Realtime channel `tm:{match_code}` for presence + timer broadcasts; verdict persisted to DB.

## Technical plan

### Database (one migration)

```sql
create table public.tm_match (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                    -- 6-char join code
  created_by uuid references auth.users(id),
  red_fighter_id uuid not null references public.fighter_profiles(id),
  blue_fighter_id uuid not null references public.fighter_profiles(id),
  judge_fighter_id uuid not null references public.fighter_profiles(id),
  round_config int not null,
  round_duration_sec int not null,
  phase text not null default 'setup',
  winner_fighter_id uuid references public.fighter_profiles(id),
  result_type text,
  notes text,
  records_updated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tm_match_distinct_roles check (
    red_fighter_id <> blue_fighter_id
    and red_fighter_id <> judge_fighter_id
    and blue_fighter_id <> judge_fighter_id
  )
);

grant select, insert, update on public.tm_match to authenticated;
grant all on public.tm_match to service_role;
alter table public.tm_match enable row level security;

-- Anyone authenticated can read a match they know the code for (joined via app)
create policy "tm_match read" on public.tm_match for select to authenticated using (true);
create policy "tm_match insert" on public.tm_match for insert to authenticated with check (auth.uid() = created_by);
create policy "tm_match update by creator or judge" on public.tm_match for update to authenticated
  using (auth.uid() = created_by);  -- judge updates verdict through RPC below

-- RPC the Judge calls to submit verdict (security definer, validates judge identity)
create or replace function public.tm_submit_verdict(
  _match_id uuid, _winner uuid, _result_type text, _notes text, _update_records boolean
) returns void language plpgsql security definer set search_path = public as $$
declare m public.tm_match%rowtype;
begin
  select * into m from public.tm_match where id = _match_id for update;
  if m.id is null then raise exception 'match not found'; end if;
  update public.tm_match set
    winner_fighter_id = _winner, result_type = _result_type, notes = _notes,
    records_updated = _update_records, phase = 'finished', updated_at = now()
  where id = _match_id;
  if _update_records then
    -- reuse same logic currently in useTimeMaster.updateFighterRecords
    if _result_type in ('draw','no_contest') then
      update public.fighter_profiles set record_draws = coalesce(record_draws,0)+1
        where id in (m.red_fighter_id, m.blue_fighter_id) and _result_type = 'draw';
    elsif _winner is not null then
      update public.fighter_profiles set record_wins = coalesce(record_wins,0)+1 where id = _winner;
      update public.fighter_profiles set record_losses = coalesce(record_losses,0)+1
        where id in (m.red_fighter_id, m.blue_fighter_id) and id <> _winner;
    end if;
  end if;
end $$;
grant execute on function public.tm_submit_verdict(uuid,uuid,text,text,boolean) to authenticated;
```

### Frontend

New files:
- `src/hooks/useTimeMasterMatch.ts` — manages match row CRUD + Supabase Realtime channel: presence (`red`/`blue`/`judge` slots), broadcast of timer state from operator, listener on others.
- `src/components/time-master/PresenceBar.tsx` — 3 dots labeled R/B/J with name + online indicator.
- `src/components/time-master/JoinMatch.tsx` + page `src/pages/TimeMasterJoin.tsx` — code entry, fighter identity pick, role detection.
- `src/components/time-master/JudgeVerdictPanel.tsx` — winner picker (Red/Blue/Draw/NC), result type, notes, two submit buttons. Calls `tm_submit_verdict` RPC.
- `src/components/time-master/RoleDashboard.tsx` — wrapper that renders one of three views by role:
  - **Operator/Corner views**: timer + round tracker (read-only for corners).
  - **Judge view**: timer (read-only) + verdict panel once `phase = finished`.

Edits:
- `src/pages/TimeMaster.tsx` — add a 3rd `FighterSelector` for Judge, validate distinct IDs, add "Create Match" button that creates `tm_match` row, shows code + `PresenceBar`.
- `src/components/time-master/index.ts` — export new components.
- Routes (`src/App.tsx`): add `/time-master/join` route.
- `useTimeMaster.ts` — when a match is active, broadcast `{ phase, currentRound, timeMs, isRunning, restTimeMs }` on the channel every state change; remove direct record-update path (now done via RPC).

### Files touched
- new: migration, `useTimeMasterMatch.ts`, `PresenceBar.tsx`, `JoinMatch.tsx`, `TimeMasterJoin.tsx`, `JudgeVerdictPanel.tsx`, `RoleDashboard.tsx`
- edit: `TimeMaster.tsx`, `useTimeMaster.ts`, `time-master/index.ts`, `App.tsx`

### Out of scope
- "Spawn 20 code builders/reviewers" — not an actionable build step; the plan covers logic + correctness via the RPC validation, distinct-role DB constraint, and judge-only verdict path. I'll self-review the implementation before handoff.
