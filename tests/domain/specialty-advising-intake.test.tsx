import { describe, it, expect, beforeEach } from 'vitest';
import {
  SpecialtyAdvisingIntake,
  calculateClerkshipHonorsCount,
  loadStudentAdvisingIntake,
  saveStudentAdvisingIntake,
  getDeanSafeIntakeSummary,
  checkStateDivisionsMismatch,
  getDefaultAdvisorForSpecialty,
  CoreClerkshipGrades,
  DEFAULT_CLERKSHIP_GRADES,
} from '@/domain/advising-intake-models';
import {
  getStoredApplicantStep2Ck,
  setStoredApplicantStep2Ck,
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
  APPLICANT_PROFILE_STORAGE_KEY,
  evaluateProgramTier,
} from '@/domain/school-list-models';
import {
  analyzeProgramLetterGaps,
  LetterWriterRequest,
  ProgramLetterRequirement,
} from '@/domain/lor-models';
import {
  updateStudentMedicalSchool,
  getStudentAccount,
} from '@/domain/student-registry';

describe('Ethmoid: Specialty Advising Intake & Governance Engine', () => {
  beforeEach(() => {
    if (typeof localStorage === 'undefined' || !globalThis.localStorage) {
      const store: Record<string, string> = {};
      (globalThis as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = String(v);
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          for (const k in store) delete store[k];
        },
      };
    } else {
      localStorage.clear();
    }
  });

  describe('Core Clerkship Honors Auto-Derivation', () => {
    it('accurately computes total clerkship honors from the 7 core clerkships', () => {
      const allHonors: CoreClerkshipGrades = {
        familyMedicine: 'Honors',
        internalMedicine: 'Honors',
        surgery: 'Honors',
        pediatrics: 'Honors',
        obGyn: 'Honors',
        neurology: 'Honors',
        psychiatry: 'Honors',
      };
      expect(calculateClerkshipHonorsCount(allHonors)).toBe(7);

      const mixedGrades: CoreClerkshipGrades = {
        familyMedicine: 'High Pass',
        internalMedicine: 'Honors',
        surgery: 'Pass',
        pediatrics: 'Honors',
        obGyn: 'High Pass',
        neurology: 'Honors',
        psychiatry: 'Pass',
      };
      expect(calculateClerkshipHonorsCount(mixedGrades)).toBe(3);

      const inProgressGrades: CoreClerkshipGrades = {
        familyMedicine: 'Pass',
        internalMedicine: 'Honors',
        surgery: 'In Progress',
        pediatrics: 'In Progress',
        obGyn: 'In Progress',
        neurology: 'In Progress',
        psychiatry: 'In Progress',
      };
      expect(calculateClerkshipHonorsCount(inProgressGrades)).toBe(1);
    });
  });

  describe('Intake Persistence & Downstream Synchronization', () => {
    it('persists intake and synchronizes numerical Step 2 CK score with downstream School List tiering', () => {
      const mockIntake: SpecialtyAdvisingIntake = {
        studentId: 'student-test-sync',
        studentName: 'Alex Rivera',
        pronouns: 'He/Him/His',
        submissionDate: '10/07/2026',
        regionalCampus: 'Northeast',
        specialtyAdvisorName: 'Dr. Rose Barham',
        applyingSpecialty: 'Internal Medicine',
        specialtyInterestReason: 'Broad clinical problem solving and inpatient care.',
        hasStepFailures: false,
        step2Status: 'score_available',
        step2Score: 265,
        completedResearchYear: true,
        researchYearLocation: 'NIH Clinical Center',
        clerkshipGrades: {
          familyMedicine: 'Honors',
          internalMedicine: 'Honors',
          surgery: 'Honors',
          pediatrics: 'Honors',
          obGyn: 'Honors',
          neurology: 'High Pass',
          psychiatry: 'High Pass',
        },
        hasAcademicFailuresOrRepeats: false,
        hasCapsOrProfessionalismConcerns: false,
        hasLeaveOfAbsence: false,
        consideringParallelPlan: false,
        futureRotationsTimeline: 'Block 6 - Med Sub-I',
        externalAdvisors: 'None',
        residencyGoalsAndGeography: 'Academic focus in Middle Atlantic.',
        isCompleted: true,
      };

      // 1. Save intake
      saveStudentAdvisingIntake(mockIntake);

      // 2. Check Step 2 CK score synchronization
      expect(getStoredApplicantStep2Ck()).toBe(265);

      // 3. Check School List tiering based on synchronized score
      // A program with range 245-255: with 265 (> 255), it is a safety
      expect(evaluateProgramTier(265, 245, 255)).toBe('safety');
      // A program with range 260-270: with 265, it is target
      expect(evaluateProgramTier(265, 260, 270)).toBe('target');

      // 4. Check ApplicantProfile auto-honors synchronization (5 Honors)
      const cachedProfile = JSON.parse(localStorage.getItem(APPLICANT_PROFILE_STORAGE_KEY) || '{}');
      expect(cachedProfile.clerkshipHonors).toBe(5);
      expect(cachedProfile.step2Ck).toBe(265);
      expect(cachedProfile.step1Result).toBe('Pass');
    });

    it('handles pending Step 2 CK date without setting an invalid numerical score', () => {
      const pendingIntake: SpecialtyAdvisingIntake = {
        studentId: 'student-pending-step',
        studentName: 'Jordan Lee',
        pronouns: 'They/Them',
        submissionDate: '10/07/2026',
        regionalCampus: 'Central',
        specialtyAdvisorName: 'Dr. Rose Barham',
        applyingSpecialty: 'Internal Medicine',
        specialtyInterestReason: 'Cardiology fellowship focus.',
        hasStepFailures: false,
        step2Status: 'anticipated_date',
        step2AnticipatedDate: 'August 2026',
        completedResearchYear: false,
        clerkshipGrades: DEFAULT_CLERKSHIP_GRADES,
        hasAcademicFailuresOrRepeats: false,
        hasCapsOrProfessionalismConcerns: false,
        hasLeaveOfAbsence: false,
        consideringParallelPlan: false,
        futureRotationsTimeline: 'Block 4 - Sub-I',
        externalAdvisors: 'None',
        residencyGoalsAndGeography: 'University programs.',
        isCompleted: true,
      };

      saveStudentAdvisingIntake(pendingIntake);
      const rehydrated = loadStudentAdvisingIntake('student-pending-step');
      expect(rehydrated.step2Status).toBe('anticipated_date');
      expect(rehydrated.step2AnticipatedDate).toBe('August 2026');
    });

    it('updates student account medical school and dispatches update event when medical school is updated', () => {
      let eventDetail: any = null;
      const listener = (e: any) => {
        eventDetail = e.detail;
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('student_account_updated', listener);
      }

      const updated = updateStudentMedicalSchool('stu-alex-rivera', 'Stanford University School of Medicine');
      expect(updated).not.toBeNull();
      expect(updated?.medicalSchool).toBe('Stanford University School of Medicine');

      const account = getStudentAccount('stu-alex-rivera');
      expect(account?.medicalSchool).toBe('Stanford University School of Medicine');

      if (typeof window !== 'undefined') {
        expect(eventDetail?.account?.medicalSchool).toBe('Stanford University School of Medicine');
        window.removeEventListener('student_account_updated', listener);
      }
    });
  });

  describe('Dean-Safe Privacy Boundary', () => {
    it('strips sensitive narrative answers and confidential red flags while exposing metrics to deans', () => {
      const sensitiveIntake: SpecialtyAdvisingIntake = {
        studentId: 'student-sensitive',
        studentName: 'Case Student',
        pronouns: 'She/Her',
        submissionDate: '10/07/2026',
        regionalCampus: 'South',
        specialtyAdvisorName: 'Dr. David Fryzel',
        applyingSpecialty: 'Anesthesiology',
        specialtyInterestReason: 'Critical care and acute physiology.',
        hasStepFailures: true,
        stepFailureDetails: 'Step 1 initial failure, passed on second attempt.',
        step2Status: 'score_available',
        step2Score: 248,
        completedResearchYear: true,
        researchYearLocation: 'AtlantiCare',
        clerkshipGrades: DEFAULT_CLERKSHIP_GRADES,
        hasAcademicFailuresOrRepeats: true,
        academicFailuresDetails: 'Remediated M1 Renal Block.',
        hasCapsOrProfessionalismConcerns: true,
        capsConcernsDetails: 'CAPS warning in year 2 for attendance, resolved.',
        hasLeaveOfAbsence: true,
        leaveOfAbsenceType: 'Personal 6-month leave',
        consideringParallelPlan: true,
        parallelPlanSpecialty: 'Internal Medicine',
        futureRotationsTimeline: 'Block 5 - Anesthesia Sub-I',
        externalAdvisors: 'Dr. Outside Mentor',
        residencyGoalsAndGeography: 'Northeast programs.',
        isCompleted: true,
        completedAt: '2026-10-01T12:00:00Z',
      };

      const deanSummary = getDeanSafeIntakeSummary(sensitiveIntake);

      // Verify metrics are preserved
      expect(deanSummary.studentName).toBe('Case Student');
      expect(deanSummary.step2Score).toBe(248);
      expect(deanSummary.clerkshipHonorsCount).toBe(6); // 6 Honors in DEFAULT_CLERKSHIP_GRADES
      expect(deanSummary.isCompleted).toBe(true);
      expect(deanSummary.completedResearchYear).toBe(true);
      expect(deanSummary.hasAdvisingFlags).toBe(true);

      // Verify sensitive narrative text is NOT in deanSummary
      expect((deanSummary as any).specialtyInterestReason).toBeUndefined();
      expect((deanSummary as any).stepFailureDetails).toBeUndefined();
      expect((deanSummary as any).academicFailuresDetails).toBeUndefined();
      expect((deanSummary as any).capsConcernsDetails).toBeUndefined();
      expect((deanSummary as any).leaveOfAbsenceType).toBeUndefined();
    });
  });

  describe('2027 MyERAS Geographic Mismatch Checking', () => {
    it('flags preferred states outside selected census divisions', () => {
      // Selected: Middle Atlantic (NJ, NY, PA)
      const selectedDivisions = ['Middle Atlantic'];
      // Preferred states: NY, NJ, and MA (MA is in New England)
      const preferredStates = ['NY', 'NJ', 'MA'];

      const result = checkStateDivisionsMismatch(preferredStates, selectedDivisions);
      expect(result.mismatchedStates).toEqual(['MA']);
      expect(result.warningMessage).toContain('MA');
      expect(result.warningMessage).toContain('Middle Atlantic');
    });

    it('returns empty mismatch when all preferred states are covered', () => {
      const selectedDivisions = ['Middle Atlantic', 'New England'];
      const preferredStates = ['NY', 'MA', 'PA'];

      const result = checkStateDivisionsMismatch(preferredStates, selectedDivisions);
      expect(result.mismatchedStates).toEqual([]);
      expect(result.warningMessage).toBeUndefined();
    });
  });

  describe('Specialty Switching Default Advisor Mapping', () => {
    it('resolves correct designated Geisinger specialty advisors', () => {
      expect(getDefaultAdvisorForSpecialty('Internal Medicine')).toBe('Dr. Rose Barham');
      expect(getDefaultAdvisorForSpecialty('Anesthesiology')).toBe('Dr. David Fryzel');
      expect(getDefaultAdvisorForSpecialty('Family Medicine')).toBe('Dr. Jason Woloski');
      expect(getDefaultAdvisorForSpecialty('General Surgery')).toBe('Dr. Megan Rapp');
    });
  });

  describe('Letter of Recommendation (LOR) Gap Detection', () => {
    it('detects letter gaps when assigned writers are fewer than required by program', () => {
      const writers: LetterWriterRequest[] = [
        {
          id: 'w1',
          writerName: 'Dr. Marcus Chen',
          writerTitle: 'Professor',
          specialty: 'Internal Medicine',
          institution: 'Geisinger',
          letterType: 'Clinical Sub-I / Attending',
          status: 'submitted',
          assignedProgramIds: ['prog-101'],
        },
        {
          id: 'w2',
          writerName: 'Dr. Rose Barham',
          writerTitle: 'Chief',
          specialty: 'Internal Medicine',
          institution: 'Geisinger',
          letterType: 'Department Chair / SLOE',
          status: 'initiated_eras',
          assignedProgramIds: ['prog-101'],
        },
      ];

      const requirements: Record<string, ProgramLetterRequirement> = {
        'prog-101': {
          programId: 'prog-101',
          requiredLettersCount: 3, // Website requires 3 letters
        },
      };

      const analysis = analyzeProgramLetterGaps('prog-101', writers, requirements);
      expect(analysis.requiredCount).toBe(3);
      expect(analysis.assignedCount).toBe(2);
      expect(analysis.submittedCount).toBe(1);
      expect(analysis.gapCount).toBe(1);
      expect(analysis.isSatisfied).toBe(false);

      // Add a third writer assigned to prog-101
      const writersFull = [
        ...writers,
        {
          id: 'w3',
          writerName: 'Dr. Sarah Jenkins',
          writerTitle: 'Director',
          specialty: 'Internal Medicine',
          institution: 'Geisinger',
          letterType: 'Research Mentor' as const,
          status: 'asked' as const,
          assignedProgramIds: ['prog-101'],
        },
      ];

      const satisfiedAnalysis = analyzeProgramLetterGaps('prog-101', writersFull, requirements);
      expect(satisfiedAnalysis.assignedCount).toBe(3);
      expect(satisfiedAnalysis.gapCount).toBe(0);
      expect(satisfiedAnalysis.isSatisfied).toBe(true);
    });
  });
});
