import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonalStatementEditor } from '@/components/PersonalStatementEditor';
import {
  AnnotatedDocumentViewer,
  scrollToElementWithinContainer,
} from '@/components/collaborative/AnnotatedDocumentViewer';
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

  it('verifies PersonalStatementEditor contains Focus Canvas, Faculty Markup, and Split View buttons', () => {
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

    // Verify Split View button exists
    expect(markup).toContain('Split View (Side-by-Side Revision)');
    expect(markup).toContain('view-mode-split-btn');
  });

  it('renders side-by-side revision in Split View with previous snapshot on left and live editor on right', () => {
    const v2Draft: PersonalStatementDraft = {
      ...mockDraft,
      currentVersionNumber: 2,
      content: 'Refined draft iterating from faculty feedback with deeper clinical insights.',
    };

    const mockV1Snapshot = {
      id: 'snap-ps-v1',
      documentType: 'personal_statement' as const,
      documentId: 'ps-1',
      versionNumber: 1,
      content: 'Initial v1 draft with broad medical interest.',
      changelogNote: 'Initial draft',
      submittedAt: '2026-09-01T12:00:00Z',
    };

    const markup = renderToStaticMarkup(
      <PersonalStatementEditor
        draft={v2Draft}
        assignedAdvisor={mockAdvisor}
        snapshots={[mockV1Snapshot]}
        initialViewMode="split"
        onSave={() => {}}
        onSubmitForReview={() => {}}
        onBack={() => {}}
      />
    );

    // Left pane: Previous version with faculty feedback
    expect(markup).toContain('v1 (Reviewed Snapshot)');
    expect(markup).toContain('Read-Only Reference');
    expect(markup).toContain('Initial v1 draft with broad medical interest.');

    // Right pane: Live active revision editor
    expect(markup).toContain('v2 (Active Working Draft)');
    expect(markup).toContain('Live Revision');
    expect(markup).toContain('Iterating from v1 Submitted Draft');
    expect(markup).toContain('Refined draft iterating from faculty feedback with deeper clinical insights.');
    expect(markup).toContain('Submit v2 for Review');
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

  describe('Independent Split View Scrolling and Localized Anchor Focusing', () => {
    it('Split View renders the left pane as an independent scroll container matching the right pane', () => {
      const v2Draft: PersonalStatementDraft = {
        ...mockDraft,
        currentVersionNumber: 2,
        content: 'Working on revision based on Dr. Chen notes.',
      };

      const mockV1Snapshot = {
        id: 'snap-ps-v1',
        documentType: 'personal_statement' as const,
        documentId: 'ps-1',
        versionNumber: 1,
        content: 'Version 1 text snapshot.',
        changelogNote: 'First draft',
        submittedAt: '2026-09-01T12:00:00Z',
      };

      const markup = renderToStaticMarkup(
        <PersonalStatementEditor
          draft={v2Draft}
          assignedAdvisor={mockAdvisor}
          snapshots={[mockV1Snapshot]}
          initialViewMode="split"
          onSave={() => {}}
          onSubmitForReview={() => {}}
          onBack={() => {}}
        />
      );

      // Verify the left pane has independent scroll container id and classes
      expect(markup).toContain('id="split-left-pane-scroll"');
      expect(markup).toContain('overflow-y-auto max-h-[680px]');

      // Verify the right pane textarea has independent scrolling capability
      expect(markup).toContain('overflow-y-auto');
    });

    it('scrollToElementWithinContainer scrolls nearest scrollable parent container instead of calling window scrollIntoView', () => {
      const origWindow = globalThis.window;
      const scrollSpy = vi.fn();
      const scrollIntoViewSpy = vi.fn();

      const mockParent = {
        parentElement: null,
        scrollHeight: 1000,
        clientHeight: 400,
        scrollTop: 50,
        scrollTo: scrollSpy,
        getBoundingClientRect: () => ({ top: 100, height: 400, bottom: 500, left: 0, right: 400 }),
      };

      const mockTarget = {
        parentElement: mockParent,
        scrollIntoView: scrollIntoViewSpy,
        getBoundingClientRect: () => ({ top: 250, height: 20, bottom: 270, left: 0, right: 400 }),
      };

      (globalThis as any).window = {
        getComputedStyle: (el: any) => {
          if (el === mockParent) return { overflowY: 'auto' };
          return { overflowY: 'visible' };
        },
      };

      try {
        scrollToElementWithinContainer(mockTarget as unknown as HTMLElement);

        // Container scrollTo should have been called smoothly
        expect(scrollSpy).toHaveBeenCalledTimes(1);
        expect(scrollSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            behavior: 'smooth',
          })
        );

        // Crucially, targetElement.scrollIntoView (which jumps outer browser window) must NOT be called
        expect(scrollIntoViewSpy).not.toHaveBeenCalled();
      } finally {
        globalThis.window = origWindow;
      }
    });

    it('scrollToElementWithinContainer falls back to scrollIntoView when no scrollable parent container exists', () => {
      const origWindow = globalThis.window;
      const scrollIntoViewSpy = vi.fn();

      const mockTarget = {
        parentElement: null,
        scrollIntoView: scrollIntoViewSpy,
        getBoundingClientRect: () => ({ top: 250, height: 20, bottom: 270, left: 0, right: 400 }),
      };

      (globalThis as any).window = {
        getComputedStyle: () => ({ overflowY: 'visible' }),
      };

      try {
        scrollToElementWithinContainer(mockTarget as unknown as HTMLElement, true);

        expect(scrollIntoViewSpy).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
        });
      } finally {
        globalThis.window = origWindow;
      }
    });
  });
});
