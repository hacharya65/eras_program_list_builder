# 11: Personal Statement Dynamic Version Forking (V1 through V_n)

**What to build:** Implement immutable snapshot locking and automatic incremental draft forking (`V1`, `V2`, ..., `V_n`) for the Personal Statement. Whenever an applicant clicks "Submit for Review", their active draft is captured as an immutable `V_k` snapshot with timestamp, word count, character count, and changelog note. If the applicant makes subsequent edits after submission, the system does not overwrite or mutate any submitted/locked record; instead, it automatically forks into an active `V_{k+1}` draft branch, preserving advisor review integrity while allowing unlimited continuous drafting iterations.

**Blocked by:** None (can start immediately)

**Status:** pending

- [ ] Immutable snapshot model: When a personal statement is submitted, mark version `V_k` with status `locked` / `submitted`.
- [ ] Dynamic draft forking trigger: Detect edits made to a submitted/locked version and automatically increment and fork into an active `V_{k+1}` draft branch (supporting arbitrary `V_n` cycles).
- [ ] Version selector & switcher in the UI: Allow applicants and faculty advisors to select and view any historical snapshot (`V1`, `V2`, ..., `V_n`) with clear badges indicating status (`Locked - In Review`, `Reviewed`, `Current Active Draft`).
- [ ] Arbitrary Diff comparison view: Visual side-by-side or inline comparison highlighting additions (green) and deletions (red) between any two chosen versions (e.g., `V_n` vs. `V_{n-1}`, or `V_n` vs. `V1`).
- [ ] Automated tests validating immutable snapshot locks, unlimited incremental version generation (`V1` through `V_n`), and clean diffing.
