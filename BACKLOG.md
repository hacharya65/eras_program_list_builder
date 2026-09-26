# Speed B Candidates: Running Ticket Backlog

This backlog tracks the next cycle of feature requests, enhancements, and bugfixes for the Pre-ERAS Institutional Advising & Strategy Platform.

---

## Ticket Overview & Priority Matrix

| Ticket # | Title | Category | Complexity | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[#11](.scratch/eras-advising/issues/11-personal-statement-version-forking.md)** | Personal Statement Dynamic Version Forking (V1 through V_n) | Workflow / Data Integrity | Medium | None | `Completed` |
| **[#12](.scratch/eras-advising/issues/12-experiences-advisor-review-submission.md)** | Faculty Advisor Review Submission for Experiences | Workflow / Advising | Medium | None | `Completed` |
| **[#13](.scratch/eras-advising/issues/13-scholarly-works-persistence-bugfix.md)** | Scholarly Works State Persistence Bugfix | Bugfix / UX | Low | None | `Completed` |
| **[#14](.scratch/eras-advising/issues/14-universal-residency-database-matrix.md)** | Universal Residency Program Database & Row Matrix | Data / UI Redesign | High | None | `Completed` |
| **[#15](.scratch/eras-advising/issues/15-signaling-strategy-recommendation-engine.md)** | Program Signaling Strategy Recommendation Engine | Algorithm / Decision Support | Medium | #14 recommended | `Completed` |
| **[#16](.scratch/eras-advising/issues/16-advisor-live-editing-annotations-comments.md)** | Advisor Live Document Editing, Annotations & Anchored Comments | Collaborative Review | High | #11, #12 | `Completed` |
| **[#17](.scratch/eras-advising/issues/10-eras-transfer-kit-pdf-export.md)** | Compiled Institutional PDF Packet Generator (MSPE Dean's Office Bundle) | Export / Reporting | Medium | #10 | `Completed` |
| **[#18](.scratch/eras-advising/issues/18-feedback-resolution-multi-revision-bugfix.md)** | Multi-Revision Personal Statement Feedback Resolution Bugfix | Bugfix / State Integrity | Low | None | `Completed` |
| **[#19](.scratch/eras-advising/issues/19-homepage-feedback-gateway-redesign.md)** | Homepage Feedback Gateway & Alert Banner Redesign | UI / Workflow | Low | #18 | `Completed` |
| **[#20](.scratch/eras-advising/issues/20-dedicated-student-feedback-analysis-hub.md)** | Dedicated Student Feedback & Analysis Hub (Full-Spectrum Review Studio) | Workflow / UX Redesign | Medium | #18, #19 | `Completed` |
| **[#21](.scratch/eras-advising/issues/21-split-screen-iteration-canvas.md)** | Split-Screen Iteration Canvas (Live Drafting with Synchronized Notes & Comments) | UI / Interactive Drafting | Medium | #18, #20 | `Completed` |

---

## Detailed Specifications

### [Ticket 11: Personal Statement Dynamic Version Forking (V1 through V_n)](.scratch/eras-advising/issues/11-personal-statement-version-forking.md)
* **Summary:** Lock submitted drafts as immutable snapshots upon submission. Any subsequent edits automatically fork into an active incremental draft branch (`V1` → `V2` → ... → `V_n`), allowing unlimited iterative submission and review cycles without mutating locked records.
* **Key Scope:**
  - Immutable snapshot model (`V_k` locked upon submission with timestamp, changelog, and review metadata).
  - Draft-forking trigger on post-submission edits into active `V_{k+1}` branch.
  - UI version selector dropdown to inspect any historical snapshot (`V1` to `V_n`) with status tags (`Locked - In Review`, `Reviewed`, `Current Active Draft`).
  - Visual side-by-side or inline diff highlighting additions (green) and deletions (red) across any selected versions.

### [Ticket 12: Faculty Advisor Review Submission for Experiences](.scratch/eras-advising/issues/12-experiences-advisor-review-submission.md)
* **Summary:** Add an end-to-end "Submit for Review" workflow to the 10 Selected Experiences module, routing the portfolio directly to the assigned faculty advisor.
* **Key Scope:**
  - Advisor assignment validation and status state machine (`Draft` → `Submitted for Review` → `Reviewed`).
  - Active review tracker displaying which item (`Entry X/10`) is currently being reviewed based on advisor history.
  - Submission validation gate: Enforce all 10 experiences completed before submission (enforcing character caps without forcing arbitrary minimums).

### [Ticket 13: Scholarly Works State Persistence Bugfix](.scratch/eras-advising/issues/13-scholarly-works-persistence-bugfix.md)
* **Summary:** Resolve state loss where adding new scholarly entries causes the screen state to reset and wipe unsaved entries during testing.
* **Key Scope:**
  - Form state management and browser local storage persistence.
  - Idempotent record creation to prevent lost or duplicated items during mutations.

### [Ticket 14: Universal Residency Program Database Integration & Row-Based Matrix](.scratch/eras-advising/issues/14-universal-residency-database-matrix.md)
* **Summary:** Ingest residency programs dataset across all specialties (including program director contact info, location, and regional metadata) into a searchable database. Redesign the School List Matrix from card/kanban columns into a sortable, row-based layout (Reach, Target, Safety, Region).
* **Key Scope:**
  - Dataset ingestion and typing from `Context/Residency Programs/`.
  - Row-based sortable matrix table.
  - Full-text search and multi-select filtering (Specialty, Region, Tier).

### [Ticket 15: Program Signaling Strategy Recommendation Engine](.scratch/eras-advising/issues/15-signaling-strategy-recommendation-engine.md)
* **Summary:** Build a decision-matrix algorithm incorporating historical interview signal yield data (No Signal vs. Silver vs. Gold interview rates) to recommend optimal signal tier allocation to applicants.
* **Key Scope:**
  - Manual input fields for applicants to record proprietary Residency Explorer interview yield statistics.
  - Delta calculation logic recommending Silver if Gold yields marginal gain, or Gold if the rate increase is significant.
  - UI guidance tags and portfolio signaling allocation summaries.

### [Ticket 16: Advisor Live Document Editing, Annotations & Anchored Comments](.scratch/eras-advising/issues/16-advisor-live-editing-annotations-comments.md)
* **Summary:** Provide faculty advisors with collaborative review tools directly on the submitted Personal Statement and Experiences pages.
* **Key Scope:**
  - Rich text annotation toolbar supporting inline highlights and strikethroughs for suggested deletions.
  - Margin-anchored comment cards with active thread tracking and resolution states.
  - Role-based permissions (applicant sees read-only suggestions and comments; advisor has active markup controls).

### [Ticket 17: Compiled Institutional PDF Packet Generator](.scratch/eras-advising/issues/10-eras-transfer-kit-pdf-export.md)
* **Summary:** Replace the client-side `window.print()` screen dump with a robust, backend-rendered PDF generation pipeline (`/api/export-packet-pdf`) using PDFKit.
* **Key Scope:**
  - Aggregates all 4 core application sections: Personal Statement, 10 Selected Experiences & Reflections, Scholarly Works Portfolio, and Strategic School List & Signals.
  - Institutional cover header, clinical endorsement verdict, running page numbers (`Page X of Y`), and confidentiality notice.
  - Generates downloadable `Apex_ERAS_Dossier_[Name]_2027.pdf` directly from the server.
  - Maintains optional Quick Print fallback.

### [Ticket 18: Multi-Revision Personal Statement Feedback Resolution Bugfix](.scratch/eras-advising/issues/18-feedback-resolution-multi-revision-bugfix.md)
* **Summary:** Fix the feedback resolution logic so that as an applicant progresses through multiple revisions (v1 -> v2 -> ... -> v_n), the system always resolves and presents the evaluation and Faculty Guidance Notes from the *most recently reviewed* revision instead of defaulting to the first review request.
* **Key Scope:**
  - Correct `storage.reviewRequests.find()` flaw in `src/app/page.tsx` and service methods by sorting completed reviews by timestamp/version descending.
  - Scope query specifically to `documentType === 'personal_statement'`.
  - Provide version-linked feedback accessor `getFeedbackForVersion(versionNumber)`.
  - Add domain regression tests for multi-cycle revision feedback queries.

### [Ticket 19: Homepage Feedback Gateway & Alert Banner Redesign](.scratch/eras-advising/issues/19-homepage-feedback-gateway-redesign.md)
* **Summary:** Redesign the student dashboard entry point for reviewing feedback. Replace the cramped inline rubric card with a prominent, actionable alert banner and module card trigger that directly routes students to the dedicated Feedback & Iteration Studio.
* **Key Scope:**
  - Responsive Faculty Feedback Action Banner with verdict badge, advisor identity, review date, and primary CTA: **"Review Faculty Feedback & Notes"**.
  - Updated Personal Statement dashboard card with explicit status triggers for revision analysis.
  - Seamless navigation routing (`activeView = 'personal_statement_feedback'`).

### [Ticket 20: Dedicated Student Feedback & Analysis Hub (Full-Spectrum Review Studio)](.scratch/eras-advising/issues/20-dedicated-student-feedback-analysis-hub.md)
* **Summary:** Build a dedicated page/view where students can inspect and synthesize all faculty comments, guidance notes, and rubric scores before beginning their next draft, with revision history navigation (v1, v2, ..., v_n) and a clear prompt to begin the next iteration.
* **Key Scope:**
  - Review summary header with version tags and advisor metadata.
  - Dedicated "Faculty Guidance Notes" block and interactive 4-Pillars Clinical Rubric cards.
  - Integrated read-only view of the reviewed draft with anchored faculty comments, highlights, and strikethroughs.
  - Revision history tabs to inspect past reviews across rounds.
  - Actionable prompt: "Ready to iterate? Create v{n+1} Revision" to smoothly transition to drafting.

### [Ticket 21: Split-Screen Iteration Canvas (Live Drafting with Synchronized Notes & Comments)](.scratch/eras-advising/issues/21-split-screen-iteration-canvas.md)
* **Summary:** Enable students to seamlessly iterate between faculty feedback and their new draft without losing context. Introduce a dual-pane Split-Screen Iteration View and docked Feedback Reference Drawer in `PersonalStatementEditor`.
* **Key Scope:**
  - Dual-Pane Split Layout: Reviewed faculty guidance notes & comment checklist on the left, active AAMC draft canvas on the right.
  - View switcher: Toggle between `Split View`, `Focus Canvas`, and `Full Feedback Studio`.
  - Interactive comment checklist: Track addressed comments while typing revisions.
  - Seamless version forking and changelog submission flow.

---

## Recommended Execution Order

1. **Sprint 1 (Immediate Quick Wins & Stability)**:
   - **Ticket 13 (Bugfix)**: Fixes Scholarly Works state persistence so user testing is rock solid.
   - **Ticket 11**: Implements Personal Statement version snapshot locking and forking.
2. **Sprint 2 (Advising Workflow Completion)**:
   - **Ticket 12**: Brings the Experiences section up to parity with the Personal Statement review submission workflow.
3. **Sprint 3 (Strategic Matching & Data Layer)**:
   - **Ticket 14**: Upgrades the School List Matrix to the row-based searchable table with full program ingestion.
   - **Ticket 15**: Plugs the interview yield signaling recommendation engine directly into the new program matrix.
4. **Sprint 4 (Deep Collaboration)**:
   - **Ticket 16**: Layers live annotations, strikethroughs, and anchored margin comments on top of locked version snapshots.
   - **Ticket 17**: Compiled institutional PDF dossier generator.
5. **Sprint 5 (Student Revision & Iteration Redesign)**:
   - **Ticket 18 (Bugfix)**: Multi-revision feedback resolution fix (ensures latest notes are displayed).
   - **Ticket 19 (UX Entry Point)**: Homepage Feedback Gateway banner and direct routing.
   - **Ticket 20 (Review Hub)**: Dedicated Student Feedback & Analysis Hub.
   - **Ticket 21 (Iteration Canvas)**: Split-Screen live drafting with synchronized faculty notes and comments.
6. **Sprint 6 (School List Matrix Multi-Campus Disambiguation)**:
   - **Ticket 22 (Bugfix / Enhancement)**: Multi-Campus & Identical-Name Institution Disambiguation (ACGME ID deduplication & campus display formatting).

