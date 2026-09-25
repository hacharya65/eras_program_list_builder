# Spec: Pre-ERAS Institutional Advising & Strategy Platform

## Problem Statement

Medical students applying to residency face a fragmented, disorganized, and high-anxiety pre-season application process before the official AAMC ERAS portal opens in mid-summer:

1. **Document & Draft Sprawl**: Students draft personal statements and experience descriptions across disparate Google Docs and Word files, creating confusing version sprawl (`v1_final`, `v2_edits`) and formatting conflicts.
2. **Formatting & Character Limit Traps**: Drafting in rich-text word processors leads to catastrophic formatting loss, stripped line breaks, and truncated text when copied into ERAS's strict plain-text system (specifically: the official **750-character** experience limit, **300-character** meaningful reflection limit, and **300-character** hobbies/interests limit).
3. **The Faculty "Review Black Hole"**: Students email drafts to busy attending physicians and faculty advisors with zero visibility into whether the document was received, opened, or actively reviewed, causing immense anxiety and awkward follow-up pinging.
4. **Unstructured & Inconsistent Feedback**: Faculty often provide vague, superficial feedback without systematically evaluating critical clinical storytelling, tone, red flags, or specialty-specific fit.
5. **Disconnected School List Strategy & Signal Wastage**: Students build program lists without clear visibility into ERAS signaling constraints (Gold/Silver tokens vary wildly by specialty), leading to misallocated signals and poor tiering (Safety vs. Target vs. Reach).
6. **Competitiveness Guesswork**: Students lack clear, transparent quartile benchmarks from NRMP Charting Outcomes and Residency Explorer data to objectively evaluate their competitiveness.
7. **Alumni Disconnect**: Historical match records and current resident alumni contacts are siloed or inaccessible, forcing students into an exhausting "scavenger hunt" across LinkedIn or expired spreadsheets.

## Solution

A multi-tenant, institutional web platform deployed by medical schools that unifies pre-season preparation into a transparent, clinical-grade advising ecosystem grounded in official 2026/2027 AAMC ERAS specifications:

1. **Strict ERAS Plain-Text Sandbox**: A dedicated drafting environment that mirrors ERAS formatting constraints in real time, automatically sanitizing illegal characters and enforcing strict character caps:
   - **Experiences Description**: Exact **750-character** limit.
   - **Most Meaningful Reflections** (up to 3): Exact **300-character** limit.
   - **Hobbies & Interests**: Exact **300-character** limit.
   - **Impactful Experiences** (overcoming obstacles): Dedicated narrative sandbox.
   - **Personal Statement**: Plain-text ASCII sandbox with character and estimated page counter.
   - **Scholarly Work Suite**: Formats peer-reviewed articles, chapters, abstracts, oral/poster presentations, up to 3 Starred Meaningful Works, and Scholarly Collections (100 char title).
2. **Official AAMC Categorization Taxonomy**: Ingests exact AAMC Experience Types, Frequency Types, Primary Focus Areas, and Key Characteristics directly from official worksheets.
3. **5-Stage Clinical Order Tracker**: A transparent status pipeline (`Drafting` → `Submitted` → `In Review` → `Revisions Requested` → `Endorsed / Locked`) that eliminates the email black hole.
4. **Forked Snapshot Versioning with Visual Diffing**: Submissions freeze as immutable snapshots (`v1`, `v2`), enabling side-by-side git-style diffs (green/red) and mandatory student changelog notes so faculty never have to re-read unchanged paragraphs.
5. **Standardized 4-Pillar Clinical Rubric**: A structured evaluation framework (Narrative/Specialty Motivation, Clinical Reflection, Tone/Fit, Mechanics) with institutional customizability and pass/fail verdicts.
6. **Automated SLA Turnaround Monitoring**: An institutional 14-day turnaround target with automated system nudges at Day 10 and administrative escalation at Day 14.
7. **Strategic School List Matrix with Dynamic Specialty Signaling**: Program selection categorized by tier (Reach, Target, Safety) and track, with real-time budget enforcement for specialty-specific Gold and Silver signals.
8. **Multimodal Competitiveness Engine**: Transparent benchmark comparisons derived directly from official NRMP 2026 Match data using `Context/Residency Programs/Summary Statistics.pdf`. Features concise matched vs. unmatched population-level medians for every specialty (USMLE Step 2 CK, research experiences, abstracts, presentations, publications, work/volunteer experiences, and AOA percentage), combined with Residency Explorer interview yield data.
9. **Alumni Resident Network & Doximity Integration**: Institutional match roster ingestion connecting students to verified alumni training at target programs, paired with direct links to verified Doximity residency reviews.
10. **Pre-Season Transfer Bridge**: 1-click clipboard copy assistant and compiled institutional PDF application packet for the Dean's Office / MSPE compilation.

