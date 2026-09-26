import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import {
  saveStoredAnnotations,
  loadStoredAnnotations,
  saveStoredThreads,
  loadStoredThreads,
  createAnnotation,
  createCommentThread,
} from '@/domain/annotation-models';

describe('Tickets 18-21: Multi-Revision Personal Statement Feedback, Analysis & Iteration Flow', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('accurately tracks multi-cycle revision feedback history across 3 iterative cycles (v1 -> v2 -> v3)', () => {
    const student = storage.personas.student;
    const advisor = storage.personas.advisor;

    // === Round 1: v1 submitted and reviewed ===
    storage.personalStatement.content = 'Alex Rivera v1 Personal Statement.';
    const req1 = service.submitPersonalStatementForReview({
      studentId: student.id,
      advisorId: advisor.id,
    });
    service.submitAdvisorFeedback({
      reviewRequestId: req1.id,
      advisorId: advisor.id,
      evaluation: {
        narrativeMotivation: 2,
        clinicalReflection: 2,
        toneAndFit: 3,
        structureAndMechanics: 3,
        overallVerdict: 'revisions_requested',
        generalNotes: 'v1 Notes: Introduce patient case in opening paragraph.',
      },
    });

    const latestRound1 = service.getLatestPersonalStatementFeedback(student.id);
    expect(latestRound1?.versionNumber).toBe(1);
    expect(latestRound1?.feedback.evaluation.generalNotes).toBe('v1 Notes: Introduce patient case in opening paragraph.');
    expect(latestRound1?.reviewRequest.stage).toBe('revisions_requested');

    // === Round 2: v2 submitted and reviewed ===
    storage.updatePersonalStatement('Alex Rivera v2 Personal Statement with patient case.');
    const req2 = service.submitPersonalStatementForReview({
      studentId: student.id,
      advisorId: advisor.id,
      changelogNote: 'Added opening patient encounter.',
    });
    service.submitAdvisorFeedback({
      reviewRequestId: req2.id,
      advisorId: advisor.id,
      evaluation: {
        narrativeMotivation: 4,
        clinicalReflection: 3,
        toneAndFit: 4,
        structureAndMechanics: 4,
        overallVerdict: 'revisions_requested',
        generalNotes: 'v2 Notes: Case is great. Refine why this specific specialty.',
      },
    });

    const latestRound2 = service.getLatestPersonalStatementFeedback(student.id);
    expect(latestRound2?.versionNumber).toBe(2);
    expect(latestRound2?.feedback.evaluation.generalNotes).toBe('v2 Notes: Case is great. Refine why this specific specialty.');
    expect(latestRound2?.feedback.evaluation.narrativeMotivation).toBe(4);

    // === Round 3: v3 submitted and endorsed ===
    storage.updatePersonalStatement('Alex Rivera v3 Personal Statement fully refined.');
    const req3 = service.submitPersonalStatementForReview({
      studentId: student.id,
      advisorId: advisor.id,
      changelogNote: 'Clarified Internal Medicine commitment.',
    });
    service.submitAdvisorFeedback({
      reviewRequestId: req3.id,
      advisorId: advisor.id,
      evaluation: {
        narrativeMotivation: 5,
        clinicalReflection: 5,
        toneAndFit: 5,
        structureAndMechanics: 5,
        overallVerdict: 'ready_to_lock',
        generalNotes: 'v3 Notes: Outstanding! Endorsed and ready to lock for ERAS.',
      },
    });

    const latestRound3 = service.getLatestPersonalStatementFeedback(student.id);
    expect(latestRound3?.versionNumber).toBe(3);
    expect(latestRound3?.feedback.evaluation.overallVerdict).toBe('ready_to_lock');
    expect(latestRound3?.feedback.evaluation.generalNotes).toContain('Outstanding');

    // History must contain all 3 revisions in descending order [v3, v2, v1]
    const history = service.getPersonalStatementFeedbackHistory(student.id);
    expect(history.length).toBe(3);
    expect(history[0].versionNumber).toBe(3);
    expect(history[1].versionNumber).toBe(2);
    expect(history[2].versionNumber).toBe(1);
    expect(history[0].snapshot.content).toContain('v3');
    expect(history[1].snapshot.content).toContain('v2');
    expect(history[2].snapshot.content).toContain('v1');
  });

  it('isolates stored markups and threads strictly per revision version so comments do not bleed across iterations', () => {
    // Save annotations for v1
    const v1Ann = createAnnotation({
      documentId: 'personal_statement',
      documentVersionId: 'v1',
      authorId: 'usr-advisor-1',
      authorName: 'Dr. Marcus Chen',
      authorRole: 'advisor',
      startOffset: 0,
      endOffset: 10,
      anchorText: 'Alex Rivera',
      type: 'highlight',
      color: 'yellow',
    });
    saveStoredAnnotations('personal_statement', [v1Ann], 'v1');

    // Save comments thread for v1
    const v1Thread = createCommentThread({
      documentId: 'personal_statement',
      documentVersionId: 'v1',
      startOffset: 0,
      endOffset: 10,
      anchorText: 'Alex Rivera',
      authorId: 'usr-advisor-1',
      authorName: 'Dr. Marcus Chen',
      authorRole: 'advisor',
      initialMessage: 'Consider personalizing the header.',
    });
    saveStoredThreads('personal_statement', [v1Thread], 'v1');

    // Save annotations for v2
    const v2Ann = createAnnotation({
      documentId: 'personal_statement',
      documentVersionId: 'v2',
      authorId: 'usr-advisor-1',
      authorName: 'Dr. Marcus Chen',
      authorRole: 'advisor',
      startOffset: 20,
      endOffset: 35,
      anchorText: 'patient case',
      type: 'replacement',
      suggestedText: 'clinical encounter',
      color: 'green',
    });
    saveStoredAnnotations('personal_statement', [v2Ann], 'v2');

    // Check v1 retrieval
    const loadedV1Ann = loadStoredAnnotations('personal_statement', 'v1');
    const loadedV1Threads = loadStoredThreads('personal_statement', 'v1');
    expect(loadedV1Ann.length).toBe(1);
    expect(loadedV1Ann[0].anchorText).toBe('Alex Rivera');
    expect(loadedV1Threads.length).toBe(1);
    expect(loadedV1Threads[0].comments[0].content).toBe('Consider personalizing the header.');

    // Check v2 retrieval
    const loadedV2Ann = loadStoredAnnotations('personal_statement', 'v2');
    expect(loadedV2Ann.length).toBe(1);
    expect(loadedV2Ann[0].anchorText).toBe('patient case');
    expect(loadedV2Ann[0].suggestedText).toBe('clinical encounter');

    // Confirm no leakage: v2 should not have v1 annotations
    expect(loadedV2Ann.some((a) => a.anchorText === 'Alex Rivera')).toBe(false);
  });
});
