# Changelog

All notable changes to **Fighter ID**. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning by date (rolling release).

---

## [2026-06-08] — License audit: reconciled profile/license drift + consistency trigger

> **Context**: Audit of 77 fighter profiles found 3 inconsistencies where `fighter_profiles.license_status` diverged from the actual `fighter_licenses` rows. Root cause: no synchronization mechanism between the two tables; UI code sometimes read the profile column and sometimes the license table, causing misleading status displays.

### Data integrity — fixed

- **2 Boxeo profiles** (`dcde47b4…`, `fb24308d…`) — `license_status` corrected from `active` → `pending` to match their actual `PENDING_REVIEW` license state. No license number or `primary_license_id` changed; they remain in the admin approval queue.
- **1 MMA profile** (`82bb63ea…`, Miguel Á. Calderón, `FGT-2025-039`) — Missing `fighter_licenses` row created with `ACTIVE` status, `is_primary=true`, dates derived from profile creation, and audit note `'Reconciliación de auditoría 2026-06-07'`. `primary_license_id` backfilled on the profile.

### Database — added

- **`trg_sync_fighter_profile_license`** — `AFTER INSERT/UPDATE/DELETE` trigger on `fighter_licenses` that keeps `fighter_profiles` in sync automatically. For each affected fighter it selects the best license (primary first, then by status precedence `ACTIVE > PENDING_REVIEW > SUSPENDED > REVOKED`, then most recent) and updates `primary_license_id`, `license_status`, and `license_number`. Idempotent: no-op when values already match. Prevents future drift.
- **Migrations**: `supabase/migrations/20260607235641_697a9d7c-386e-4418-bfe9-dc3fbc0cee72.sql` (trigger + function) and `20260608000113_118959c8-76d5-4608-8514-237406702458.sql` (guard clause to prevent recursive loop on trigger depth).

### UI — fixed

- **`src/hooks/useLicenseAuth.tsx`** — Removed the "forced ACTIVE" fallback that was overriding real license status. Now queries `fighter_licenses` directly, sets `hasActiveLicense` only when `status === 'ACTIVE'`, and routes users correctly: `SUSPENDED` → `/license/suspended`, `PENDING_REVIEW` → `/license/pending`.
- **`src/pages/profile/ProfileHub.tsx`** — License query now orders by `is_primary DESC, created_at DESC` so the primary license is always authoritative. Route mapping simplified: `suspended` → `/license/suspended`, anything else non-active → `/license/onboarding` only when no license row exists.

### Verification

- Re-run audit query: **0 inconsistencies** across all 77 profiles.
- `useLicenseAuth` correctly reports `active_license` for Miguel Á. Calderón and `pending_license` for the 2 boxeadores.

### Files changed

- **Created**: `supabase/migrations/20260607235641_697a9d7c-386e-4418-bfe9-dc3fbc0cee72.sql`, `supabase/migrations/20260608000113_118959c8-76d5-4608-8514-237406702458.sql`
- **Edited**: `src/hooks/useLicenseAuth.tsx`, `src/pages/profile/ProfileHub.tsx`

---

## [2026-06-07b] — SPARC v2 Integrity-First Hardening (Build Pass 0, 1, 2)

> **Context**: The SPARC scoring system needed integrity guarantees — no lost votes, no duplicate devices, no clock drift, no blocked events, immutable confirmed votes, configurable quorum, and recomputable rankings. Delivered as three build passes: database/RPC foundation (Pass 0), judge resilience layer (Pass 1), and the Time Master Dashboard (Pass 2).

### SPARC — added (Build Pass 0: Database & Server Logic)

