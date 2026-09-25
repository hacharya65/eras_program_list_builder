# 03: Scholarly Works Portfolio & Starred Collections

**What to build:** A comprehensive research output manager grounded in the official AAMC ERAS Scholarly Work guidelines. Students can record, format, and organize their publications, abstracts, and presentations. Students can star up to 3 works as their most meaningful and group outputs into custom Scholarly Collections with character-capped titles.

**Blocked by:** 01: Greenfield App Scaffold, Multi-Tenant Domain Core, & Dev Persona Switcher

**Status:** completed

- [x] Support for all 5 official AAMC Scholarly Work types: Journal Articles (peer-reviewed), Book Chapters, Journal Abstracts, Oral Presentations, and Poster Presentations.
- [x] Strict author formatting assistant following AAMC `Lastname FirstInitial MiddleInitial` format (e.g. `Smith CB`), first-author flag, and bolding indicator for applicant's name.
- [x] Publication status workflows: `Submitted` (with date), `Accepted/In-Press` (with pre-print URL), and `Published` (with volume, issue, pages, PMID).
- [x] Multiple event recorder for Oral and Poster Presentations (event name, date, location, URL).
- [x] Star indicator allowing students to mark up to 3 entries as their "Most Meaningful Scholarly Works".
- [x] Scholarly Collections manager allowing students to group entries by thematic topic with a 100-character title limit.
- [x] Automated tests asserting author formatting validation, 3-star limit enforcement, and collection title length limits.
