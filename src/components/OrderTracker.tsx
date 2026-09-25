'use client';

import React from 'react';
import { ReviewStage } from '@/domain/types';
import {
  FileEdit,
  Send,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface OrderTrackerProps {
  currentStage: ReviewStage;
  submittedAt?: string;
  inReviewAt?: string;
  completedAt?: string;
}

export function OrderTracker({
  currentStage,
  submittedAt,
  inReviewAt,
  completedAt,
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Clinical Order Pipeline Tracking
          </h3>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Eliminates email back-and-forth
        </span>
      </div>

      {/* Progress Stepper Bar */}
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
  );
}
