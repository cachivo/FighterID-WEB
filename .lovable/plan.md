# Plan: Guest fighters in Time Master

Allow the Time Master to type a free-text fighter name for fighters that do not have a user/profile in the system. Matches involving a guest do not touch any fighter record.

## UX

In each corner selector (Red / Blue):

- Keep the existing "Select fighter" dropdown of registered profiles.
- Add a small toggle / link at the bottom of the popover: **"Use guest fighter"**.
- When picked, the trigger turns into a text input where the operator types the fighter's display name (e.g. "Juan Pérez"). A subtle "Guest" tag appears under the name.
- Switching back to the registered list clears the typed name.

Either corner can be a guest. Both corners can be guests. The "Start match" button enables as soon as both corners have something selected (registered or guest with non-empty name).

When a match involves at least one guest:

- A persistent notice appears above the Start button: **"This match will not affect any fighter's record (guest fighter)."**
- The `MatchResultDialog` still lets the judge pick the winner (Red / Blue / Draw / NC), but the "Update fighter records" switch is forced **off** and disabled, with the same explanatory copy.
- The verdict is shown on screen with the typed names so the judges have a clean summary, but nothing is written to the database.

Registered-vs-registered matches behave exactly like today.

## Technical notes

- `FighterSelector`: add `mode` ('registered' | 'guest'), `guestName`, and `onGuestNameChange`. Render either the Command popover or a text input based on `mode`. Add the toggle inside the popover footer.
- `useTimeMaster`:
  - Add `fighterAIsGuest`, `fighterBIsGuest` state and setters `setFighterAGuest(name)` / `setFighterBGuest(name)`. Setting guest mode clears `fighterAId`; setting a registered fighter clears guest mode.
  - `canStartMatch` becomes: each corner is either a registered id or a guest with a non-empty trimmed name, and (when both are registered) the ids differ.
  - Derive `isGuestMatch = fighterAIsGuest || fighterBIsGuest` and expose it.
  - `saveResultAtomic` / `updateFighterRecords` / `insertVerdict`: when `isGuestMatch` is true, skip the `save_fight_result` RPC entirely, return `{ success: true, recordsUpdated: false, duplicate: false }`, and toast "Verdict registered locally — records not updated (guest fighter)".
  - `winnerId` in `MatchResult` can be a synthetic string (`'guest:red'` / `'guest:blue'`) when the winner is a guest; only used for UI labels.
- `MatchResultDialog`: when `isGuestMatch`, hide / disable the "Update records" switch and show the explanatory copy. Winner selector still works using the typed names.
- `RoundScoreDialog`: no change beyond using the existing `fighterAName` / `fighterBName` (already typed-name-friendly).
- No database or RLS changes. No edge function changes.

## Out of scope

- Persisting guest matches to any history table.
- Promoting a guest into a real `fighter_profile` from inside Time Master.
- Stats / record reporting for guest fighters.