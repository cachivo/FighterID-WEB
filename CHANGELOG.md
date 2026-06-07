# Changelog

All notable changes to **Fighter ID**. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning by date (rolling release).

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
