# 20: Dedicated Student Feedback & Analysis Hub (Full-Spectrum Review Studio)

**What to build:** Build a dedicated page/view (`StudentFeedbackHub.tsx` or enhanced `StudentFeedbackViewer`) where students can inspect and analyze all faculty comments, guidance notes, and rubric scores before beginning their next draft. After reviewing, students are presented with a clear action prompt to create the next revision version, with version history navigation to compare feedback across rounds (v1, v2, etc.).

**Key Scope:**
- **Review Summary Header**:
  - Displays reviewed snapshot version badge (e.g. `v2 Reviewed Snapshot`), advisor info, completion date, and overall verdict.
  - Revision history tabs/selector allowing applicants to look back at feedback and notes from v1 when currently on v2.
- **Faculty Guidance Notes & 4-Pillars Scoring Studio**:
  - Prominently styled "Faculty Guidance Notes" block formatted with readable typography and clean markdown/whitespace rendering.
  - Interactive 4-Pillar Clinical Rubric scorecards with scoring criteria (Narrative Motivation, Clinical Reflection, Tone & Fit, Flow & Mechanics).
- **Embedded Annotated Document Viewer**:
  - Displays the reviewed version's plain-text document with anchored faculty comments, highlights, and strikethroughs (read-only for student with ability to reply or mark addressed).
- **Actionable Next-Step Iteration Prompt**:
  - Sticky or bottom action bar: "Ready to iterate on Dr. {Advisor}'s feedback? Create v{n+1} Revision to begin editing."
  - Initiates the next incremental version branch and seamlessly transitions the applicant into the iteration drafting workspace.

**Blocked by:** Ticket #18, Ticket #19

**Status:** completed

- [x] Build `StudentFeedbackHub` component integrating rubric evaluation, guidance notes, and anchored comment stream.
- [x] Implement revision selector to view historical feedback for previous versions (v1, v2, ..., v_n).
- [x] Connect "Create Next Version" trigger that increments draft version and routes to editor.
- [x] Verify that inline comments from faculty are correctly loaded for the reviewed version.
