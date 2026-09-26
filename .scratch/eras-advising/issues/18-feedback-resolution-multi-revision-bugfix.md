# 18: Multi-Revision Personal Statement Feedback Resolution Bugfix

**What to build:** Fix the feedback resolution logic so that as an applicant progresses through multiple personal statement review cycles (v1 -> v2 -> ... -> v_n), the system accurately resolves and displays the evaluation and "Faculty Guidance Notes" from the *most recently reviewed* revision, rather than stale notes from the first revision. Additionally, ensure feedback records are tied to their specific document type (`personal_statement`) and snapshot version number (`v_k`), with a helper to retrieve historical feedback per version.

**Root Cause:**
In `src/app/page.tsx` (`getAdvisorFeedback`), the code uses `storage.reviewRequests.find(...)` matching the student ID and stage `revisions_requested | endorsed`. Because `storage.reviewRequests` is ordered chronologically, `find()` always returns the earliest matching review request (revision 1), completely ignoring subsequent revisions. Furthermore, it does not filter by `documentType === 'personal_statement'`, risking collisions with experience portfolio reviews.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Add `getLatestReviewRequestForDocument(studentId: string, documentType: string)` to `AdvisingPlatformService` and `InMemoryStorageAdapter`, sorting/filtering completed reviews by date/version descending.
- [x] Add `getFeedbackHistoryForDocument(studentId: string, documentType: string)` returning feedback objects paired with snapshot version metadata (`versionNumber`, `changelogNote`, `submittedAt`, `reviewedAt`, `advisor`).
- [x] Update `src/app/page.tsx` and dashboard contexts to supply the latest personal statement review metadata and snapshot version instead of the naive `find()` call.
- [x] Add unit tests in `tests/domain/` simulating multi-cycle revisions (v1 submitted -> v1 reviewed with notes A -> v2 submitted -> v2 reviewed with notes B) verifying that the latest query returns notes B and associated version v2.
