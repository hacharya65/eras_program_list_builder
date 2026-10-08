'use client';

import React from 'react';
import { AdvisorDashboardContext, ReviewRequest, DocumentSnapshot } from '@/domain/types';
import {
  Inbox,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  ChevronRight,
  FileCheck,
  Stethoscope,
  MessageSquare,
  Highlighter,
  Briefcase,
  BookOpen,
  Sparkles,
  FileText
} from 'lucide-react';
import { VisualDiffViewer } from './VisualDiffViewer';
import { ClinicalRubricForm } from './ClinicalRubricForm';
import { AnnotatedDocumentViewer } from './collaborative/AnnotatedDocumentViewer';
import { SpecialtyAdvisingFormModal } from './SpecialtyAdvisingFormModal';
import { loadStudentAdvisingIntake, SpecialtyAdvisingIntake } from '@/domain/advising-intake-models';
import { RubricEvaluation } from '@/domain/types';
import { calculateSlaStatus } from '@/domain/sla-engine';

interface AdvisorPortalProps {
  context: AdvisorDashboardContext;
  onOpenReview?: (reviewId: string) => void;
  onSubmitFeedback?: (reviewId: string, evaluation: RubricEvaluation) => void;
  onEndorseReview?: (reviewId: string) => void;
  getSnapshotContent?: (snapshotId: string) => any;
  getPreviousSnapshot?: (snapshotId: string) => any;
  onViewingEntry?: (reviewId: string, entryIndex: number) => void;
}

