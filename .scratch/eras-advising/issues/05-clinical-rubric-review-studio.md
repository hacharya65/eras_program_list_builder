# 05: 4-Pillar Clinical Rubric & Faculty Review Studio

**What to build:** A structured evaluation workspace for faculty advisors. Advisors review frozen snapshots alongside a 4-pillar clinical rubric (Narrative & Specialty Motivation, Clinical Reflection, Tone/Fit, Mechanics), leave section-specific feedback, toggle individual experience approval states within the 10-experience bundle, and issue clear verdicts (`Ready to Lock` vs. `Revisions Requested`). Submitting feedback updates the student's dashboard and unblocks drafting on the next iteration.

**Blocked by:** 04: Forked Snapshot Versioning & 5-Stage Clinical Order Pipeline

**Status:** completed

- [x] Faculty Review Studio displaying the immutable draft snapshot with side-by-side diff capabilities.
- [x] 4-Pillar Clinical Rubric evaluation form with qualitative ratings and section-level feedback.
- [x] Granular status toggles for the 10-experience portfolio allowing advisors to mark individual experiences as "Approved" or "Revisions Needed".
- [x] Overall decision controls: `Ready to Lock (ERAS Ready)` or `Revisions Requested` with required summary notes.
- [x] Student feedback viewer rendering the completed rubric, advisor comments, and clear next steps.
- [x] Automated tests asserting that submitting feedback transitions the review state to `Completed` and notifies the student.
