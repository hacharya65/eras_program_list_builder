'use client';

import React from 'react';
import { AdminCohortContext } from '@/domain/types';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Building,
  Lock
} from 'lucide-react';

interface AdminPortalProps {
  context: AdminCohortContext;
}

export function AdminPortal({ context }: AdminPortalProps) {
  const { admin, institution, cohortSummary, overdueReviews } = context;

  const funnelSteps = [
    { label: 'Drafting Started', count: cohortSummary.draftingCount, pct: Math.round((cohortSummary.draftingCount / cohortSummary.totalStudents) * 100), color: 'bg-slate-400' },
    { label: 'Submitted for Review', count: cohortSummary.submittedCount, pct: Math.round((cohortSummary.submittedCount / cohortSummary.totalStudents) * 100), color: 'bg-amber-500' },
    { label: 'In Faculty Review', count: cohortSummary.inReviewCount, pct: Math.round((cohortSummary.inReviewCount / cohortSummary.totalStudents) * 100), color: 'bg-sky-500' },
    { label: 'Revisions Active', count: cohortSummary.revisionsRequestedCount, pct: Math.round((cohortSummary.revisionsRequestedCount / cohortSummary.totalStudents) * 100), color: 'bg-purple-500' },
    { label: 'Endorsed & Ready', count: cohortSummary.endorsedCount, pct: Math.round((cohortSummary.endorsedCount / cohortSummary.totalStudents) * 100), color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Welcome Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Student Affairs & Deans Office
            </span>
            <span className="text-xs text-slate-500">{institution.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Institutional Oversight: {admin.name}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            MS4 Cohort Size: <strong className="text-slate-900">{cohortSummary.totalStudents} Students</strong> | SLA Target: <strong className="text-slate-900">{institution.defaultSlaDays} Days</strong>
          </p>
        </div>

        {/* FERPA / Privacy Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center gap-3">
          <Lock className="w-5 h-5 text-slate-600" />
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">FERPA Privacy Guard Active</div>
            <div className="font-semibold text-slate-800">Metadata & Turnaround Only</div>
            <div className="text-slate-500 text-[11px]">Confidential essay text is restricted to assigned mentors</div>
          </div>
        </div>
      </div>

      {/* Cohort Funnel Analytics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">Class of 2027 Advising Pipeline Funnel</h2>
          </div>
          <span className="text-xs text-slate-500">Live Aggregated Metrics</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {funnelSteps.map((step) => (
            <div key={step.label} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">{step.label}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{step.count}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${step.color}`}></span>
                {step.pct}% of cohort
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Breach Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">SLA Breach Escalation Queue (&gt;14 Days)</h3>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
              {cohortSummary.slaBreachedCount} Flagged Reviews
            </span>
          </div>
          <span className="text-xs text-slate-500">Auto-routes to Dean for Advisor Support</span>
        </div>

        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">3 Student Submissions currently exceed the 14-day turnaround target.</strong>
              <p className="mt-1 text-amber-800">
                Automated Day 10 reminders were dispatched. Student Affairs advisors can gently check in with the respective department chairs to relieve clinical burdens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