export function AdvisorPortal({
  context,
  onOpenReview,
  onSubmitFeedback,
  onEndorseReview,
  getSnapshotContent,
  getPreviousSnapshot,
  onViewingEntry,
}: AdvisorPortalProps) {
  const { advisor, advisees, pendingReviews } = context;
  const [selectedReviewId, setSelectedReviewId] = React.useState<string | null>(null);
  const [activeEntryIndex, setActiveEntryIndex] = React.useState<number>(1);
  const [psReviewTab, setPsReviewTab] = React.useState<'live_annotations' | 'rubric'>('live_annotations');
  const [expReviewTab, setExpReviewTab] = React.useState<'live_annotations' | 'standard'>('live_annotations');
  const [reviewQueueTab, setReviewQueueTab] = React.useState<'pending' | 'completed'>('pending');
  const [reviewingAdviseeIntakeId, setReviewingAdviseeIntakeId] = React.useState<string | null>(null);

  const selectedReview = pendingReviews.find((r) => r.id === selectedReviewId);
  const snapshot = selectedReview ? getSnapshotContent?.(selectedReview.snapshotId) : null;
  const previousSnapshot = snapshot && snapshot.versionNumber >= 2 ? getPreviousSnapshot?.(snapshot.id) : null;

function deduplicateLatestReviews(
  reviews: ReviewRequest[],
  getSnapshotContent?: (id: string) => DocumentSnapshot | null,
  snapshots?: DocumentSnapshot[]
): ReviewRequest[] {
  const latestMap = new Map<string, ReviewRequest>();
  for (const rev of reviews) {
    const key = `${rev.studentId}_${rev.documentType}`;
    const existing = latestMap.get(key);
    if (!existing) {
      latestMap.set(key, rev);
    } else {
      const existingTime = new Date(existing.completedAt || existing.submittedAt).getTime();
      const revTime = new Date(rev.completedAt || rev.submittedAt).getTime();
      const timeDiff = revTime - existingTime;
      if (timeDiff > 0) {
        latestMap.set(key, rev);
      } else if (timeDiff === 0) {
        const existingSnap = getSnapshotContent ? getSnapshotContent(existing.snapshotId) : snapshots?.find((s) => s.id === existing.snapshotId);
        const revSnap = getSnapshotContent ? getSnapshotContent(rev.snapshotId) : snapshots?.find((s) => s.id === rev.snapshotId);
        if ((revSnap?.versionNumber ?? 0) >= (existingSnap?.versionNumber ?? 0)) {
          latestMap.set(key, rev);
        }
      }
    }
  }
  return Array.from(latestMap.values());
}

  // Separate active pending reviews from completed / signed-off reviews
  const pendingReviewsOnly = React.useMemo(() => {
    return pendingReviews.filter(
      (r) => (r.stage === 'submitted' || r.stage === 'in_review') && !r.completedAt
    );
  }, [pendingReviews]);

  const completedReviewsOnly = React.useMemo(() => {
    return pendingReviews.filter(
      (r) => r.stage === 'endorsed' || (Boolean(r.completedAt) && r.stage !== 'revisions_requested')
    );
  }, [pendingReviews]);

  // Filter faculty pending submission list so only the latest submitted version is displayed per student document
  const latestPendingReviews = React.useMemo(() => {
    return deduplicateLatestReviews(pendingReviewsOnly, getSnapshotContent, context.snapshots);
  }, [pendingReviewsOnly, getSnapshotContent, context.snapshots]);

  // Filter completed reviews so the latest review per student document is triaged cleanly
  const latestCompletedReviews = React.useMemo(() => {
    return deduplicateLatestReviews(completedReviewsOnly, getSnapshotContent, context.snapshots);
  }, [completedReviewsOnly, getSnapshotContent, context.snapshots]);

  const getAdviseeStatus = (adviseeId: string): string => {
    // 1. Check pending/completed reviews for this advisee
    const adviseeReviews = pendingReviews.filter((r) => r.studentId === adviseeId);
    if (adviseeReviews.length > 0) {
      const sorted = [...adviseeReviews].sort((a, b) => {
        const timeDiff = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        const snapA = getSnapshotContent?.(a.snapshotId) || context.snapshots?.find((s) => s.id === a.snapshotId);
        const snapB = getSnapshotContent?.(b.snapshotId) || context.snapshots?.find((s) => s.id === b.snapshotId);
        return (snapB?.versionNumber ?? 0) - (snapA?.versionNumber ?? 0);
      });
      const latestRev = sorted[0];
      const revSnap = getSnapshotContent?.(latestRev.snapshotId) ||
        context.snapshots?.find((s) => s.id === latestRev.snapshotId);
      const ver = revSnap?.versionNumber ?? 1;

      if (latestRev.stage === 'endorsed') {
        return `ERAS Ready v${ver}`;
      }
      if (latestRev.stage === 'in_review') {
        return `In Review v${ver}`;
      }
      if (latestRev.stage === 'revisions_requested') {
        return `Revisions Requested v${ver}`;
      }
      return `Submitted v${ver}`;
    }

    // 2. Check if context has snapshots for this advisee's personal statement
    if (context.snapshots && context.snapshots.length > 0) {
      const studentSnaps = context.snapshots
        .filter((s) => s.documentType === 'personal_statement')
        .sort((a, b) => b.versionNumber - a.versionNumber);
      if (studentSnaps.length > 0) {
        const latestSnap = studentSnaps[0];
        if (context.personalStatement?.stage === 'endorsed') {
          return `ERAS Ready v${latestSnap.versionNumber}`;
        }
        if (context.personalStatement?.stage === 'in_review') {
          return `In Review v${latestSnap.versionNumber}`;
        }
        if (context.personalStatement?.stage === 'revisions_requested') {
          return `Revisions Requested (v${latestSnap.versionNumber})`;
        }
        return `Submitted v${latestSnap.versionNumber}`;
      }
    }

    // 3. Check personalStatement in context if applicable
    if (context.personalStatement && context.personalStatement.studentId === adviseeId) {
      if (context.personalStatement.stage === 'endorsed') {
        return `ERAS Ready v${context.personalStatement.currentVersionNumber}`;
      }
      if (context.personalStatement.stage === 'submitted') {
        return `Submitted v${context.personalStatement.currentVersionNumber}`;
      }
      if (context.personalStatement.stage === 'in_review') {
        return `In Review v${context.personalStatement.currentVersionNumber}`;
      }
      if (context.personalStatement.stage === 'revisions_requested') {
        return `Revisions Requested (v${context.personalStatement.currentVersionNumber})`;
      }
      return `Drafting v${context.personalStatement.currentVersionNumber}`;
    }

    return 'Drafting v1';
  };

  if (selectedReview && snapshot) {
    // Check if this is an experience_portfolio review
    if (selectedReview.documentType === 'experience_portfolio') {
      let experiencesList: any[] = [];
      try {
        experiencesList = JSON.parse(snapshot.content);
      } catch {
        experiencesList = [];
      }

      const currentEntry = experiencesList[activeEntryIndex - 1];

      const handleSelectEntry = (index: number) => {
        setActiveEntryIndex(index);
        onViewingEntry?.(selectedReview.id, index);
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedReviewId(null)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                &larr; Back to Queue
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Reviewing: {selectedReview.studentName}'s 10 Selected Experiences Portfolio
                </h2>
                <span className="text-xs text-slate-500">
                  Stage: <strong className="text-blue-700 capitalize">{selectedReview.stage.replace('_', ' ')}</strong> &bull; Submitted on {new Date(selectedReview.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onEndorseReview) {
                    onEndorseReview(selectedReview.id);
                  } else if (onSubmitFeedback) {
                    onSubmitFeedback(selectedReview.id, {
                      narrativeMotivation: 4,
                      clinicalReflection: 4,
                      toneAndFit: 4,
                      structureAndMechanics: 4,
                      overallVerdict: 'ready_to_lock',
                      generalNotes: '10 Selected Experiences endorsed as ERAS ready.',
                    });
                  }
                  alert(`Endorsed! 10 Selected Experiences for ${selectedReview.studentName} marked ERAS ready.`);
                  setSelectedReviewId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Endorse 10 Experiences
              </button>
            </div>
          </div>

          {/* Active Review Tracker Bar */}
          <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-bold text-slate-900">
                Active Viewing Position: Entry #{activeEntryIndex} of 10 ({currentEntry?.title || 'Selected Experience'})
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Student live tracker automatically synchronized
            </span>
          </div>

          {/* 10 Entry Pagination Tabs */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => {
              const num = i + 1;
              const isSelected = activeEntryIndex === num;
              const exp = experiencesList[i];
              return (
                <button
                  key={num}
                  onClick={() => handleSelectEntry(num)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Entry #{num} {exp?.isMostMeaningful ? '★' : ''}
                </button>
              );
            })}
          </div>

          {/* Detailed Experience Review Card */}
          {currentEntry ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                      {currentEntry.experienceType}
                    </span>
                    {currentEntry.isMostMeaningful && (
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        ★ Most Meaningful Experience
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    {currentEntry.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <strong>Organization:</strong> {currentEntry.orgName} &bull; <strong>Role:</strong> {currentEntry.roleName} &bull; <strong>Frequency:</strong> {currentEntry.frequency}
                  </p>
                </div>
              </div>

              {/* Review Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setExpReviewTab('live_annotations')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    expReviewTab === 'live_annotations'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  Interactive Markup &amp; Margin Comments
                </button>
                <button
                  onClick={() => setExpReviewTab('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    expReviewTab === 'standard'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Standard Readout
                </button>
              </div>

              {expReviewTab === 'live_annotations' ? (
                <AnnotatedDocumentViewer
                  documentId={`exp-entry-${activeEntryIndex}`}
                  documentTitle={`Entry #${activeEntryIndex}: ${currentEntry.title}`}
                  documentSubtitle={`Role: ${currentEntry.roleName} • Organization: ${currentEntry.orgName}`}
                  text={currentEntry.descriptionText || ''}
                  userRole="advisor"
                  currentUserId={advisor.id}
                  currentUserName={advisor.name}
                />
              ) : (
                <div className="space-y-4">
                  {/* Context, Roles, and Responsibilities (750 chars max) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Context, Roles, and Responsibilities</span>
                      <span className="font-mono text-slate-500">{currentEntry.descriptionText?.length || 0} / 750 chars</span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono leading-relaxed text-slate-800 whitespace-pre-wrap">
                      {currentEntry.descriptionText}
                    </div>
                  </div>

                  {/* Most Meaningful Reflection (300 chars max) */}
                  {currentEntry.isMostMeaningful && (
                    <div className="space-y-1.5 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between text-xs text-amber-900">
                        <span className="font-bold">Most Meaningful Summary &amp; Clinical Reflection</span>
                        <span className="font-mono">{currentEntry.reflectionText?.length || 0} / 300 chars</span>
                      </div>
                      <p className="p-3 bg-white rounded-lg border border-amber-200 text-xs font-mono leading-relaxed text-slate-800 whitespace-pre-wrap">
                        {currentEntry.reflectionText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border text-center text-slate-500 text-sm">
              Entry #{activeEntryIndex} is blank.
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedReviewId(null)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              &larr; Back to Queue
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Reviewing: {selectedReview.studentName}'s Personal Statement v{snapshot.versionNumber}
              </h2>
              <span className="text-xs text-slate-500">
                Stage: <strong className="text-blue-700 capitalize">{selectedReview.stage.replace('_', ' ')}</strong> &bull; Submitted on {new Date(selectedReview.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Review Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setPsReviewTab('live_annotations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              psReviewTab === 'live_annotations'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            Live Document Markup &amp; Anchored Comments
          </button>
          <button
            onClick={() => setPsReviewTab('rubric')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              psReviewTab === 'rubric'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Rubric and Change Log
          </button>
        </div>

        {psReviewTab === 'live_annotations' ? (
          <AnnotatedDocumentViewer
            documentId="personal_statement"
            documentVersionId={`v${snapshot.versionNumber}`}
            versionNumber={snapshot.versionNumber}
            documentTitle={`${selectedReview.studentName}'s Personal Statement (v${snapshot.versionNumber})`}
            documentSubtitle="Faculty Collaborative Review Mode — Select text with cursor to apply strikethrough or anchor margin comments."
            text={snapshot.content}
            userRole="advisor"
            currentUserId={advisor.id}
            currentUserName={advisor.name}
          />
        ) : (
          <div className="space-y-6">
            {/* Version comparison / Visual Diff engages strictly starting from V2 onwards */}
            {snapshot.versionNumber >= 2 && (
              <VisualDiffViewer
                previousVersionTitle={`v${previousSnapshot ? previousSnapshot.versionNumber : snapshot.versionNumber - 1} Submitted Draft`}
                previousContent={previousSnapshot ? previousSnapshot.content : ''}
                newVersionTitle={`v${snapshot.versionNumber} Submitted Draft`}
                newContent={snapshot.content}
                changelogNote={snapshot.changelogNote || `Revisions submitted for v${snapshot.versionNumber}.`}
                studentName={selectedReview.studentName}
              />
            )}

            {/* Standardized Rubric Evaluation Form */}
            <ClinicalRubricForm
              studentName={selectedReview.studentName}
              versionNumber={snapshot.versionNumber}
              onSubmit={(evaluation) => {
                onSubmitFeedback?.(selectedReview.id, evaluation);
                alert(`Evaluation submitted! Feedback returned to ${selectedReview.studentName}.`);
                setSelectedReviewId(null);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advisor Welcome Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Faculty Advisor Portal
            </span>
            <span className="text-xs text-neutral-500">Geisinger Commonwealth School of Medicine &bull; Department of Internal Medicine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome, {advisor.name}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Active Advisees: <span className="font-semibold text-slate-800">{advisees.length} Medical Students</span> | Department: <span className="text-slate-700">Internal Medicine</span>
          </p>
        </div>

        {/* SLA Summary Pill */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-600" />
          <div>
            <div className="text-[11px] text-emerald-700 font-medium uppercase tracking-wider">Institutional SLA Target</div>
            <div className="font-bold text-emerald-900">14-Day Review Turnaround</div>
            <div className="text-emerald-700 text-[11px]">Day 10 auto-nudge / Day 14 Dean's escalation</div>
          </div>
        </div>
      </div>

      {/* Review Queue & Advisee List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Review Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">Pending Review Queue</h2>
              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs font-semibold">
                {latestPendingReviews.length} Active
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Filtered to latest submitted draft per student
            </span>
          </div>

          {/* Review Queue Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 px-6 bg-slate-50/50">
            <button
              onClick={() => setReviewQueueTab('pending')}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                reviewQueueTab === 'pending'
                  ? 'border-sky-600 text-sky-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Pending Reviews ({latestPendingReviews.length})</span>
            </button>
            <button
              onClick={() => setReviewQueueTab('completed')}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                reviewQueueTab === 'completed'
                  ? 'border-emerald-600 text-emerald-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed ({latestCompletedReviews.length})</span>
            </button>
          </div>

          <div className="p-6">
            {reviewQueueTab === 'pending' ? (
              latestPendingReviews.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-800">Your Review Queue is Clear!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    When advisees submit personal statements or 10-experience portfolios, they will appear here with automated 14-day SLA tracking.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {latestPendingReviews.map((rev) => {
                    const sla = calculateSlaStatus(rev, 14);
                    const revSnapshot = getSnapshotContent ? getSnapshotContent(rev.snapshotId) : context.snapshots?.find((s) => s.id === rev.snapshotId);
                    const versionNum = revSnapshot?.versionNumber ?? 1;
                    return (
                      <div key={rev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            {rev.studentName}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">
                              {rev.stage.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200" title={`Version ${versionNum}`}>
                              v{versionNum}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Latest Version
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] border ${sla.badgeClass}`}>
                              {sla.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Document: {rev.documentType === 'experience_portfolio' ? '10 Selected Experiences Portfolio' : 'Personal Statement'} &bull; Submitted on {new Date(rev.submittedAt).toLocaleDateString()}
                          </div>
                          {sla.shouldNudgeAdvisor && (
                            <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>System Nudge: This review has been in queue for {sla.daysElapsed} days (SLA target: 14 days).</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            onOpenReview?.(rev.id);
                            setSelectedReviewId(rev.id);
                          }}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-lg font-medium shadow-sm transition-colors shrink-0"
                        >
                          {rev.documentType === 'experience_portfolio' ? 'Review Portfolio' : 'Open Review & Diff'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              latestCompletedReviews.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-800">No Completed Reviews Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    When you sign off on advisee personal statements as ERAS ready, they will appear here with permanent audit trails.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {latestCompletedReviews.map((rev) => {
                    const revSnapshot = getSnapshotContent ? getSnapshotContent(rev.snapshotId) : context.snapshots?.find((s) => s.id === rev.snapshotId);
                    const versionNum = revSnapshot?.versionNumber ?? 1;
                    const adviseeStudent = advisees.find((a) => a.id === rev.studentId);
                    return (
                      <div key={rev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <span>{rev.studentName}</span>
                            {adviseeStudent && (
                              <span className="text-xs text-slate-400 font-normal">
                                ({adviseeStudent.specialty})
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ERAS READY (SIGNED OFF)
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200" title={`Version ${versionNum}`}>
                              v{versionNum}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] border bg-slate-50 text-slate-700 border-slate-200">
                              Signed off on {new Date(rev.completedAt || rev.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Document: {rev.documentType === 'experience_portfolio' ? '10 Selected Experiences Portfolio' : 'Personal Statement'} &bull; Submitted on {new Date(rev.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onOpenReview?.(rev.id);
                            setSelectedReviewId(rev.id);
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-lg font-medium border border-slate-300 transition-colors shrink-0 flex items-center gap-1.5"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                          <span>View Review &amp; Evaluation</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column: Assigned Advisees */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Assigned Advisees</h3>
          </div>

          <div className="space-y-3">
            {advisees.map((advisee) => {
              const statusText = getAdviseeStatus(advisee.id);
              const breakdown = context.adviseeComponentBreakdowns?.[advisee.id];
              const adviseeExperiences = (context.experiences || []).filter((e) => !e.studentId || e.studentId === advisee.id);
              const expCount = breakdown?.experiencesCount ?? adviseeExperiences.length;
              const expMeaningful = breakdown?.experiencesMeaningful ?? adviseeExperiences.filter((e) => e.isMostMeaningful).length;
              const scholarlyCount = breakdown?.scholarlyCount ?? (context.scholarlyStats?.count ?? 2);
              const schoolListCount = breakdown?.schoolListCount ?? (context.schoolListStats?.count ?? 0);
              const signalsAssigned = breakdown?.signalsAssigned ?? (context.schoolListStats?.signalsAssigned ?? 0);
              const signalsBudget = breakdown?.signalsBudget ?? (context.schoolListStats?.signalsBudget ?? 15);

              return (
                <div key={advisee.id} className="p-3.5 rounded-xl border border-slate-200 hover:border-[#7EAE9B] transition-colors bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{advisee.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{advisee.email}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        {advisee.specialty}
                      </span>
                      {(() => {
                        const studentIntake = loadStudentAdvisingIntake(advisee.id);
                        return studentIntake.isCompleted ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Intake Complete
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Intake In Progress
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* High-yield Triage Badges */}
                  {(() => {
                    const studentIntake = loadStudentAdvisingIntake(advisee.id);
                    const badges = [];
                    if (studentIntake.hasLeaveOfAbsence) {
                      badges.push(
                        <span key="loa" className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          LOA Disclosed
                        </span>
                      );
                    }
                    if (studentIntake.consideringParallelPlan) {
                      badges.push(
                        <span key="parallel" className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          Parallel: {studentIntake.parallelPlanSpecialty || 'Active'}
                        </span>
                      );
                    }
                    if (
                      studentIntake.hasStepFailures ||
                      studentIntake.hasAcademicFailuresOrRepeats ||
                      studentIntake.hasCapsOrProfessionalismConcerns
                    ) {
                      badges.push(
                        <span key="flags" className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Academic Flags
                        </span>
                      );
                    }
                    if (badges.length === 0) return null;
                    return <div className="flex flex-wrap gap-1 pt-1">{badges}</div>;
                  })()}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Personal Statement Status: <strong className="text-slate-800">{statusText}</strong></span>
                    <button
                      onClick={() => setReviewingAdviseeIntakeId(advisee.id)}
                      className="text-[11px] font-bold text-[#4E8773] hover:text-[#1F3A30] hover:underline flex items-center gap-0.5"
                    >
                      <span>View Advising Form &rarr;</span>
                    </button>
                  </div>

                  {/* Condensed Core Application Components Progress */}
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 text-[11px] space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Core Application Components
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>Personal Statement:</span>
                        </span>
                        <span className="font-semibold text-slate-900">{statusText}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Selected Experiences:</span>
                        </span>
                        <span className="font-semibold text-slate-900">
                          {expCount}/10 Complete &bull; {expMeaningful}/3 Starred
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Scholarly Works:</span>
                        </span>
                        <span className="font-semibold text-slate-900">
                          {scholarlyCount} Recorded
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Strategic School List:</span>
                        </span>
                        <span className="font-semibold text-slate-900">
                          {schoolListCount} Programs &bull; {signalsAssigned}/{signalsBudget} Signals
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advisee Specialty Advising Intake Dossier Modal (Advisor Mode) */}
      <SpecialtyAdvisingFormModal
        isOpen={Boolean(reviewingAdviseeIntakeId)}
        onClose={() => setReviewingAdviseeIntakeId(null)}
        studentId={reviewingAdviseeIntakeId || ''}
        isAdvisorReviewMode={true}
      />
    </div>
  );
}