- **`sparc_server_time()`** — Returns server timestamp + monotonic token; client calculates RTT/offset so every countdown is server-synchronized.
- **`sparc_claim_device(session_id, device_id, device_label)`** — One judge = one active device. If a different device is already bound, writes `DEVICE_TRANSFER` audit log, updates `active_device_id`, and broadcasts a realtime `device_revoked` event to kick the old device.
- **`sparc_submit_vote()`** — Rewritten to be idempotent, window-aware, and device-aware. Rejects votes with `VOTING_CLOSED` when `now() >= voting_closes_at` and `DEVICE_NOT_BOUND` when `client_device_id != active_device_id`.
- **`sparc_close_voting(round_id)`** — In a single transaction sets every vote of the round to `LOCKED`. A `BEFORE UPDATE/DELETE` trigger on `sparc_votes` blocks any mutation of `LOCKED` rows (even admins).
- **`sparc_session_quorum()` / `sparc_open_voting()`** — Enforces `min_quorum_pct` (default 60) and optional `min_quorum_absolute`. Below quorum → returns `QUORUM_NOT_MET`; admin can still override.
- **`sparc_auto_close_expired_rounds()`** — Opportunistically sweeps expired rounds from any judge heartbeat or admin tick, so rounds close even if the admin browser is dead.
- **`sparc_heartbeat()`** — Upgraded to compute `ONLINE | IDLE | AWAY | OFFLINE` from `last_interaction` age (10s / 60s / 300s thresholds).
- **`sparc_admin_override(fight_id, action, reason)`** — Admin-only escape hatch for `force_close_round`, `force_close_voting`, `force_confirm_result`, `force_advance_fight`. Requires mandatory reason; fully audited in `sparc_audit_log` as `EMERGENCY_OVERRIDE`.
- **`sparc_vote_source` enum + `source_meta jsonb`** — Vote source tracking (`human | ai | coach | hybrid | auto`) with metadata. Schema is AI-ready; current UI writes `human`.
- **Ranking resilience** — `sparc_rankings` now stores `wins`, `losses`, `draws`, `sparring_count`, `strength_of_schedule`. `sparc_rankings_v` computes `rank` via `ROW_NUMBER()` per discipline/weight class. `sparc_recompute_rankings(discipline)` recalculates on demand without migrations.
- **`sparc_event_dashboard_v`** — Aggregated executive view per active session: active fight, current round, judge presence counts, quorum status, last vote timestamp, sync drift, next fight. Powers Build Pass 2 without further DB work.
- **Migrations**: `supabase/migrations/20260607183902_06a1b20b-29f5-43ef-938d-282945d604a6.sql` and `20260607184757_6a1090d7-b54d-495e-bf3e-061d90ab8257.sql`.

### SPARC — added (Build Pass 1: Judge Resilience Layer)

- **`src/system/sparc/hooks/useSparcServerClock.ts`** — Client hook that calls `sparc_server_time()` on mount + every 30s, measures RTT, computes clock offset, and exports `serverNow()`. Bans `Date.now()` in SPARC views.
- **`src/system/sparc/hooks/useSparcDevice.ts`** — Generates a persistent `device_id` (stored in `localStorage`), claims it via `sparc_claim_device`, and monitors `device_revoked` broadcasts to trigger a full-screen lockout overlay if the session is transferred to another device.
- **`src/system/sparc/storage/voteDb.ts`** — IndexedDB store for vote persistence with lifecycle states: `DRAFT → SUBMITTED → CONFIRMED → LOCKED`, plus terminal states `REJECTED_TOO_LATE` and `DEVICE_REJECTED`.
- **`src/system/sparc/voteQueue.ts`** — Submission pipeline passes `device_id` to `sparc_submit_vote`, handles terminal vs. retryable errors, and reconciles server state back into IndexedDB.
- **`src/system/sparc/hooks/useSparcRecoveryWorker.ts`** — Background recovery process polling every 15s to flush pending votes from IndexedDB using exponential backoff (1s–30s).
- **`src/system/sparc/hooks/useSparcSessionRecovery.ts`** — On app launch/refresh calls `sparc_recover_session` and auto-redirects judges back to the active fight at `/sparc/live/:fightId`.
- **`src/system/sparc/hooks/useSparcInteraction.ts`** — Tracks `last_interaction` on `pointerdown` / `keydown` for heartbeat presence state.
- **`src/pages/sparc/SparcLiveFight.tsx`** — Overhauled for low-end Android (no blurs/shadows). Large touch targets (≥56px), real-time state reconciliation (e.g. `markRoundLocked` on round close), visual countdowns driven by `serverNow()`, distinct `LOCKED` tick.
- **`src/system/sparc/useSparcConnection.tsx`** — Heartbeat now sends `p_device_id` and `p_interacted`.

### SPARC — added (Build Pass 2: Time Master Dashboard)

