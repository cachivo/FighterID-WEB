# Architecture rules

- The landing header delegates to the shared public Header so navigation, Live access, and account actions stay consistent across public pages.
- Arena Control persists classified bouts through save_arena_result with a per-session UUID; private atomic SQL enforces official-record isolation and public get_arena_history exposes only non-sensitive profile history.

- The official record per fighter lives in the discipline columns (boxeo_record_*/mma_record_*); trigger trg_sync_official_record mirrors them to record_*, so writers must increment only the discipline columns to avoid double counting.
