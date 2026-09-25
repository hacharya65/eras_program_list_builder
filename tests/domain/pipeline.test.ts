import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { computeTextDiff } from '@/domain/diff-engine';

describe('Ticket 04: Forked Snapshot Versioning & 5-Stage Order Pipeline', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  describe('Submission & Immutable Snapshot Creation', () => {
    it('creates an immutable snapshot on draft submission and transitions stage to "submitted"', () => {
      const studentId = 'usr-student-1';
      const advisorId = 'usr-advisor-1';
      const initialText = 'Draft v1 original content.';

      storage.personalStatement.content = initialText;
      storage.personalStatement.stage = 'drafting';

      const request = service.submitPersonalStatementForReview({
        studentId,
        advisorId,
        changelogNote: 'Initial draft for review',
      });

      expect(request).toBeDefined();
      expect(request.stage).toBe('submitted');
      expect(request.studentId).toBe(studentId);
      expect(request.advisorId).toBe(advisorId);
      expect(request.submittedAt).toBeDefined();

      // Verify immutable snapshot exists
      const snapshot = storage.snapshots.find(s => s.id === request.snapshotId);
      expect(snapshot).toBeDefined();
      expect(snapshot?.content).toBe(initialText);
      expect(snapshot?.versionNumber).toBe(1);

      // Verify that local student draft can be updated without altering the frozen snapshot
      service.updatePersonalStatement('Locally edited text that should not affect snapshot');
      expect(storage.personalStatement.content).toBe('Locally edited text that should not affect snapshot');
      expect(snapshot?.content).toBe(initialText); // unchanged!
    });

    it('requires a non-empty changelog note when submitting a revision (v2 or later)', () => {
      const studentId = 'usr-student-1';
      const advisorId = 'usr-advisor-1';

      // Set to v2
      storage.personalStatement.currentVersionNumber = 2;

      expect(() => {
        service.submitPersonalStatementForReview({
          studentId,
          advisorId,
          changelogNote: '   ', // whitespace only
        });
      }).toThrowError('A student revision changelog note is required for submitting revisions');
    });
  });

  describe('5-Stage Clinical Order Pipeline Transitions', () => {
    it('transitions from "submitted" to "in_review" when advisor opens the submission', () => {
      const request = service.submitPersonalStatementForReview({
        studentId: 'usr-student-1',
        advisorId: 'usr-advisor-1',
        changelogNote: 'Initial review request',
      });

      expect(request.stage).toBe('submitted');
      expect(request.inReviewAt).toBeUndefined();

      // Advisor opens review
      const inReviewRequest = service.openReviewAsAdvisor(request.id, 'usr-advisor-1');
      expect(inReviewRequest.stage).toBe('in_review');
      expect(inReviewRequest.inReviewAt).toBeDefined();

      // Also updates personal statement status for student visibility
      expect(storage.personalStatement.stage).toBe('in_review');
    });
  });

  describe('Text Diff Engine', () => {
    it('accurately identifies added, removed, and unchanged word chunks', () => {
      const v1 = 'I cared for Mr. K in the ICU and learned clinical empathy.';
      const v2 = 'I cared for Mr. K in the medical ICU and demonstrated deep empathy.';

      const diff = computeTextDiff(v1, v2);
      expect(diff.length).toBeGreaterThan(0);

      const addedChunks = diff.filter(c => c.type === 'added');
      const removedChunks = diff.filter(c => c.type === 'removed');
      const unchangedChunks = diff.filter(c => c.type === 'unchanged');

      expect(addedChunks.some(c => c.text.includes('medical'))).toBe(true);
      expect(addedChunks.some(c => c.text.includes('demonstrated'))).toBe(true);
      expect(addedChunks.some(c => c.text.includes('deep'))).toBe(true);
      expect(removedChunks.some(c => c.text.includes('learned'))).toBe(true);
      expect(removedChunks.some(c => c.text.includes('clinical'))).toBe(true);
      expect(unchangedChunks.some(c => c.text.includes('I cared for Mr. K in the'))).toBe(true);
    });
  });
});
