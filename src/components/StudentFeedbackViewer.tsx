'use client';

import React from 'react';
import { ReviewFeedback, UserProfile } from '@/domain/types';
import {
  CheckCircle2,
  RotateCcw,
  Star,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

interface StudentFeedbackViewerProps {
  feedback: ReviewFeedback;
  advisor: UserProfile;
  versionNumber: number;
  onCreateRevision: () => void;
}

export function StudentFeedbackViewer({
  feedback,
  advisor,
  versionNumber,
  onCreateRevision,
}: StudentFeedbackViewerProps) {
  const { evaluation } = feedback;
  const isEndorsed = evaluation.overallVerdict === 'ready_to_lock';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Header Verdict Banner */}
      <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
        isEndorsed
          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
          : 'bg-purple-50 border-purple-300 text-purple-950'
      }`}>
        <div className="flex items-start gap-3">
          {isEndorsed ? (
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <RotateCcw className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-bold">
              {isEndorsed ? 'Application Endorsed: Ready to Lock' : 'Revisions Requested on v' + versionNumber}
            </div>
            <p className="text-xs mt-0.5 opacity-90">
              Evaluated by {advisor.name} ({advisor.specialty}) on {new Date(feedback.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {!isEndorsed && (
          <button
            onClick={onCreateRevision}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
          >
            Create v{versionNumber + 1} Revision <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4 Pillars Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-semibold truncate">1. Narrative Motivation</div>
          <div className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            {evaluation.narrativeMotivation} / 5
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-semibold truncate">2. Clinical Reflection</div>
          <div className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            {evaluation.clinicalReflection} / 5
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-semibold truncate">3. Tone &amp; Humility</div>
          <div className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            {evaluation.toneAndFit} / 5
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-semibold truncate">4. Flow &amp; Mechanics</div>
          <div className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            {evaluation.structureAndMechanics} / 5
          </div>
        </div>
      </div>

      {/* Advisor Feedback Notes */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <MessageSquare className="w-4 h-4 text-sky-600" />
          Faculty Guidance Notes:
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
          {evaluation.generalNotes}
        </p>
      </div>
    </div>
  );
}
