import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';

describe('Item 15: Personal Statement Advisor Review Cleanup & Renaming', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('eliminates baseline comparison target for Draft 1 (getPreviousSnapshot is undefined for Draft 1)', () => {
    // Student writes initial draft 1
    storage.personalStatement.content = 'My journey into internal medicine began in the cardiology ward.';
    storage.personalStatement.currentVersionNumber = 1;

    // Student submits draft 1
    const request = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Draft 1 initial submission',
    });

    const draft1Snapshot = service.getSnapshot(request.snapshotId);
    expect(draft1Snapshot).toBeDefined();
    expect(draft1Snapshot?.versionNumber).toBe(1);

    // There should be NO previous snapshot target for Draft 1
    const prevSnapshot = service.getPreviousSnapshot(request.snapshotId);
    expect(prevSnapshot).toBeUndefined();
  });

  it('engages version comparison/diff target starting from V2 onwards', () => {
    // 1. Submit Draft 1
    storage.personalStatement.content = 'First version content of personal statement.';
    storage.personalStatement.currentVersionNumber = 1;
    const req1 = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Initial draft',
    });

    // 2. Advisor requests revisions
    service.submitAdvisorFeedback({
      reviewRequestId: req1.id,
      advisorId: 'usr-advisor-1',
      evaluation: {
        narrativeMotivation: 3,
        clinicalReflection: 3,
        toneAndFit: 4,
        structureAndMechanics: 3,
        overallVerdict: 'revisions_requested',
        generalNotes: 'Add more clinical specifics.',
      },
    });

    // 3. Student forks revision to Draft 2
    service.updatePersonalStatement('Second revised version with clinical specifics added.');
    expect(storage.personalStatement.currentVersionNumber).toBe(2);

    const req2 = service.submitPersonalStatementForReview({
      studentId: 'usr-student-1',
      advisorId: 'usr-advisor-1',
      changelogNote: 'Sharpened clinical reflection in paragraph 2.',
    });

    const draft2Snapshot = service.getSnapshot(req2.snapshotId);
    expect(draft2Snapshot).toBeDefined();
    expect(draft2Snapshot?.versionNumber).toBe(2);

    // V2 onwards MUST resolve the previous snapshot (Draft 1) for visual diff comparison
    const prevSnapshot = service.getPreviousSnapshot(req2.snapshotId);
    expect(prevSnapshot).toBeDefined();
    expect(prevSnapshot?.versionNumber).toBe(1);
    expect(prevSnapshot?.content).toBe('First version content of personal statement.');
  });
});
