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
} from '../../domain/annotation-models';

interface AnnotatedDocumentViewerProps {
  documentId: string;
  documentTitle: string;
  documentSubtitle?: string;
  text: string;
  userRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  onTextUpdate?: (newText: string) => void;
  readOnly?: boolean;
}

export const AnnotatedDocumentViewer: React.FC<AnnotatedDocumentViewerProps> = ({
  documentId,
  documentTitle,
  documentSubtitle,
  text,
  userRole,
  currentUserId,
  currentUserName,
  onTextUpdate,
  readOnly = false,
}) => {
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [threads, setThreads] = useState<CommentThread[]>([]);
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

  // Load from local storage
  useEffect(() => {
    const loadedAnn = loadStoredAnnotations(documentId);
    const loadedThr = loadStoredThreads(documentId);
    setAnnotations(loadedAnn);
    setThreads(loadedThr);
  }, [documentId]);

  // Save to local storage on change
  const updateAnnotationsState = (newAnn: DocumentAnnotation[]) => {
    setAnnotations(newAnn);
    saveStoredAnnotations(documentId, newAnn);
  };

  const updateThreadsState = (newThr: CommentThread[]) => {
    setThreads(newThr);
    saveStoredThreads(documentId, newThr);
  };

  // Selection detection for Advisor
  const handleMouseUp = () => {
    if (userRole !== 'advisor' || readOnly) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionRange(null);
      return;
    }

    const selectedStr = selection.toString();
    const docText = text;
    const start = docText.indexOf(selectedStr);

    if (start === -1) {
      setSelectionRange(null);
      return;
    }

    const end = start + selectedStr.length;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectionRange({
      start,
      end,
      text: selectedStr,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top - 10,
    });
  };

  // Add Annotation Action
  const handleAddHighlight = (color: AnnotationColor) => {
    if (!selectionRange) return;
    const newAnn = createAnnotation({
      documentId,
      authorId: currentUserId,
      authorName: currentUserName,
      authorRole: userRole,
      startOffset: selectionRange.start,
      endOffset: selectionRange.end,
      anchorText: selectionRange.text,
      type: 'highlight',
      color,
    });

    updateAnnotationsState([...annotations, newAnn]);
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleAddStrikethrough = () => {
    if (!selectionRange) return;
    const newAnn = createAnnotation({
      documentId,
      authorId: currentUserId,
      authorName: currentUserName,
      authorRole: userRole,
      startOffset: selectionRange.start,
      endOffset: selectionRange.end,
      anchorText: selectionRange.text,
      type: 'strikethrough',
    });

    const newThread = createCommentThread({
      documentId,
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
        documentId,
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
        documentId,
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: userRole,
        startOffset: newCommentModal.start,
        endOffset: newCommentModal.end,
        anchorText: newCommentModal.anchorText,
        type: 'highlight',
        color: 'yellow',
      });
      linkedAnnId = newAnn.id;
      updateAnnotationsState([...annotations, newAnn]);
    }

    const newThread = createCommentThread({
      documentId,
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
      commentCardsRef.current[linkedThread.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (filterMode === 'open') return t.status === 'open';
    if (filterMode === 'resolved') return t.status === 'resolved';
    return true;
  });

  const textSpans = segmentDocumentText(text, annotations, threads);

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
                Select any text with cursor to highlight, suggest deletions, or anchor margin comments.
              </span>
              <span className="text-[10px] text-purple-700 font-semibold uppercase">Live Active</span>
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
              const isSelected = selectedThreadId === span.thread?.id;

              let styleClasses = 'cursor-pointer transition-colors px-0.5 rounded ';
              if (ann.type === 'strikethrough') {
                styleClasses += 'bg-red-100 line-through text-red-800 decoration-red-600 font-medium ';
              } else if (ann.type === 'replacement') {
                styleClasses += 'bg-emerald-100 border-b-2 border-emerald-500 text-emerald-900 ';
              } else {
                switch (ann.color) {
                  case 'green':
                    styleClasses += 'bg-emerald-100 border-b-2 border-emerald-400 text-emerald-950 ';
                    break;
                  case 'blue':
                    styleClasses += 'bg-sky-100 border-b-2 border-sky-400 text-sky-950 ';
                    break;
                  case 'purple':
                    styleClasses += 'bg-purple-100 border-b-2 border-purple-400 text-purple-950 ';
                    break;
                  default:
                    styleClasses += 'bg-amber-100 border-b-2 border-amber-400 text-amber-950 ';
                }
              }

              if (isSelected) {
                styleClasses += 'ring-2 ring-sky-500 ring-offset-1 ';
              }

              return (
                <span
                  key={idx}
                  onClick={() => handleSpanClick(ann)}
                  className={styleClasses}
                  title={`Comment/Markup by ${ann.authorName} (${ann.authorRole})`}
                >
                  {span.text}
                  {ann.type === 'replacement' && ann.suggestedText && (
                    <span className="ml-1 inline-flex items-center text-[11px] font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-300">
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
                onClick={() => handleAddHighlight('yellow')}
                className="p-1.5 hover:bg-slate-800 rounded text-amber-300 hover:text-amber-200 transition-colors"
                title="Highlight Yellow"
              >
                <div className="w-3.5 h-3.5 rounded bg-amber-400" />
              </button>
              <button
                onClick={() => handleAddHighlight('green')}
                className="p-1.5 hover:bg-slate-800 rounded text-emerald-300 hover:text-emerald-200 transition-colors"
                title="Highlight Green"
              >
                <div className="w-3.5 h-3.5 rounded bg-emerald-400" />
              </button>
              <button
                onClick={handleAddStrikethrough}
                className="p-1.5 hover:bg-slate-800 rounded text-red-300 hover:text-red-200 transition-colors flex items-center gap-1 text-xs font-bold"
                title="Suggest Deletion (Strikethrough)"
              >
                <span className="line-through">Strike</span>
              </button>
              <button
                onClick={() => handleOpenCommentModal('replacement')}
                className="p-1.5 hover:bg-slate-800 rounded text-sky-300 hover:text-sky-200 transition-colors flex items-center gap-1 text-xs font-bold"
                title="Suggest Replacement"
              >
                Suggest
              </button>
              <div className="w-px h-4 bg-slate-700 mx-0.5" />
              <button
                onClick={() => handleOpenCommentModal('comment')}
                className="p-1.5 hover:bg-slate-800 rounded text-white hover:text-sky-300 transition-colors flex items-center gap-1 text-xs font-semibold"
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
              Margin Annotations ({filteredThreads.length})
            </h3>
            {userRole === 'advisor' && (
              <span className="text-[11px] text-slate-500">Live advisor sync</span>
            )}
          </div>

          {filteredThreads.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                {filterMode === 'open'
                  ? 'No open comments. Highlight text to start a thread.'
                  : 'No comments found for this filter.'}
              </p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThreadId === thread.id;
              const linkedAnn = annotations.find((a) => a.id === thread.annotationId);
              const isResolved = thread.status === 'resolved';

              return (
                <div
                  key={thread.id}
                  ref={(el) => {
                    commentCardsRef.current[thread.id] = el;
                  }}
                  className={`bg-white rounded-xl border transition-all p-4 shadow-sm space-y-3 ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-100 shadow-md'
                      : isResolved
                      ? 'border-slate-200 opacity-70 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Anchor text snippet banner */}
                  <div className="flex items-start justify-between gap-2 border-l-2 border-sky-500 pl-2.5 py-0.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Referenced Passage:
                      </span>
                      <span className="italic text-slate-700 font-medium line-clamp-2">
                        &quot;{thread.anchorText}&quot;
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                        isResolved
                          ? 'bg-slate-100 text-slate-600'
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
                        <div className="flex items-center gap-2 pt-1">
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
                  <div className="pt-2 border-t border-slate-100 space-y-2">
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
                        className="p-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                        title="Send reply"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom controls: Resolve and Delete */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        onClick={() => handleToggleResolve(thread.id)}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {isResolved ? 'Reopen Thread' : 'Mark Resolved'}
                      </button>

                      {userRole === 'advisor' && linkedAnn && (
                        <button
                          onClick={() => handleDeleteAnnotation(linkedAnn.id)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
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
