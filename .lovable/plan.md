# Per-Round Results & Final Verdict

Add the ability for the Judge to record per-round scores/notes during a fight, so the final verdict (and uploaded audit record) reflects the round-by-round outcome.

## What we'll build

1. **Per-round score entry (UI)**
   - When a round ends (phase becomes `between_rounds` or `finished`), open a quick "Round X Result" dialog where the judge enters:
     - Score for Red corner (default 10)
     - Score for Blue corner (default 9) — 10-point must system
     - Knockdowns Red / Blue (numeric)
     - Warnings Red / Blue (numeric)
     - Optional note
   - Dialog can be reopened later from the `RoundTracker` (click any completed round → edit).
   - The judge can also skip and just confirm `10-9 Red` / `10-9 Blue` / `10-10` via quick-pick buttons.

2. **State + hook changes (`useTimeMaster.ts`)**
   - Extend `RoundResult` with `scoreA`, `scoreB`, `note`.
   - New action `setRoundScore(roundNumber, partial)` — merges into the existing entry in `roundsCompleted`.
   - On `endRound` / auto-end, push the round with default `10-9` favoring no one (judge fills in next).
   - Derive `totalScoreA` / `totalScoreB` selectors for the verdict dialog.

3. **Final verdict dialog (`MatchResultDialog`)**
   - Show a round-by-round score table (read-only summary).
   - Pre-suggest winner + `decision_unanimous` when totals differ; suggest `draw` when equal.
   - Judge still confirms manually.

4. **Persistence (`tm_verdict`)**
   - Add column `rounds jsonb` storing `[{round, scoreA, scoreB, knockdownsA, knockdownsB, warningsA, warningsB, note, durationMs}]`.
   - `insertVerdict` writes the array along with the existing fields.
   - Migration: `ALTER TABLE public.tm_verdict ADD COLUMN rounds jsonb NOT NULL DEFAULT '[]'::jsonb;` (no new RLS needed).

5. **Admin review (out of scope here)** — existing admin panel will surface the new `rounds` column later; not part of this change.

## Files touched

- `supabase/migrations/<new>.sql` — add `rounds jsonb` to `tm_verdict`.
- `src/hooks/useTimeMaster.ts` — extend `RoundResult`, add `setRoundScore`, include `rounds` in `insertVerdict`.
- `src/components/time-master/RoundScoreDialog.tsx` *(new)* — per-round entry.
- `src/components/time-master/RoundTracker.tsx` — clickable rounds + show `10-9` chips.
- `src/components/time-master/MatchResultDialog.tsx` — summary table + auto-suggest winner.
- `src/components/time-master/index.ts` — export new dialog.
- `src/pages/TimeMaster.tsx` — open `RoundScoreDialog` after each round end; pass rounds to verdict dialog.

## Technical notes

- 10-point must system defaults: winner 10, loser 9; KD = -1 (down to 8); even round = 10-10.
- All new state lives in the existing hook — no realtime/multi-device sync needed (single-judge model).
- `rounds` defaults to `[]` so existing verdict rows remain valid.
