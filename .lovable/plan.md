

# Fix HUD to display fight data and AI strike events

## Problem
The HUD at `/hud/fight/:fightId` is stuck on "Esperando datos de la pelea..." because:

1. **Fight query returns 406**: The Supabase join `fighter_a_id(first_name, last_name, nickname)` fails because there are no foreign key constraints from `fights.fighter_a_id` / `fights.fighter_b_id` to `fighter_profiles`. PostgREST requires FK relationships for embedded joins.
2. **Rounds query returns 400**: The `rounds` table exists but may have schema issues with the query.
3. **5 AI strike events exist** in `ai_strike_events` for this fight and are ready to display.

## Solution

### 1. Fix fight data query in `HudPublicDisplay.tsx`
Instead of relying on PostgREST joins (which need FKs), fetch fighter data separately:

```typescript
// Replace the single joined query with:
const { data: fight } = await supabase
  .from('fights')
  .select('id, fight_number, fighter_a_id, fighter_b_id, status')
  .eq('id', fightId)
  .single();

// Then fetch fighter names separately
if (fight?.fighter_a_id) {
  const { data: fa } = await supabase
    .from('fighter_profiles')
    .select('first_name, last_name, nickname')
    .eq('id', fight.fighter_a_id)
    .single();
  // merge into fightData
}
// Same for fighter_b_id
```

### 2. Fix rounds query
Verify the `rounds` table columns match the select statement and fix any discrepancies.

### Files to modify
- `src/pages/HudPublicDisplay.tsx` — rewrite the `load()` function to avoid PostgREST joins

