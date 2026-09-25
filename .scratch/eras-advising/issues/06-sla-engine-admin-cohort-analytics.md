# 06: Institutional SLA Engine, Overdue Queue, & Cohort Analytics

**What to build:** An automated institutional oversight engine for the Student Affairs Dean's Office. Tracks turnaround deadlines against a 14-day SLA, triggers automated Day 10 nudges to advisors, and routes Day 14 overdue reviews into an administrative escalation queue. Deans can view cohort-wide progress funnels across all MS4s without violating student privacy by accessing raw essay content.

**Blocked by:** 05: 4-Pillar Clinical Rubric & Faculty Review Studio

**Status:** ready-for-agent

- [ ] Institutional SLA calculation engine measuring turnaround elapsed days against the 14-day target.
- [ ] Day 10 approaching-deadline badge and automated nudge indicator on advisor dashboard.
- [ ] Day 14 SLA breach detector that flags overdue items with a red indicator and surfaces them in the Dean's Alert Queue.
- [ ] Dean's Cohort Funnel Dashboard showing aggregate progress (% drafted, % submitted, % endorsed, % school list finalized).
- [ ] Privacy safeguards ensuring administrators view only status metadata and turnaround metrics without access to confidential student essay text.
- [ ] Automated tests asserting SLA deadline calculations and overdue queue filtering.
