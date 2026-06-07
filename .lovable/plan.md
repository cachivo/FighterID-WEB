# SPARC — Sparring Performance Assessment & Ranking Circuit

A parallel ecosystem inside Fighter ID for judged sparring. Independent records and rankings. Built for low-end Android, bad networks, and zero vote loss.

## Scope

- Disciplines: **BOXING** + **MMA** (segregated, using existing `useDiscipline()` pattern)
- Fully isolated from official records / rankings / fight results
- Roles: SPARC Admin, Judge, Coach, Fighter (read-only for own record)

---

## Phase 1 — Database foundation (Time Master = Postgres)

All state transitions go through SECURITY DEFINER RPCs. Frontend never mutates state directly.

**Tables** (all `sparc_*`, RLS on, GRANTs included):

```text
sparc_events           id, discipline, name, host_gym_id, starts_at, state, meta
sparc_sessions         id, event_id, name, state, scheduled_at, time_master_offset
sparc_session_members  session_id, app_user_id, role(admin|judge|coach|observer), status
sparc_fights           id, session_id, red_fighter_id, blue_fighter_id, weight_class,
                       rounds_planned, round_duration_s, vote_window_s, state, current_round
sparc_rounds           id, fight_id, idx, started_at, ended_at, voting_opens_at,
                       voting_closes_at, state
sparc_votes            id, round_id, judge_id, choice(red|blue|draw|abstain),
                       client_vote_id (UUID, unique), submitted_at, confirmed_at, status
sparc_vote_drafts      round_id, judge_id, choice, client_vote_id, updated_at
                       (server mirror; primary draft store is IndexedDB)
sparc_results          fight_id, winner(red|blue|draw), method(decision|abstain_majority),
                       red_rounds, blue_rounds, draw_rounds, confirmed_by, confirmed_at
sparc_records          fighter_id, discipline, wins, losses, draws, sparring_count
sparc_rankings         discipline, weight_class, fighter_id, points, rank
sparc_gym_rankings     discipline, gym_id, points, rank
sparc_coach_rankings   discipline, coach_id, points, rank
sparc_presence         session_id, app_user_id, status(online|away|reconnecting|offline),
                       last_seen, client_info
sparc_audit_log        actor_id, session_id, fight_id, round_id, action, payload, at
sparc_reconnections    session_id, app_user_id, disconnected_at, reconnected_at, gap_ms
```

**Fight state machine** (enforced by trigger + RPC):
`CREATED → READY → WAITING_JUDGES → ACTIVE → ROUND_BREAK → VOTING_OPEN → VOTING_CLOSED → FINISHED → RESULT_CONFIRMED → ARCHIVED`

**RPCs** (single source of truth):
- `sparc_open_round(fight_id)` / `sparc_close_round(round_id)`
- `sparc_open_voting(round_id)` / `sparc_close_voting(round_id)` (auto-marks non-voters as `ABSTAIN`)
- `sparc_submit_vote(round_id, choice, client_vote_id)` — idempotent on `client_vote_id`, blocks doubles, returns CONFIRMED
- `sparc_compute_result(fight_id)` — round winners + fight winner
- `sparc_heartbeat(session_id)` — updates presence
- `sparc_recover_session(app_user_id)` — returns current session/fight/round + remaining time

**Realtime**: Postgres `REPLICA IDENTITY FULL` + `supabase_realtime` publication on `sparc_fights`, `sparc_rounds`, `sparc_votes` (judge's own), `sparc_presence`.

---

## Phase 2 — Client resilience layer

**Local persistence**:
- `localStorage`: `sparc.session_id`, `sparc.fight_id`, `sparc.round_id`, `sparc.role`, `sparc.last_sync`
- `IndexedDB` (via `idb`): vote drafts queue, pending submissions, audit buffer

**Vote lifecycle**:
1. Tap choice → write to IndexedDB as `DRAFT` with generated `client_vote_id`
2. Network call to `sparc_submit_vote` → mark `SUBMITTED`
3. Server response → mark `CONFIRMED`
4. Background worker retries `SUBMITTED`-but-not-`CONFIRMED` and `DRAFT` items on reconnect
5. UI shows only `CONFIRMED` as final

**Reconnection manager** (`useSparcConnection`):
- Online/offline events + Supabase realtime channel state
- Heartbeat every 5s while visible; pause on `visibilitychange=hidden`, resume on visible
- On reconnect: call `sparc_recover_session`, flush IndexedDB queue, rejoin realtime channel
- Exponential backoff (1s → 30s cap)

**Boot redirect**: On app open, if `sparc.session_id` exists and `sparc_recover_session` returns an active fight → redirect straight to `/sparc/live/:fightId`. No login/dashboard/menu.

---

## Phase 3 — UI (mobile-first, 320–390px primary)

Routes:
- `/sparc` — hub (events list, my role)
- `/sparc/admin/events` — create/manage events & sessions (admin)
- `/sparc/session/:id` — session control room (admin sees judges' presence in real time)
- `/sparc/live/:fightId` — **judge view** (the critical screen)
- `/sparc/records/:fighterId` — independent sparring record
- `/sparc/rankings` — independent rankings (fighter / gym / coach)

**Judge live view** (single screen, no nav):
- Top: countdown bar (round timer or voting timer), color = state
- Middle: Red / Blue fighter names + records
- Bottom: 3 large buttons (RED / DRAW / BLUE) — only enabled during `VOTING_OPEN`, disabled after first tap (no double-click), shows local DRAFT → SUBMITTED → CONFIRMED tick
- Status chip: connection state (ONLINE / RECONNECTING / OFFLINE)
- Pending vote banner if IndexedDB queue non-empty

**Admin view**: live grid of judges with presence dots; per-fight controls (start round, close round, confirm result).

**Performance constraints** (per project memory: Honduras 2–3GB Android):
- No `bg-fixed`, no blur orbs, no heavy gradients on live view
- No animations beyond CSS transforms on the timer bar
- Lazy-load admin/ranking routes; live view eager only
- Editorial Sports v2 tokens (Geist + crimson `#DC2626` + `#0A0A0A`), 2px radius, hairline borders

---

## Phase 4 — Ranking & records engine

- Trigger on `sparc_results` insert → updates `sparc_records`, `sparc_rankings`, `sparc_gym_rankings`, `sparc_coach_rankings` atomically
- Points formula (configurable per discipline): win=3, draw=1, loss=0, bonus for clean sweep
- Idempotent via `(fight_id)` unique key on results
- **Never touches** `fighter_profiles.record_*`, official `fights`, or any existing ranking table

---

## Phase 5 — Auditing & disaster recovery

- Every state transition + vote + presence change writes to `sparc_audit_log`
- `sparc_reconnections` row per gap > 2s
- Server restart recovery: clients call `sparc_recover_session` on reconnect; state is fully reconstructable from DB

---

## Out of scope (this plan)

- AI Vision / Coach Evaluation / Hybrid Scoring — schema leaves room (`sparc_votes.source` enum extensible) but no UI
- Native push notifications (web heartbeat + realtime is enough for v1)
- Offline event creation by admins (admin requires connectivity; only judge votes are offline-tolerant)

---

## Delivery order

1. Migration: all `sparc_*` tables + RPCs + triggers + RLS + GRANTs
2. `useSparcConnection` + IndexedDB vote queue (`src/system/sparc/`)
3. Judge live view + recovery boot redirect
4. Admin session control room
5. Records + rankings pages
6. Audit dashboard (admin)

Estimated: 5 focused build passes. Phase 1 + 2 + 3 (judge view) is the MVP that satisfies the "never lose a vote" criterion.
