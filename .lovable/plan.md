# Auto-launch result and record flow at end of fight

## Goal
When the last scheduled round ends (judge scores it or a KO/TKO is declared via the existing button), the judge should be guided through the final flow without having to remember to click "Declarar Resultado": prompt for the official verdict, then prompt whether to update each fighter's record.

## Current behavior
- When `currentRound >= roundConfig` ends, `useTimeMaster` sets `phase = 'finished'`.
- `MatchResultDialog` only opens if the judge manually clicks "Declarar Resultado".
- `RecordUpdateDialog` already opens after submitting the result dialog (this part works).
- The per-round `RoundScoreDialog` opens automatically after each round, including the last one.

## Changes (presentation only — `src/pages/TimeMaster.tsx`)

1. Add an effect that watches `tm.phase`. When it transitions to `'finished'` AND `pendingResult` is null AND `resultDialogOpen` is false AND `recordDialogOpen` is false, open `MatchResultDialog` automatically. Guard with a ref (`autoOpenedRef`) so it only triggers once per match and resets on `resetMatch` (detect via `phase === 'setup'`).
2. Ensure the auto-open waits until the last round's score has been saved: trigger only when `roundsCompleted.length >= roundConfig` so the result dialog shows accurate totals. If the judge closes `MatchResultDialog` without submitting, allow re-opening via the existing button (do not re-auto-open on the same finished state).
3. In `RecordUpdateDialog`, after `handleConfirmRecord` or `handleDeclineRecord` resolves, surface a toast confirming the outcome ("Récords actualizados" / "Resultado firmado sin actualizar récords"). No new dialog.
4. Disable "Nueva Pelea" button while `recordDialogOpen` is true so the judge cannot reset before deciding.

## Out of scope
- No changes to timer logic, scoring math, DB writes, or `useTimeMaster` hook signatures.
- No changes to record-update business logic (`updateFighterRecords` / `insertVerdict` stay as-is).
- No visual redesign of the dialogs.

## Verification
- Run a 3-round match in `/time-master` at 390×844: score each round, confirm `MatchResultDialog` auto-opens after round 3 score is saved, submit, confirm `RecordUpdateDialog` appears, then both Confirm and Decline paths show a toast and dismiss cleanly.
- Run a match and click "Declarar Resultado" mid-fight (KO scenario): confirm flow still works and auto-open does not double-fire when phase later resolves.
- Click "Nueva Pelea" after dismissing record dialog: confirm state resets and a second match can auto-trigger again.
