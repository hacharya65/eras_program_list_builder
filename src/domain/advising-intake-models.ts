/**
 * Ethmoid - Institutional Specialty Advising Intake & Governance Models
 * Grounded in the Geisinger Commonwealth School of Medicine Specialty Advising Form
 * and 2027 MyERAS Season Rules.
 */

import {
  getStoredApplicantStep2Ck,
  setStoredApplicantStep2Ck,
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
  APPLICANT_PROFILE_STORAGE_KEY,
} from './school-list-models';

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

export type CareerDirection = 'fellowship' | 'academic_practice' | 'community_practice' | 'undecided';
export type SettingPreference = 'urban' | 'suburban' | 'rural' | 'no_preference';
export type ProgramTypePreference = 'academic' | 'community' | 'hybrid';

export interface SpecialtyAdvisingIntake {
  studentId: string;
  studentName: string;
  pronouns: string;
  submissionDate: string;
  regionalCampus: string;
  specialtyAdvisorName: string;
  
  // Q1: Specialty Applying
  applyingSpecialty: string;
  
  // Q2: Specialty Interest Narrative Statement
  specialtyInterestReason: string;
  
  // Q3: Step Exam Failure Disclosures
  hasStepFailures: boolean;
  stepFailureDetails?: string;
  
  // Q4: Step 2 CK Status
  step2Status: 'score_available' | 'anticipated_date';
  step2Score?: number;
  step2AnticipatedDate?: string;
  
  // Q5: Dedicated Research Year
  completedResearchYear: boolean;
  researchYearLocation?: string;
  
  // Q6: 7 Core Clerkship Grades
  clerkshipGrades: CoreClerkshipGrades;
  
  // Q7: Academic / Course / Clerkship Failures or Repeat of Year
  hasAcademicFailuresOrRepeats: boolean;
  academicFailuresDetails?: string;
  
  // Q8: CAPS Actions (Probation) or Professionalism Concerns in MSPE
  hasCapsOrProfessionalismConcerns: boolean;
  capsConcernsDetails?: string;
  
  // Q9: Leave of Absence (LOA)
  hasLeaveOfAbsence: boolean;
  leaveOfAbsenceType?: string;
  
  // Q10: Parallel Specialty Plan
  consideringParallelPlan: boolean;
  parallelPlanSpecialty?: string;
  
  // Q11: Future Specialty Rotations, Dates & Campus Locations
  futureRotationsTimeline: string;
  
  // Q12: External Specialty Advisors
  externalAdvisors: string;
  
  // Q13: Goals for Residency Program & Geographic Preferences
  residencyGoalsAndGeography: string;
  
  // Strategic Preferences
  careerDirection?: CareerDirection;
  settingPreference?: SettingPreference;
  programTypeInterest?: ProgramTypePreference[];
  preferredStates?: string[];
  myErasCensusDivisions?: string[]; // Up to 3 divisions
  
  // Governance & Review Status
  isCompleted: boolean;
  completedAt?: string;
  advisorEndorsementNotes?: string;
  advisorReviewedAt?: string;
  advisorReviewerName?: string;
}

/**
 * Institutional Default Specialty Advisors for Geisinger
 */
export const GEISINGER_SPECIALTY_ADVISORS: Record<string, string> = {
  'Internal Medicine': 'Dr. Rose Barham',
  'Anesthesiology': 'Dr. David Fryzel',
  'Family Medicine': 'Dr. Jason Woloski',
  'General Surgery': 'Dr. Megan Rapp',
  'Pediatrics': 'Dr. Rose Barham',
  'Emergency Medicine': 'Dr. David Fryzel',
  'Psychiatry': 'Dr. Jason Woloski',
  'Obstetrics and Gynecology': 'Dr. Megan Rapp',
};

export function getDefaultAdvisorForSpecialty(specialty: string): string {
  return GEISINGER_SPECIALTY_ADVISORS[specialty] || 'Dr. Rose Barham';
}

/**
 * Official U.S. Census Divisions for 2027 MyERAS Season
 */
