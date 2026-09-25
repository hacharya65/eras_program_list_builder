# 16: Advisor Live Document Editing, Annotations & Anchored Comments

**What to build:** Collaborative review and editing tools for faculty advisors directly on submitted Personal Statements and Experiences documents.

**Blocked by:** Ticket 11 (Personal Statement Version Forking) and Ticket 12 (Faculty Advisor Review Submission for Experiences)

**Status:** completed

- [x] Role-based permissions: When viewing a submitted draft, faculty advisors see active markup controls (suggestions, comments, annotations); applicants see read-only suggestions and comments with accept/reject or acknowledgment controls.
- [x] Rich text annotation toolbar: Enable text selection to trigger inline highlight styling and strikethrough styling for suggested deletions.
- [x] Margin-anchored comment cards: Render floating or margin-anchored comment threads linked to specific character ranges in the essay or experience description.
- [x] Thread management: Support comment resolution states (`Open`, `Resolved`), reply threads between advisor and student, and advisor approval stamps.
- [x] Comprehensive unit and integration tests verifying character-offset anchoring, role permission gates, and comment state transitions.