- **`src/pages/sparc/SparcDashboard.tsx`** — Operational control center at `/sparc/dashboard/:sessionId` (admin-gated). Reads `sparc_event_dashboard_v` and `sparc_session_quorum()` via realtime.
- **Realtime subscriptions** — `sparc_presence`, `sparc_fights`, `sparc_rounds`, `sparc_votes`, `sparc_audit_log` for live updates.
- **Judge grid** — Displays all judges with color-coded presence states (`online`, `idle`, `away`, `offline`).
- **Quorum gauge** — Live progress bar against `min_quorum_pct` / `min_quorum_absolute`.
- **Emergency override drawer** — Calls `sparc_admin_override()` with mandatory reason input for `force_close_round`, `force_close_voting`, `force_confirm_result`, `force_advance_fight`.
- **System health panel** — Shows sync offset, latency, and realtime connection status.
- **`src/App.tsx`** — Added lazy-loaded route for the dashboard.

### Files changed

- **Created**: `src/system/sparc/hooks/useSparcServerClock.ts`, `src/system/sparc/hooks/useSparcDevice.ts`, `src/system/sparc/hooks/useSparcInteraction.ts`, `src/system/sparc/hooks/useSparcRecoveryWorker.ts`, `src/system/sparc/hooks/useSparcSessionRecovery.ts`, `src/system/sparc/storage/voteDb.ts`, `src/pages/sparc/SparcDashboard.tsx`, and two Supabase migrations.
- **Edited**: `src/pages/sparc/SparcLiveFight.tsx`, `src/system/sparc/voteQueue.ts`, `src/system/sparc/useSparcConnection.tsx`, `src/App.tsx`, `src/integrations/supabase/types.ts`.

---

## [2026-06-07] — Critical stability fix: query-pattern failures & orphaned auth rows

> **Context**: Systemic `.single()` query failures across multiple hooks/pages caused unhandled rejections when an expected row did not exist. The root trigger was an inconsistent `app_user` backfill state where some `auth.users` rows had no corresponding `app_user`, making every `.single()` call throw at runtime.

### Auth — fixed

- **`src/hooks/useAppUserId.tsx`** — Both helper and hook switched from `.single()` to `.maybeSingle()`. Returns `null` gracefully when no `app_user` row exists for the current `auth.users` session.
- **`src/pages/Auth.tsx`** — Invitation acceptance flow now retries up to 5 attempts waiting for the database trigger to create the linked `app_user` row, and persists the verification token across attempts.
- **`supabase/migrations/20260607175959_b34e87a3-5e55-43bf-9bd2-96f4a57ab678.sql`** — Backfills every orphaned `auth.users` row with a unique `app_user` record (sanitized email prefix + UUID suffix) so existing accounts no longer trigger missing-row errors.

### Roles — fixed

- **`src/hooks/useUserRoles.tsx`** — Legacy accounts whose `app_user.auth_user_id` is `null` now fall back to querying by `app_user.id`, restoring role resolution for pre-migration users.
- **`src/components/AdminProtectedRoute.tsx`** — Removed dead `isAdmin === null` branch that caused UI flicker; authentication check now runs first and returns early with a loading state.

### Fighter sensitive data — fixed

- **`src/pages/FighterProfile.tsx`** — `getFighterById()` wrapped in `try/catch/finally`; ownership validation query switched to `.maybeSingle()` to prevent crashes on non-existent fighter IDs.
- **`src/hooks/useFighterProfiles.tsx`** — All `.single()` calls converted to `.maybeSingle()` with explicit error messages when a fighter profile is missing.
- **`src/hooks/useUserProfile.tsx`** — Query switched to `.maybeSingle()` and surfaces an empty-state instead of throwing when the profile row is absent.
- **`src/pages/profile/ProfileHub.tsx`** — `gym_staff` and `judges` relationship queries now bind on `appUser.id` (the application user UUID) instead of the raw `auth.users` UUID, fixing silent data mismatches that leaked incorrect gym/coach visibility.

### State / session — fixed

- **`src/system/session/session.service.ts`** — `startSession()` now returns `WorkSession | null` and guards against a missing `app_user` row before writing; `getOpenSessionFor()` no longer propagates null dereferences.
- **`src/system/session/useSession.tsx`** — Handles `null` session responses and fixes a cleanup race condition that left stale listeners on rapid unmount/remount.
- **`src/hooks/useEvents.tsx`** — Event creation now explicitly inserts `state: 'draft'` so downstream consumers never read an undefined state.

### Files changed

