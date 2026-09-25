# 11: Personal Statement Version Forking (V1 Lock & V2 Branch)

**What to build:** Implement immutable snapshot locking and automatic draft forking for the Personal Statement. Once an applicant clicks "Submit for Review", their active draft is captured as an immutable `V1` snapshot with timestamp, word count, character count, and changelog note. If the applicant makes subsequent edits after submission, the system does not overwrite or mutate the submitted V1 record; instead, it automatically forks into an active `V2` draft branch, preserving advisor review integrity while allowing continued local drafting.

**Blocked by:** None (can start immediately)

**Status:** pending

- [ ] Immutable snapshot model: When a personal statement is submitted, mark version `V1` with status `locked` / `submitted`.
- [ ] Draft forking trigger: Detect edits made to a submitted/locked version and automatically fork an active `V2` draft branch.
- [ ] Version selector & switcher in the UI: Allow applicants and faculty advisors to toggle between `V1 (Locked - In Review)` and `V2 (Active Draft)`.
- [ ] Diff comparison view: Visual side-by-side or inline comparison highlighting additions (green) and deletions (red) between V1 and V2.
- [ ] Unit & regression tests validating that locked versions are immutable and that editing triggers clean forking.
