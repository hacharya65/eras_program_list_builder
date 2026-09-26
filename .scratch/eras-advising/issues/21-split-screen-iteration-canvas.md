# 21: Split-Screen Iteration Canvas (Live Drafting with Synchronized Faculty Notes & Inline Comments)

**What to build:** Enable students to seamlessly iterate between faculty feedback (guidance notes and inline comments) and their new draft without losing context. In the `PersonalStatementEditor`, introduce a synchronized Split-Screen Iteration View and a collapsible docked Feedback Reference Drawer so applicants can consult faculty notes and comments side-by-side while writing their next draft.

**Key Scope:**
- **Split-Screen Iteration Mode ("Feedback & Draft" Dual-Pane)**:
  - **Left Pane (Reference Hub)**: Displays the reviewed version's Faculty Guidance Notes, 4-pillar scores, and checklist of faculty inline comments/suggestions with an "Addressed" toggle.
  - **Right Pane (Active Draft Canvas)**: The active `v_{k+1}` plain-text editor with real-time character count, sanitization, and autosave.
- **Fluid View Switcher Bar**:
  - `Split View (Side-by-Side)`: Recommended mode for revision drafting.
  - `Focus Editor`: Distraction-free full-width writing canvas with floating trigger to open the feedback drawer.
  - `Full Feedback Studio`: 1-click jump back to the complete review studio.
- **Bi-directional Navigation**:
  - Clicking an anchored comment in the reference pane highlights the corresponding passage or scrolls to that section in the editor canvas.
  - Applicant can check off comments as they incorporate revisions.

**Blocked by:** Ticket #18, Ticket #20

**Status:** completed

- [x] Implement dual-pane split view layout in `PersonalStatementEditor.tsx`.
- [x] Render synchronized reference panel containing faculty guidance notes, rubric summary, and comment checklist for the referenced reviewed snapshot.
- [x] Provide view toggles (`Split View`, `Focus Canvas`, `Full Feedback`).
- [x] Add comment checklist state allowing applicants to track which faculty notes they have addressed during their revision session.
- [x] Retain full compatibility with existing diff viewer and submission workflows.
