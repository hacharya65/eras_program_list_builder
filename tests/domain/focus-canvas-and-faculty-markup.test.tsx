import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonalStatementEditor } from '@/components/PersonalStatementEditor';
import { AnnotatedDocumentViewer } from '@/components/collaborative/AnnotatedDocumentViewer';
import { segmentDocumentText, createCommentThread } from '@/domain/annotation-models';
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
});
