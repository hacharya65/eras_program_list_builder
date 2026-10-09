import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentReviewEngine } from '@/domain/document-review-engine';
import { ReviewRequest } from '@/domain/types';

describe('Deep Document Review Engine', () => {
  let engine: DocumentReviewEngine;
  const docId = 'test-ps-doc';

  beforeEach(() => {
    engine = new DocumentReviewEngine();
    engine.clearVersionState(docId, 1);
    engine.clearVersionState(docId, 2);
  });

  it('assembles a unified review package with diffs, segmented spans, and SLA metrics', () => {
    const v1Content = 'My passion for internal medicine started early.';
    const v2Content = 'My deep passion for internal medicine and critical care started early.';

    // Create a mock review request
    const reviewRequest: ReviewRequest = {
      id: 'rev-101',
      snapshotId: 'snap-101',
      studentId: 'student-1',
      studentName: 'Alex Rivera',
      advisorId: 'advisor-1',
      documentType: 'personal_statement',
      stage: 'in_review',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      slaDueAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Add an annotation to V2
    engine.addAnnotation({
      documentId: docId,
      versionNumber: 2,
      authorId: 'advisor-1',
      authorName: 'Dr. Marcus Chen',
      authorRole: 'advisor',
      startOffset: 8,
      endOffset: 15,
      anchorText: 'passion',
      type: 'highlight',
      color: 'yellow',
    });

    const pkg = engine.getReviewPackage({
      documentId: docId,
      versionNumber: 2,
      currentContent: v2Content,
      previousContent: v1Content,
      reviewRequest,
      defaultSlaDays: 14,
    });

    expect(pkg.documentId).toBe(docId);
    expect(pkg.versionNumber).toBe(2);
    expect(pkg.hasPreviousVersion).toBe(true);

    // Verify word diff computed
    expect(pkg.wordDiff).toBeDefined();
    expect(pkg.wordDiff!.some((c) => c.type === 'added' && c.text.includes('critical care'))).toBe(true);

    // Verify text spans segmented
    expect(pkg.segmentedSpans.length).toBeGreaterThan(1);
    expect(pkg.segmentedSpans.some((s) => s.annotation && s.annotation.anchorText === 'passion')).toBe(true);

    // Verify SLA status
    expect(pkg.slaStatus).toBeDefined();
    expect(pkg.slaStatus!.daysElapsed).toBe(2);
    expect(pkg.slaStatus!.daysRemaining).toBe(12);
    expect(pkg.slaStatus!.status).toBe('on_track');

    // Verify stats
    expect(pkg.stats.totalAnnotations).toBe(1);
    expect(pkg.stats.activeAnnotations).toBe(1);
  });

  it('handles suggestion lifecycle atomically: addition, acceptance, and content updating', () => {
    const initialText = 'I treated five patients today.';

    // Suggest replacing "five" with "six"
    const ann = engine.addAnnotation({
      documentId: docId,
      versionNumber: 1,
      authorId: 'adv-1',
      authorName: 'Dr. Chen',
      authorRole: 'advisor',
      startOffset: 10,
      endOffset: 14,
      anchorText: 'five',
      type: 'replacement',
      suggestedText: 'six',
      color: 'green',
    });

    expect(ann.status).toBe('active');

    // Accept suggestion
    const result = engine.acceptSuggestion({
      documentId: docId,
      versionNumber: 1,
      currentContent: initialText,
      annotationId: ann.id,
    });

    expect(result.updatedContent).toBe('I treated six patients today.');
    expect(result.updatedAnnotation.status).toBe('accepted');

    // Verify refreshed review package reflects updated state
    const pkg = engine.getReviewPackage({
      documentId: docId,
      versionNumber: 1,
      currentContent: result.updatedContent,
    });

    expect(pkg.stats.totalAnnotations).toBe(1);
    expect(pkg.stats.activeAnnotations).toBe(0); // Since it was accepted
  });

  it('manages comment thread discussions and toggles resolution', () => {
    const thread = engine.createCommentThread({
      documentId: docId,
      versionNumber: 1,
      authorId: 'adv-1',
      authorName: 'Dr. Chen',
      authorRole: 'advisor',
      startOffset: 0,
      endOffset: 9,
      anchorText: 'I treated',
      initialMessage: 'Can you specify the clinical setting here?',
    });

    expect(thread.status).toBe('open');
    expect(thread.comments).toHaveLength(1);

    // Add reply
    const replied = engine.addThreadReply({
      documentId: docId,
      versionNumber: 1,
      threadId: thread.id,
      authorId: 'stu-1',
      authorName: 'Alex Rivera',
      authorRole: 'applicant',
      content: 'Yes, this was in the Geisinger MICU.',
    });

    expect(replied.comments).toHaveLength(2);

    // Resolve thread
    const resolved = engine.toggleThreadResolution({
      documentId: docId,
      versionNumber: 1,
      threadId: thread.id,
    });

    expect(resolved.status).toBe('resolved');
  });
});
