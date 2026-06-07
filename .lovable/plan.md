# SPARC v2 — Integrity-First Hardening Plan

Adopting the recommendation: **Build Pass 0 (DB/RPC/State/Audit) first, then UI.** The product is event integrity, not screens.

---

## Build Pass 0 — Database & Server Logic (no UI)

Single migration that extends the existing `sparc_*` schema. All transitions remain SECURITY DEFINER RPCs; frontend never mutates state directly.

### 1. Last-judge problem → **Policy A (auto-ABSTAIN)**
- `sparc_close_voting(round_id)` already marks non-voters as `ABSTAIN`. Confirm + harden:
  - Add server-side cron-like check: when `now() >= voting_closes_at`, any client call to `sparc_submit_vote` is rejected (`VOTING_CLOSED`).
  - Add `sparc_auto_close_expired_rounds()` RPC (called by admin dashboard tick + by any judge heartbeat as opportunistic sweep) so the round closes even if admin browser is dead.
- Result computation runs immediately on close; event never blocks on a missing judge.

### 2. Multi-device protection → **One judge = one active device**
- Add to `sparc_session_members`:
  - `active_device_id text`, `active_device_label text`, `device_bound_at timestamptz`
- New RPC `sparc_claim_device(session_id, device_id, device_label)`:
  - If different device already bound → write `sparc_audit_log` (`DEVICE_TRANSFER`), update `active_device_id`, broadcast realtime kick to old device.
- `sparc_submit_vote` validates `client_device_id = active_device_id` → else `DEVICE_NOT_BOUND` (vote rejected, stays in IndexedDB as `DRAFT` with error flag).
- Old device receives realtime event `device_revoked` → UI shows "Sesión transferida a otro dispositivo".

### 3. Vote immutability → **Add `LOCKED` state**
- Extend `sparc_vote_status` enum: `DRAFT → SUBMITTED → CONFIRMED → LOCKED`.
- `sparc_close_voting` sets every vote of that round to `LOCKED` in same transaction.
- Add `BEFORE UPDATE/DELETE` trigger on `sparc_votes`: if `OLD.status = 'LOCKED'` → `RAISE EXCEPTION`. Applies to all roles including admins (only superuser bypass, which Supabase RLS roles do not have).
- Admin "corrections" become a separate append-only `sparc_vote_overrides` table with full audit (not part of this pass — reserved).

### 4. Clock synchronization → **Server is the only clock**
- New RPC `sparc_server_time()` returning `{ server_now, monotonic_token }`.
- Client `useSparcServerClock()` hook:
  - Calls `sparc_server_time()` on mount + every 30s.
  - Measures RTT, computes `offset = server_now - (clientSent + rtt/2)`.
  - Exposes `serverNow()` = `Date.now() + offset`.
- All countdowns (round timer, voting window) computed from `voting_closes_at - serverNow()`. `Date.now()` is banned in SPARC views (lint rule via comment + code review).

### 5. Emergency override → **Admin-only escape hatch**
- Add `sparc_admin_override(fight_id, action, reason)` RPC. `action ∈ {force_close_round, force_close_voting, force_confirm_result, force_advance_fight}`.
- Requires `sparc_session_members.role = 'admin'` AND `sparc_events.created_by` chain OR `has_role(auth.uid(), 'admin')`.
- Every call writes `sparc_audit_log` with `action='EMERGENCY_OVERRIDE'` and mandatory `reason` text.
- Works regardless of judge presence/quorum.

### 6. Minimum quorum
- Add to `sparc_sessions`:
  - `min_quorum_pct int default 60` (0–100), `min_quorum_absolute int null` (overrides pct if set).
