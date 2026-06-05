# Time Master — Boxing Round Timer

A new authenticated-only page at `/time-master` providing a professional boxing match timer with fighter selection, configurable rounds/durations, bell + warning audio, result declaration, and optional record sync to `fighter_profiles`.

## Scope

- New page accessible from header nav (registered users only)
- Fighter dropdowns populated from `fighter_profiles` (active only)
- Match config: 3/5/8 rounds × 2min/3min
- Timer with Start / Pause / Resume / End / Reset
- 60s rest between rounds, bell sound, alerts at 1min/30s/10s remaining
- Result dialog (KO, TKO, Decisions, Draw, DQ, No Contest)
- Yes/No popup to optionally sync win/loss/draw to DB (sparring mode = skip)

## Files to create

```text
src/hooks/useTimeMaster.ts
src/pages/TimeMaster.tsx
src/components/time-master/
  FighterSelector.tsx
  MatchConfig.tsx
  TimerDisplay.tsx
  RoundTracker.tsx
  MatchResultDialog.tsx
  RecordUpdateDialog.tsx
  TimeMasterLayout.tsx
  index.ts
```

## Files to modify

- `src/App.tsx` — add lazy import + `<Route path="/time-master" element={<ProtectedRoute><TimeMaster /></ProtectedRoute>} />`
- `src/components/Header.tsx` — add "Time Master" nav entry (mobile + desktop + user dropdown) using `Timer` icon from lucide

## Technical notes

- Hook `useTimeMaster` owns all state (phase machine: setup → ready → fighting → between_rounds → finished), uses `requestAnimationFrame` for the round timer and `setInterval` for the 60s rest period. Refs hold start/pause timestamps to keep timing accurate across pause/resume.
- Bell uses Web Audio API (`OscillatorNode`) — no audio asset needed.
- Fighter loading: `supabase.from('fighter_profiles').select(...).eq('active', true).order('last_name')`.
- Record sync: read-modify-write on `record_wins` / `record_losses` / `record_draws`. Draw / No Contest increments both fighters' `record_draws`.
- Uses semantic tokens (`fighter-danger`, `fighter-info`, `primary`, `muted-foreground`) consistent with existing design system. Will verify these tokens exist in `index.css` / `tailwind.config.ts` and fall back to existing tokens if not.
- All shadcn components used (Select, Dialog, AlertDialog, RadioGroup, Card, Button, Badge, ScrollArea, Textarea, Skeleton) are already installed.
- The user's provided source had a few minor syntax artifacts (stray `</body>` in an import, missing JSX in some snippets). I'll clean those up while keeping behavior identical.
- Route is gated by existing `ProtectedRoute`, so only authenticated users reach it.

## Out of scope

- No DB schema changes (only reads + updates to existing `fighter_profiles` columns).
- No knockdown/warning counters in UI v1 (kept in data model with zeros so it can be extended later).
- No persistence of match history — single in-memory session.