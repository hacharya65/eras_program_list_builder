import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { RubricEvaluation } from '@/domain/types';

describe('Ticket 18: Multi-Revision Personal Statement Feedback Resolution', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('accurately resolves latest reviewed revision feedback when multiple revisions exist', () => {
    const student = storage.personas.student;
    const advisor = storage.personas.advisor;

    // Revision 1: Student submits v1
    storage.personalStatement.content = 'My draft v1 personal statement content.';
    const req1 = service.submitPersonalStatementForReview({
      studentId: student.id,
      advisorId: advisor.id,
    });
    expect(req1).toBeDefined();

    // Advisor reviews v1
    const eval1: RubricEvaluation = {
      narrativeMotivation: 3,
      clinicalReflection: 2,
      toneAndFit: 4,
      structureAndMechanics: 3,
      overallVerdict: 'revisions_requested',
      generalNotes: 'Revision 1 Notes: Focus more on specific patient encounters and clinical reflection.',
    };
    service.submitAdvisorFeedback({
      reviewRequestId: req1.id,
      advisorId: advisor.id,
      evaluation: eval1,
    });

    // Verify after round 1: latest feedback is Revision 1
    const latest1 = service.getLatestPersonalStatementFeedback(student.id);
    expect(latest1).toBeDefined();
    expect(latest1?.versionNumber).toBe(1);
    expect(latest1?.feedback.evaluation.generalNotes).toContain('Revision 1 Notes');

    // Revision 2: Student updates and submits v2 with changelog
    storage.updatePersonalStatement('My draft v2 personal statement with patient encounters added.');
    const req2 = service.submitPersonalStatementForReview({
      studentId: student.id,
      advisorId: advisor.id,
      changelogNote: 'Incorporated patient stories as requested.',
    });
    expect(req2).toBeDefined();

    // Advisor reviews v2
    const eval2: RubricEvaluation = {
      narrativeMotivation: 4,
      clinicalReflection: 4,
      toneAndFit: 5,
      structureAndMechanics: 4,
      overallVerdict: 'revisions_requested',
      generalNotes: 'Revision 2 Notes: Strong improvement in clinical storytelling. Polish transitions between paragraphs 2 and 3.',
    };
    service.submitAdvisorFeedback({
      reviewRequestId: req2.id,
      advisorId: advisor.id,
      evaluation: eval2,
    });

    // Verification: Latest feedback MUST be Revision 2, NOT Revision 1!
    const latest2 = service.getLatestPersonalStatementFeedback(student.id);
    expect(latest2).toBeDefined();
    expect(latest2?.versionNumber).toBe(2);
    expect(latest2?.feedback.evaluation.generalNotes).toBe(
      'Revision 2 Notes: Strong improvement in clinical storytelling. Polish transitions between paragraphs 2 and 3.'
    );
    expect(latest2?.feedback.evaluation.clinicalReflection).toBe(4);

    // Also verify feedback history returns both in descending version order [v2, v1]
    const history = service.getPersonalStatementFeedbackHistory(student.id);
    expect(history.length).toBe(2);
    expect(history[0].versionNumber).toBe(2);
    expect(history[0].feedback.evaluation.generalNotes).toContain('Revision 2 Notes');
    expect(history[1].versionNumber).toBe(1);
    expect(history[1].feedback.evaluation.generalNotes).toContain('Revision 1 Notes');
  });

  it('does not confuse experience reviews with personal statement feedback', () => {
    const student = storage.personas.student;
    const advisor = storage.personas.advisor;

    // Student submits personal statement v1
    storage.personalStatement.content = 'Personal statement content.';
    const psReq = service.submitPersonalStatementForReview({
      studentId: student.id,
      advisorId: advisor.id,
    });
    service.submitAdvisorFeedback({
      reviewRequestId: psReq.id,
      advisorId: advisor.id,
      evaluation: {
        narrativeMotivation: 3,
        clinicalReflection: 3,
        toneAndFit: 3,
        structureAndMechanics: 3,
        overallVerdict: 'revisions_requested',
        generalNotes: 'Personal Statement Note.',
      },
    });

    // Populate experiences so validation passes
    for (let i = 1; i <= 10; i++) {
      storage.updateExperience(`exp-${i}`, {
        title: `Experience ${i}`,
        orgName: `Hospital ${i}`,
        roleName: `Role ${i}`,
        descriptionText: `Valid clinical experience description for number ${i}.`,
        isMostMeaningful: i <= 3,
        reflectionText: i <= 3 ? `Meaningful reflection for experience ${i}.` : undefined,
      });
    }

    // Submit experience portfolio
    const expReq = service.submitExperiencesForReview({
      studentId: student.id,
      advisorId: advisor.id,
      changelogNote: 'Experiences portfolio submit.',
    });
    service.submitAdvisorFeedback({
      reviewRequestId: expReq.id,
      advisorId: advisor.id,
      evaluation: {
        narrativeMotivation: 5,
        clinicalReflection: 5,
        toneAndFit: 5,
        structureAndMechanics: 5,
        overallVerdict: 'ready_to_lock',
        generalNotes: 'Experiences Portfolio Note: All 10 look stellar.',
      },
    });

    // Personal statement feedback must strictly still return Personal Statement Note
    const latestPS = service.getLatestPersonalStatementFeedback(student.id);
    expect(latestPS?.feedback.evaluation.generalNotes).toBe('Personal Statement Note.');
    expect(latestPS?.reviewRequest.documentType).toBe('personal_statement');
  });
});
