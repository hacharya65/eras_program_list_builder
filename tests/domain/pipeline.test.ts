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

  describe('Ticket 11: Dynamic Version Forking (V1 through V_n)', () => {
    it('automatically forks to next version (v2, v3, ... vn) on edit when current version is locked/submitted', () => {
      const studentId = 'usr-student-1';
      const advisorId = 'usr-advisor-1';

      // 1. Initial draft at v1
      storage.personalStatement.content = 'First version content of personal statement.';
      expect(storage.personalStatement.currentVersionNumber).toBe(1);
      expect(storage.personalStatement.stage).toBe('drafting');

      // 2. Submit v1 for review -> freezes snapshot v1
      service.submitPersonalStatementForReview({
        studentId,
        advisorId,
        changelogNote: 'Submitting V1 for initial advisor feedback',
      });
      expect(storage.personalStatement.stage).toBe('submitted');
      expect(storage.snapshots).toHaveLength(1);
      expect(storage.snapshots[0].versionNumber).toBe(1);
      expect(storage.snapshots[0].content).toBe('First version content of personal statement.');

      // 3. Student makes an edit post-submission -> must automatically fork into active V2 draft
      const v2Text = 'Second version content with clinical updates.';
      const updatedDraft = service.updatePersonalStatement(v2Text);

      expect(updatedDraft.currentVersionNumber).toBe(2);
      expect(updatedDraft.stage).toBe('drafting');
      expect(updatedDraft.content).toBe(v2Text);
      // V1 snapshot must remain completely immutable
      expect(storage.snapshots[0].content).toBe('First version content of personal statement.');
      expect(storage.snapshots[0].versionNumber).toBe(1);

      // 4. Submit v2 for review -> freezes snapshot v2
      service.submitPersonalStatementForReview({
        studentId,
        advisorId,
        changelogNote: 'Revised clinical section based on attending advice',
      });
      expect(storage.personalStatement.stage).toBe('submitted');
      expect(storage.snapshots).toHaveLength(2);
      expect(storage.snapshots[1].versionNumber).toBe(2);
      expect(storage.snapshots[1].content).toBe(v2Text);

      // 5. Student makes another edit -> must automatically fork into active V3 draft (scaling to Vn)
      const v3Text = 'Third version content ready for final dean endorsement.';
      const v3Draft = service.updatePersonalStatement(v3Text);

      expect(v3Draft.currentVersionNumber).toBe(3);
      expect(v3Draft.stage).toBe('drafting');
      expect(v3Draft.content).toBe(v3Text);
      expect(storage.snapshots).toHaveLength(2); // V1 and V2 locked
    });

    it('retrieves comprehensive version history across all snapshots and the active draft', () => {
      const studentId = 'usr-student-1';
      const advisorId = 'usr-advisor-1';

      storage.personalStatement.content = 'Version 1 body';
      service.submitPersonalStatementForReview({ studentId, advisorId, changelogNote: 'V1 init' });

      service.updatePersonalStatement('Version 2 body');
      service.submitPersonalStatementForReview({ studentId, advisorId, changelogNote: 'V2 rev' });

      service.updatePersonalStatement('Version 3 in-progress draft');

      const history = service.getPersonalStatementVersionHistory();
      expect(history.length).toBe(3);

      expect(history[0].versionNumber).toBe(1);
      expect(history[0].stage).toBe('submitted');
      expect(history[0].isCurrentActiveDraft).toBe(false);

      expect(history[1].versionNumber).toBe(2);
      expect(history[1].stage).toBe('submitted');
      expect(history[1].isCurrentActiveDraft).toBe(false);

      expect(history[2].versionNumber).toBe(3);
      expect(history[2].stage).toBe('drafting');
      expect(history[2].isCurrentActiveDraft).toBe(true);
      expect(history[2].content).toBe('Version 3 in-progress draft');
    });
  });
});

