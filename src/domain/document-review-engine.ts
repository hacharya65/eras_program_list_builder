/**
 * Deep Document Review Engine
 * 
 * Encapsulates word-level text diffs, non-overlapping span segmentation,
 * character offset math, comment thread discussions, and SLA turnaround status
 * behind a unified high-leverage review package interface.
 */

import {
  DocumentAnnotation,
  CommentThread,
  TextSpan,
  createAnnotation,
  createCommentThread,
  addReplyToThread,
  toggleThreadResolution,
  acceptSuggestion as baseAcceptSuggestion,
  rejectSuggestion as baseRejectSuggestion,
  segmentDocumentText,
  loadStoredAnnotations,
  saveStoredAnnotations,
  loadStoredThreads,
  saveStoredThreads,
  UserRole,
  AnnotationType,
  AnnotationColor,
} from './annotation-models';
import { computeTextDiff, DiffChunk } from './diff-engine';
import { calculateSlaStatus, SlaCalculationResult } from './sla-engine';
import { ReviewRequest } from './types';

export interface RevisionReviewPackage {
  documentId: string;
  versionNumber: number;
  versionId: string;
  currentContent: string;
  previousContent?: string;
  hasPreviousVersion: boolean;
  wordDiff?: DiffChunk[];
  segmentedSpans: TextSpan[];
  annotations: DocumentAnnotation[];
  threads: CommentThread[];
  slaStatus?: SlaCalculationResult;
  stats: {
    totalAnnotations: number;
    activeAnnotations: number;
    openThreads: number;
    resolvedThreads: number;
  };
}

export class DocumentReviewEngine {
  /**
   * Assembles a complete, ready-to-render review package for a document revision.
   */
  getReviewPackage(params: {
    documentId: string;
    versionNumber: number;
    currentContent: string;
    previousContent?: string;
    reviewRequest?: ReviewRequest;
    defaultSlaDays?: number;
  }): RevisionReviewPackage {
    const { documentId, versionNumber, currentContent, previousContent, reviewRequest, defaultSlaDays = 14 } = params;
    const versionId = `v${versionNumber}`;

    const annotations = loadStoredAnnotations(documentId, versionId);
    const threads = loadStoredThreads(documentId, versionId);

    // Compute word-level diff against previous revision if available
    const hasPreviousVersion = versionNumber > 1 && previousContent !== undefined;
    const wordDiff = hasPreviousVersion && previousContent !== undefined
      ? computeTextDiff(previousContent, currentContent)
      : undefined;

    // Segment document text into non-overlapping spans with attached markup
    const segmentedSpans = segmentDocumentText(currentContent, annotations, threads);

    // Calculate SLA status if review request is provided
    const slaStatus = reviewRequest
      ? calculateSlaStatus(reviewRequest, defaultSlaDays)
      : undefined;

    const activeAnnotations = annotations.filter((a) => a.status === 'active').length;
    const openThreads = threads.filter((t) => t.status === 'open').length;
    const resolvedThreads = threads.filter((t) => t.status === 'resolved').length;

    return {
      documentId,
      versionNumber,
      versionId,
      currentContent,
      previousContent,
      hasPreviousVersion,
      wordDiff,
      segmentedSpans,
      annotations,
      threads,
      slaStatus,
      stats: {
        totalAnnotations: annotations.length,
        activeAnnotations,
        openThreads,
        resolvedThreads,
      },
    };
  }

