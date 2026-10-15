import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonalStatementEditor } from '@/components/PersonalStatementEditor';
import { AnnotatedDocumentViewer } from '@/components/collaborative/AnnotatedDocumentViewer';
import {
  segmentDocumentText,
  createCommentThread,
  findClosestOccurrence,
  isThreadAnnotationMatch,
} from '@/domain/annotation-models';
import { PersonalStatementDraft, UserProfile } from '@/domain/types';

describe('Simplified Focus Canvas and Faculty Markup with Resilient Highlighting', () => {
  const mockDraft: PersonalStatementDraft = {
    id: 'ps-1',
    studentId: 'student-alex-rivera',
    specialty: 'Internal Medicine',
    currentVersionNumber: 1,
    content: 'My commitment to internal medicine grew during my clinical rotations at Geisinger.',
    stage: 'drafting',
    updatedAt: '2026-09-01T12:00:00Z',
  };

  const mockAdvisor: UserProfile = {
    id: 'adv-marcus-chen',
    name: 'Dr. Marcus Chen',
    email: 'mchen@som.edu',
    role: 'advisor',
    specialty: 'Internal Medicine',
    institutionId: 'geisinger',
  };

  it('verifies PersonalStatementEditor contains only Focus Canvas and Faculty Markup buttons, with NO split view button', () => {
    const markup = renderToStaticMarkup(
      <PersonalStatementEditor
        draft={mockDraft}
        assignedAdvisor={mockAdvisor}
        onSave={() => {}}
        onSubmitForReview={() => {}}
        onBack={() => {}}
      />
    );

    // Verify Focus Canvas button exists
    expect(markup).toContain('Focus Canvas');
    expect(markup).toContain('view-mode-editor-btn');

    // Verify Faculty Markup button exists
    expect(markup).toContain('Faculty Markup &amp; Anchored Comments');
    expect(markup).toContain('view-mode-annotations-btn');

    // Verify Split View is completely removed
    expect(markup).not.toContain('Split View (Feedback + Draft)');
    expect(markup).not.toContain('view-mode-split-btn');
  });

  it('resiliently segments document text and creates highlighted spans for comment threads with anchorText', () => {
    const fullText =
      'My commitment to internal medicine grew during my clinical rotations at Geisinger. The diagnostic complexity was profound.';
    const thread = createCommentThread({
      documentId: 'ps-1',
      documentVersionId: 'v1',
      authorId: 'adv-01',
      authorName: 'Dr. Marcus Chen',
      authorRole: 'advisor',
      startOffset: 0,
      endOffset: 0, // Zero offset tests self-healing from anchorText
      anchorText: 'clinical rotations at Geisinger',
      initialMessage: 'Elaborate more on patient cases here.',
    });

    const spans = segmentDocumentText(fullText, [], [thread]);

    // Should have 3 spans: prefix, highlighted anchorText, and suffix
    expect(spans.length).toBe(3);
    const highlightedSpan = spans.find((s) => s.annotation?.anchorText === 'clinical rotations at Geisinger');
    expect(highlightedSpan).toBeDefined();
    expect(highlightedSpan?.text).toBe('clinical rotations at Geisinger');
    expect(highlightedSpan?.thread?.id).toBe(thread.id);
  });

  it('renders AnnotatedDocumentViewer with visible amber highlight markup and interactive comment cards', () => {
    const sampleText = 'Specialty dedication in inpatient medicine.';
    const markup = renderToStaticMarkup(
      <AnnotatedDocumentViewer
        documentId="personal_statement"
        documentVersionId="v1"
        versionNumber={1}
        documentTitle="Personal Statement v1"
        text={sampleText}
        userRole="applicant"
        currentUserId="stu-101"
        currentUserName="Applicant"
      />
    );

    expect(markup).toContain('Applicant View');
    expect(markup).toContain('Active Annotations');
    expect(markup).toContain('Specialty dedication in inpatient medicine.');
  });

  it('does NOT prompt for Student Revision Changelog on submission of the first draft (v1)', () => {
    const markup = renderToStaticMarkup(
      <PersonalStatementEditor
        draft={mockDraft} // currentVersionNumber: 1
        assignedAdvisor={mockAdvisor}
        initialShowSubmitModal={true}
        onSave={() => {}}
        onSubmitForReview={() => {}}
        onBack={() => {}}
      />
    );

    // Initial draft modal header
    expect(markup).toContain('Submit Initial Draft (v1) to Advisor');
    expect(markup).toContain('Confirm Submission &amp; Freeze v1');

    // "Student Revision Changelog (Required)" must NOT be prompted for first draft
    expect(markup).not.toContain('Student Revision Changelog (Required)');
    expect(markup).not.toContain('Briefly summarize what was revised');

    // The submit button must NOT have disabled attribute
    const confirmButtonHtml = markup.match(/<button[^>]*>Confirm Submission &amp; Freeze v1<\/button>/)?.[0];
    expect(confirmButtonHtml).toBeDefined();
    expect(confirmButtonHtml).not.toContain('disabled=""');

    // Also verify no changelog textarea exists
    expect(markup).not.toContain('placeholder="Briefly summarize what was revised');
  });

  it('DOES prompt for Student Revision Changelog (Required) on submission of future drafts (v2+)', () => {
    const revisionDraft: PersonalStatementDraft = {
      ...mockDraft,
      currentVersionNumber: 2,
    };

    const markup = renderToStaticMarkup(
      <PersonalStatementEditor
        draft={revisionDraft} // currentVersionNumber: 2
        assignedAdvisor={mockAdvisor}
        initialShowSubmitModal={true}
        onSave={() => {}}
        onSubmitForReview={() => {}}
        onBack={() => {}}
      />
    );

    // Revision draft modal header
    expect(markup).toContain('Submit Revision (v2) to Advisor');
    expect(markup).toContain('Confirm Revision &amp; Freeze v2');

    // "Student Revision Changelog (Required)" MUST be prompted for revisions
    expect(markup).toContain('Student Revision Changelog (Required)');
    expect(markup).toContain('Briefly summarize what was revised');

    // The submit button must be disabled until changelog is entered
    const confirmButtonHtml = markup.match(/<button[^>]*>Confirm Revision &amp; Freeze v2<\/button>/)?.[0];
    expect(confirmButtonHtml).toBeDefined();
    expect(confirmButtonHtml).toContain('disabled=""');
  });

  describe('Precise Character Offset Anchoring and Punctuation Disambiguation', () => {
    it('findClosestOccurrence resolves the last period of a multi-paragraph text instead of jumping to the first paragraph', () => {
      const fullText =
        'Paragraph 1: My passion for internal medicine started here. Paragraph 2: Clinical rotations deepened this interest. Paragraph 3: The diagnostic complexity solidified my ultimate career goals.';
      // Multiple periods exist at:
      // index 59 (end of para 1)
      // index 116 (end of para 2)
      const expectedLastPeriodIdx = fullText.lastIndexOf('.');
      const expectedFirstPeriodIdx = fullText.indexOf('.');
      expect(fullText[expectedLastPeriodIdx]).toBe('.');
      expect(fullText[expectedFirstPeriodIdx]).toBe('.');

      // When targeting near the end of the document:
      const resolvedOffset = findClosestOccurrence(fullText, '.', fullText.length - 1);
      expect(resolvedOffset).toBe(expectedLastPeriodIdx);
      expect(resolvedOffset).not.toBe(expectedFirstPeriodIdx); // Must NOT attach to the first period in paragraph 1!

      // When targeting paragraph 1:
      const firstPeriodOffset = findClosestOccurrence(fullText, '.', expectedFirstPeriodIdx - 5);
      expect(firstPeriodOffset).toBe(expectedFirstPeriodIdx);
    });

    it('isThreadAnnotationMatch correctly distinguishes identical anchorText at different offsets', () => {
      const annFirstPeriod = {
        id: 'ann-1',
        anchorText: '.',
        startOffset: 59,
        endOffset: 60,
      };

      const annLastPeriod = {
        id: 'ann-2',
        anchorText: '.',
        startOffset: 193,
        endOffset: 194,
      };

      const threadForLastPeriod = {
        id: 'thr-last',
        annotationId: 'ann-2',
        anchorText: '.',
        startOffset: 193,
        endOffset: 194,
      };

      // Direct ID match
      expect(isThreadAnnotationMatch(threadForLastPeriod, annLastPeriod)).toBe(true);
      expect(isThreadAnnotationMatch(threadForLastPeriod, annFirstPeriod)).toBe(false);

      // Fallback matching without annotationId should also respect offset proximity
      const syntheticThreadLast = {
        id: 'thr-syn',
        anchorText: '.',
        startOffset: 193,
        endOffset: 194,
      };
      expect(isThreadAnnotationMatch(syntheticThreadLast, annLastPeriod)).toBe(true);
      expect(isThreadAnnotationMatch(syntheticThreadLast, annFirstPeriod)).toBe(false);
    });

    it('segmentDocumentText correctly highlights the very last period when a comment is attached to it', () => {
      const fullText =
        'First paragraph encounter. Second paragraph reflection. Concluding aspiration for residency.';
      const lastPeriodIdx = fullText.lastIndexOf('.');
      expect(lastPeriodIdx).toBe(fullText.length - 1);

      const thread = createCommentThread({
        documentId: 'ps-1',
        documentVersionId: 'v1',
        authorId: 'adv-01',
        authorName: 'Dr. Marcus Chen',
        authorRole: 'advisor',
        startOffset: lastPeriodIdx,
        endOffset: lastPeriodIdx + 1,
        anchorText: '.',
        initialMessage: 'Consider ending with a forward-looking leadership sentence.',
      });

      const spans = segmentDocumentText(fullText, [], [thread]);

      // Verify the last span is the highlighted period with the attached thread
      const lastSpan = spans[spans.length - 1];
      expect(lastSpan.text).toBe('.');
      expect(lastSpan.annotation).toBeDefined();
      expect(lastSpan.thread?.id).toBe(thread.id);
      expect(lastSpan.thread?.comments[0]?.content).toBe('Consider ending with a forward-looking leadership sentence.');

      // Verify the first period in paragraph 1 is NOT highlighted
      const firstPeriodSpan = spans.find((s) => s.text.includes('First paragraph encounter.'));
      expect(firstPeriodSpan).toBeDefined();
      expect(firstPeriodSpan?.annotation).toBeUndefined();
    });
  });
});