- **Created**: `supabase/migrations/20260607175959_b34e87a3-5e55-43bf-9bd2-96f4a57ab678.sql`
- **Edited**: `src/hooks/useAppUserId.tsx`, `src/hooks/useEvents.tsx`, `src/hooks/useFighterProfiles.tsx`, `src/hooks/useUserProfile.tsx`, `src/hooks/useUserRoles.tsx`, `src/pages/Auth.tsx`, `src/pages/FighterProfile.tsx`, `src/pages/profile/ProfileHub.tsx`, `src/components/AdminProtectedRoute.tsx`, `src/system/session/session.service.ts`, `src/system/session/useSession.tsx`

## [2026-05-02b] — Security hardening pass 2 (CORS allowlist + dry-run patches)

> **Context**: Bug-hunter scan flagged 1 critical (`.env` tracked) and 25 high (wildcard CORS in 17 edge functions). This pass closes them without touching business logic.

### Security — added

- **`supabase/functions/_shared/cors.ts`** — New shared helper exporting `ALLOWED_ORIGINS`, `buildCorsHeaders(req)`, `isAllowedOrigin(origin)`. Echoes the request's `Origin` only when in allowlist; otherwise returns canonical origin (browser rejects). Adds `Vary: Origin`, `Access-Control-Max-Age: 86400`, scoped methods.
- Allowlist: `fighter-id.org`, `www.fighter-id.org`, `fighterid.lovable.app`, the Lovable preview domain, and dev `localhost:{5173,8080,3000}`.
- **`scripts/untrack-env.sh`** — One-shot helper to run `git rm --cached .env` locally. The committed `.env` only contains the publishable Supabase anon key (safe by design — `VITE_*` prefix proves it ships to the browser), but it should not be tracked.

### Security — changed

- **17 edge functions refactored to per-request CORS**:
  `admin-ai-assistant`, `ai-strike-test-simulator`, `check-email-exists`, `delete-user`, `fetch-link-metadata`, `fetch-sports-news`, `notify-admin-pending`, `populate-batalla-gimnasios`, `publish-news-to-social`, `receive-contact`, `remove-image-background`, `send-fighter-invitation`, `send-gym-invitation`, `send-license-approval`, `send-mass-email`, `send-password-recovery`, `send-signup-confirmation`.
  Each now imports `buildCorsHeaders(req)` and computes the headers per request inside the handler. The static `corsHeaders = { '*' }` constant is removed.
- **`.gitignore`** — Added explicit `.env` entry under a security comment.

### Security — intentionally unchanged (documented exceptions)

These edge functions keep `Access-Control-Allow-Origin: *` because they receive **server-to-server** traffic (no browser origin) and rejecting unknown origins would break them:

- `ai-strike-ingest` — external IA vision engine push
- `ai-strike-test-simulator` *(refactored, but allowlist already includes our dev/prod origins)*
- `bet-delay-processor` — pg_cron worker
- `finalize-fight-auto` — pg_cron / database trigger
- `process-email-queue` — pg_cron worker
- `session-embed` — invoked from other edge functions, no browser
- `vision-start-session` — external IA engine telemetry posts

These are recorded in `SECURITY_FIGHTER_DATA.md` and in security memory.

### Code quality — changed

- **`src/components/EventImporter.tsx`** — `useState(null)` → typed `useState<ImportResult | null>(null)` (local `ImportResult` interface).
- **`src/components/FighterIDModal.tsx`** — `useState(null)` → typed via `Awaited<ReturnType<typeof getUserFighterProfile>>`.
- **`src/pages/EventDetail.tsx`** — `useState(null)` → typed via `(typeof events)[number]`.
- The 3 `Promise<void>` patches from `react_logic_fixer.py` dry-run were **rejected** as false positives — `event.logger.ts`, `retrieval.service.ts`, `session.service.ts` already return correctly inferred types (`Promise<boolean>`, etc.). Documented to avoid future re-application.

### Verification

- `python3 scripts/bug_hunter.py` post-fix: **High dropped 25 → 8** (the 6 documented webhook exceptions + 2 unrelated). Critical remains 1 until the user runs `scripts/untrack-env.sh` locally.
- `bunx vitest run`: **12/12 tests passing**, no regression.

---


## [2026-05-02c] — Landing section header unification + HHF rebrand

### UI — added
- **`src/components/landing/SectionDivider.tsx`** — Reusable section header (hairlines + uppercase title + uppercase tracked subtitle) extracted from the Boxeo block, now the single source of truth for landing section dividers.

