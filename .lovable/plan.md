Eight parallel review agents inspected Time Master end-to-end (UI, hook state machine, scoring, DB/RLS, performance, code quality, app-wide responsive, tests) and surfaced a coherent set of bugs. Below is the consolidated, prioritized fix plan — grouped so each phase is independently shippable and verifiable.

## Phase 1 — Data correctness & integrity (blocking)

1. **Stop double-penalizing knockdowns** — `useTimeMaster.ts` (`totalScoreA/B`) and `MatchResultDialog.tsx` (per-round display) both subtract `knockdownsA/B` from `scoreA/B`. Judge already enters the post-KD score in `RoundScoreDialog`. Remove the second subtraction in both places; show KDs as a separate column instead.

2. **No-contest must not write draws** — `useTimeMaster.updateFighterRecords` lumps `no_contest` with `draw` and increments `record_draws` for both fighters. Branch them: a `no_contest` leaves W/L/D unchanged (we add `record_nc` later if desired). Still write the verdict row.

3. **Reset `pendingResult` between fights** — `TimeMaster.tsx`: the auto-open dialog effect requires `!pendingResult`, but `pendingResult` is never cleared on `resetMatch`. After fight #1 the auto-open is dead. Reset it (and `autoOpenedRef`) when phase returns to `setup`, and also reset `autoOpenedRef` when the result dialog closes while `phase === 'finished'` so the judge isn't stuck.

4. **Guard the natural-expiry vs. manual `endRound` race** — `useTimeMaster.ts` rAF loop calls `setIsRunning(false)` async; a tap on "Terminar Round" before that paint pushes a duplicate `RoundResult`. Add `roundEndedRef` set inside `timerLoop` natural expiry, checked in `endRound`.

5. **Double-submit guard on result confirm** — `MatchResultDialog.tsx` confirm button stays enabled after click. Add local `submitting` state, disable on first click, re-enable on dialog close.

6. **Auto-open guard for early KO** — When a KO is declared mid-fight via the manual button, phase flips to `finished` while `roundsCompleted.length < roundConfig`. Set `autoOpenedRef.current = true` inside `handleSubmitResult` so the post-finish effect can't fire a second dialog.

## Phase 2 — Backend atomicity & RLS (blocking)

7. **Create `save_fight_result` Postgres RPC** (per project memory). One `SECURITY DEFINER` function that:
   - Validates `has_role(auth.uid(),'judge')` (or admin)
   - Inserts `tm_verdict` with `ON CONFLICT DO NOTHING` on a new unique key `(red_fighter_id, blue_fighter_id, judge_user_id, signed_at::date)`
   - Atomically updates `fighter_profiles` using `record_wins = record_wins + 1` etc., in a single transaction
   - Returns `{ verdict_id, records_updated: boolean }`

8. **Tighten `tm_verdict` INSERT policy** — current policy allows any `authenticated` user. Add `AND public.has_role(auth.uid(),'judge')` (or admin).

9. **Fix `fighter_profiles` UPDATE path for judges** — current RLS only lets admins update; judge writes silently return 0 rows yet code logs `records_updated: true`. Once #7 lands, the RPC bypasses RLS via `SECURITY DEFINER` and this is moot; remove the direct client-side UPDATE in `updateFighterRecords` and call the RPC.

10. **Don't trust `records_updated`** — check affected rows / RPC return value and set the verdict flag from the actual outcome.

## Phase 3 — Mobile cutoff fixes (user-reported)

11. **Remove `truncate` from every fighter/person name** (project memory rule violation):
    - `FighterSelector.tsx:53,79` → `break-words`, add `min-w-0` to outer button
    - `RoundScoreDialog.tsx:91,109` → `break-words`
    - `FightTelemetryPanel.tsx:43,46`
    - `EventDetail.tsx:384,423,493,616`
    - `GymFighterUpdateCard.tsx:44`, `GymStaffCard.tsx:41`, `AdminCoachCard.tsx:33`

12. **Remove `overflow-x-hidden` masks** in `Index.tsx:89` and `LicenseLayout.tsx:60,172`; fix the underlying culprits (`FighterMiniature.tsx:30` hard `w-[420px]`, decorative blobs in `EventDetail` / `LicenseAuth`). Replace fixed widths with `w-full max-w-[420px]`.