## User Stories

### Student Persona
1. As a medical student, I want to draft my personal statement in a plain-text sandbox with a live character and page counter, so that I never suffer character cutoff or stripped formatting in official ERAS.
2. As a medical student, I want illegal characters, smart/curly quotes, and rich formatting to be automatically sanitized upon paste, so that my text is 100% ERAS-compliant.
3. As a medical student, I want to manage all 10 ERAS experiences and designate up to 3 as "Most Meaningful" in one unified dashboard, so that I can see my application balance at a glance.
4. As a medical student, I want real-time validation warning me when an experience description exceeds 750 characters, a meaningful reflection exceeds 300 characters, or hobbies exceed 300 characters, so that I can edit proactively.
5. As a medical student, I want to categorize my experiences using the official AAMC dropdowns (Experience Type, Frequency, Primary Focus Area, Key Characteristics), so that my data directly maps to official ERAS fields.
6. As a medical student, I want to record my scholarly works (peer-reviewed articles, abstracts, oral/poster presentations), star up to 3 as most meaningful, and organize them into Scholarly Collections (100 char limit), so that my research output is professionally curated.
7. As a medical student, I want to submit an essay draft to my assigned Dean's Advisor or invited Specialty Mentor with a mandatory changelog note, so that my reviewer knows exactly what I revised.
6. As a medical student, I want my submitted draft to freeze into an immutable version snapshot (`v1`, `v2`), so that I can continue drafting locally without overwriting what my advisor is reading.
7. As a medical student, I want to see a live 5-stage order tracker (`Drafting` → `Submitted` → `In Review` → `Revisions Requested` → `Endorsed / Locked`), so that I know the exact moment an advisor opens my draft.
8. As a medical student, I want to view side-by-side visual diffs of my drafts highlighting text additions in green and deletions in red, so that I can track evolution across versions.
9. As a medical student, I want to receive rubric scores and section-level feedback from my advisor, so that I have clear, actionable guidance on how to improve.
10. As a medical student, I want to invite secondary Specialty Mentors from my school's faculty directory for specific essays, so that I can obtain specialized feedback for competitive fields.
11. As a medical student, I want an automated system nudge sent to my advisor if my draft has been queued for 10 days, so that I don't have to send an awkward follow-up email.
12. As a medical student, I want to select my target specialty and have the system automatically allocate my exact ERAS signal budget (Gold and Silver counts), so that I don't violate signaling rules.
13. As a medical student, I want to build a school list categorized into Reach, Target, and Safety tiers, so that I maintain a strategically balanced program distribution.
14. As a medical student, I want to assign my Gold and Silver signals directly to programs on my school list, so that I can optimize my signaling strategy with my advisor.
15. As a medical student, I want to enter my Step 2 CK, clerkship honors, publication count, and geographic preferences into a competitiveness calculator, so that I can see where I land against NRMP matched applicant quartiles.
16. As a medical student, I want direct hyperlinks to Residency Explorer on each program card, so that I can cross-reference my specific interview yield statistics.
17. As a medical student, I want to see which alumni from my medical school matched at each target program over the past 3-5 years, so that I know where our school has a strong historical presence.
18. As a medical student, I want to view alumni who opted in to mentor applicants and see direct links to Doximity residency reviews, so that I can get honest insights into program culture.
19. As a medical student, I want a 1-click clipboard transfer assistant with field-by-field copy buttons, so that I can paste my finalized application into official ERAS in under 15 minutes.
20. As a medical student, I want to export a compiled institutional PDF of my approved application packet, so that I have an archival copy for my Dean's letter / MSPE committee.

### Faculty Advisor Persona
21. As a faculty advisor, I want an authenticated dashboard displaying an actionable inbox of pending student reviews sorted by submission date, so that I can prioritize my advising queue efficiently.
22. As a faculty advisor, I want clicking a student's review to automatically transition the state to `In Review`, so that the student is immediately notified that their draft is being read.
23. As a faculty advisor, I want to review an immutable snapshot of the student's submission, so that the text cannot be modified under my feet while I am writing comments.
24. As a faculty advisor, I want to see a side-by-side diff with the student's changelog note when reviewing `v2` or later drafts, so that I can evaluate changes without re-reading the entire essay.
25. As a faculty advisor, I want to evaluate essays using a standardized 4-pillar clinical rubric (Narrative Motivation, Clinical Reflection, Tone/Fit, Mechanics), so that my feedback is structured and high-yield.
26. As a faculty advisor, I want to leave section-specific comments and select an overall verdict (`Ready to Lock` vs. `Revisions Requested`), so that the next steps are unambiguous.
27. As a faculty advisor, I want to review a student's 10-experience portfolio as a holistic bundle, while toggling approval or revision requests on individual experiences, so that I can evaluate balance without slowing down approvals.
28. As a faculty advisor, I want to review a student's categorized school list, inspect their Gold/Silver signal allocation, and flag specific programs with strategic notes, so that the student applies safely and effectively.
29. As a faculty advisor, I want to receive an automated gentle email reminder at Day 10 if an assigned draft is approaching the 14-day turnaround target, so that I don't lose track of busy advisees.

