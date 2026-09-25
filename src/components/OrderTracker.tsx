'use client';

import React from 'react';
import { ReviewStage } from '@/domain/types';
import {
  FileEdit,
  Send,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  FileText,
  Briefcase,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface OrderTrackerProps {
  currentStage: ReviewStage;
  submittedAt?: string;
  inReviewAt?: string;
  completedAt?: string;
  personalStatementChars?: number;
  personalStatementVersion?: number;
  experiencesCount?: number;
  experiencesMeaningfulCount?: number;
  scholarlyCount?: number;
  scholarlyMeaningfulCount?: number;
  schoolListCount?: number;
  schoolListSignalsAssigned?: number;
  schoolListSignalsBudget?: number;
}

export function OrderTracker({
  currentStage,
  submittedAt,
  inReviewAt,
  completedAt,
  personalStatementChars = 0,
  personalStatementVersion = 1,
  experiencesCount = 0,
  experiencesMeaningfulCount = 0,
  scholarlyCount = 0,
  scholarlyMeaningfulCount = 0,
  schoolListCount = 0,
  schoolListSignalsAssigned = 0,
  schoolListSignalsBudget = 15,
}: OrderTrackerProps) {
  const stages: {
    key: ReviewStage;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'drafting',
      label: '1. Drafting',
      sublabel: 'Student working locally',
      icon: <FileEdit className="w-4 h-4" />,
    },
    {
      key: 'submitted',
      label: '2. Submitted',
      sublabel: submittedAt ? 'Queued with Advisor' : 'Awaiting Submission',
      icon: <Send className="w-4 h-4" />,
    },
    {
      key: 'in_review',
      label: '3. In Review',
      sublabel: inReviewAt ? 'Advisor actively reading' : 'Awaiting Open',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      key: 'revisions_requested',
      label: '4. Revisions Active',
      sublabel: 'Feedback ready for edits',
      icon: <RotateCcw className="w-4 h-4" />,
    },
    {
      key: 'endorsed',
      label: '5. Endorsed',
      sublabel: 'Signed off for ERAS',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStageIndex = (stage: ReviewStage) => {
    switch (stage) {
      case 'drafting': return 0;
      case 'submitted': return 1;
      case 'in_review': return 2;
      case 'revisions_requested': return 3;
      case 'endorsed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  // Percentages for individual component progress bars
  const expPercent = Math.min(Math.round((experiencesCount / 10) * 100), 100);
  const psPercent = Math.min(Math.round((personalStatementChars / 5300) * 100), 100);
  const scholarlyPercent = Math.min(Math.round((scholarlyCount / 5) * 100), 100);
  const schoolListPercent = Math.min(
    Math.round((schoolListSignalsAssigned / (schoolListSignalsBudget || 15)) * 100),
    100
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
      {/* Header & Stage Machine */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Clinical Order Pipeline Tracking
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Automated Institutional Turnaround &amp; Review Workflow
          </span>
        </div>

        {/* 5-Stage Stepper Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {stages.map((stage, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            let cardStyle = 'bg-slate-50 border-slate-200 text-slate-400';
            let iconStyle = 'bg-slate-200 text-slate-500';

            if (isCurrent) {
              if (stage.key === 'revisions_requested') {
                cardStyle = 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-500/20';
                iconStyle = 'bg-purple-600 text-white shadow-sm';
              } else if (stage.key === 'endorsed') {
                cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20';
                iconStyle = 'bg-emerald-600 text-white shadow-sm';
              } else if (stage.key === 'in_review') {
                cardStyle = 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20';
                iconStyle = 'bg-blue-600 text-white shadow-sm animate-pulse';
              } else {
                cardStyle = 'bg-sky-50 border-sky-300 text-sky-900 ring-2 ring-sky-500/20';
                iconStyle = 'bg-sky-600 text-white shadow-sm';
              }
            } else if (isPassed) {
              cardStyle = 'bg-emerald-50/50 border-emerald-200 text-emerald-900';
              iconStyle = 'bg-emerald-500 text-white';
            }

            return (
              <div
                key={stage.key}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${cardStyle}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${iconStyle}`}>
                    {stage.icon}
                  </span>
                  {isPassed && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                  )}
                </div>

                <div>
                  <div className="font-bold text-xs">{stage.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5 leading-tight">{stage.sublabel}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Progress Bars for All Core Application Components */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Core Application Components Progress
          </h4>
          <span className="text-[11px] text-slate-500">Live ERAS Readiness Bars</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Component 1: Selected Experiences */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Selected Experiences
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {experiencesCount} / 10
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${expPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{experiencesMeaningfulCount} / 3 Starred</span>
              <span className="font-semibold text-emerald-800">{expPercent}% Complete</span>
            </div>
          </div>

          {/* Component 2: Scholarly Works */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Scholarly Works
              </span>
              <span className="text-xs font-mono font-bold text-indigo-700">
                {scholarlyCount} Recorded
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${scholarlyPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{scholarlyMeaningfulCount} / 3 Starred</span>
              <span className="font-semibold text-indigo-800">{scholarlyPercent}% Target</span>
            </div>
          </div>

          {/* Component 3: Strategic School List */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Strategic School List
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">
                {schoolListCount} Programs
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${schoolListPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{schoolListSignalsAssigned} / {schoolListSignalsBudget} Tokens Assigned</span>
              <span className="font-semibold text-amber-800">{schoolListPercent}% Budget</span>
            </div>
          </div>

          {/* Component 4: Personal Statement */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                Personal Statement
              </span>
              <span className="text-xs font-mono font-bold text-sky-700">
                v{personalStatementVersion}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  personalStatementChars > 5300 ? 'bg-red-500' : 'bg-sky-500'
                }`}
                style={{ width: `${psPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{personalStatementChars.toLocaleString()} / 5,300 Chars</span>
              <span className="font-semibold text-sky-800">{psPercent}% of 1 Page</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
