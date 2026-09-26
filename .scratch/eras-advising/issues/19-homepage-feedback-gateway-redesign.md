# 19: Homepage Feedback Gateway & Alert Banner Redesign

**What to build:** Redesign the student dashboard entry point for reviewing feedback. When an applicant receives revisions or endorsement on their personal statement, replace the crowded inline rubric card with a prominent, actionable alert banner and an updated Personal Statement module card. Clicking either directly navigates the student to the dedicated Feedback & Iteration Studio rather than dropping them into the raw text editor or an inline card.

**Key Scope:**
- Replace the inline `StudentFeedbackViewer` card on the homepage with an ergonomic **Faculty Feedback Action Banner**:
  - Highlights: "Faculty Review Completed on v{versionNumber}: Revisions Requested"
  - Summary badges: Overall verdict, Advisor name, date reviewed, 4-pillar average score.
  - Primary CTA: **"Review Faculty Feedback & Notes"** (routes directly to the dedicated feedback analysis page).
- Update the **Personal Statement Module Card** in the 3-column dashboard grid:
  - When in `revisions_requested` stage, highlight status badge and provide primary CTA "View Feedback & Notes" as well as secondary "Open Draft Canvas".
- Ensure the routing state in `StudentPortal` supports deep linking directly to the new feedback analysis view (`activeView = 'personal_statement_feedback'`).

**Blocked by:** Ticket #18 (needs accurate latest feedback resolution)

**Status:** completed

- [x] Add `personal_statement_feedback` view state to `StudentPortal.tsx`.
- [x] Implement responsive Faculty Feedback Action Banner with verdict badge, advisor summary, and direct CTA.
- [x] Update the Personal Statement dashboard card with explicit status triggers for revision analysis.
- [x] Support back navigation from the feedback view back to the homepage overview.