### UI — changed
- **`src/pages/Index.tsx`** — `BoxeoBlock` refactored to use `<SectionDivider>`. New MMA divider added before the UCC ranking (`title="MMA"`, subtitle pulled from `ranking_organizations.description`).
- **`src/components/sections/GymShowcase.tsx`**, **`src/components/StrategicAllies.tsx`**, **`src/components/landing/HowItWorks.tsx`** — Replaced bespoke `ufc-label` echo headers with `<SectionDivider>` for consistent hierarchy across landing sections.

### Data — changed
- **`ranking_organizations.description`** — `HHF_AMATEUR` updated from `"Minor League — boxeo amateur de barrio"` to `"Boxeo Honduras Hood Fights"` so the HHF ranking subtitle on the landing reads as the user requested.

### Out of scope
- Internal page headers (`PageHeader` on sub-routes) keep their own style.

---


## [2026-05-02] — Landing page rescue for low-end mobile (Honduras)

> **Context**: Most users in Honduras are on 2–3 GB RAM Android phones (Moto E, Tecno Spark, Adreno 5xx / Mali-G52) on 3G or congested 4G. The landing was unusable — heavy parallax, fixed blur orbs, three eager Ranking sections each opening their own WebSocket subscriptions, and a 226 KB PNG hero.

### Performance — added

- **`src/components/LazyMount.tsx`** — IntersectionObserver wrapper, 200 px rootMargin. Defers rendering (and therefore data fetching + realtime subscriptions) until the user scrolls near the section.
- **`src/components/landing/HowItWorks.tsx`** — Pure-CSS, ~2 KB Swiss-brutalist 3-step strip (Regístrate → Verifica → Compite). Replaces "engagement gap" between hero and rankings without adding image payload.
- **WebP hero assets**: `src/assets/hero-cage-mobile.webp` (~22 KB) and `hero-cage-desktop.webp` (~50 KB), served via `<picture>` with `<source media>`.
- **`<link rel="preload" as="image" fetchpriority="high">`** in `index.html` for the hero, with mobile/desktop media queries.

### Performance — changed

- **`src/components/sections/Ranking.tsx`** — Removed `bg-fixed` (causes full-screen repaint per scroll frame on budget GPUs). Echo-stack title now `md:` only.
- **`src/components/UrbanDecorations.tsx`** — Replaced four `position: fixed` `blur-3xl` orbs with a single static CSS radial-gradient on `body::before`. Zero DOM nodes, zero blur cost.
- **`src/components/Hero.tsx`** — Single dominant CTA ("Crea tu Fighter ID") instead of two equal buttons (better signup conversion). Live ticker pill (EN VIVO event or next-event countdown) for proof-of-life. Trust strip with real-time counters animated only once on entry.
- **`src/pages/Index.tsx`** — Only **one** Ranking (UCC_MMA) renders eagerly. Boxeo block (FEDEHBOX + HHF_AMATEUR), GymShowcase, and StrategicAllies are all wrapped in `<LazyMount>`. Saves **4+ WebSocket subscriptions** per cold landing visit.
- **`index.html`** — Removed `Cache-Control: no-cache, no-store, Expires: 0` meta tags (Vite fingerprints assets; these were forcing redundant downloads on repeat visits — disastrous on slow connections). Trimmed Google Fonts.
- **`src/main.tsx`** — Service Worker registered only in production; auto-unregistered in dev to prevent stale-asset surprises.

### Performance — removed

- **6 unused large image assets** in `src/assets/`: `arena-octagon.png`, `blue-arena.jpg` (2.2 MB), `hero-urban.jpg`, `mma-cage-4k.png` (891 KB), `mma-ring-background.png`. Directory size dropped from **4.0 MB → 401 KB**. Deletions confirmed via `rg` reference scan.

### Memory rules added

- `mem://performance/landing-page-low-end-mobile` — Enforced rules: no `bg-fixed`, no fixed blur orbs, WebP hero <30 KB, mandatory `LazyMount` for below-fold, max 1 eager Ranking. Target: Honduras 2–3 GB Android.

### Expected impact

| Metric                                  | Before    | After    |
| --------------------------------------- | --------- | -------- |
| Landing transferred bytes (mobile cold) | ~3.2 MB   | ~600 KB  |
| Hero image                              | 226 KB    | ~22 KB   |
| FCP on Moto E (3G)                      | ~5–7 s    | ~1.8 s   |
| Scroll jank in Ranking section          | Severe    | None     |
| Realtime WebSockets at landing          | 6 (3×2)   | 2 (1×2)  |
| Repeat-visit cache                      | Broken    | Full     |

