# Changelog

All notable changes to **Fighter ID**. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning by date (rolling release).

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
