# Issue 23: Specialty Advising Intake Form Integration & Streamlined Faculty Review

## Status
- **Type**: Feature / Workflow Enhancement
- **Priority**: High
- **Status**: Ready for Implementation
- **Triage Label**: `ready-for-agent`

---

## Problem Statement

Medical students preparing for residency applications must complete a mandatory paper/PDF Specialty Advising Form (e.g. Geisinger Commonwealth School of Medicine's Specialty Advising Form) prior to meeting with their assigned specialty advisors. Currently, this process happens outside the digital advising platform via disconnected PDF email attachments. 

Furthermore, within the platform, students are asked to enter disconnected numerical metrics (such as guessing an aggregate count of clerkship honors or inputting isolated test scores) in generic modals, creating duplicated effort and disjointed data. Specialty advisors lack a unified, comprehensive pre-meeting intake dossier within their advisor portal, forcing them to juggle external PDF files, personal statement drafts, and experience lists across different tools.

## Solution

Incorporate the institutional Specialty Advising Form directly into the core platform workflow as the official onboarding and pre-advising intake. 

On initial student sign-up/onboarding, students are guided through the 13 clinical advising questions with all redundant questions eliminated (auto-syncing target specialty, consolidating Step examination status with score vs. anticipated date, and replacing manual honors counts with individual dropdowns for the 7 core clerkships that auto-compute aggregate honors). 

In the Advisor Portal, faculty advisors gain direct access to an interactive "Advisee Specialty Advising Dossier" modal for each assigned student, surfacing narrative motivations, core clerkship grades, academic red-flag screenings (course failures, CAPS probation, leaves of absence), parallel backup plans, upcoming Sub-I rotation calendars, outside mentors, and residency program/geographic goals. Students can update their intake at any time and print or export a clean, standardized advising packet to satisfy the pre-meeting institutional requirement.

## User Stories

1. As a newly registered medical student, I want to be prompted with a guided onboarding intake upon first logging into the platform, so that I can establish my clinical baseline and advising profile before beginning application drafts.
2. As a medical student, I want my name, institutional email, and designated medical school to be pre-populated in the advising form header, so that I do not have to re-enter basic biographical information.
3. As a medical student, I want to select my preferred pronouns (He/Him/His, She/Her/Hers, They/Them/Theirs, or Custom) on the form, so that my faculty advisor addresses me respectfully and accurately in advising sessions and letters.
4. As a medical student, I want to select my regional campus (Northeast, Central, South, West, Guthrie, AtlantiCare, or Other), so that my regional clinical deans and campus-specific advisors are correctly contextualized.
5. As a medical student, I want to confirm or select my target applying specialty from the platform's canonical 26 ACGME specialties (Question 1), so that my selection automatically synchronizes across the School List Matrix, ERAS signaling rules, and advisor matching.
6. As a medical student, I want to write a narrative statement explaining why I am interested in my chosen specialty (Question 2), so that my advisor understands my clinical motivations, inpatient vs. outpatient orientation, fellowship aspirations, and passion for teaching before our first meeting.
7. As a medical student, I want a single unified Step examination question (Question 3) where I indicate whether I have any Step exam failures (Yes/No) and provide explanation details only if applicable, so that I do not have to answer redundant pass/fail prompts across different modals.
8. As a medical student who has already completed USMLE Step 2 CK, I want to record my numerical score (Question 4), so that it automatically populates downstream school list auto-tiering and competitiveness benchmarks.
9. As a medical student who has not yet taken USMLE Step 2 CK, I want to specify an anticipated test date (Question 4) rather than being forced to enter a placeholder numerical score, so that my profile accurately reflects my test timeline.
10. As a medical student, I want to indicate whether I completed a dedicated Research Year (Question 5) and record the institution/laboratory where it occurred, so that my advisor can evaluate my research dedication independently of individual project counts.
11. As a medical student, I want to record my specific grade for each of the 7 core clinical clerkships—Family Medicine, Internal Medicine, Surgery, Pediatrics, Obstetrics & Gynecology, Neurology, and Psychiatry—using standard grade tiers (Honors, High Pass, Pass, Fail, In Progress) (Question 6), so that my transcript performance is clinically detailed and structured.
12. As a medical student, I want the platform to automatically compute my total Clerkship Honors count from my 7 recorded clerkship grades, so that I never have to manually tally honors to feed the Competitiveness Engine.
13. As a medical student, I want to disclose any pre-clerkship course failures, clerkship failures, or repeat of academic years (Question 7) with contextual explanations, so that my specialty advisor can proactively strategize MSPE framing and residency application safety.
14. As a medical student, I want to disclose any Committee on Academic and Professional Standards (CAPS) actions, probation, or professionalism citations (Question 8) with contextual explanations, so that my advisor is aware of items that will appear on my MSPE.
15. As a medical student, I want to disclose whether I have taken a Leave of Absence (LOA) (Question 9) and specify the type of leave (medical, personal, research, dual degree), so that my graduation timeline and career path are transparent to my advisor.
16. As a medical student considering a competitive or dual specialty, I want to indicate whether I am pursuing a parallel plan (Question 10) and select my backup specialty from the canonical specialties list, so that my advisor can guide my dual-application strategy and signal allocation.
17. As a medical student, I want to list my upcoming 4th-year specialty rotations, Sub-Internships (Sub-Is), critical care electives, away/audition rotations, dates, and campus locations (Question 11), so that my advisor knows which clinical blocks precede letter-of-recommendation deadlines.
18. As a medical student, I want to list any external specialty advisors or mentors I am working with outside of the home clinical affiliate network (Question 12), so that my institutional advisor can coordinate with outside mentors.
19. As a medical student, I want to record my program goals (academic vs. community focus, fellowship plans) and prioritized geographic preferences (Ranked #1, #2, #3, #4) (Question 13), so that my advisor can evaluate the geographic alignment of my School List.
20. As a medical student, I want to view an updated summary of my publications, presentations, and scholarly citations automatically pulled from the Scholarly Works portfolio directly within my advising intake summary, so that I do not have to retype my research history.
21. As a medical student, I want to edit and update my Specialty Advising Form at any time from a header action button in the Student Portal, so that I can update clerkship grades, new Step 2 scores, or confirmed away rotations as my 4th year progresses.
22. As a medical student, I want to preview and print or export my completed Specialty Advising Form in a clean, standardized 2-page document layout matching the institutional paper form, so that I can bring the printed copy along with my CV to in-person advising meetings.
23. As a faculty advisor, I want to see an "Advising Intake Form: Complete / In Progress" status badge on each advisee's card in the Advisor Portal, so that I immediately know who has submitted their pre-meeting paperwork.
24. As a faculty advisor, I want visual flag badges on advisee cards (such as "LOA Disclosed", "Parallel Plan Active", "Academic Flags Noted", or "All Core Honors"), so that I can triage high-risk advising needs at a glance.
25. As a faculty advisor, I want to click "View Advising Form" on any advisee card to open a full, interactive Advisee Advising Dossier Modal, so that I can review all 13 questions, clerkship grades, rotation timeline, and geographic goals in one unified view.
26. As a faculty advisor, I want to record private faculty advising notes and toggle an "Advising Intake Endorsed / Reviewed" sign-off directly inside the student's advising dossier, so that our advising milestones are tracked institutional-wide.
27. As a medical school dean or administrator, I want institutional intake completion rates to be trackable across the cohort, so that student affairs can ensure 100% of MS4s complete specialty intake prior to the ERAS submission cycle.

## Implementation Decisions

### Modules & Architecture
- **Advising Intake Domain Model (`src/domain/advising-intake-models.ts`)**:
  - Implements the complete schema for the 13-question Specialty Advising Form, including header metadata, USMLE Step status (score vs. anticipated date), 7-core clerkship grades dictionary, red-flag screening flags with required details, parallel plan, rotation timeline, and geographic/residency goals.
  - Provides helper methods for computing total clerkship honors from core clerkship grades, validating completeness, serializing/deserializing, and synchronizing with existing local storage keys (`APPLICANT_PROFILE_STORAGE_KEY`, `APPLICANT_STEP2_CK_STORAGE_KEY`, and `TARGET_SPECIALTY_STORAGE_KEY`).
  - Provides sample default intake data for mock students (e.g. Alex Rivera, MS4).
- **Specialty Advising Modal Component (`src/components/SpecialtyAdvisingFormModal.tsx`)**:
  - Full-featured, accessible modal (`role="dialog"`) supporting tabbed or segmented navigation:
    1. *Student & Specialty Profile* (Pronouns, Campus, Applying Specialty, Motivation Statement).
    2. *Academic & Clinical Performance* (Step exam status & score/date, 7 core clerkship grade selectors with live Honors counter, dedicated Research Year).
    3. *Academic Screening & Disclosures* (Course failures, CAPS/professionalism citations, Leaves of Absence).
    4. *Strategy, Rotations & Goals* (Parallel plan specialty, 4th-year rotation calendar, external mentors, program & geographic goals).
  - Includes a "Print / Export Advising Dossier" view that formats the responses to mirror the 2-page institutional layout.
- **Student Portal Integration (`src/components/StudentPortal.tsx`)**:
  - Welcomes new students with an onboarding alert banner or initial intake trigger if intake is incomplete.
  - Replaces the generic profile modal button with a prominent "Specialty Advising Form" header trigger.
  - Ensures saving updates in the advising form updates `targetSpecialty`, `step2Ck`, and the Competitiveness Engine metrics in real-time.
- **Advisor Portal Integration (`src/components/AdvisorPortal.tsx`)**:
  - Enhances each advisee card with intake completion status (`Complete` vs `In Progress`) and high-yield triage badges (`Parallel Plan`, `LOA`, `Flags`).
  - Wire the existing "View Details →" link to open the interactive Advisee Advising Dossier Modal, allowing advisors to inspect all 13 fields, read the motivation statement, verify clerkship grades, and record advisor sign-off notes.

### Deduplication Schema Contract
```ts
export type ClerkshipGrade = 'Honors' | 'High Pass' | 'Pass' | 'Fail' | 'In Progress';

export interface CoreClerkshipGrades {
  familyMedicine: ClerkshipGrade;
  internalMedicine: ClerkshipGrade;
  surgery: ClerkshipGrade;
  pediatrics: ClerkshipGrade;
  obGyn: ClerkshipGrade;
  neurology: ClerkshipGrade;
  psychiatry: ClerkshipGrade;
}

export interface SpecialtyAdvisingIntake {
  studentId: string;
  studentName: string;
  pronouns: string;
  submissionDate: string;
  regionalCampus: string;
  specialtyAdvisorName: string;
  // Q1
  applyingSpecialty: string;
  // Q2
  specialtyInterestReason: string;
  // Q3
  hasStepFailures: boolean;
  stepFailureDetails?: string;
  // Q4
  step2Status: 'score_available' | 'anticipated_date';
  step2Score?: number;
  step2AnticipatedDate?: string;
  // Q5
  completedResearchYear: boolean;
  researchYearLocation?: string;
  // Q6
  clerkshipGrades: CoreClerkshipGrades;
  // Q7
  hasAcademicFailuresOrRepeats: boolean;
  academicFailuresDetails?: string;
  // Q8
  hasCapsOrProfessionalismConcerns: boolean;
  capsConcernsDetails?: string;
  // Q9
  hasLeaveOfAbsence: boolean;
  leaveOfAbsenceType?: string;
  // Q10
  consideringParallelPlan: boolean;
  parallelPlanSpecialty?: string;
  // Q11
  futureRotationsTimeline: string;
  // Q12
  externalAdvisors?: string;
  // Q13
  residencyGoalsAndGeography: string;
  // Status
  isCompleted: boolean;
  advisorEndorsementNotes?: string;
  advisorReviewedAt?: string;
}
```

## Testing Decisions

### What Makes a Good Test
- Tests must verify observable user behavior and clinical state contracts rather than internal component implementation details.
- Tests should verify:
  1. Deduplication consistency: Saving Step 2 CK or applying specialty inside the intake form propagates immediately to the school list and competitiveness modules.
  2. Automatic derivation: Setting 5 core clerkships to 'Honors' automatically yields a clerkship honors count of 5.
  3. Red-flag disclosure logic: Selecting 'Yes' for course failures or CAPS requires and preserves explanation text.
  4. Advisor portal visibility: An advisor can load an advisee's completed intake, see their responses and badges, and append advisor notes.
  5. Persistence and rehydration: Saved intake persists to local storage and rehydrates across portal sessions.

### Modules Tested
- `src/domain/advising-intake-models.ts` (Domain logic, score sync, honors tally calculation).
- `src/components/SpecialtyAdvisingFormModal.tsx` & `src/components/StudentPortal.tsx` (Student onboarding and form submission flow).
- `src/components/AdvisorPortal.tsx` (Advisor intake dossier review and advisee status rendering).

### Prior Art
- `tests/domain/speed-b-ticket9-ticket10.test.ts` (Modal intake persistence and Step 2 CK tiering sync).
- `tests/domain/advisor-portal-advisee-status.test.tsx` (Advisee rendering and status verification).
- `tests/domain/alumni-school-list-cross-linking.test.tsx` (Cross-component synchronization).

## Out of Scope
- Automatic OCR PDF uploading of the paper form (the intake form is digital-first; file upload parsing can be an optional future add-on).
- Institutional Single Sign-On (SSO) authentication binding.

## Further Notes
- Grounded strictly in the provided Geisinger Commonwealth School of Medicine Specialty Advising Form document: `/Users/hacharya/Documents/ChatGPT/Internal ERAS Advising Application/Acharya - Specialty Advising Form (1).pdf`.
