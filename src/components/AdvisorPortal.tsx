'use client';

import React from 'react';
import { AdvisorDashboardContext } from '@/domain/types';
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
  Highlighter
} from 'lucide-react';
import { VisualDiffViewer } from './VisualDiffViewer';
import { ClinicalRubricForm } from './ClinicalRubricForm';
import { AnnotatedDocumentViewer } from './collaborative/AnnotatedDocumentViewer';
import { RubricEvaluation } from '@/domain/types';
import { calculateSlaStatus } from '@/domain/sla-engine';

interface AdvisorPortalProps {
  context: AdvisorDashboardContext;
  onOpenReview?: (reviewId: string) => void;
  onSubmitFeedback?: (reviewId: string, evaluation: RubricEvaluation) => void;
  getSnapshotContent?: (snapshotId: string) => any;
  onViewingEntry?: (reviewId: string, entryIndex: number) => void;
}

export function AdvisorPortal({
  context,
  onOpenReview,
  onSubmitFeedback,
  getSnapshotContent,
  onViewingEntry,
}: AdvisorPortalProps) {
  const { advisor, advisees, pendingReviews } = context;
  const [selectedReviewId, setSelectedReviewId] = React.useState<string | null>(null);
  const [activeEntryIndex, setActiveEntryIndex] = React.useState<number>(1);
  const [psReviewTab, setPsReviewTab] = React.useState<'live_annotations' | 'rubric'>('live_annotations');
  const [expReviewTab, setExpReviewTab] = React.useState<'live_annotations' | 'standard'>('live_annotations');

  const selectedReview = pendingReviews.find((r) => r.id === selectedReviewId);
  const snapshot = selectedReview ? getSnapshotContent?.(selectedReview.snapshotId) : null;

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
            Clinical Rubric &amp; Visual Diff
          </button>
        </div>

        {psReviewTab === 'live_annotations' ? (
          <AnnotatedDocumentViewer
            documentId={`ps-v${snapshot.versionNumber}`}
            documentTitle={`${selectedReview.studentName}'s Personal Statement (v${snapshot.versionNumber})`}
            documentSubtitle="Faculty Collaborative Review Mode — Select text with cursor to highlight, suggest deletions, or anchor margin comments."
            text={snapshot.content}
            userRole="advisor"
            currentUserId={advisor.id}
            currentUserName={advisor.name}
          />
        ) : (
          <div className="space-y-6">
            {/* Visual Diff & Snapshot View */}
            <VisualDiffViewer
              previousVersionTitle="Baseline Template / v0"
              previousContent="Standing in the clinic, I observed the team treat patients..."
              newVersionTitle={`v${snapshot.versionNumber} Submitted Draft`}
              newContent={snapshot.content}
              changelogNote={snapshot.changelogNote || 'Initial submission for faculty review.'}
              studentName={selectedReview.studentName}
            />

            {/* 4-Pillar Clinical Evaluation Form */}
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
            <span className="text-xs text-slate-500">Apex Health Internal Medicine</span>
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
                {pendingReviews.length} Pending
              </span>
            </div>
          </div>

          <div className="p-6">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">Your Review Queue is Clear!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When advisees submit personal statements or 10-experience portfolios, they will appear here with automated 14-day SLA tracking.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReviews.map((rev) => {
                  const sla = calculateSlaStatus(rev, 14);
                  return (
                    <div key={rev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          {rev.studentName}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">
                            {rev.stage.replace('_', ' ')}
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
            {advisees.map((advisee) => (
              <div key={advisee.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 text-sm">{advisee.name}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                    {advisee.specialty}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{advisee.email}</div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Status: <strong className="text-slate-800">Drafting v1</strong></span>
                  <span className="text-sky-600 hover:underline cursor-pointer">View Details &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
