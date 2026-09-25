import { describe, it, expect } from 'vitest';
import {
  createAnnotation,
  createCommentThread,
  addReplyToThread,
  toggleThreadResolution,
  acceptSuggestion,
  rejectSuggestion,
  segmentDocumentText,
  DocumentAnnotation,
} from '../../src/domain/annotation-models';

describe('Ticket 16: Advisor Live Document Editing & Annotations', () => {
  const sampleDocText =
    'My journey in internal medicine began during a complex inpatient rotation where diagnostic ambiguity challenged the clinical team.';

  it('creates an inline highlight annotation with role attribution', () => {
    const start = sampleDocText.indexOf('diagnostic ambiguity');
    const end = start + 'diagnostic ambiguity'.length;

    const ann = createAnnotation({
      documentId: 'ps-v1',
      authorId: 'adv-01',
      authorName: 'Dr. Sarah Lin',
      authorRole: 'advisor',
      startOffset: start,
      endOffset: end,
      anchorText: 'diagnostic ambiguity',
      type: 'highlight',
      color: 'yellow',
    });

    expect(ann.id).toBeDefined();
    expect(ann.authorRole).toBe('advisor');
    expect(ann.authorName).toBe('Dr. Sarah Lin');
    expect(ann.anchorText).toBe('diagnostic ambiguity');
    expect(ann.type).toBe('highlight');
    expect(ann.status).toBe('active');
  });

  it('validates character offset boundaries', () => {
    expect(() =>
      createAnnotation({
        documentId: 'ps-v1',
        authorId: 'adv-01',
        authorName: 'Dr. Sarah Lin',
        authorRole: 'advisor',
        startOffset: 10,
        endOffset: 5,
        anchorText: 'invalid',
      })
    ).toThrow('Invalid character offset range');
  });

  it('creates an anchored comment thread linked to text range', () => {
    const thread = createCommentThread({
      documentId: 'ps-v1',
      authorId: 'adv-01',
      authorName: 'Dr. Sarah Lin',
      authorRole: 'advisor',
      startOffset: 0,
      endOffset: 34,
      anchorText: 'My journey in internal medicine',
      initialMessage: 'Consider opening with a direct clinical vignette instead of a general statement.',
    });

    expect(thread.status).toBe('open');
    expect(thread.comments.length).toBe(1);
    expect(thread.comments[0].authorName).toBe('Dr. Sarah Lin');
    expect(thread.comments[0].authorRole).toBe('advisor');
  });

  it('supports back-and-forth replies between student and advisor', () => {
    let thread = createCommentThread({
      documentId: 'ps-v1',
      authorId: 'adv-01',
      authorName: 'Dr. Sarah Lin',
      authorRole: 'advisor',
      startOffset: 0,
      endOffset: 34,
      anchorText: 'My journey in internal medicine',
      initialMessage: 'Does this convey your specialty commitment immediately?',
    });

    thread = addReplyToThread(thread, {
      authorId: 'stu-01',
      authorName: 'Marcus Vance',
      authorRole: 'applicant',
      content: 'I will lead with the pulmonary embolism case in paragraph 2 instead.',
    });

    expect(thread.comments.length).toBe(2);
    expect(thread.comments[1].authorRole).toBe('applicant');
    expect(thread.comments[1].content).toContain('pulmonary embolism');
  });

  it('toggles thread resolution state', () => {
    let thread = createCommentThread({
      documentId: 'ps-v1',
      authorId: 'adv-01',
      authorName: 'Dr. Sarah Lin',
      authorRole: 'advisor',
      startOffset: 0,
      endOffset: 10,
      anchorText: 'My journey',
      initialMessage: 'Check phrasing',
    });

    expect(thread.status).toBe('open');
    thread = toggleThreadResolution(thread);
    expect(thread.status).toBe('resolved');
    thread = toggleThreadResolution(thread);
    expect(thread.status).toBe('open');
  });

  it('applies suggested deletion (strikethrough) cleanly on student acceptance', () => {
    const phrase = 'diagnostic ambiguity ';
    const start = sampleDocText.indexOf(phrase);
    const end = start + phrase.length;

    const ann = createAnnotation({
      documentId: 'ps-v1',
      authorId: 'adv-01',
      authorName: 'Dr. Sarah Lin',
      authorRole: 'advisor',
      startOffset: start,
      endOffset: end,
      anchorText: phrase,
      type: 'strikethrough',
    });

    const { updatedText, updatedAnnotation } = acceptSuggestion(sampleDocText, ann);

    expect(updatedAnnotation.status).toBe('accepted');
    expect(updatedText).not.toContain('diagnostic ambiguity ');
    expect(updatedText).toBe(
      'My journey in internal medicine began during a complex inpatient rotation where challenged the clinical team.'
    );
  });

  it('applies suggested replacement cleanly on student acceptance', () => {
    const phrase = 'inpatient rotation';
    const start = sampleDocText.indexOf(phrase);
    const end = start + phrase.length;

    const ann = createAnnotation({
      documentId: 'ps-v1',
      authorId: 'adv-01',
      authorName: 'Dr. Sarah Lin',
      authorRole: 'advisor',
      startOffset: start,
      endOffset: end,
      anchorText: phrase,
      type: 'replacement',
      suggestedText: 'MICU sub-internship',
    });

    const { updatedText, updatedAnnotation } = acceptSuggestion(sampleDocText, ann);

    expect(updatedAnnotation.status).toBe('accepted');
    expect(updatedText).toContain('complex MICU sub-internship where');
  });

  it('marks suggestion as rejected when applicant declines change', () => {
    const ann = createAnnotation({
      documentId: 'ps-v1',
      authorId: 'adv-01',
      authorName: 'Dr. Sarah Lin',
      authorRole: 'advisor',
      startOffset: 0,
      endOffset: 10,
      anchorText: 'My journey',
      type: 'strikethrough',
    });

    const rejected = rejectSuggestion(ann);
    expect(rejected.status).toBe('rejected');
  });

  it('segments text accurately into plain and annotated spans', () => {
    const text = 'Alpha Beta Gamma Delta';
    const ann1: DocumentAnnotation = {
      id: 'a1',
      documentId: 'doc1',
      authorId: 'adv',
      authorName: 'Advisor',
      authorRole: 'advisor',
      startOffset: 6,
      endOffset: 10,
      anchorText: 'Beta',
      type: 'highlight',
      color: 'yellow',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const spans = segmentDocumentText(text, [ann1]);
    expect(spans.length).toBe(3);
    expect(spans[0].text).toBe('Alpha ');
    expect(spans[0].annotation).toBeUndefined();
    expect(spans[1].text).toBe('Beta');
    expect(spans[1].annotation?.id).toBe('a1');
    expect(spans[2].text).toBe(' Gamma Delta');
  });
});
