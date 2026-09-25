# 07: Strategic School List Matrix with Dynamic Specialty Signaling

**What to build:** A strategic residency program selector that organizes applications into Reach, Target, and Safety tiers, plus track designations (Categorical, Preliminary, PSTP). Features a dynamic specialty engine that automatically configures and enforces official ERAS Gold and Silver signal budgets according to the selected specialty. Real-time budget meters prevent over-spending, and advisors can review their advisee's strategic list to evaluate balance.

**Blocked by:** 01: Greenfield App Scaffold, Multi-Tenant Domain Core, & Dev Persona Switcher

**Status:** ready-for-agent

- [ ] Program search and filter directory across ACGME specialties and geographical regions.
- [ ] School list management interface organizing programs by tier: **Reach**, **Target**, and **Safety**, and by track (Categorical, Preliminary, PSTP).
- [ ] Dynamic specialty rule selector: choosing a specialty automatically sets the official Gold and Silver signal caps (e.g. Ortho: 30 signals; Internal Medicine: 3 Gold, 12 Silver; OB/GYN: 3 Gold, 15 Silver).
- [ ] Live signal allocation budget meter showing remaining Gold and Silver tokens and preventing over-allocation.
- [ ] Advisor review mode enabling faculty to inspect program distribution ratios and leave program-specific strategic flags.
- [ ] Automated tests validating tier assignments, track selection, and strict signal quota enforcement.
