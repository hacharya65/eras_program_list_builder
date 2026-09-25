import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { RubricEvaluation } from '@/domain/types';

describe('Ticket 05: 4-Pillar Clinical Rubric & Faculty Review Studio', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('submits feedback with 4-pillar rubric ratings and transitions state to revisions_requested', () => {
    // 1. Student submits draft
    const request = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Initial draft submission',
    });

    // 2. Advisor opens draft
    service.openReviewAsAdvisor(request.id, 'usr-advisor-1');

    // 3. Advisor submits rubric feedback
    const evaluation: RubricEvaluation = {
      narrativeMotivation: 3,
      clinicalReflection: 4,
      toneAndFit: 5,
      structureAndMechanics: 3,
      overallVerdict: 'revisions_requested',
      generalNotes: 'Great patient storytelling. Shorten the introduction by 100 words and focus more on your specific interest in pulmonary medicine.',
    };

    const feedback = service.submitAdvisorFeedback({
      reviewRequestId: request.id,
      advisorId: 'usr-advisor-1',
      evaluation,
    });

    expect(feedback).toBeDefined();
    expect(feedback.evaluation.overallVerdict).toBe('revisions_requested');
    expect(feedback.evaluation.clinicalReflection).toBe(4);

    // Verify review request and personal statement updated to revisions_requested
    const updatedRequest = storage.reviewRequests.find(r => r.id === request.id);
    expect(updatedRequest?.stage).toBe('revisions_requested');
    expect(storage.personalStatement.stage).toBe('revisions_requested');
    expect(updatedRequest?.completedAt).toBeDefined();
  });

  it('submits feedback with "ready_to_lock" verdict and transitions state to endorsed', () => {
    const request = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Final polished draft',
    });

    service.openReviewAsAdvisor(request.id, 'usr-advisor-1');

    const evaluation: RubricEvaluation = {
      narrativeMotivation: 5,
      clinicalReflection: 5,
      toneAndFit: 5,
      structureAndMechanics: 5,
      overallVerdict: 'ready_to_lock',
      generalNotes: 'Outstanding personal statement. You are ready to lock this into ERAS.',
    };

    service.submitAdvisorFeedback({
      reviewRequestId: request.id,
      advisorId: 'usr-advisor-1',
      evaluation,
    });

    expect(storage.personalStatement.stage).toBe('endorsed');
    const updatedRequest = storage.reviewRequests.find(r => r.id === request.id);
    expect(updatedRequest?.stage).toBe('endorsed');
  });

  it('allows advisor to set granular approval status on individual experiences in portfolio', () => {
    const expId = 'exp-1';
    storage.experiences.push({
      id: expId,
      studentId: 'student-1',
      title: 'Triage Volunteer',
      orgName: 'Free Clinic',
      roleName: 'Volunteer',
      experienceType: 'Volunteer/service/advocacy',
      frequency: 'Weekly (recurring)',
      startDate: '2024-01-01',
      isCurrent: true,
      descriptionText: 'Assisted in triage.',
      isMostMeaningful: false,
    });

    expect(storage.experiences[0].status).toBeUndefined();

    service.setExperienceApprovalStatus(expId, 'approved', 'Looks strong and concise.');
    expect(storage.experiences[0].status).toBe('approved');
    expect(storage.experiences[0].advisorNote).toBe('Looks strong and concise.');

    service.setExperienceApprovalStatus(expId, 'revisions_needed', 'Cut 40 characters from reflection.');
    expect(storage.experiences[0].status).toBe('revisions_needed');
    expect(storage.experiences[0].advisorNote).toBe('Cut 40 characters from reflection.');
  });
});