### Out of scope (intentionally untouched)

- All routes, all navigation items, all Rankings (Boxeo simply mounts on scroll instead of being deleted).
- `useRealTimeStats`, all data hooks, realtime functionality.
- Admin, license, gym, judge flows.
- Brand identity (Swiss-brutalist + UFC red preserved).

---

## [2026-05-01] — Round 1: Security hardening & architecture

> **Context**: External audit flagged committed `.env`, RLS gaps, route-param enumeration risk, and architectural drift (5 nested providers, duplicated admin route trees, no test infrastructure).

### Security

- **RLS migration** applied to **10 tables**:
  - `fights` — writes restricted to admins / creators.
  - `configuracion_sitio` — writes restricted to admins.
  - `post_comments` — ownership enforced on update/delete.
  - `license_verification_tokens` — public `SELECT` removed.
  - `bet_delay_queue`, `station_*`, and others — narrowed policies.
- **Route-param validation** via new **`src/hooks/useUuidParam.tsx`** (Zod `z.string().uuid()`) — prevents enumeration attacks via malformed UUIDs in `:id` / `:eventId` routes. Applied to `FighterProfile.tsx` and `EventDetail.tsx` first; standard going forward.
- **Production error visibility** — `App.tsx` global error handlers now surface via `sonner` toasts instead of being silently swallowed.
- Memory: `mem://security/rls-hardening-round-1` documents the changes and the Round 2 roadmap (public views for sensitive data).

### Architecture & refactor

- **`src/routes/adminDisciplineRoutes.tsx`** — Unified MMA/Boxing admin route subtrees into a single shared component, significantly reducing `App.tsx` bloat.
- **Project renamed** to `fighter-id` in `package.json`.
- **Lockfile hygiene** — Deleted `package-lock.json` and `bun.lockb`; `bun.lock` is the single source of truth.

### Testing — added

- **Vitest + React Testing Library + jsdom** infrastructure: `vitest.config.ts`, `src/test/setup.ts`.
- **12 initial tests** (all green):
  - `src/system/events/event.types.test.ts` (3) — Event-type whitelist.
  - `src/lib/scoring-utils.test.ts` (4) — Scoring math.
  - `src/lib/fighterDataFilter.test.ts` (5) — Fighter data filtering rules.
- Standard: pure-function extraction + mocked Supabase client.

### Files

- **Created**: `src/routes/adminDisciplineRoutes.tsx`, `src/hooks/useUuidParam.tsx`, `vitest.config.ts`, `src/test/setup.ts`, three test files, `mem://security/rls-hardening-round-1`.
- **Edited**: `src/App.tsx`, `package.json`, `src/pages/FighterProfile.tsx`, `src/pages/EventDetail.tsx`, `mem://index.md`.
- **Deleted**: `package-lock.json`, `bun.lockb`.
- **Migration**: `supabase/migrations/20260501234648_*.sql`.

### Notes

- The `.env` file contains the Supabase **publishable** (anon) key. This key is designed to be exposed in client bundles; RLS protects the data. The committed-key concern is **moot for the publishable key** — the real risk would be a service-role key, which lives only in Lovable Cloud secrets.
- `.gitignore` is currently locked by the platform; once writable, `.env` / `.env.*` should be added with `!.env.example` exception. An `.env.example` is provided.

---

## Audit notes (2026-05-02)

- **Test suite**: 12/12 passing.
- **TODO/FIXME markers in source**: 0 (only one Spanish-language comment in `ProfileProgressWidget.tsx` containing the substring "TODOS").
- **Console errors at landing**: none. Only React Router v7 future-flag deprecation warnings (informational).
- **Realtime channels at landing (post-fix)**: 1 global `fighter-updates-global` + per-route subscription on fighter detail pages. No leaks observed in cleanup logs.
- **Open architectural debts** (not fixed in this round, tracked):
  - 5 nested root providers in `App.tsx` — candidate for an `AppProviders` composition.
  - README hardcodes a Supabase edge-function URL in copyable curl snippets — to be parameterized.
  - `.gitignore` lacks `.env*` entries (file is read-only in the platform; will land when unlocked).
