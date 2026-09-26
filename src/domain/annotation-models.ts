export type AnnotationColor = 'yellow' | 'green' | 'blue' | 'purple';
export type AnnotationType = 'highlight' | 'strikethrough' | 'replacement';
export type AnnotationStatus = 'active' | 'accepted' | 'rejected';
export type UserRole = 'advisor' | 'applicant';

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  documentVersionId?: string;
  document_version_id?: string;
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
  documentVersionId?: string;
  document_version_id?: string;
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
  documentVersionId?: string;
  document_version_id?: string;
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
    documentVersionId,
    document_version_id,
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

  const resolvedVersionId = documentVersionId || document_version_id;

  return {
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentId,
    documentVersionId: resolvedVersionId,
    document_version_id: resolvedVersionId,
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
  documentVersionId?: string;
  document_version_id?: string;
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
    documentVersionId,
    document_version_id,
    authorId,
    authorName,
    authorRole,
    startOffset,
    endOffset,
    anchorText,
    initialMessage,
    annotationId,
  } = params;

  const resolvedVersionId = documentVersionId || document_version_id;
  const now = new Date().toISOString();
  return {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentId,
    documentVersionId: resolvedVersionId,
    document_version_id: resolvedVersionId,
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

  // Active annotations only, sorted by startOffset then endOffset
  const activeAnnotations = annotations
    .filter((a) => a.status === 'active')
    .sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);

  if (activeAnnotations.length === 0) {
    return [{ text: fullText }];
  }

  const spans: TextSpan[] = [];
  let currentIndex = 0;

  for (const ann of activeAnnotations) {
    const start = Math.max(0, Math.min(ann.startOffset, fullText.length));
    const end = Math.max(start, Math.min(ann.endOffset, fullText.length));

    // Emit unannotated text preceding this annotation
    if (start > currentIndex) {
      spans.push({ text: fullText.slice(currentIndex, start) });
      currentIndex = start;
    }

    // Determine the non-overlapping segment for this annotation
    const segStart = Math.max(currentIndex, start);
    if (end > segStart) {
      const matchingThread = threads.find((t) => t.annotationId === ann.id);
      spans.push({
        text: fullText.slice(segStart, end),
        annotation: ann,
        thread: matchingThread,
      });
      currentIndex = end;
    }
  }

  // Trailing unannotated text
  if (currentIndex < fullText.length) {
    spans.push({ text: fullText.slice(currentIndex) });
  }

  return spans;
}

// Local storage sync helpers with strict version-scoping
const ANNOTATIONS_STORAGE_KEY = 'eras_doc_annotations';
const THREADS_STORAGE_KEY = 'eras_doc_comment_threads';

const inMemoryAnnotationsStore: Record<string, string> = {};
const inMemoryThreadsStore: Record<string, string> = {};

export function clearInMemoryAnnotationStores(): void {
  for (const k of Object.keys(inMemoryAnnotationsStore)) {
    delete inMemoryAnnotationsStore[k];
  }
  for (const k of Object.keys(inMemoryThreadsStore)) {
    delete inMemoryThreadsStore[k];
  }
}

export function getScopedStorageKey(baseKey: string, documentId: string, versionId?: string): string {
  if (!versionId) return `${baseKey}_${documentId}`;
  return `${baseKey}_${documentId}_${versionId}`;
}

export function loadStoredAnnotations(documentId: string, documentVersionId?: string): DocumentAnnotation[] {
  try {
    const scopedKey = getScopedStorageKey(ANNOTATIONS_STORAGE_KEY, documentId, documentVersionId);
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(scopedKey);
      if (!raw && documentVersionId) {
        raw = localStorage.getItem(`${ANNOTATIONS_STORAGE_KEY}_${documentId}-${documentVersionId}`) ||
              localStorage.getItem(`${ANNOTATIONS_STORAGE_KEY}_ps-${documentVersionId}`);
      } else if (!raw && !documentVersionId) {
        raw = localStorage.getItem(`${ANNOTATIONS_STORAGE_KEY}_${documentId}`);
      }
    }
    if (!raw && inMemoryAnnotationsStore[scopedKey]) {
      raw = inMemoryAnnotationsStore[scopedKey];
    }

    const items: DocumentAnnotation[] = raw ? JSON.parse(raw) : [];

    // Strict version isolation filter: ensure no historical annotations from other drafts leak through
    if (documentVersionId) {
      return items.filter((a) => {
        const itemVer = a.documentVersionId || a.document_version_id;
        return !itemVer ? documentVersionId === 'v1' : itemVer === documentVersionId;
      });
    }
    return items;
  } catch {
    return [];
  }
}

export function saveStoredAnnotations(
  documentId: string,
  annotations: DocumentAnnotation[],
  documentVersionId?: string
): void {
  try {
    const scopedKey = getScopedStorageKey(ANNOTATIONS_STORAGE_KEY, documentId, documentVersionId);
    const json = JSON.stringify(annotations);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(scopedKey, json);
    }
    inMemoryAnnotationsStore[scopedKey] = json;
  } catch (e) {
    console.error('Failed to save annotations to localStorage', e);
  }
}

export function loadStoredThreads(documentId: string, documentVersionId?: string): CommentThread[] {
  try {
    const scopedKey = getScopedStorageKey(THREADS_STORAGE_KEY, documentId, documentVersionId);
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(scopedKey);
      if (!raw && documentVersionId) {
        raw = localStorage.getItem(`${THREADS_STORAGE_KEY}_${documentId}-${documentVersionId}`) ||
              localStorage.getItem(`${THREADS_STORAGE_KEY}_ps-${documentVersionId}`);
      } else if (!raw && !documentVersionId) {
        raw = localStorage.getItem(`${THREADS_STORAGE_KEY}_${documentId}`);
      }
    }
    if (!raw && inMemoryThreadsStore[scopedKey]) {
      raw = inMemoryThreadsStore[scopedKey];
    }

    const items: CommentThread[] = raw ? JSON.parse(raw) : [];

    // Strict version isolation filter: ensure no historical threads from other drafts leak through
    if (documentVersionId) {
      return items.filter((t) => {
        const itemVer = t.documentVersionId || t.document_version_id;
        return !itemVer ? documentVersionId === 'v1' : itemVer === documentVersionId;
      });
    }
    return items;
  } catch {
    return [];
  }
}

export function saveStoredThreads(
  documentId: string,
  threads: CommentThread[],
  documentVersionId?: string
): void {
  try {
    const scopedKey = getScopedStorageKey(THREADS_STORAGE_KEY, documentId, documentVersionId);
    const json = JSON.stringify(threads);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(scopedKey, json);
    }
    inMemoryThreadsStore[scopedKey] = json;
  } catch (e) {
    console.error('Failed to save comment threads to localStorage', e);
  }
}

export interface HistoricalDraftAnnotationLog {
  versionNumber: number;
  versionId: string;
  annotations: DocumentAnnotation[];
  threads: CommentThread[];
}

export function loadHistoricalDraftAnnotations(
  documentId: string,
  currentVersionNumber: number
): HistoricalDraftAnnotationLog[] {
  if (currentVersionNumber <= 1) return [];
  const history: HistoricalDraftAnnotationLog[] = [];

  for (let v = 1; v < currentVersionNumber; v++) {
    const vId = `v${v}`;
    const ann = loadStoredAnnotations(documentId, vId);
    const thr = loadStoredThreads(documentId, vId);
    if (ann.length > 0 || thr.length > 0) {
      history.push({
        versionNumber: v,
        versionId: vId,
        annotations: ann,
        threads: thr,
      });
    }
  }

  return history;
}
