# 02: Strict ERAS Plain-Text Drafting Sandbox & Content Sanitizer

**What to build:** An authentic pre-season drafting environment that mirrors the exact formatting and character constraints of the official 2026/2027 AAMC ERAS portal. Students can draft Personal Statements, 10 Selected Experiences, up to 3 Most Meaningful Reflections, Hobbies, and Impactful Experiences. Pasted text is automatically sanitized to remove illegal characters, rich formatting, and smart quotes. Live character counters enforce official limits in real time.

**Blocked by:** 01: Greenfield App Scaffold, Multi-Tenant Domain Core, & Dev Persona Switcher

**Status:** completed

- [x] Plain-text drafting editor for Personal Statement with live character counting, estimated AAMC page count, and warning when approaching limits.
- [x] Paste sanitizer that automatically converts curly/smart quotes to straight quotes, em-dashes to double hyphens, and strips non-standard bullets.
- [x] 10 Selected Experiences interface enforcing the official hard limit of **750 characters** per description.
- [x] Official AAMC taxonomy dropdowns implemented for experiences: Experience Type (8 types), Frequency (6 types), Primary Focus Area (13 areas), and Key Characteristics (10 characteristics).
- [x] Most Meaningful Experiences module allowing up to 3 selections with an additional **300-character** reflection prompt.
- [x] Hobbies & Interests section enforcing the official **300-character** limit.
- [x] Impactful Experiences narrative section for applicants who have overcome major obstacles.
- [x] Automated tests asserting that descriptions >750 chars or reflections >300 chars are rejected, and paste sanitization functions correctly.
