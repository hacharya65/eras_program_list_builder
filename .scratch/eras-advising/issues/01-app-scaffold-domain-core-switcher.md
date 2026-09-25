# 01: Greenfield App Scaffold, Multi-Tenant Domain Core, & Dev Persona Switcher

**What to build:** The foundational full-stack application shell and domain application service seam. Medical students, faculty advisors, and student affairs deans can load the application and immediately see their respective role-based portals. Developers and testers can use a persistent top-bar persona switcher to toggle seamlessly between Alex (Student), Dr. Chen (Faculty Advisor), and Dr. Taylor (Student Affairs Dean) with real-time UI state updates.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Next.js App Router application initialized with Tailwind CSS, Lucide icons, and TypeScript support in the workspace.
- [x] High-level domain application service seam (`AdvisingPlatformService`) established with an in-memory storage adapter for deterministic, millisecond automated testing.
- [x] Global Dev Persona Switcher bar present across all views, allowing 1-click toggling between Student, Advisor, and Dean roles without authentication friction.
- [x] Role-based portal navigation rendered for each persona (Student view, Advisor inbox view, Dean cohort overview).
- [x] Automated tests verify that switching personas loads the correct permissions and initial data context.