export const US_CENSUS_DIVISIONS: Record<string, string[]> = {
  'New England': ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'],
  'Middle Atlantic': ['NJ', 'NY', 'PA'],
  'East North Central': ['IL', 'IN', 'MI', 'OH', 'WI'],
  'West North Central': ['IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
  'South Atlantic': ['DE', 'DC', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV'],
  'East South Central': ['AL', 'KY', 'MS', 'TN'],
  'West South Central': ['AR', 'LA', 'OK', 'TX'],
  'Mountain': ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY'],
  'Pacific': ['AK', 'CA', 'HI', 'OR', 'WA'],
};

/**
 * Checks for geographic mismatch between preferred states and selected census divisions
 */
export function checkStateDivisionsMismatch(
  preferredStates: string[],
  selectedDivisions: string[]
): { mismatchedStates: string[]; warningMessage?: string } {
  if (!preferredStates || preferredStates.length === 0 || !selectedDivisions || selectedDivisions.length === 0) {
    return { mismatchedStates: [] };
  }

  const allowedStates = new Set<string>();
  for (const div of selectedDivisions) {
    const states = US_CENSUS_DIVISIONS[div] || [];
    states.forEach((s) => allowedStates.add(s.toUpperCase()));
  }

  const mismatchedStates = preferredStates.filter((st) => !allowedStates.has(st.toUpperCase()));
  if (mismatchedStates.length > 0) {
    return {
      mismatchedStates,
      warningMessage: `Advising Note: Preferred state(s) ${mismatchedStates.join(
        ', '
      )} lie outside your selected 2027 MyERAS Census Divisions (${selectedDivisions.join(
        ', '
      )}). Consider aligning your geographic signals or preparing a tailored rationale.`,
    };
  }

  return { mismatchedStates: [] };
}

/**
 * Automatically computes total Clerkship Honors from the 7 core clerkship grades.
 */
export function calculateClerkshipHonorsCount(grades: CoreClerkshipGrades): number {
  if (!grades) return 0;
  return Object.values(grades).filter((grade) => grade === 'Honors').length;
}

export const SPECIALTY_INTAKE_STORAGE_PREFIX = 'ethmoid_specialty_advising_intake_';

export const DEFAULT_CLERKSHIP_GRADES: CoreClerkshipGrades = {
  familyMedicine: 'Honors',
  internalMedicine: 'Honors',
  surgery: 'Honors',
  pediatrics: 'Honors',
  obGyn: 'Honors',
  neurology: 'Honors',
  psychiatry: 'High Pass',
};

export const INITIAL_MOCK_INTAKE: SpecialtyAdvisingIntake = {
  studentId: 'usr-student-1',
  studentName: 'Alex Rivera',
  pronouns: 'He/Him/His',
  submissionDate: new Date().toLocaleDateString('en-US'),
  regionalCampus: 'Northeast',
  specialtyAdvisorName: 'Dr. Rose Barham',
  applyingSpecialty: 'Internal Medicine',
  specialtyInterestReason:
    'I enjoy the breadth of internal medicine, the ability to manage complex patients in the inpatient setting, continuity in outpatient clinic, and the potential to subspecialize in pulmonary/critical care. I also enjoy bedside clinical teaching and medical student mentorship.',
  hasStepFailures: false,
  step2Status: 'score_available',
  step2Score: 267,
  completedResearchYear: false,
  clerkshipGrades: DEFAULT_CLERKSHIP_GRADES,
  hasAcademicFailuresOrRepeats: false,
  hasCapsOrProfessionalismConcerns: false,
  hasLeaveOfAbsence: false,
  consideringParallelPlan: false,
  futureRotationsTimeline:
    'Block 3 - EM @ GMC // Block 4 - SSHM (PM&R) @ GMC // Block 5 - Crit Care @ GMC // Block 6 - Med Sub-I @ GMC // Block 7 - Med Sub-I @ Mt. Sinai NYC',
  externalAdvisors: 'None (working primarily with Geisinger faculty)',
  residencyGoalsAndGeography:
    'Academic university-based programs (focus on clinician-educator track). Preferred geography: Middle Atlantic (NY, NJ, PA) and New England (MA, CT).',
  careerDirection: 'fellowship',
  settingPreference: 'urban',
  programTypeInterest: ['academic', 'hybrid'],
  preferredStates: ['NY', 'NJ', 'PA', 'MA'],
  myErasCensusDivisions: ['Middle Atlantic', 'New England'],
  isCompleted: true,
  completedAt: new Date().toISOString(),
  advisorReviewerName: 'Dr. Marcus Chen',
  advisorReviewedAt: '2026-09-25T14:30:00.000Z',
  advisorEndorsementNotes:
    'Strong academic foundation. Excellent core clerkship transcript with 6 Honors. Recommended targeting top university programs with high fellowship placement.',
};

const inMemoryIntakeMap = new Map<string, SpecialtyAdvisingIntake>();

/**
 * Loads the student advising intake from storage, creating default baseline if not present.
 */
export function loadStudentAdvisingIntake(studentId: string = 'usr-student-1'): SpecialtyAdvisingIntake {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${SPECIALTY_INTAKE_STORAGE_PREFIX}${studentId}`);
      if (stored) {
        const parsed: SpecialtyAdvisingIntake = JSON.parse(stored);
        // Ensure synchronization with global step 2 CK and target specialty if stored
        const globalStep2 = getStoredApplicantStep2Ck();
        const globalSpecialty = getStoredTargetSpecialty();
        if (globalStep2 && parsed.step2Status === 'score_available' && !parsed.step2Score) {
          parsed.step2Score = globalStep2;
        }
        if (globalSpecialty && parsed.applyingSpecialty !== globalSpecialty) {
          parsed.applyingSpecialty = globalSpecialty;
        }
        return parsed;
      }
    } catch {}
  }

  if (inMemoryIntakeMap.has(studentId)) {
    return inMemoryIntakeMap.get(studentId)!;
  }

  // Return initial mock intake for demo student
  return {
    ...INITIAL_MOCK_INTAKE,
    studentId,
    applyingSpecialty: getStoredTargetSpecialty() || INITIAL_MOCK_INTAKE.applyingSpecialty,
    step2Score: getStoredApplicantStep2Ck() || INITIAL_MOCK_INTAKE.step2Score,
  };
}

/**
 * Saves and synchronizes student advising intake across the platform.
 */
export function saveStudentAdvisingIntake(intake: SpecialtyAdvisingIntake): void {
  inMemoryIntakeMap.set(intake.studentId, intake);

  // 1. Synchronize Step 2 CK score with downstream School List tiering
  if (intake.step2Status === 'score_available' && typeof intake.step2Score === 'number') {
    setStoredApplicantStep2Ck(intake.step2Score);
  }

  // 2. Synchronize Target Specialty
  if (intake.applyingSpecialty) {
    setStoredTargetSpecialty(intake.applyingSpecialty);
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(
        `${SPECIALTY_INTAKE_STORAGE_PREFIX}${intake.studentId}`,
        JSON.stringify(intake)
      );

      // 3. Synchronize auto-computed clerkship honors count into ApplicantProfile
      const computedHonors = calculateClerkshipHonorsCount(intake.clerkshipGrades);
      const existingProfileRaw = localStorage.getItem(APPLICANT_PROFILE_STORAGE_KEY);
      const existingProfile = existingProfileRaw ? JSON.parse(existingProfileRaw) : {};
      localStorage.setItem(
        APPLICANT_PROFILE_STORAGE_KEY,
        JSON.stringify({
          ...existingProfile,
          step2Ck: intake.step2Status === 'score_available' ? intake.step2Score : existingProfile.step2Ck,
          clerkshipHonors: computedHonors,
          step1Result: intake.hasStepFailures ? 'Fail / Retaken' : 'Pass',
        })
      );
    } catch (e) {
      console.error('Error saving advising intake:', e);
    }
  }
}

/**
 * Dean-Safe Privacy Filter:
 * Strips sensitive narrative answers, course failures, CAPS probation details, and LOA details.
 * Exposes metrics, completion status, and review timestamps only!
 */
export interface DeanSafeIntakeSummary {
  studentId: string;
  studentName: string;
  regionalCampus: string;
  specialtyAdvisorName: string;
  applyingSpecialty: string;
  isCompleted: boolean;
  completedAt?: string;
  step2Status: 'score_available' | 'anticipated_date';
  step2Score?: number;
  clerkshipHonorsCount: number;
  completedResearchYear: boolean;
  hasAdvisingFlags: boolean; // Aggregated red-flag indicator without exposing sensitive text
}

export function getDeanSafeIntakeSummary(intake: SpecialtyAdvisingIntake): DeanSafeIntakeSummary {
  return {
    studentId: intake.studentId,
    studentName: intake.studentName,
    regionalCampus: intake.regionalCampus,
    specialtyAdvisorName: intake.specialtyAdvisorName,
    applyingSpecialty: intake.applyingSpecialty,
    isCompleted: intake.isCompleted,
    completedAt: intake.completedAt,
    step2Status: intake.step2Status,
    step2Score: intake.step2Score,
    clerkshipHonorsCount: calculateClerkshipHonorsCount(intake.clerkshipGrades),
    completedResearchYear: intake.completedResearchYear,
    hasAdvisingFlags:
      intake.hasStepFailures ||
      intake.hasAcademicFailuresOrRepeats ||
      intake.hasCapsOrProfessionalismConcerns ||
      intake.hasLeaveOfAbsence,
  };
}
