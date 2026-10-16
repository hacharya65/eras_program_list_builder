'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Highlighter,
  CheckCircle2,
  Trash2,
  Send,
  CornerDownRight,
  Shield,
  User,
  Check,
  X,
  PlusCircle,
  Filter,
  History,
  Eye,
  BookOpen,
} from 'lucide-react';
import {
  DocumentAnnotation,
  CommentThread,
  UserRole,
  AnnotationColor,
  createAnnotation,
  createCommentThread,
  addReplyToThread,
  toggleThreadResolution,
  acceptSuggestion,
  rejectSuggestion,
  segmentDocumentText,
  loadStoredAnnotations,
  saveStoredAnnotations,
  loadStoredThreads,
  saveStoredThreads,
  loadHistoricalDraftAnnotations,
  HistoricalDraftAnnotationLog,
  findClosestOccurrence,
  isThreadAnnotationMatch,
} from '../../domain/annotation-models';

interface AnnotatedDocumentViewerProps {
  documentId: string;
  documentVersionId?: string;
  versionNumber?: number;
  documentTitle: string;
  documentSubtitle?: string;
  text: string;
  userRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  onTextUpdate?: (newText: string) => void;
  readOnly?: boolean;
}

export function getSelectionCharacterOffsets(
  container: HTMLElement,
  docFullText: string
): { start: number; end: number; text: string; clientX: number; clientY: number } | null {
  if (typeof window === 'undefined') return null;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }

  const selectedStr = selection.toString();
  if (!selectedStr || !selectedStr.trim()) {
    return null;
  }

  let startOffset = -1;
  let endOffset = -1;
  let currentOffset = 0;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node) {
        const el = node.parentElement;
        if (el && el.closest('[data-ignore-selection="true"]')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let currentNode = walker.nextNode();
  while (currentNode) {
    const textLen = currentNode.nodeValue?.length || 0;

    // Check startContainer
    if (currentNode === range.startContainer) {
      startOffset = currentOffset + range.startOffset;
    } else if (
      range.startContainer.nodeType === Node.ELEMENT_NODE &&
      currentNode.parentNode === range.startContainer
    ) {
      const childIndex = Array.prototype.indexOf.call(range.startContainer.childNodes, currentNode);
      if (childIndex === range.startOffset && startOffset === -1) {
        startOffset = currentOffset;
      }
    }

    // Check endContainer
    if (currentNode === range.endContainer) {
      endOffset = currentOffset + range.endOffset;
    } else if (
      range.endContainer.nodeType === Node.ELEMENT_NODE &&
      currentNode.parentNode === range.endContainer
    ) {
      const childIndex = Array.prototype.indexOf.call(range.endContainer.childNodes, currentNode);
      if (childIndex === range.endOffset && endOffset === -1) {
        endOffset = currentOffset;
      }
    }

    currentOffset += textLen;
    currentNode = walker.nextNode();
  }

  if (startOffset === -1 && range.startContainer === container && range.startOffset === 0) {
    startOffset = 0;
  }
  if (endOffset === -1 && range.endContainer === container && range.endOffset >= container.childNodes.length) {
    endOffset = currentOffset;
  }

  if (startOffset !== -1 && (endOffset === -1 || endOffset < startOffset)) {
    endOffset = startOffset + selectedStr.length;
  }

  let finalStart = startOffset;
  let finalEnd = endOffset;

  if (finalStart === -1) {
    finalStart = findClosestOccurrence(docFullText, selectedStr, 0);
    finalEnd = finalStart + selectedStr.length;
  } else {
    // Verify against docFullText and heal if needed
    const slice = docFullText.slice(finalStart, finalEnd);
    if (slice !== selectedStr) {
      const closest = findClosestOccurrence(docFullText, selectedStr, finalStart);
      if (closest !== -1) {
        finalStart = closest;
        finalEnd = closest + selectedStr.length;
      }
    }
  }

  if (finalStart < 0 || finalEnd <= finalStart) {
    return null;
  }

  const rect = range.getBoundingClientRect();
  return {
    start: finalStart,
    end: finalEnd,
    text: docFullText.slice(finalStart, finalEnd),
    clientX: rect.left + rect.width / 2,
    clientY: rect.top - 10,
  };
}

/**
 * Helper to smoothly scroll to a target element within its nearest scrollable container
 * (such as the independent Split View left pane) without scrolling the outer browser window.
 */
export function scrollToElementWithinContainer(
  targetElement: HTMLElement | null,
  fallbackToWindow = true
): void {
  if (!targetElement) return;

  let parent = targetElement.parentElement;
  let scrollContainer: HTMLElement | null = null;

  const docBody = typeof document !== 'undefined' ? document.body : null;
  const docElement = typeof document !== 'undefined' ? document.documentElement : null;

  while (parent) {
    if ((docBody && parent === docBody) || (docElement && parent === docElement)) {
      break;
    }
    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const style = window.getComputedStyle(parent);
      const overflowY = style ? style.overflowY : '';
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      ) {
        scrollContainer = parent;
        break;
      }
    }
    parent = parent.parentElement;
  }

  // Fallback: In headless/test environments or fixed-height wrappers, also check overflowY directly
  if (!scrollContainer) {
    let p = targetElement.parentElement;
    while (p) {
      if ((docBody && p === docBody) || (docElement && p === docElement)) break;
      if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
        const style = window.getComputedStyle(p);
        if (style && (style.overflowY === 'auto' || style.overflowY === 'scroll')) {
          scrollContainer = p;
          break;
        }
      }
      p = p.parentElement;
    }
  }

  if (scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const relativeTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
    const targetScrollTop = Math.max(
      0,
      relativeTop - scrollContainer.clientHeight / 2 + targetRect.height / 2
    );

    if (typeof scrollContainer.scrollTo === 'function') {
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    } else {
      scrollContainer.scrollTop = targetScrollTop;
    }
  } else if (fallbackToWindow && typeof targetElement.scrollIntoView === 'function') {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}

