# Fighter ID

> The certified, real-time identity & ranking platform for combat sports — MMA & Boxing.
> Built for Honduras (HHF / FEDEHBOX / UCC), engineered for low-end mobile.

**Live**: https://fighter-id.org · **Preview**: https://fighterid.lovable.app
**Lovable Project**: https://lovable.dev/projects/c4add1c8-f68d-4715-9b10-5a9613b9085b

---

## Table of contents

1. [What is Fighter ID](#what-is-fighter-id)
2. [Architecture overview](#architecture-overview)
3. [Tech stack](#tech-stack)
4. [Getting started](#getting-started)
5. [Project structure](#project-structure)
6. [Data model & key views](#data-model--key-views)
7. [Authentication & roles](#authentication--roles)
8. [Multi-discipline (MMA / Boxing)](#multi-discipline-mma--boxing)
9. [AI Vision & live HUD](#ai-vision--live-hud)
10. [Performance — low-end mobile policy](#performance--low-end-mobile-policy)
11. [Security model & RLS](#security-model--rls)
12. [Testing](#testing)
13. [Coding conventions](#coding-conventions)
14. [Deployment](#deployment)
15. [Recent changes](#recent-changes)

---

## What is Fighter ID

Fighter ID is the official digital licensing, ranking and live-event platform for combat sports federations in Honduras. It serves four kinds of users from a single account:

- **Fighters** — public profile, verified record, official ranking, license issuance, social feed.
- **Gyms / Coaches** — roster management, fight requests, membership audit.
- **Officials & Judges** — digital scorecards (3-station system), referee control room, sanctions.
- **Federation admins** — segregated MMA / Boxing dashboards, approvals, rankings, email campaigns, AI Vision diagnostics.

Each `app_user` row can own multiple roles simultaneously (`fighter`, `gym`, `judge`, `admin`, …) with module switching from `/profile/hub`.

## Architecture overview

```
┌──────────────────────────── Client (React 18 + Vite 5) ────────────────────────────┐
│                                                                                    │
│  Routes (React Router)        Hooks layer            UI (shadcn + Tailwind)        │
│  ├─ /                         useAuth                Swiss-Brutalist tokens        │
│  ├─ /fighter/:id              useFighterByIdQuery    Hero · Ranking · HUD          │
│  ├─ /events/:id               useFightTelemetry      LazyMount, useInView          │
│  ├─ /admin/* (MMA · Boxing)   useDiscipline          Mobile-first grids            │
│  ├─ /license/* (FFid)         useLicenseAuth                                       │
│  └─ /hud/:id                  useVisionSyncSession                                 │
│                                                                                    │
│           ▲                                                                        │
│           │  React Query                                                           │
│           ▼                                                                        │
│  ┌─────────────────────────── Lovable Cloud (Supabase) ─────────────────────────┐ │
│  │  Postgres + RLS                Realtime               Edge Functions          │ │
│  │  ├─ fighter_profiles           fights                 ai-strike-ingest        │ │
│  │  ├─ fights → fights_full view  fighter_updates        vision-start-session    │ │
│  │  ├─ user_roles (separate!)     work_session_events    send-* (Resend)         │ │
│  │  ├─ work_sessions / events     vision_sync_sessions   admin-ai-assistant      │ │
│  │  └─ knowledge_embeddings (pgvector)                   session-embed (RAG)     │ │
│  │                                                                                │ │
│  │  Storage buckets: avatars, posters, gym-logos, judge-uploads                  │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│  Lovable AI Gateway (text + embeddings) — used by RAG and admin assistant         │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## Tech stack

| Layer            | Technology                                                              |
| ---------------- | ----------------------------------------------------------------------- |
| Framework        | **React 18**, **Vite 5**, **TypeScript 5**                              |
| Styling          | **Tailwind CSS v3** + shadcn/ui, semantic HSL tokens, Clash + Satoshi   |
| State / data     | **TanStack Query**, Supabase JS v2, Zod for input validation            |
| Backend          | **Lovable Cloud** (Supabase: Postgres, Auth, Realtime, Edge, Storage)   |
| AI               | **Lovable AI Gateway** (chat + embeddings → `pgvector`)                 |
| Auth             | Supabase Auth (email + Google OAuth, PKCE), separate `user_roles` table |
| Animation        | framer-motion (gated on `useReducedMotion` + `isLowEnd`)                |
| Mobile shell     | Capacitor (PWA install + native shell ready)                            |
| Testing          | **Vitest** + React Testing Library, jsdom                               |
| Email            | Resend via edge functions, custom domain `fighter-id.org`               |
| Analytics        | Custom realtime hooks (`useRealTimeStats`)                              |

## Getting started

```bash
# 1. Install
bun install        # or npm install

# 2. Env (the included .env has publishable Supabase values; fine for local)
cp .env.example .env   # only needed if cloning fresh

# 3. Dev
bun run dev        # http://localhost:8080

# 4. Tests
bunx vitest run

# 5. Lint
bun run lint
```

> **Note**: `SUPABASE_PUBLISHABLE_KEY` is the Supabase anon/publishable key. It is **safe** to expose in the client bundle — RLS protects the data. Service-role keys live only in Lovable Cloud secrets and are used by edge functions.

## Project structure

```
src/
├─ App.tsx                   # Root: providers + router
├─ main.tsx                  # SW registration (prod only)
├─ assets/                   # Optimized WebP/JPG (≤30KB hero on mobile)
├─ components/
│  ├─ ui/                    # shadcn primitives
│  ├─ landing/               # Hero, HowItWorks, QuickStats
│  ├─ sections/Ranking.tsx   # Mobile-tuned ranking blocks
│  ├─ LazyMount.tsx          # IntersectionObserver wrapper
│  └─ UrbanDecorations.tsx   # CSS-only background (no blur orbs)
├─ contexts/                 # Auth, License, Discipline, Tooltip
├─ hooks/
│  ├─ useAuth, useAdmin, useUserRole, useDiscipline
│  ├─ useUuidParam           # Zod-validated route params
│  ├─ fighters/, gyms/       # Domain-grouped React Query hooks
│  └─ useDeviceCapability    # isLowEnd, prefers-reduced-motion
├─ pages/
│  ├─ admin/                 # Federation admin (MMA + Boxing segregated)
│  ├─ license/               # Fighter licensing flow (FFid)
│  ├─ gym/, judge/, station/ # Role-specific dashboards
│  └─ Index.tsx              # Landing — hero + 1 eager Ranking, rest lazy
├─ routes/
│  └─ adminDisciplineRoutes.tsx  # Shared MMA/Boxing admin subtree
├─ system/                   # Sessions, events, RAG, workflow adapter
├─ lib/                      # Pure utilities (testable)
└─ test/                     # Vitest setup
supabase/
├─ functions/                # Edge functions (Deno)
└─ migrations/               # Append-only SQL migrations
```

## Data model & key views

**Always read fights through views, never join manually.**

| View / table             | Purpose                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `fights_full`            | Canonical fight read (joins fighters, weights, results). **Use me.** |
| `fights_hud`             | Lightweight projection for live HUD                                  |
| `fighter_profiles`       | Identity (name/phone live in `app_user`)                             |
| `app_user`               | Canonical user record, mandatory at ProfileSetup                     |
| `user_roles`             | **Roles never live on the user table** — security-critical           |
| `fights`                 | Source of truth; results saved via `save_fight_result` RPC           |
| `bdg_event`              | Events; `meta` JSONB carries streaming + sponsorship config          |
| `work_sessions/_events`  | Append-only audit/RAG ingestion                                      |
| `knowledge_embeddings`   | pgvector embeddings (Lovable AI Gateway)                             |
| `vision_sync_sessions`   | HUD ↔ Vision engine pairing                                          |

The `parseMeta` pattern is mandatory when reading any JSONB `meta` column — mobile browsers occasionally return strings.

## Authentication & roles

- Email + Google OAuth (PKCE flow). Google domains registered in Supabase + GCP.
- 17 roles validated through `useUserRole` boolean helpers. Single email → multiple roles (Fighter + Gym + Judge + Admin) via `/profile/hub` switching.
- **Roles live in `public.user_roles`** with a `SECURITY DEFINER` `has_role()` function — never check client-side localStorage for admin status.
- License module (FFid) is independent: `LicenseAuthProvider` only triggers checks on `/license/*` routes.
- Admin guard: `useAdmin` accepts `admin` + `super_admin`. License checks are scoped to `/license`.
- Onboarding guards redirect to `/auth` after email confirm if no session.

## Multi-discipline (MMA / Boxing)

Admin UI is **fully segregated** by discipline:

- `useDiscipline()` is mandatory in admin pages; never hardcode org codes.
- Routes share via `src/routes/adminDisciplineRoutes.tsx` (single subtree, two prefixes).
- `user_discipline_access` controls per-user MMA vs Boxing rights for gyms/coaches.
- Boxing rankings auto-migrate boxers between `HHF_AMATEUR` and `FEDEHBOX` based on level.
- Weight classes: discipline-specific tables and utility functions in `src/lib/constants/disciplines.ts`.

## AI Vision & live HUD

- HUD shown at `/hud/:fightId`, paired with a Vision engine via `vision-start-session` edge function (returns short session token).
- Strike events ingested through `ai-strike-ingest`, which enforces a strict v3.4 contract (`start → event → end`, active-state validation).
- Telemetry stored in JSONB; CASCADE delete from `fights` cleans sessions + events.
- Real-time KPIs (FPS, latency, persons detected) surfaced in `/admin/vision-diagnostics`.
- Demo mode at `/hud/demo` simulates the full pipeline (connected = attempted) without a real engine.
- `trg_fight_result_inserted` automates points + finish detection; idempotent.

## Performance — low-end mobile policy

The product target is a Moto E / Tecno Spark on 3G in Honduras. The following rules are **enforced** (memory-tracked):

1. **No `bg-fixed`** anywhere — kills mid-range Adreno/Mali GPUs.
2. **No animated `blur-3xl` orbs** — replaced with a single static CSS radial-gradient on `body::before`.
3. **Hero**: WebP `<picture>` (≤30KB mobile / 50KB desktop), `fetchpriority="high"`, `<link rel="preload">` in `index.html`.
4. **Single eager Ranking** above the fold (UCC_MMA). All other rankings + GymShowcase + StrategicAllies wrapped in `<LazyMount>` (IntersectionObserver, 200px rootMargin) → defers 4+ realtime WebSockets.
5. **Echo-stack title** rendered only at `md:` breakpoint.
6. **`useDeviceCapability().isLowEnd`** disables hover scale, fade-in animations, reduces ranking density (3 vs 5 entries).
7. **No `Cache-Control: no-cache`** in `index.html` — Vite fingerprints assets, browser cache is desired.
8. **Service Worker** registered in production only; auto-unregistered in dev to avoid stale assets.

Expected impact: cold-load transferred bytes ~3.2MB → ~600KB; FCP on Moto E (3G) ~6s → ~1.8s.

## Security model & RLS

- **Round 1 RLS hardening (2026-05-01)** applied to: `fights`, `bet_delay_queue`, `post_comments`, `station_*`, `configuracion_sitio`, `license_verification_tokens`, etc. See `mem://security/rls-hardening-round-1`.
- Writes to `fights` restricted to admins/creators; `post_comments` enforces ownership; `license_verification_tokens` no longer publicly selectable.
- **Route-param validation**: every `:id` / `:eventId` route uses `useUuidParam('id')` (Zod) to prevent enumeration via malformed UUIDs.
- **Atomic fight result save** via `save_fight_result` RPC prevents race conditions.
- **Roles in separate table** with `SECURITY DEFINER has_role()` — never on the user table (privilege-escalation-safe).
- Defensive JSON parsing (`parseMeta`) on every `meta` column read.
- Error toasts via `sonner` replaced silent global rejections in production.
- Pending Round 2: public views for sensitive tables, broader audit of `SELECT` exposure on profile-adjacent tables.

> Detailed posture: see `SECURITY_FIGHTER_DATA.md`. Memory-managed via the security memory document.

## Testing

```bash
bunx vitest run          # full suite
bunx vitest              # watch
```

- Vitest + RTL + jsdom (`vitest.config.ts`, `src/test/setup.ts`).
- Standard: extract business logic into pure functions, mock the Supabase client.
- Current coverage: event whitelisting, scoring utilities, fighter data filter (12 tests, all green).
- See `mem://architecture/testing-infrastructure-vitest`.

## Coding conventions

- **Design tokens only** — never hardcode `text-white` / `bg-black`. Use `--background`, `--primary`, etc. (HSL).
- **Brand assets** via `useSystemAssets` hook — never hardcode Lovable upload paths.
- **Forms**: initialize every field (no `undefined`); use explicit `null` for empty optional numerics (height, weight). Never `0`.
- **DB reads**: always `fights_full` / `fights_hud` views. Exception: `search_fighters_for_gym`.
- **Mobile-first admin**: default `grid-cols-1`. Never `truncate` on names.
- **No icons** in landing UI per Swiss-brutalist identity.
- Memory rules in `mem://index.md` are authoritative — read before adding cross-cutting features.

## Deployment

- **Lovable**: Publish via project dashboard → custom domain `fighter-id.org`.
- **Email**: SPF/DKIM/DMARC configured for `fighter-id.org` via Resend.
- **PWA**: manifest + SW; install prompt available on mobile.
- **Capacitor**: native shell pre-configured (`capacitor.config.ts`) for future store releases.

## Recent changes

See [`CHANGELOG.md`](./CHANGELOG.md) for the full history. Highlights:

- **2026-05-02** — Landing page rescue for low-end Honduras mobile: hero diet, GPU-killer removal, lazy-mount below-fold, new `HowItWorks` section, single-CTA hero. ~80% byte reduction.
- **2026-05-01** — Round 1 security hardening (10 tables), Zod route-param validation, Vitest infra, shared admin discipline routes, project rename to `fighter-id`.

For deeper subsystems:

- [`AI_VISION_SYSTEM_README.md`](./AI_VISION_SYSTEM_README.md) — Vision engine contract, telemetry schema.
- [`SCORING_SYSTEM_README.md`](./SCORING_SYSTEM_README.md) — 3-station digital scoring.
- [`SECURITY_FIGHTER_DATA.md`](./SECURITY_FIGHTER_DATA.md) — Fighter data exposure model.
- [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md) — Business-level overview.
