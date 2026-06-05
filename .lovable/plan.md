## Plan: Use custom bell sounds in Time Master

Replace the synthesized "bell" tone with the two uploaded MP3 files, used only in the Time Master feature.

### Mapping
- **1 Bell.mp3** → plays at **round start** (`startRound`)
- **3 Bell.mp3** → plays at **round end** (timer expiry in `timerLoop` and manual `endRound`)
- "warning" (60s/30s/10s) and "rest" alerts keep their current synthesized tones — user only specified bell sounds.

### Steps

1. **Upload MP3s as Lovable Assets** (CDN-hosted, not committed as binaries):
   - `src/assets/time-master-bell-1.mp3.asset.json`
   - `src/assets/time-master-bell-3.mp3.asset.json`

2. **Extend `src/lib/timeMasterAlerts.ts`**:
   - Add a new `AlertKind` variant or sub-type `'bell-start' | 'bell-end'` (replacing the single `'bell'`), OR keep `'bell'` and add a `variant?: 'start' | 'end'` parameter to `playAlert`. Recommend the parameter approach to minimize churn in settings UI (still one "Campana" toggle controlling both).
   - Preload two `HTMLAudioElement` instances pointing at the asset URLs.
   - In `playAlert`, when `kind === 'bell'` and `cfg.sound` is true, play the appropriate MP3 (clone the audio element so rapid re-triggers work) at `cfg.volume`, instead of `playTone(TONES.bell, ...)`.
   - Vibration behavior unchanged.

3. **Update `src/hooks/useTimeMaster.ts`**:
   - `startRound` → `fire('bell', 'start')`
   - `timerLoop` expiry branch → `fire('bell', 'end')`
   - `endRound` → `fire('bell', 'end')`
   - `previewAlert` from the test panel → keep playing the "start" sound by default (or play both sequentially — will use the "start" sound for the preview button since it's the more recognizable single ring).

4. **No UI changes** to `AlertSettingsPanel` or `AlertTestPanel` — the single "Campana" toggle keeps controlling both start and end bell sounds.

### Files touched
- `src/assets/time-master-bell-1.mp3.asset.json` (new, via `lovable-assets`)
- `src/assets/time-master-bell-3.mp3.asset.json` (new, via `lovable-assets`)
- `src/lib/timeMasterAlerts.ts` (edit)
- `src/hooks/useTimeMaster.ts` (edit `fire` signature + 3 call sites)

Scope is limited to Time Master; no other feature uses these alert utilities.
