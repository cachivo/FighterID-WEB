# SPARC → ARENA Product Architecture Refactor

Build the ARENA competition layer on top of the existing SPARC integrity backend. **No database changes.** All RPCs/views already exist (`sparc_event_dashboard_v`, `sparc_session_quorum`, `sparc_recover_session`, `sparc_admin_override`). The existing `SparcDashboard` page is reused as the ARENA session dashboard implementation.

## New files

### `src/pages/arena/arenaHelpers.ts`
Shared `fmt(ms)` and `fmtTime(iso)` formatters.

### `src/pages/arena/ArenaLanding.tsx` — public/admin route `/arena`
Operations hub that lists ALL sessions from `sparc_event_dashboard_v`.
- Boot recovery: `recoverSession()` → if `fight_id` exists, redirect to `/arena/live/:fightId`.
- Split sessions into Active/Paused (`active_fight_id != null`) and Scheduled (no active fight).
- Stat strip: # live, # scheduled, total judges online, total sessions.
- Session cards: state badge, discipline, event name, active fight name + round, judges online/registered, "Ver Público" button → `/arena/watch/:fightId`, click card → `/arena/session/:sessionId`.
- Quick actions row: Crear Sesión (`/sparc/admin`), Arena Control (`/time-master`), Reanudar (first active session), Resultados (`/resultados`).
- Empty state with primary CTA to `/sparc/admin`.
- Editorial Sports v2 styling: `#0A0A0A` bg, hairline borders, crimson accent on live state.

### `src/pages/arena/ArenaSessionDashboard.tsx` — `/arena/session/:sessionId`
Re-exports the existing `SparcDashboard` component unchanged (it already handles quorum, judges, overrides, audit, realtime). This keeps a single dashboard implementation; we just give it the ARENA route.

### `src/pages/arena/ArenaPublicWatch.tsx` — public route `/arena/watch/:fightId`
Read-only spectator view.
- Queries `sparc_event_dashboard_v` filtered by `active_fight_id = :fightId` plus realtime subscription on `sparc_rounds` and `sparc_fights`.
- Polls every 2s as fallback.
- Big LIVE badge, red/blue corner names, round number, round countdown (server-clock via `useSparcServerClock`), vote count, voting open/closed state.
- No buttons, no mutations. Safe to embed on stream overlay.
- `useUuidParam('fightId')` to prevent enumeration.

## Modified files

### `src/App.tsx`
Add lazy imports + routes:
```tsx
const ArenaLanding = lazy(() => import("./pages/arena/ArenaLanding"));
const ArenaSessionDashboard = lazy(() => import("./pages/arena/ArenaSessionDashboard"));
const ArenaPublicWatch = lazy(() => import("./pages/arena/ArenaPublicWatch"));
```
New routes (placed alongside SPARC block):
- `/arena` → `<ArenaLanding />`
- `/arena/session/:sessionId` → `<ProtectedRoute><ArenaSessionDashboard /></ProtectedRoute>`
- `/arena/live/:fightId` → reuse existing `<SparcLiveFight />` (judge panel)
- `/arena/watch/:fightId` → `<ArenaPublicWatch />`

Legacy redirects (keep SPARC URLs working):
- `/sparc/dashboard/:sessionId` → `<Navigate to="/arena/session/:sessionId" replace />` via small inline redirect component.

Existing SPARC routes (`/sparc`, `/sparc/live/:fightId`, `/sparc/rankings`, `/sparc/admin`) stay intact.

### `src/components/Header.tsx`
Replace the "Time Master" entry in `navigationItems` (mobile sheet) with `{ name: "ARENA", href: "/arena", icon: Radio, highlight: true }`. Desktop nav already has Time Master separately — add an ARENA link before it on `lg` and `md` rows, and keep the mobile-only icon button pointing to `/arena` instead of `/time-master`.

### `src/pages/sparc/SparcHub.tsx` — full rewrite
New hierarchy: Desarrollo (Records, Rankings, Gyms, Coaches) + Competencia bridge to ARENA + Eventos list.
- Boot recovery redirects to `/arena/live/:fightId` (not `/sparc/live/...`).
- Tile grid links: Records (`/resultados`), Rankings (`/sparc/rankings`), Gyms (`/gimnasios`), Coaches (`/entrenadores`).
- ARENA bridge card → `/arena`.
- Events list preserved from existing implementation.

### `src/utils/navigation.ts`
Append ARENA helpers:
```ts
export const ARENA_ROUTES = {
  HUB: '/arena',
  SESSION: (id: string) => `/arena/session/${id}`,
  LIVE: (id: string) => `/arena/live/${id}`,
  WATCH: (id: string) => `/arena/watch/${id}`,
} as const;
```

### `src/pages/TimeMaster.tsx`
Rename the visible page heading/subtitle to "Arena Control" (Spanish: "Control de Arena"). Route stays `/time-master`. No business logic changes.

## What I'm NOT doing
- No DB migrations (script referenced non-existent `sparc_session_dashboard` / `sparc_fight_state` RPCs — I'm using `sparc_event_dashboard_v` + the existing `SparcDashboard` instead).
- Not removing SPARC routes — they stay as legacy entry points + redirect to ARENA.
- Not running the broken sed-based script (would corrupt App.tsx / Header.tsx).

## Verification
- `/arena` renders, lists sessions, redirects when there's an active fight in localStorage.
- `/arena/session/:sessionId` shows the existing operational dashboard (admin-gated).
- `/arena/watch/:fightId` renders public view; survives reconnects via polling fallback.
- `/sparc/dashboard/:sessionId` redirects to the ARENA equivalent.
- Header shows ARENA on mobile + desktop; TimeMaster page heading reads "Arena Control".