13. **Dialogs need `max-h-[90dvh] overflow-y-auto`** — `EnrollFighterModal`, `Comunidad.tsx` (4 dialogs), `Configuracion.tsx` (2 dialogs), `ChatWidget.tsx:323` Sheet (`w-full sm:w-[480px]`).

14. **Time Master narrow-viewport polish**:
    - `TimerDisplay` round number: `text-4xl sm:text-6xl`
    - Fighter tags: `flex flex-col sm:grid sm:grid-cols-2` so names never crowd at 320 px
    - `RoundTracker` completed-round rows: bump tap target to `py-3`
    - Silent/Sound button: drop `size="sm"`, add `min-h-[44px]`
    - `TimeMasterLayout` main: add `pb-[env(safe-area-inset-bottom,1.5rem)]`

15. **Misc**: add `overflow-x-auto` wrapper to `LiveControl.tsx:364` table; swap `100vh` → `100dvh` in `FighterProfile.tsx:87,102` and `EventDetail.tsx:148`.

## Phase 4 — Performance for low-end Android

16. **Stop the 60 Hz re-render cascade** — `setTimeMs` in the rAF loop currently re-renders every Card on /time-master. Two minimal one-liners pay most of the cost:
    - Wrap `FighterSelector` and `RoundTracker` in `React.memo`
    - `useMemo` the `fighters.find()` in `FighterSelector`
    - Move the inline `FighterTag` out of `TimerDisplay` so it doesn't remount per tick

17. **AudioContext singleton + bell preload** — `timeMasterAlerts.ts` currently constructs a new `AudioContext` every alert (leaks past ~6) and `new Audio(url)` at fire time (CDN latency on 3G). Use a module-level cached context (resume on demand) and preload both bells at module init.

18. **Rest interval 100ms → 1000ms** — display only shows whole seconds; cuts 600 setStates per rest period.

19. **Stabilize `timerLoop` deps** — store `toast` in a ref, drop it from the `useCallback` deps so the rAF isn't torn down by an unstable `toast` reference.

20. **Remove redundant `timeMsRef` sync effect** (`useTimeMaster.ts:89`); the ref is already written directly inside the loop.

## Phase 5 — Code health (non-blocking)

21. Single source for `MatchResultType` (currently duplicated in hook and dialog) — export from `scoring-types.ts`.
22. Delete the dead `matchResult` state/export in `useTimeMaster.ts`.
23. Use `weights.kick_weight ?? 1.3` in `scoring-utils.ts` (current `||` swallows `0`).
24. Destructure `loadFighters` from the hook in `TimeMaster.tsx` so the effect dep is the stable callback, not the whole `tm` object.
25. Strip leftover `console.error` calls in `useFightControl.tsx`/`useOlympicTimer.tsx` where a `toast` already surfaces the error.

## Phase 6 — Tests (focused, not exhaustive)

26. Add Vitest coverage for the highest-risk pure logic only:
    - `useTimeMaster` state-machine reducer-style helpers: phase transitions, final-round → `finished`, pause/resume integrity, `resetMatch` clears `pendingResult`
    - `scoring-utils`: `formatRoundTime` boundary cases, `calculateAggression` weighted sum, `kick_weight = 0` honored
    - `MatchResultDialog` totals reflect single (not double) KD subtraction

## Out of scope

- No redesign of dialogs or pages beyond the responsive fixes above.
- No changes to other timer surfaces (`useOlympicTimer`, `useRoundControl`, station pages) except removing the duplicated `Round` type if it lands trivially.
- No new analytics/telemetry.

## Verification

- Build + `bunx vitest run`.
- Browser preview at 320×568, 360×800, 390×844: run a full 3-round match, a mid-fight KO, a draw, and a no-contest; confirm names never clip, dialogs scroll, the auto-open fires once per fight, totals match the judge's entered scores, fighter records update exactly once.
- Supabase RPC unit test for `save_fight_result` idempotency (double-call → one verdict, one record increment).

## Technical notes

- All new SQL goes in a single migration with `GRANT EXECUTE ON FUNCTION public.save_fight_result(...) TO authenticated;` and the role check inside the function body.
- `tm_verdict` migration: add `UNIQUE (red_fighter_id, blue_fighter_id, judge_user_id, signed_at)` constraint; tolerate `ON CONFLICT DO NOTHING`.
- Memo wrappers should preserve the existing default-export signatures; update imports if any switch to named.
