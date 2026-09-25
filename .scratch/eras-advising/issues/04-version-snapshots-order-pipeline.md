# 04: Forked Snapshot Versioning & 5-Stage Clinical Order Pipeline

**What to build:** An unambiguous review lifecycle that eliminates the "email black hole". Submitting an essay draft creates an immutable versioned snapshot (`v1`, `v2`) with a required student changelog note. The student dashboard reflects live progress through a 5-stage order tracker (`Drafting` → `Submitted` → `In Review` → `Revisions Requested` → `Endorsed / Locked`), while advisors receive submissions in an organized inbox that automatically transitions to `In Review` when opened. Side-by-side git-style diffs highlight revisions between snapshots.

**Blocked by:** 02: Strict ERAS Plain-Text Drafting Sandbox & Content Sanitizer

**Status:** ready-for-agent

- [ ] Immutable snapshot creation on draft submission; student local draft continues in parallel without modifying the submitted version.
- [ ] Mandatory changelog summary prompt on submission for `v2` or later drafts.
- [ ] Interactive 5-stage clinical order tracker displayed on student dashboard showing timestamps for each stage.
- [ ] Faculty review inbox listing pending reviews sorted by submission date; opening a review updates state to `In Review` and notifies the student.
- [ ] Side-by-side visual diff component showing previous version on the left and new version on the right with additions in green and deletions in red.
- [ ] Automated tests verifying state transitions, snapshot immutability, and mandatory changelog enforcement.