### Student Affairs Admin / Dean's Office Persona
30. As a student affairs admin, I want to manage student and faculty cohorts for our medical school, so that advisors and advisees are properly mapped.
31. As a student affairs admin, I want to configure our institution's SLA turnaround target (defaulting to 14 days), so that system alerts align with our school's advising policies.
32. As a student affairs admin, I want a cohort funnel dashboard displaying aggregate progress (e.g., % drafted, % submitted, % endorsed, % school list finalized) without accessing confidential essay text, so that I can protect student privacy while monitoring institutional health.
33. As a student affairs admin, I want an alert queue of review requests that have breached the 14-day SLA, so that Student Affairs can intervene and support overworked advisors.
34. As a student affairs admin, I want to upload our medical school's historical match lists, so that our students can see verified alumni match history across ACGME programs.
35. As a student affairs admin, I want to customize the 4-pillar rubric criteria to reflect our institution's specific advising guidelines, so that our faculty follow a unified standard.

### Developer & Demonstration Persona
36. As a developer/tester, I want a top-bar persona quick-switcher to seamlessly toggle between Student, Advisor, and Admin roles in development mode, so that I can verify end-to-end workflows rapidly without multi-account auth friction.

## Implementation Decisions

### 1. Architectural Pattern & Module Seam
- **Primary Seam**: The highest seam is the **Domain Application Service Seam** (`AdvisingPlatformService`).
  - All state transitions, immutable snapshotting, character validation, signaling budget checks, and competitiveness percentile calculations sit behind this single service interface.
  - Callers (Next.js Server Actions, API routes, or test suites) interact solely through this high-level interface.
  - A pluggable **Storage Adapter** interface allows running against an ultra-fast in-memory fake for deterministic automated tests and against Supabase PostgreSQL in production.

### 2. Relational Core Schema (Supabase PostgreSQL)
- `institutions`: ID, name, domain, default_sla_days, created_at.
- `profiles`: ID, institution_id, email, full_name, role (`student`, `advisor`, `admin`), avatar_url.
- `specialties`: ID, name, code, gold_signals_count, silver_signals_count, total_signals_count, nrp_benchmarks (JSONB).
- `programs`: ID, specialty_id, acgme_code, institution_name, city, state, hospital_type.
- `advisor_assignments`: ID, institution_id, student_id, advisor_id, assignment_type (`primary_dean`, `specialty_mentor`), specialty_id.
- `personal_statements`: ID, student_id, title, specialty_id, status (`drafting`, `submitted`, `in_review`, `revisions_requested`, `endorsed`).
- `experiences`: ID, student_id, title, org_name, role_name, experience_type, start_date, end_date, is_current, description_text (max 1024), is_most_meaningful (boolean), reflection_text (max 300), display_order.
- `document_versions`: ID, document_type (`personal_statement`, `experience_portfolio`), document_id, version_number, payload (JSONB / text), changelog_note, created_at.
- `review_requests`: ID, document_version_id, student_id, advisor_id, status (`submitted`, `in_review`, `revisions_requested`, `endorsed`), submitted_at, in_review_at, completed_at, sla_due_at.
- `review_feedback`: ID, review_request_id, rubric_scores (JSONB), overall_verdict (`ready_to_lock`, `revisions_requested`), general_notes, created_at.
- `school_lists`: ID, student_id, specialty_id, status (`drafting`, `submitted_for_review`, `approved`).
- `school_list_items`: ID, school_list_id, program_id, tier (`safety`, `target`, `reach`), signal_type (`gold`, `silver`, `none`), track (`categorical`, `preliminary`, `pstp`), advisor_notes.
- `alumni_records`: ID, institution_id, full_name, graduation_year, matched_program_id, specialty_id, opt_in_mentorship (boolean), contact_channel, doximity_profile_url.

### 3. Review Pipeline State Machine
```
[ Drafting ] ──(Student Submits + Changelog)──> [ Submitted (Snapshot Frozen) ]
                                                       │
                                            (Advisor Opens Draft)
                                                       │
                                                       ▼
                                                [ In Review ]
                                                 │         │
                   ┌─────────────────────────────┘         └─────────────────────────────┐
        (Revisions Requested)                                                     (Approved / Endorsed)
                   │                                                                     │
                   ▼                                                                     ▼
        [ Revisions Requested ]                                                 [ Endorsed / Locked ]
                   │                                                                     │
        (Student Creates v2)                                                    (Unlocked for ERAS Export)
                   │
                   ▼
              [ Drafting ]
```

