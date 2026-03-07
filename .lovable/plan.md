
## Remove discipline descriptions from fighter profile form

The descriptions under each discipline checkbox ("Combate que combina técnicas de striking y grappling", "Arte del pugilismo - solo golpes con los puños") are unnecessary — fighters already know what these disciplines are.

### Changes

**1. `src/lib/constants/disciplines.ts`** — Remove `description` from ENABLED_DISCIPLINES entries.

**2. `src/components/FighterProfileForm.tsx`** — Remove the `<p>` that renders `discipline.description` inside the discipline checkbox list (around line 216).

**3. `src/components/admin/AdminFighterForm.tsx`** — Check if it also renders descriptions and remove if so.

2 files changed, ~4 lines removed.