  /**
   * Adds an annotation to a specific document version and persists it.
   */
  addAnnotation(params: {
    documentId: string;
    versionNumber: number;
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
    const versionId = `v${params.versionNumber}`;
    const newAnnotation = createAnnotation({
      documentId: params.documentId,
      documentVersionId: versionId,
      authorId: params.authorId,
      authorName: params.authorName,
      authorRole: params.authorRole,
      startOffset: params.startOffset,
      endOffset: params.endOffset,
      anchorText: params.anchorText,
      type: params.type,
      suggestedText: params.suggestedText,
      color: params.color,
    });

    const current = loadStoredAnnotations(params.documentId, versionId);
    saveStoredAnnotations(params.documentId, [...current, newAnnotation], versionId);
    return newAnnotation;
  }

  /**
   * Accepts a suggestion, updating the document text and marking the annotation accepted.
   */
  acceptSuggestion(params: {
    documentId: string;
    versionNumber: number;
    currentContent: string;
    annotationId: string;
  }): { updatedContent: string; updatedAnnotation: DocumentAnnotation } {
    const versionId = `v${params.versionNumber}`;
    const current = loadStoredAnnotations(params.documentId, versionId);
    const target = current.find((a) => a.id === params.annotationId);
    if (!target) {
      throw new Error(`Annotation not found: ${params.annotationId}`);
    }

    const { updatedText, updatedAnnotation } = baseAcceptSuggestion(params.currentContent, target);
    const updatedList = current.map((a) => (a.id === target.id ? updatedAnnotation : a));
    saveStoredAnnotations(params.documentId, updatedList, versionId);

    return { updatedContent: updatedText, updatedAnnotation };
  }

  /**
   * Rejects an annotation without altering document content.
   */
  rejectSuggestion(params: {
    documentId: string;
    versionNumber: number;
    annotationId: string;
  }): DocumentAnnotation {
    const versionId = `v${params.versionNumber}`;
    const current = loadStoredAnnotations(params.documentId, versionId);
    const target = current.find((a) => a.id === params.annotationId);
    if (!target) {
      throw new Error(`Annotation not found: ${params.annotationId}`);
    }

    const updated = baseRejectSuggestion(target);
    const updatedList = current.map((a) => (a.id === target.id ? updated : a));
    saveStoredAnnotations(params.documentId, updatedList, versionId);
    return updated;
  }

  /**
   * Creates a threaded comment discussion anchored to text.
   */
  createCommentThread(params: {
    documentId: string;
    versionNumber: number;
    authorId: string;
    authorName: string;
    authorRole: UserRole;
    startOffset: number;
    endOffset: number;
    anchorText: string;
    initialMessage: string;
    annotationId?: string;
  }): CommentThread {
    const versionId = `v${params.versionNumber}`;
    const thread = createCommentThread({
      documentId: params.documentId,
      documentVersionId: versionId,
      authorId: params.authorId,
      authorName: params.authorName,
      authorRole: params.authorRole,
      startOffset: params.startOffset,
      endOffset: params.endOffset,
      anchorText: params.anchorText,
      initialMessage: params.initialMessage,
      annotationId: params.annotationId,
    });

    const current = loadStoredThreads(params.documentId, versionId);
    saveStoredThreads(params.documentId, [...current, thread], versionId);
    return thread;
  }

  /**
   * Adds a reply to an existing comment thread.
   */
  addThreadReply(params: {
    documentId: string;
    versionNumber: number;
    threadId: string;
    authorId: string;
    authorName: string;
    authorRole: UserRole;
    content: string;
  }): CommentThread {
    const versionId = `v${params.versionNumber}`;
    const current = loadStoredThreads(params.documentId, versionId);
    const target = current.find((t) => t.id === params.threadId);
    if (!target) {
      throw new Error(`Thread not found: ${params.threadId}`);
    }

    const updated = addReplyToThread(target, {
      authorId: params.authorId,
      authorName: params.authorName,
      authorRole: params.authorRole,
      content: params.content,
    });

    const updatedList = current.map((t) => (t.id === target.id ? updated : t));
    saveStoredThreads(params.documentId, updatedList, versionId);
    return updated;
  }

  /**
   * Toggles thread resolution status between open and resolved.
   */
  toggleThreadResolution(params: {
    documentId: string;
    versionNumber: number;
    threadId: string;
  }): CommentThread {
    const versionId = `v${params.versionNumber}`;
    const current = loadStoredThreads(params.documentId, versionId);
    const target = current.find((t) => t.id === params.threadId);
    if (!target) {
      throw new Error(`Thread not found: ${params.threadId}`);
    }

    const updated = toggleThreadResolution(target);
    const updatedList = current.map((t) => (t.id === target.id ? updated : t));
    saveStoredThreads(params.documentId, updatedList, versionId);
    return updated;
  }

  /**
   * Resets version annotations and threads (e.g. when submitting a fresh draft).
   */
  clearVersionState(documentId: string, versionNumber: number): void {
    const versionId = `v${versionNumber}`;
    saveStoredAnnotations(documentId, [], versionId);
    saveStoredThreads(documentId, [], versionId);
  }
}

export const documentReviewEngine = new DocumentReviewEngine();
