# Architecture rules

- The landing header delegates to the shared public Header so navigation, Live access, and account actions stay consistent across public pages.
- Arena Control persists classified bouts through save_arena_result with a per-session UUID; private atomic SQL enforces official-record isolation and public get_arena_history exposes only non-sensitive profile history.