### 4. Drafting Rules & Content Constraints
- Personal Statement: ASCII / clean UTF-8 text only; rich-text markdown stripped upon input; dynamic character count and target AAMC page estimator (standard ~5,300 characters / 800 words).
- Experience Description: Enforces hard limit of **750 characters** (including spaces) per official 2026/2027 AAMC ERAS specification.
- Most Meaningful Reflection: Enforces hard limit of **300 characters** (including spaces), capped at exactly 3 designated experiences.
- Hobbies & Interests: Enforces hard limit of **300 characters** (including spaces).
- Impactful Experiences: Narrative space for applicants with major life/socio-economic obstacles.
- Scholarly Works: Formats 5 official AAMC types (Journal Articles, Book Chapters, Abstracts, Oral Presentations, Poster Presentations), up to 3 Starred Meaningful Works, and Collections (100 char limit).
- Paste Sanitization: Automatically converts smart quotes (`“`, `”`) to straight quotes (`"`), em-dashes to double hyphens, and removes non-standard bullet characters.

### 5. SLA & Notification Engine
- Default institutional SLA: 14 calendar days from `submitted_at`.
- Day 10 Check: If `status == 'submitted'`, trigger advisory nudge email and in-app bell notification to assigned advisor.
- Day 14 Check: If `status == 'submitted'`, mark `sla_breached = true`, display red indicator on advisor dashboard, and surface record in Dean's Office Overdue Review Queue.

### 6. Signaling & Competitiveness Constraints
- Real-time signal validation: Total assigned Gold signals $\le$ specialty gold cap; Total assigned Silver signals $\le$ specialty silver cap.
- Program tiering validation: Flag advisory warning if school list has zero safety programs or exceeds recommended reach percentage (>40%).
- Benchmark bands: Categorizes applicant metric into `Comfortable` ($\ge 75\text{th}$ percentile), `Competitive` ($25\text{th} - 75\text{th}$ percentile), or `Stretch` ($< 25\text{th}$ percentile) based on NRMP specialty tables.

## Testing Decisions

### What Makes a Good Test
- **Test External Behavior, Not Implementation Details**: Tests must interact strictly through the `AdvisingPlatformService` seam and verify observable state transitions, invariant violations, and returned data. Tests must never inspect internal database row cursors or private class helper methods.
- **Hermetic & Fast**: Core domain suite runs against the in-memory adapter in milliseconds, enabling instant test-driven iteration.

### Key Behaviors Under Test
1. **Drafting & Sanitization Invariants**:
   - Reject experience description $>750$ characters.
   - Reject $>3$ "Most Meaningful" designations.
   - Reject meaningful reflection $>300$ characters.
   - Reject hobbies & interests $>300$ characters.
   - Verify smart-quote paste sanitization into clean ASCII.
2. **Review State Machine & Snapshot Invariants**:
   - Submitting a draft creates an immutable version record that cannot be mutated by subsequent draft edits.
   - Transitioning `Submitted` $\rightarrow$ `In Review` timestamps `in_review_at` and notifies student.
   - Transitioning to `Revisions Requested` requires rubric evaluation and feedback notes.
   - Student cannot submit `v2` without providing a non-empty changelog note.
3. **SLA & Turnaround Rules**:
   - Verify Day 10 alert triggering.
   - Verify Day 14 breach state surfacing in admin queue.
4. **Strategic School List Rules**:
   - Enforce specialty-specific Gold/Silver signal caps (e.g. attempting to assign a 4th Gold signal in Internal Medicine throws `SignalQuotaExceededError`).
   - Calculate competitiveness quartiles against benchmark table fixtures.
5. **Multi-Tenant Access Isolation**:
   - Verify that an advisor from Medical School A cannot access review requests from Medical School B.
   - Verify that a student cannot view another student's draft.

## Out of Scope
- Direct programmatic submission into AAMC ERAS (AAMC provides no public API; export is handled via the 1-click clipboard assistant and PDF).
- Non-residency educational programs (pre-med AMCAS, dental, pharmacy).
- Real-time video conferencing for advising sessions (handled via external institutional Zoom/Teams).

## Further Notes
- A top-level dev persona quick-switcher toolbar will be injected into local development environments to accelerate multi-role verification.
- The project is initialized in `/Users/hacharya/Desktop/AI Coding` using Next.js App Router, Tailwind CSS, and Supabase.
