

# Fix accuracy calculation bug in HUD Demo

## Problem
The accuracy for Esquina Roja shows **133%**, which is impossible. The `computeStats` function calculates accuracy as `connected / attempted * 100`, but the demo event generator treats `strike_connected` and `strike_attempted` as independent random outcomes. A connected strike should logically also count as an attempted strike, so `connected` can never exceed `attempted`.

## Solution

### Option A — Fix the generator (recommended)
In `useHudDemoMode.ts`, change the logic so that every `strike_connected` event also generates a corresponding `strike_attempted` event, OR change the model so:
- `strike_attempted` = the strike was thrown (always generated)
- `strike_connected` = the strike landed (generated ~60% of the time **in addition to** the attempted event)

This means each "action" produces either 1 event (attempted only) or 2 events (attempted + connected).

### Option B — Fix the stats calculation
In `HudDemoDisplay.tsx`, change `computeStats` to count total strikes as `attempted + connected` and accuracy as `connected / (attempted + connected) * 100`. This treats both event types as distinct counts.

### Recommended: Option A
Change `generateEvent` to always emit a `strike_attempted`, and with 60% probability also emit a `strike_connected` for the same action. This matches real-world semantics where every connected strike was also attempted.

### File
- `src/hooks/useHudDemoMode.ts` — modify event generation logic

