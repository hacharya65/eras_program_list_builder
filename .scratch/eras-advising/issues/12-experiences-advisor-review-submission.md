# 12: Faculty Advisor Review Submission for Experiences

**What to build:** An end-to-end "Submit for Review" workflow for the 10 Selected Experiences module, routing the complete experiences portfolio directly to the assigned faculty advisor's review queue.

**Blocked by:** None (can start immediately)

**Status:** pending

- [ ] Submission validation gate: Enforce that all 10 experiences must be populated before final submission can proceed (respecting character maximums of 750 for descriptions, 300 for meaningful reflections, 300 for hobbies, without forcing arbitrary minimums).
- [ ] Advisor state machine: Transition experiences portfolio state cleanly across `Draft` → `Submitted for Review` → `Under Review` → `Reviewed / Endorsed`.
- [ ] Active review tracker: Render a live indicator showing which item (`Entry X/10`) the faculty advisor is currently viewing/reviewing based on advisor interaction history.
- [ ] Advisor review interface: Provide faculty advisors with an aggregated summary view to review all 10 experiences, add section-level comments, and endorse or request revisions.
- [ ] Automated tests covering validation rules, state machine transitions, and advisor queue visibility.
