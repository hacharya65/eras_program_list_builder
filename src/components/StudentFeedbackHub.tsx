'use client';

import React, { useState } from 'react';
import { DocumentFeedbackSummary, ReviewStage } from '@/domain/types';
import { AnnotatedDocumentViewer } from './collaborative/AnnotatedDocumentViewer';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Star,
  MessageSquare,
  History,
  Edit3,
  Calendar,
  Sparkles,
  CheckCircle2,
  Columns,
  BookOpen
} from 'lucide-react';

interface StudentFeedbackHubProps {
  latestFeedback?: DocumentFeedbackSummary;
  feedbackHistory: DocumentFeedbackSummary[];
  currentDraftVersion: number;
  personalStatementStage: ReviewStage;
  onBack: () => void;
  onStartRevision: (targetVersion: number) => void;
  onOpenEditor: (initialMode?: 'split' | 'editor') => void;
}

export function StudentFeedbackHub({
  latestFeedback,
  feedbackHistory,
  currentDraftVersion,
  personalStatementStage,
  onBack,
  onStartRevision,
  onOpenEditor,
}: StudentFeedbackHubProps) {
  // Select active revision feedback to inspect (defaults to latest)
  const [selectedVersion, setSelectedVersion] = useState<number>(() => {
    return latestFeedback?.versionNumber || 1;
  });

  const activeFeedbackSummary =
    feedbackHistory.find((f) => f.versionNumber === selectedVersion) ||
    latestFeedback;

  if (!activeFeedbackSummary) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Faculty Feedback Available Yet</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Your personal statement is either still in local draft or currently queued with faculty review. Once your advisor completes their rubric and leaves guidance notes, they will appear here.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  const { feedback, advisor, snapshot, versionNumber } = activeFeedbackSummary;
  const { evaluation } = feedback;
  const isEndorsed = evaluation.overallVerdict === 'ready_to_lock';
  const isLatestRevision = latestFeedback?.versionNumber === versionNumber;

  // Average pillar score
  const avgScore = (
    (evaluation.narrativeMotivation +
      evaluation.clinicalReflection +
      evaluation.toneAndFit +
      evaluation.structureAndMechanics) /
    4
  ).toFixed(1);

  const [activeTab, setActiveTab] = useState<'summary' | 'annotations'>('summary');

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="feedback-hub-back-btn"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                Faculty Review Hub
              </span>
              <h1 className="text-lg font-bold text-slate-900">
                Personal Statement Feedback: v{versionNumber}
              </h1>
              {isLatestRevision && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Most Recent Review
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review advisor guidance notes, rubric scores, and inline markups before drafting your next iteration.
            </p>
          </div>
        </div>

        {/* Multi-Revision Historical Selector */}
        {feedbackHistory.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <History className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <span className="text-xs font-medium text-slate-600">Revision:</span>
            <select
              id="feedback-version-selector"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
            >
              {feedbackHistory.map((item) => (
                <option key={item.versionNumber} value={item.versionNumber}>
                  v{item.versionNumber} Review ({item.feedback.evaluation.overallVerdict === 'ready_to_lock' ? 'Endorsed' : 'Revisions Requested'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Review Verdict & Action Prompt Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
          isEndorsed
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : 'bg-purple-50/80 border-purple-300 text-purple-950'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isEndorsed ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
            }`}
          >
            {isEndorsed ? <ShieldCheck className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">
                {isEndorsed
                  ? `Application Endorsed: Ready to Lock (v${versionNumber})`
                  : `Revisions Requested by Faculty on v${versionNumber}`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/80 border border-slate-200 text-slate-700 shadow-2xs">
                Score: {avgScore} / 5.0
              </span>
            </div>
            <div className="text-xs mt-1 opacity-90 flex flex-wrap items-center gap-2">
              <span>
                Evaluated by <strong>{advisor.name}</strong> ({advisor.specialty})
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(feedback.submittedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {snapshot.changelogNote && (
                <>
                  <span>&bull;</span>
                  <span className="italic truncate max-w-md">"{snapshot.changelogNote}"</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: Start Next Iteration / Open Split Screen */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEndorsed && (
            <>
              {currentDraftVersion > versionNumber && personalStatementStage === 'drafting' ? (
                <button
                  id="continue-revision-draft-btn"
                  onClick={() => onOpenEditor('split')}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <Columns className="w-4 h-4" />
                  <span>Resume v{currentDraftVersion} (Split-Screen)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="create-next-revision-btn"
                  onClick={() => {
                    onStartRevision(versionNumber + 1);
                    onOpenEditor('split');
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Create v{versionNumber + 1} Revision & Iterate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {isEndorsed && (
            <button
              onClick={() => onOpenEditor('editor')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>View Endorsed Text</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('summary')}
          id="tab-feedback-summary"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-400" />
          Guidance Notes &amp; Rubric Scoring
        </button>
        <button
          onClick={() => setActiveTab('annotations')}
          id="tab-feedback-annotations"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'annotations'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Faculty Markup &amp; Anchored Comments
        </button>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-6">
          {/* Prominent Faculty Guidance Notes Block */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-50/70 border-b border-sky-100 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-sky-950">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Faculty Guidance Notes on v{versionNumber}</span>
              </div>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded">
                Written by {advisor.name}
              </span>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 relative">
                <div className="absolute top-3 right-4 text-[10px] text-slate-400 font-mono">
                  REF: REV-{versionNumber}
                </div>
                <p
                  id="faculty-guidance-notes-content"
                  className="text-sm text-slate-800 leading-relaxed font-mono whitespace-pre-wrap selection:bg-sky-100"
                >
                  {evaluation.generalNotes}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Pillars Clinical Rubric Scorecards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinical Rubric Evaluation (4 Pillars)
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                AAMC Specialty-Aligned Benchmarks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pillar 1 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  1. Narrative Motivation
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>{evaluation.narrativeMotivation}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 5</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      evaluation.narrativeMotivation >= 4
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {evaluation.narrativeMotivation >= 4 ? 'Strong' : 'Needs Focus'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Authentic trajectory and clarity of specialty choice without clichés.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  2. Clinical Reflection
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>{evaluation.clinicalReflection}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 5</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      evaluation.clinicalReflection >= 4
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {evaluation.clinicalReflection >= 4 ? 'Strong' : 'Needs Focus'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Depth of patient encounter analysis and demonstration of clinical empathy.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  3. Tone &amp; Humility
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>{evaluation.toneAndFit}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 5</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      evaluation.toneAndFit >= 4
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {evaluation.toneAndFit >= 4 ? 'Balanced' : 'Review Tone'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Professional humility, coachability, and alignment with resident culture.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  4. Flow &amp; Mechanics
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>{evaluation.structureAndMechanics}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 5</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      evaluation.structureAndMechanics >= 4
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {evaluation.structureAndMechanics >= 4 ? 'Polished' : 'Refine'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Structural transitions, paragraph cohesion, and clean ERAS formatting.
                </p>
              </div>
            </div>
          </div>

          {/* Action Prompt Callout Footer */}
          {!isEndorsed && (
            <div className="p-6 bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-purple-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Ready to address Dr. {advisor.name.split(' ')[1] || advisor.name}'s recommendations?</span>
                </div>
                <p className="text-xs text-purple-800 max-w-xl">
                  Drafting mode provides a split-screen canvas where these notes and inline comments stay side-by-side with your writing canvas.
                </p>
              </div>

              <button
                onClick={() => {
                  if (currentDraftVersion <= versionNumber) {
                    onStartRevision(versionNumber + 1);
                  }
                  onOpenEditor('split');
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <span>Launch Split-Screen Iteration Canvas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Anchored Comments & Inline Markup Tab */
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-purple-600" />
              Viewing faculty highlights, strikethroughs, and anchored margin comments on{' '}
              <strong>v{versionNumber}</strong>.
            </span>
            <button
              onClick={() => onOpenEditor('split')}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 underline flex items-center gap-1"
            >
              Open Split-Screen Canvas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <AnnotatedDocumentViewer
            documentId="personal_statement"
            documentVersionId={`v${versionNumber}`}
            versionNumber={versionNumber}
            documentTitle={`Personal Statement v${versionNumber}`}
            documentSubtitle={`Faculty reviewed snapshot (${new Date(feedback.submittedAt).toLocaleDateString()})`}
            text={snapshot.content}
            userRole="applicant"
            currentUserId="stu-101"
            currentUserName="Applicant"
            readOnly={true}
          />
        </div>
      )}
    </div>
  );
}
