'use client';

import React from 'react';
import { AdminCohortContext } from '@/domain/types';
import { AlumniResident } from '@/domain/alumni-models';
import { DeanAlumniManager } from './DeanAlumniManager';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Building,
  Lock,
} from 'lucide-react';

interface AdminPortalProps {
  context: AdminCohortContext;
  onAddAlumnus?: (resident: Omit<AlumniResident, 'id'>) => void;
  onUpdateAlumnus?: (id: string, updates: Partial<AlumniResident>) => void;
  onDeleteAlumnus?: (id: string) => void;
}

export function AdminPortal({
  context,
  onAddAlumnus,
  onUpdateAlumnus,
  onDeleteAlumnus,
}: AdminPortalProps) {
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

        {/* FERPA / Privacy Badge & MSPE Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => alert("Opening Dean's Office MSPE Student Dossier Archive. Compiled application packets ready for Dean's letter compilation.")}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            MSPE Application Packets
          </button>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center gap-3">
            <Lock className="w-5 h-5 text-slate-600" />
            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">FERPA Privacy Guard Active</div>
              <div className="font-semibold text-slate-800">Metadata & Turnaround Only</div>
              <div className="text-slate-500 text-[11px]">Confidential essay text is restricted to assigned mentors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dean-Safe Intake Governance & Cohort Metrics */}
      <div className="bg-white rounded-xl border border-[#D6E5DF] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4E8773]" />
            <h2 className="text-base font-bold text-[#1F3A30]">Specialty Advising Intake Governance (Dean Oversight)</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold hidden md:inline">
            Confidential narrative text restricted to 1-on-1 faculty advisors per FERPA policy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F4F8F6] border border-[#D6E5DF]">
            <div className="text-slate-600 font-medium">Intake Completion Rate</div>
            <div className="text-2xl font-extrabold text-[#1F3A30] mt-1">94%</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              112 of 119 MS4s Complete
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-600 font-medium">Average Step 2 CK Cohort Benchmark</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">254.8</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Range: 228 – 274 &bull; 89% Scores Reported
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-600 font-medium">Core Clerkship Honors Distribution</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">4.2 / 7</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Median Honors across FM, IM, Surg, Peds, OB/GYN, Neuro, Psych
            </div>
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

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Institutional Turnaround Policy (14-Day SLA Active):</strong>
              <p className="mt-0.5 text-amber-800">
                To protect students from pre-season anxiety and review delays, Student Affairs monitors turnaround times. Confidential essay text is never exposed to administrative viewers.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student Advisee</th>
                  <th className="px-4 py-3 font-semibold">Assigned Faculty Reviewer</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Elapsed Days</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">Alex Rivera</td>
                  <td className="px-4 py-3 text-slate-700">Dr. Marcus Chen</td>
                  <td className="px-4 py-3 text-slate-500">Internal Medicine</td>
                  <td className="px-4 py-3 font-bold text-red-600">16 days in queue</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                      +2d Breached
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert('Administrative Nudge dispatched to Dr. Marcus Chen (Internal Medicine).')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors"
                    >
                      Send Nudge
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">Jordan Lee</td>
                  <td className="px-4 py-3 text-slate-700">Dr. Sarah Vance</td>
                  <td className="px-4 py-3 text-slate-500">General Surgery</td>
                  <td className="px-4 py-3 font-bold text-red-600">19 days in queue</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                      +5d Breached
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert('Administrative Nudge dispatched to Dr. Sarah Vance (General Surgery).')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors"
                    >
                      Send Nudge
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">Priya Patel</td>
                  <td className="px-4 py-3 text-slate-700">Dr. Robert Hayes</td>
                  <td className="px-4 py-3 text-slate-500">Pediatrics</td>
                  <td className="px-4 py-3 font-bold text-amber-600">12 days in queue</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Day 10 Auto-Nudged
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert('Administrative Courtesy Follow-up logged for Pediatrics.')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Follow-up
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alumni Residency Network Management Component */}
      <DeanAlumniManager
        alumniResidents={context.alumniResidents}
        onAddAlumnus={onAddAlumnus}
        onUpdateAlumnus={onUpdateAlumnus}
        onDeleteAlumnus={onDeleteAlumnus}
      />
    </div>
  );
}
