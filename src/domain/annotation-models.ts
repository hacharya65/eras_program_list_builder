export type AnnotationColor = 'yellow' | 'green' | 'blue' | 'purple';
export type AnnotationType = 'highlight' | 'strikethrough' | 'replacement';
export type AnnotationStatus = 'active' | 'accepted' | 'rejected';
export type UserRole = 'advisor' | 'applicant';

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  studentId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  type: AnnotationType;
  suggestedText?: string;
  color: AnnotationColor;
  status: AnnotationStatus;
  createdAt: string;
}

export interface CommentMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  documentId: string;
  annotationId?: string;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  status: 'open' | 'resolved';
  comments: CommentMessage[];
  createdAt: string;
  updatedAt: string;
}

export function createAnnotation(params: {
  documentId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  type?: AnnotationType;
  suggestedText?: string;
  color?: AnnotationColor;
}): DocumentAnnotation {
  const {
    documentId,
    authorId,
    authorName,
    authorRole,
    startOffset,
    endOffset,
    anchorText,
    type = 'highlight',
    suggestedText,
    color = 'yellow',
  } = params;

  if (startOffset < 0 || endOffset <= startOffset) {
    throw new Error('Invalid character offset range');
  }

  return {
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentId,
    authorId,
    authorName,
    authorRole,
    startOffset,
    endOffset,
    anchorText,
    type,
    suggestedText,
    color,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

export function createCommentThread(params: {
  documentId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  initialMessage: string;
  annotationId?: string;
}): CommentThread {
  const {
    documentId,
    authorId,
    authorName,
    authorRole,
    startOffset,
    endOffset,
    anchorText,
    initialMessage,
    annotationId,
  } = params;

  const now = new Date().toISOString();
  return {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentId,
    annotationId,
    startOffset,
    endOffset,
    anchorText,
    status: 'open',
    comments: [
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authorId,
        authorName,
        authorRole,
        content: initialMessage,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function addReplyToThread(
  thread: CommentThread,
  reply: {
    authorId: string;
    authorName: string;
    authorRole: UserRole;
    content: string;
  }
): CommentThread {
  if (!reply.content.trim()) return thread;
  const now = new Date().toISOString();
  return {
    ...thread,
    updatedAt: now,
    comments: [
      ...thread.comments,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authorId: reply.authorId,
        authorName: reply.authorName,
        authorRole: reply.authorRole,
        content: reply.content.trim(),
        createdAt: now,
      },
    ],
  };
}

export function toggleThreadResolution(thread: CommentThread): CommentThread {
  const nextStatus = thread.status === 'open' ? 'resolved' : 'open';
  return {
    ...thread,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
}

export function acceptSuggestion(
  currentText: string,
  annotation: DocumentAnnotation
): { updatedText: string; updatedAnnotation: DocumentAnnotation } {
  if (annotation.status !== 'active') {
    return { updatedText: currentText, updatedAnnotation: annotation };
  }

  const replacement =
    annotation.type === 'strikethrough'
      ? ''
      : annotation.suggestedText !== undefined
      ? annotation.suggestedText
      : annotation.anchorText;

  const prefix = currentText.slice(0, annotation.startOffset);
  const suffix = currentText.slice(annotation.endOffset);
  const updatedText = prefix + replacement + suffix;

  return {
    updatedText,
    updatedAnnotation: {
      ...annotation,
      status: 'accepted',
    },
  };
}

export function rejectSuggestion(
  annotation: DocumentAnnotation
): DocumentAnnotation {
  return {
    ...annotation,
    status: 'rejected',
  };
}

export interface TextSpan {
  text: string;
  annotation?: DocumentAnnotation;
  thread?: CommentThread;
}

export function segmentDocumentText(
  fullText: string,
  annotations: DocumentAnnotation[],
  threads: CommentThread[] = []
): TextSpan[] {
  if (!fullText) return [];

  // Active annotations only
  const activeAnnotations = annotations
    .filter((a) => a.status === 'active')
    .sort((a, b) => a.startOffset - b.startOffset);

  if (activeAnnotations.length === 0) {
    return [{ text: fullText }];
  }

  const spans: TextSpan[] = [];
  let currentIndex = 0;

  for (const ann of activeAnnotations) {
    const start = Math.max(0, Math.min(ann.startOffset, fullText.length));
    const end = Math.max(start, Math.min(ann.endOffset, fullText.length));

    if (start > currentIndex) {
      spans.push({ text: fullText.slice(currentIndex, start) });
    }

    if (end > start) {
      const matchingThread = threads.find((t) => t.annotationId === ann.id);
      spans.push({
        text: fullText.slice(start, end),
        annotation: ann,
        thread: matchingThread,
      });
      currentIndex = end;
    }
  }

  if (currentIndex < fullText.length) {
    spans.push({ text: fullText.slice(currentIndex) });
  }

  return spans;
}

// Local storage sync helpers
const ANNOTATIONS_STORAGE_KEY = 'eras_doc_annotations';
const THREADS_STORAGE_KEY = 'eras_doc_comment_threads';

export function loadStoredAnnotations(documentId: string): DocumentAnnotation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${ANNOTATIONS_STORAGE_KEY}_${documentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredAnnotations(documentId: string, annotations: DocumentAnnotation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${ANNOTATIONS_STORAGE_KEY}_${documentId}`, JSON.stringify(annotations));
  } catch (e) {
    console.error('Failed to save annotations to localStorage', e);
  }
}

export function loadStoredThreads(documentId: string): CommentThread[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${THREADS_STORAGE_KEY}_${documentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredThreads(documentId: string, threads: CommentThread[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${THREADS_STORAGE_KEY}_${documentId}`, JSON.stringify(threads));
  } catch (e) {
    console.error('Failed to save comment threads to localStorage', e);
  }
}
