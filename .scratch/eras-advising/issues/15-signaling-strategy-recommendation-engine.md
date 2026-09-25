# 15: Program Signaling Strategy Recommendation Engine

**What to build:** A decision-matrix algorithm incorporating historical interview signal yield data (No Signal vs. Silver vs. Gold interview rates) to recommend optimal program signaling strategies to applicants.

**Blocked by:** None (can start immediately)

**Status:** pending

- [ ] Applicant input fields: Dedicated inputs for recording proprietary Residency Explorer interview yield metrics per target program (No Signal % interview rate, Silver % interview rate, Gold % interview rate).
- [ ] Delta calculation logic:
  - If Gold yields marginal gain over Silver (e.g. Δ < 10%), advise allocating Silver and reserving Gold for high-yield programs.
  - If Gold yields a statistically significant jump over Silver, recommend Gold tier allocation.
  - If No Signal has high interview yield (e.g., home programs or safety programs with historical affinity), recommend assigning 0 signals to conserve tokens.
- [ ] Strategic guidance tags: Render contextual UI badges on the school list (e.g. `Gold High Yield`, `Silver Optimal`, `Signal Inefficient`) with explanatory hover tips.
- [ ] Portfolio signaling summary: Dynamic allocation scorecard showing total Gold and Silver tokens spent vs. specialty budget caps, with optimization warnings.
- [ ] Automated domain tests for recommendation calculations, delta thresholds, and budget constraints.
