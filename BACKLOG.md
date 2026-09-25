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
