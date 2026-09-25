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
  Stethoscope
} from 'lucide-react';

interface AdvisorPortalProps {
  context: AdvisorDashboardContext;
}

export function AdvisorPortal({ context }: AdvisorPortalProps) {
  const { advisor, advisees, pendingReviews } = context;

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
                {pendingReviews.map((rev) => (
                  <div key={rev.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{rev.studentName}</div>
                      <div className="text-xs text-slate-500">{rev.documentType}</div>
                    </div>
                    <button className="px-3 py-1.5 bg-sky-600 text-white text-xs rounded-lg font-medium">
                      Review Draft
                    </button>
                  </div>
                ))}
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
