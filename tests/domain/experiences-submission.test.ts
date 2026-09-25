import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { validateExperiencesSubmission } from '@/domain/experience-validation';
import { ExperienceDraft } from '@/domain/types';

describe('Ticket 12: Faculty Advisor Review Submission for Experiences', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  const createMockExperiences = (count: number): ExperienceDraft[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `exp-${i + 1}`,
      studentId: 'usr-student-1',
      title: `Experience Title #${i + 1}`,
      orgName: `Organization #${i + 1}`,
      roleName: `Role #${i + 1}`,
      experienceType: 'Clinical/patient care',
      frequency: 'Weekly (recurring)',
      startDate: '2023-01-01',
      isCurrent: true,
      descriptionText: `Valid description text for experience #${i + 1}. Well within the 750-character limit.`,
      isMostMeaningful: i < 3,
      reflectionText: i < 3 ? 'Meaningful reflection under 300 chars.' : undefined,
    }));
  };

  describe('Submission Validation Gate', () => {
    it('blocks submission when fewer than 10 experiences are entered', () => {
      const incomplete = createMockExperiences(7);
      const res = validateExperiencesSubmission(incomplete);

      expect(res.canSubmit).toBe(false);
      expect(res.filledCount).toBe(7);
      expect(res.errors[0]).toContain('All 10 selected experiences must be completely filled out');
    });

    it('blocks submission when an experience description exceeds 750 characters', () => {
      const exps = createMockExperiences(10);
      exps[0].descriptionText = 'A'.repeat(751);

      const res = validateExperiencesSubmission(exps);
      expect(res.canSubmit).toBe(false);
      expect(res.errors.some(e => e.includes('exceeds the 750-character limit'))).toBe(true);
    });

    it('blocks submission when a Most Meaningful reflection exceeds 300 characters', () => {
      const exps = createMockExperiences(10);
      exps[0].isMostMeaningful = true;
      exps[0].reflectionText = 'B'.repeat(301);

      const res = validateExperiencesSubmission(exps);
      expect(res.canSubmit).toBe(false);
      expect(res.errors.some(e => e.includes('exceeds the 300-character limit'))).toBe(true);
    });

    it('allows submission when all 10 experiences are completely filled within limits', () => {
      const complete = createMockExperiences(10);
      const res = validateExperiencesSubmission(complete);

      expect(res.canSubmit).toBe(true);
      expect(res.filledCount).toBe(10);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe('End-to-End Advisor Review State Machine & Queue Routing', () => {
    it('submits experiences portfolio to advisor queue and transitions stage to "submitted"', () => {
      const exps = createMockExperiences(10);
      storage.experiences = exps;

      const request = service.submitExperiencesForReview({
        studentId: 'usr-student-1',
        advisorId: 'usr-advisor-1',
        changelogNote: 'Complete 10-experiences portfolio ready for Dr. Chen review',
      });

      expect(request).toBeDefined();
      expect(request.documentType).toBe('experience_portfolio');
      expect(request.stage).toBe('submitted');
      expect(request.advisorId).toBe('usr-advisor-1');

      // Advisor queue includes the experiences submission
      const advisorContext = service.getAdvisorDashboardContext();
      const expReview = advisorContext.pendingReviews.find(r => r.id === request.id);
      expect(expReview).toBeDefined();
      expect(expReview?.documentType).toBe('experience_portfolio');
    });

    it('transitions to in_review and tracks the active viewing entry index (Entry X/10)', () => {
      const exps = createMockExperiences(10);
      storage.experiences = exps;

      const request = service.submitExperiencesForReview({
        studentId: 'usr-student-1',
        advisorId: 'usr-advisor-1',
      });

      // Advisor opens review
      service.openReviewAsAdvisor(request.id, 'usr-advisor-1');
      const updatedReq = storage.reviewRequests.find(r => r.id === request.id);
      expect(updatedReq?.stage).toBe('in_review');

      // Advisor views Entry 4
      service.setAdvisorViewingEntry(request.id, 4);
      expect(updatedReq?.currentViewingEntryIndex).toBe(4);

      // Student and advisor see active review tracking
      const studentContext = service.getStudentDashboardContext();
      const activeExpReview = studentContext.activeReviewRequests.find(r => r.id === request.id);
      expect(activeExpReview?.currentViewingEntryIndex).toBe(4);
    });
  });
});