export const AnnotatedDocumentViewer: React.FC<AnnotatedDocumentViewerProps> = ({
  documentId,
  documentVersionId,
  versionNumber,
  documentTitle,
  documentSubtitle,
  text,
  userRole,
  currentUserId,
  currentUserName,
  onTextUpdate,
  readOnly = false,
}) => {
  // Derive effective version ID (e.g. 'v1', 'v2') and base document ID
  const effectiveVersionId =
    documentVersionId ||
    (versionNumber ? `v${versionNumber}` : (documentId.match(/v\d+/)?.[0] || 'v1'));
  const effectiveBaseDocId = documentId.replace(/-?v\d+$/, '') || 'personal_statement';

  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalDraftAnnotationLog[]>([]);
  const [showHistoricalLog, setShowHistoricalLog] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'open' | 'resolved'>('open');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Floating selection state
  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
    text: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  // New comment draft modal
  const [newCommentModal, setNewCommentModal] = useState<{
    start: number;
    end: number;
    anchorText: string;
    type: 'comment' | 'replacement';
  } | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [suggestedReplacementInput, setSuggestedReplacementInput] = useState('');

  const docContainerRef = useRef<HTMLDivElement>(null);
  const commentCardsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const passageSpansRef = useRef<Record<string, HTMLSpanElement | null>>({});

  // Strictly isolate annotations to this version ID and load historical draft log if version > 1
  useEffect(() => {
    const loadedAnn = loadStoredAnnotations(effectiveBaseDocId, effectiveVersionId);
    const loadedThr = loadStoredThreads(effectiveBaseDocId, effectiveVersionId);

    // Auto-purge orphaned standalone highlight annotations (from legacy highlight tool)
    const validThreadAnnIds = new Set(loadedThr.map((t) => t.annotationId).filter(Boolean));
    const cleanedAnn = loadedAnn.filter((a) => {
      if (a.type === 'highlight' && !validThreadAnnIds.has(a.id)) {
        return false;
      }
      return true;
    });

    // Reconcile threads that may not have an active annotation in the annotations list
    const reconciledAnn = [...cleanedAnn];
    for (const thr of loadedThr) {
      if (thr.anchorText) {
        const hasAnn = reconciledAnn.some((a) => isThreadAnnotationMatch(thr, a));
        if (!hasAnn) {
          const firstComment = thr.comments[0];
          reconciledAnn.push({
            id: thr.annotationId || `syn-${thr.id}`,
            documentId: effectiveBaseDocId,
            documentVersionId: effectiveVersionId,
            authorId: firstComment?.authorId || 'advisor-01',
            authorName: firstComment?.authorName || 'Faculty Advisor',
            authorRole: firstComment?.authorRole || 'advisor',
            startOffset: thr.startOffset,
            endOffset: thr.endOffset,
            anchorText: thr.anchorText,
            type: 'highlight',
            color: 'yellow',
            status: 'active',
            createdAt: thr.createdAt,
          });
        }
      }
    }

    if (cleanedAnn.length !== loadedAnn.length) {
      saveStoredAnnotations(effectiveBaseDocId, cleanedAnn, effectiveVersionId);
    }

    setAnnotations(reconciledAnn);
    setThreads(loadedThr);

    const vNum = versionNumber || (parseInt(effectiveVersionId.replace('v', ''), 10) || 1);
    if (vNum > 1) {
      const history = loadHistoricalDraftAnnotations(effectiveBaseDocId, vNum);
      setHistoricalLogs(history);
    } else {
      setHistoricalLogs([]);
    }
  }, [effectiveBaseDocId, effectiveVersionId, versionNumber]);

  // Save to local storage on change with strict version scoping
  const updateAnnotationsState = (newAnn: DocumentAnnotation[]) => {
    setAnnotations(newAnn);
    saveStoredAnnotations(effectiveBaseDocId, newAnn, effectiveVersionId);
  };

  const updateThreadsState = (newThr: CommentThread[]) => {
    setThreads(newThr);
    saveStoredThreads(effectiveBaseDocId, newThr, effectiveVersionId);
  };

  // Selection detection for Advisor using exact DOM character offset tracking
  const handleMouseUp = () => {
    if (userRole !== 'advisor' || readOnly || !docContainerRef.current) return;

    const offsetResult = getSelectionCharacterOffsets(docContainerRef.current, text);
    if (!offsetResult) {
      setSelectionRange(null);
      return;
    }

    setSelectionRange(offsetResult);
  };

  const handleAddStrikethrough = () => {
    if (!selectionRange) return;
    const newAnn = createAnnotation({
      documentId: effectiveBaseDocId,
      documentVersionId: effectiveVersionId,
      authorId: currentUserId,
      authorName: currentUserName,
      authorRole: userRole,
      startOffset: selectionRange.start,
      endOffset: selectionRange.end,
      anchorText: selectionRange.text,
      type: 'strikethrough',
    });

    const newThread = createCommentThread({
      documentId: effectiveBaseDocId,
      documentVersionId: effectiveVersionId,
      authorId: currentUserId,
      authorName: currentUserName,
      authorRole: userRole,
      startOffset: selectionRange.start,
      endOffset: selectionRange.end,
      anchorText: selectionRange.text,
      initialMessage: 'Suggested deletion to sharpen conciseness.',
      annotationId: newAnn.id,
    });

    updateAnnotationsState([...annotations, newAnn]);
    updateThreadsState([...threads, newThread]);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleOpenCommentModal = (type: 'comment' | 'replacement') => {
    if (!selectionRange) return;
    setNewCommentModal({
      start: selectionRange.start,
      end: selectionRange.end,
      anchorText: selectionRange.text,
      type,
    });
    setNewCommentContent('');
    setSuggestedReplacementInput('');
    setSelectionRange(null);
  };

  const handleCreateCommentThread = () => {
    if (!newCommentModal || !newCommentContent.trim()) return;

    let linkedAnnId: string | undefined;

    if (newCommentModal.type === 'replacement') {
      const newAnn = createAnnotation({
        documentId: effectiveBaseDocId,
        documentVersionId: effectiveVersionId,
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: userRole,
        startOffset: newCommentModal.start,
        endOffset: newCommentModal.end,
        anchorText: newCommentModal.anchorText,
        type: 'replacement',
        suggestedText: suggestedReplacementInput.trim() || undefined,
        color: 'green',
      });
      linkedAnnId = newAnn.id;
      updateAnnotationsState([...annotations, newAnn]);
    } else {
      const newAnn = createAnnotation({
        documentId: effectiveBaseDocId,
        documentVersionId: effectiveVersionId,
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: userRole,
        startOffset: newCommentModal.start,
        endOffset: newCommentModal.end,
        anchorText: newCommentModal.anchorText,
        type: 'highlight',
        color: 'blue',
      });
      linkedAnnId = newAnn.id;
      updateAnnotationsState([...annotations, newAnn]);
    }

    const newThread = createCommentThread({
      documentId: effectiveBaseDocId,
      documentVersionId: effectiveVersionId,
      authorId: currentUserId,
      authorName: currentUserName,
      authorRole: userRole,
      startOffset: newCommentModal.start,
      endOffset: newCommentModal.end,
      anchorText: newCommentModal.anchorText,
      initialMessage: newCommentContent.trim(),
      annotationId: linkedAnnId,
    });

    updateThreadsState([...threads, newThread]);
    setSelectedThreadId(newThread.id);
    setNewCommentModal(null);
    window.getSelection()?.removeAllRanges();
  };

  // Reply to thread
  const handleSendReply = (threadId: string) => {
    const replyText = replyTexts[threadId]?.trim();
    if (!replyText) return;

    const updated = threads.map((t) => {
      if (t.id === threadId) {
        return addReplyToThread(t, {
          authorId: currentUserId,
          authorName: currentUserName,
          authorRole: userRole,
          content: replyText,
        });
      }
      return t;
    });

    updateThreadsState(updated);
    setReplyTexts((prev) => ({ ...prev, [threadId]: '' }));
  };

  // Toggle Resolution
  const handleToggleResolve = (threadId: string) => {
    const updated = threads.map((t) => (t.id === threadId ? toggleThreadResolution(t) : t));
    updateThreadsState(updated);
  };

  // Applicant Accept Suggestion
  const handleAcceptSuggestion = (annId: string) => {
    const targetAnn = annotations.find((a) => a.id === annId);
    if (!targetAnn) return;

    const { updatedText, updatedAnnotation } = acceptSuggestion(text, targetAnn);
    onTextUpdate?.(updatedText);

    const updatedAnnList = annotations.map((a) => (a.id === annId ? updatedAnnotation : a));
    updateAnnotationsState(updatedAnnList);

    // Also auto-resolve linked thread
    const updatedThreads = threads.map((t) => {
      if (t.annotationId === annId) {
        return { ...t, status: 'resolved' as const };
      }
      return t;
    });
    updateThreadsState(updatedThreads);
  };

  // Applicant Reject Suggestion
  const handleRejectSuggestion = (annId: string) => {
    const targetAnn = annotations.find((a) => a.id === annId);
    if (!targetAnn) return;

    const rejected = rejectSuggestion(targetAnn);
    const updatedAnnList = annotations.map((a) => (a.id === annId ? rejected : a));
    updateAnnotationsState(updatedAnnList);
  };

  // Delete Annotation (Advisor)
  const handleDeleteAnnotation = (annId: string) => {
    updateAnnotationsState(annotations.filter((a) => a.id !== annId));
    updateThreadsState(threads.filter((t) => t.annotationId !== annId));
  };

  // Focus comment card
  const handleSpanClick = (ann: DocumentAnnotation) => {
    const linkedThread = threads.find((t) => t.annotationId === ann.id);
    if (linkedThread) {
      setSelectedThreadId(linkedThread.id);
      const cardEl = commentCardsRef.current[linkedThread.id];
      if (cardEl) {
        scrollToElementWithinContainer(cardEl);
      }
    } else if (userRole === 'advisor') {
      // If clicking an orphaned markup with no thread, delete it immediately
      handleDeleteAnnotation(ann.id);
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (filterMode === 'open') return t.status === 'open';
    if (filterMode === 'resolved') return t.status === 'resolved';
    return true;
  });

  // Exclude orphaned highlight markups that have no thread
  const validThreadAnnIds = new Set(threads.map((t) => t.annotationId).filter(Boolean));
  const displayAnnotations = annotations.filter((a) => {
    if (a.type === 'highlight' && !validThreadAnnIds.has(a.id)) {
      return false;
    }
    return true;
  });

  const textSpans = segmentDocumentText(text, displayAnnotations, threads);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                userRole === 'advisor'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-sky-100 text-sky-800 border border-sky-200'
              }`}
            >
              {userRole === 'advisor' ? 'Advisor Review & Markup Mode' : 'Applicant View'}
            </span>
            <span className="text-xs text-slate-500">
              Active Author: <strong>{currentUserName}</strong>
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">{documentTitle}</h2>
          {documentSubtitle && <p className="text-xs text-slate-500">{documentSubtitle}</p>}
        </div>

        {/* Comment filters & stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1.5" />
            <button
              onClick={() => setFilterMode('open')}
              className={`px-2 py-1 rounded font-semibold transition-all ${
                filterMode === 'open' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Open ({threads.filter((t) => t.status === 'open').length})
            </button>
            <button
              onClick={() => setFilterMode('resolved')}
              className={`px-2 py-1 rounded font-semibold transition-all ${
                filterMode === 'resolved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Resolved ({threads.filter((t) => t.status === 'resolved').length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-1 rounded font-semibold transition-all ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({threads.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main split view: Document text on left, anchored comments on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Document Canvas */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative">
          {userRole === 'advisor' && !readOnly && (
            <div className="mb-4 p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Highlighter className="w-4 h-4 text-purple-600" />
                Select any text with cursor to apply strikethrough or anchor margin comments.
              </span>
              <div className="flex items-center gap-2">
                {annotations.length > 0 && (
                  <button
                    onClick={() => {
                      updateAnnotationsState([]);
                      updateThreadsState([]);
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                    title="Clear all annotations on this document"
                  >
                    Clear Markups ({annotations.length})
                  </button>
                )}
                <span className="text-[10px] text-purple-700 font-semibold uppercase">Live Active</span>
              </div>
            </div>
          )}

          <div
            ref={docContainerRef}
            onMouseUp={handleMouseUp}
            className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans selection:bg-sky-200"
          >
            {textSpans.map((span, idx) => {
              if (!span.annotation) {
                return <span key={idx}>{span.text}</span>;
              }

              const ann = span.annotation;
              const linkedThread =
                span.thread ||
                threads.find((t) => isThreadAnnotationMatch(t, ann));
              const isSelected = Boolean(
                selectedThreadId && linkedThread && selectedThreadId === linkedThread.id
              );

              let styleClasses = 'cursor-pointer transition-all duration-200 px-1 py-0.5 rounded font-medium inline ';
              if (ann.type === 'strikethrough') {
                styleClasses += isSelected
                  ? 'bg-red-200 line-through text-red-950 ring-2 ring-red-500 ring-offset-1 font-bold shadow-xs '
                  : 'bg-red-100 line-through text-red-800 decoration-red-600 hover:bg-red-200 ';
              } else if (ann.type === 'replacement') {
                styleClasses += isSelected
                  ? 'bg-emerald-200 border-b-2 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500 ring-offset-1 font-bold shadow-xs '
                  : 'bg-emerald-100 border-b-2 border-emerald-500 text-emerald-900 hover:bg-emerald-200 ';
              } else {
                // Highly visible warm amber highlight with distinct bottom border; increases intensity on selection
                styleClasses += isSelected
                  ? 'bg-amber-300 text-amber-950 border-b-2 border-amber-600 ring-2 ring-amber-500 ring-offset-1 font-bold shadow-xs '
                  : 'bg-amber-100/95 text-neutral-900 border-b-2 border-amber-400 hover:bg-amber-200 hover:border-amber-500 ';
              }

              return (
                <span
                  key={idx}
                  ref={(el) => {
                    if (linkedThread) {
                      passageSpansRef.current[linkedThread.id] = el;
                    }
                  }}
                  onClick={() => {
                    if (linkedThread) {
                      setSelectedThreadId(linkedThread.id);
                      const cardEl = commentCardsRef.current[linkedThread.id];
                      if (cardEl) {
                        scrollToElementWithinContainer(cardEl);
                      }
                    } else {
                      handleSpanClick(ann);
                    }
                  }}
                  className={styleClasses}
                  title={`Comment/Markup by ${ann.authorName} (${ann.authorRole}): click to highlight and view comment card`}
                >
                  {span.text}
                  {ann.type === 'replacement' && ann.suggestedText && (
                    <span
                      data-ignore-selection="true"
                      className="ml-1 inline-flex items-center text-[11px] font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-300 select-none"
                    >
                      &rarr; &quot;{ann.suggestedText}&quot;
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Floating selection toolbar for Advisor */}
          {selectionRange && userRole === 'advisor' && (
            <div
              className="fixed z-50 bg-slate-900 text-white rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1.5 border border-slate-700 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150"
              style={{
                left: `${selectionRange.clientX}px`,
                top: `${selectionRange.clientY}px`,
              }}
            >
              <button
                onClick={handleAddStrikethrough}
                className="p-1.5 px-2 hover:bg-slate-800 rounded text-red-300 hover:text-red-200 transition-colors flex items-center gap-1 text-xs font-bold"
                title="Suggest Deletion (Strikethrough)"
              >
                <span className="line-through">Strikethrough</span>
              </button>
              <div className="w-px h-4 bg-slate-700 mx-0.5" />
              <button
                onClick={() => handleOpenCommentModal('comment')}
                className="p-1.5 px-2 hover:bg-slate-800 rounded text-white hover:text-sky-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Add Comment Thread"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comment
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Anchored Comment Threads Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              Active Annotations ({filteredThreads.length})
            </h3>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Draft {effectiveVersionId.toUpperCase()}
            </span>
          </div>

          {/* Historical Previous Drafts Read-Only Log (Ticket Candidate 10) */}
          {historicalLogs.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Previous Draft History ({historicalLogs.reduce((acc, h) => acc + h.threads.length, 0)} archived)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoricalLog(!showHistoricalLog)}
                  className="text-[11px] font-bold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
                >
                  {showHistoricalLog ? 'Hide History Log' : 'View Read-Only Log'}
                </button>
              </div>

              {showHistoricalLog && (
                <div className="space-y-3 pt-2 border-t border-slate-200 max-h-80 overflow-y-auto pr-1">
                  {historicalLogs.map((log) => (
                    <div key={log.versionId} className="space-y-2">
                      <div className="flex items-center justify-between bg-slate-200/80 px-2 py-1 rounded text-[10px] font-bold text-slate-700">
                        <span>DRAFT V{log.versionNumber} MARKS</span>
                        <span className="text-slate-500 font-normal italic">Archived • Read Only</span>
                      </div>

                      {log.threads.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="border-l-2 border-slate-400 pl-2 text-[11px] italic text-slate-600">
                            &quot;{t.anchorText}&quot;
                          </div>
                          <div className="text-slate-800 font-medium">
                            {t.comments[0]?.content}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                            <span>{t.comments[0]?.authorName}</span>
                            <span className="font-semibold text-slate-500 capitalize">{t.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {filteredThreads.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                {filterMode === 'open'
                  ? 'No open comments. Select text with cursor to apply strikethrough or add comments.'
                  : 'No comments found for this filter.'}
              </p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThreadId === thread.id;
              const linkedAnn = annotations.find((a) => isThreadAnnotationMatch(thread, a));
              const isResolved = thread.status === 'resolved';

              return (
                <div
                  key={thread.id}
                  ref={(el) => {
                    commentCardsRef.current[thread.id] = el;
                  }}
                  onClick={() => {
                    setSelectedThreadId(thread.id);
                    const targetSpan = passageSpansRef.current[thread.id];
                    if (targetSpan) {
                      scrollToElementWithinContainer(targetSpan);
                    }
                  }}
                  className={`bg-white rounded-xl border transition-all p-4 shadow-sm space-y-3 cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-200 shadow-md bg-amber-50/20'
                      : isResolved
                      ? 'border-slate-200 opacity-70 bg-slate-50/50 hover:opacity-100 hover:border-slate-300'
                      : 'border-slate-200 hover:border-amber-300 hover:shadow-xs'
                  }`}
                >
                  {/* Anchor text snippet banner */}
                  <div
                    className={`flex items-start justify-between gap-2 border-l-2 pl-2.5 py-0.5 text-xs ${
                      isSelected ? 'border-amber-500' : 'border-slate-400'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Referenced Passage:
                      </span>
                      <span
                        className={`italic font-medium line-clamp-2 ${
                          isSelected ? 'text-amber-950 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        &quot;{thread.anchorText}&quot;
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                        isResolved
                          ? 'bg-slate-100 text-slate-600'
                          : isSelected
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {thread.status}
                    </span>
                  </div>

                  {/* Suggestion Accept / Reject Card (if linked suggestion annotation exists) */}
                  {linkedAnn && (linkedAnn.type === 'strikethrough' || linkedAnn.type === 'replacement') && (
                    <div className="p-2.5 bg-sky-50/80 rounded-lg border border-sky-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-900">
                          {linkedAnn.type === 'strikethrough'
                            ? 'Suggested Deletion'
                            : 'Suggested Replacement'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Status: {linkedAnn.status}
                        </span>
                      </div>

                      {linkedAnn.type === 'replacement' && linkedAnn.suggestedText && (
                        <div className="text-[11px] text-emerald-800 font-medium">
                          Replacement: &quot;{linkedAnn.suggestedText}&quot;
                        </div>
                      )}

                      {/* Action buttons for applicant or advisor */}
                      {userRole === 'applicant' && linkedAnn.status === 'active' && (
                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAcceptSuggestion(linkedAnn.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Accept & Apply
                          </button>
                          <button
                            onClick={() => handleRejectSuggestion(linkedAnn.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message stream */}
                  <div className="space-y-2.5 pt-1">
                    {thread.comments.map((msg) => (
                      <div key={msg.id} className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            {msg.authorRole === 'advisor' ? (
                              <Shield className="w-3 h-3 text-purple-600" />
                            ) : (
                              <User className="w-3 h-3 text-sky-600" />
                            )}
                            {msg.authorName}
                            <span className="text-[10px] font-normal text-slate-400 capitalize">
                              ({msg.authorRole})
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input Box */}
                  <div className="pt-2 border-t border-slate-100 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyTexts[thread.id] || ''}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({ ...prev, [thread.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReply(thread.id);
                        }}
                        placeholder={`Reply as ${currentUserName}...`}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50"
                      />
                      <button
                        onClick={() => handleSendReply(thread.id)}
                        disabled={!replyTexts[thread.id]?.trim()}
                        className="p-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
                        title="Send reply"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom controls: Resolve and Delete */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        onClick={() => handleToggleResolve(thread.id)}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {isResolved ? 'Reopen Thread' : 'Mark Resolved'}
                      </button>

                      {userRole === 'advisor' && linkedAnn && (
                        <button
                          onClick={() => handleDeleteAnnotation(linkedAnn.id)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delete annotation"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal for creating a new comment or suggestion thread */}
      {newCommentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                {newCommentModal.type === 'replacement'
                  ? 'Add Suggested Edit'
                  : 'Add Anchored Faculty Comment'}
              </h3>
              <button
                onClick={() => setNewCommentModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selected Text:
              </span>
              <p className="italic text-slate-800 font-medium mt-0.5 line-clamp-3">
                &quot;{newCommentModal.anchorText}&quot;
              </p>
            </div>

            {newCommentModal.type === 'replacement' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Suggested Replacement Text
                </label>
                <input
                  type="text"
                  value={suggestedReplacementInput}
                  onChange={(e) => setSuggestedReplacementInput(e.target.value)}
                  placeholder="Enter recommended replacement wording..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Advising Comment / Rationale
              </label>
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Explain the clinical rationale or advising suggestion to the student..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNewCommentModal(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCommentThread}
                disabled={!newCommentContent.trim()}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white shadow-xs"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
