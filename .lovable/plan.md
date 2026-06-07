# Fix: Ranking card record/points overlap on mobile

## Problem
On `/` Ranking section (mobile, 390px), the win-loss-draw record (`3-0-1`) is rendering on top of the large points value (`74`) on the right side of each fighter card.

Root cause in `src/components/sections/Ranking.tsx` (Line 3 of fighter info, ~lines 354–365):
- The division badge `Peso Medio (185 lbs)` has no `shrink` constraint and consumes the full row width.
- The record `<span>` uses `ml-auto shrink-0`, so it gets pushed past the right edge of the `flex-1 min-w-0` info column and visually collides with the adjacent points column (`74 / pts`).
- The badge text is long (`Peso Medio (185 lbs)`) and the points column is narrow (`min-w-[45px]`), leaving no breathing room.

## Fix (presentation only, single file)

`src/components/sections/Ranking.tsx`:

1. **Constrain the division badge** so it can shrink instead of pushing the record out:
   - Wrap the badge text in a `truncate` span.
   - Add `min-w-0` and `truncate` classes to the badge itself.
2. **Anchor the record column** so it can't overflow:
   - Add `shrink-0` to the record `<span>` (already present) and ensure parent row uses `min-w-0` and `flex-nowrap`.
   - Add a small left margin / gap separation.
3. **Give the points column a touch more room** on mobile:
   - Bump `min-w-[45px]` to `min-w-[50px]` at the `xs` breakpoint to prevent the visual collision.
4. **Add `overflow-hidden`** to the card content row so any residual overflow is clipped rather than painted over the neighbor column.

No changes to data, hooks, or business logic. No new components. Mobile-only visual fix; desktop layout remains unchanged because the badge already fits at larger widths.

## Verification
- Reload `/` at 390×844 and confirm `74` and `3-0-1` are clearly separated on each card.
- Check long names/badges (e.g. `Peso Medio (185 lbs)`) truncate cleanly.
- Confirm desktop (≥768px) layout is visually unchanged.