- `sparc_open_voting(round_id)` checks live presence count vs registered judges; if below quorum → returns `QUORUM_NOT_MET` (admin can still override via #5).
- Quorum state exposed via new view `sparc_session_quorum_v` for the dashboard.

### 7. Ranking resilience → **Store components, recompute rank**
- Replace `sparc_rankings.points` single column with:
  - `points int`, `wins int`, `losses int`, `draws int`, `sparring_count int`, `strength_of_schedule numeric default 0`, `last_recomputed_at timestamptz`.
- `rank` becomes a computed value via view `sparc_rankings_v` (`row_number() over (partition by discipline, weight_class order by points desc, sos desc, wins desc)`), never persisted as truth.
- Add `sparc_recompute_rankings(discipline)` RPC for full recalculation when formulas change.
- Same pattern for `sparc_gym_rankings` and `sparc_coach_rankings`.

### 8. AI-ready vote source
- Add to `sparc_votes`:
  - `source sparc_vote_source not null default 'human'` (enum: `human | ai | coach | hybrid`)
  - `source_meta jsonb default '{}'::jsonb` (model id, confidence, etc.)
- All current UI continues to write `human`. No code change needed beyond default — but schema is future-proof.

### 9. Inactivity detection → **Granular presence states**
- Extend `sparc_presence_status` enum: `ONLINE | IDLE | AWAY | RECONNECTING | OFFLINE`.
- Add `sparc_presence.last_interaction timestamptz` (updated on tap/scroll, not on heartbeat).
- Heartbeat RPC accepts `p_last_interaction` and computes status:
  - `< 10s` → `ONLINE`
  - `10–60s` → `IDLE`
  - `60–300s` → `AWAY`
  - `> 300s` or no heartbeat 15s → `OFFLINE`
- Client updates `last_interaction` on `pointerdown` / `keydown` only.

### 10. Time Master Executive Dashboard — **data layer only this pass**
- New view `sparc_event_dashboard_v` aggregating per active session:
  - active fight, current round, `voting_closes_at`, judges online/idle/away/offline, quorum status, last vote received timestamp, next fight, sync status (max client clock drift reported).
- Powers Build Pass 2 UI without further DB work.

---

## Files touched in Build Pass 0

- **New migration** `supabase/migrations/<ts>_sparc_v2_hardening.sql` — all of the above (enum extends, column adds, RPCs, triggers, views, GRANTs, RLS adjustments).
- **No UI changes.** Existing `SparcLiveFight` / `SparcAdmin` keep working (backward-compatible enum extensions, additive columns).

---

## Build Pass 1 — Judge view upgrade (after Pass 0 approved & run)

- Wire `useSparcServerClock` into `SparcLiveFight` (replace `Date.now()` countdowns).
- Wire `sparc_claim_device` on mount; handle `device_revoked` realtime event with full-screen lockout.
- Update IndexedDB queue: on `VOTING_CLOSED` server event, mark local drafts as `REJECTED_TOO_LATE` (no retry).
- Show `LOCKED` tick (final) distinct from `CONFIRMED`.
- Track `last_interaction` (pointer/key listeners).

## Build Pass 2 — Time Master Executive Dashboard

- New route `/sparc/dashboard/:sessionId` (admin only) reading `sparc_event_dashboard_v` via realtime.
- Panels: active fight, round + server-synced countdown, judge grid (color by presence state), quorum gauge, last-vote heartbeat, sync drift, ranking impact preview, next fight, **EMERGENCY OVERRIDE** drawer (with mandatory reason input).

## Build Pass 3 — Records & Rankings

- Rebuild `SparcRankings` against `sparc_rankings_v` (computed rank).
- Per-fighter sparring record page reading components, not derived rank.
- Gym + Coach ranking pages share the same view pattern.

## Build Pass 4 — Analytics & AI hooks

- Audit log explorer (filter by actor/action/fight).
- Reconnection timeline per session.
- AI vote ingestion endpoint (`source='ai'`) reserved; no UI yet.

---

## Out of scope (still)

- Native push, offline event creation by admins, AI Vision UI, coach scoring UI, override-correction workflow for `LOCKED` votes (would be a separate `sparc_vote_overrides` design).

## Delivery checkpoint

After Pass 0 migration is approved and run, the database satisfies every integrity criterion (no vote loss, no duplicate device, no clock drift, no blocked event, no mutable confirmed vote, configurable quorum, recomputable rankings, AI-ready, granular presence, dashboard-ready). UI passes then become straightforward consumers of that integrity layer.
