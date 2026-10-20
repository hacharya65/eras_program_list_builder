'use client';

import React, { useState } from 'react';
import {
  SchoolListItem,
  exportSchoolListToCsv,
  loadItemsForSpecialty,
  getStoredApplicantStep2Ck,
} from '@/domain/school-list-models';
import {
  Download,
  Printer,
  Compass,
  ArrowLeft,
  Sparkles,
  Building,
  MapPin,
  Award,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface SimplifiedProgramListRosterProps {
  studentId: string;
  studentName?: string;
  medicalSchool?: string;
  specialty: string;
  onBack?: () => void;
  onNavigateToSchoolList?: () => void;
}

export function SimplifiedProgramListRoster({
  studentId,
  studentName = 'Alex Rivera',
  medicalSchool = 'Geisinger Commonwealth School of Medicine',
  specialty,
  onBack,
  onNavigateToSchoolList,
}: SimplifiedProgramListRosterProps) {
  const applicantStep2Ck = getStoredApplicantStep2Ck(studentId);
  const [items] = useState<SchoolListItem[]>(() =>
    loadItemsForSpecialty(specialty, applicantStep2Ck, studentId)
  );

  const [tierFilter, setTierFilter] = useState<'all' | 'reach' | 'target' | 'safety'>('all');
  const [signalFilter, setSignalFilter] = useState<'all' | 'gold' | 'silver' | 'none'>('all');

  const filteredItems = items.filter((item) => {
    if (tierFilter !== 'all') {
      const itemTier = item.tier || 'target';
      if (itemTier !== tierFilter) return false;
    }
    if (signalFilter !== 'all') {
      const itemSignal = item.signal || 'none';
      if (itemSignal !== signalFilter) return false;
    }
    return true;
  });

  const goldCount = items.filter((i) => i.signal === 'gold').length;
  const silverCount = items.filter((i) => i.signal === 'silver').length;
  const reachCount = items.filter((i) => i.tier === 'reach').length;
  const targetCount = items.filter((i) => !i.tier || i.tier === 'target').length;
  const safetyCount = items.filter((i) => i.tier === 'safety').length;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportCsv = () => {
    exportSchoolListToCsv(items, specialty, studentName);
  };

  return (
    <div className="space-y-6">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10pt !important;
          }
          nav, header, aside, .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr.print-row {
            page-break-inside: avoid !important;
          }
          th {
            background-color: #f8fafc !important;
            color: #1e293b !important;
            border-bottom: 2px solid #cbd5e1 !important;
            padding: 6pt 6pt !important;
            font-size: 8.5pt !important;
          }
          td {
            padding: 6pt 6pt !important;
            border-bottom: 1px solid #e2e8f0 !important;
            font-size: 8.5pt !important;
          }
          .print-badge {
            border: 1px solid #94a3b8 !important;
            color: #0f172a !important;
            background: #f8fafc !important;
          }
        }
      `}</style>

      {/* Top Header & Actions Toolbar */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Program List &amp; Signals Roster
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Official Packet View
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simplified, high-legibility dossier view ready for institutional advising review, CSV export, or PDF printing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToSchoolList && (
            <button
              type="button"
              onClick={onNavigateToSchoolList}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-slate-600" />
              <span>Full Interactive Matrix</span>
            </button>
          )}

          {/* Export to CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download school list as CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Print / Save to PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Print or Save to PDF via clean browser layout"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save to PDF</span>
          </button>
        </div>
      </div>

      {/* Dossier Document Sheet */}
      <div className="print-full-width bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Institutional Document Header */}
        <div className="p-6 sm:p-8 bg-linear-to-r from-slate-50 via-white to-emerald-50/30 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                <span>{medicalSchool}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {studentName} — ERAS Strategic Program List
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-600">
                <div>
                  Target Specialty: <strong className="text-slate-900">{specialty}</strong>
                </div>
                <div>•</div>
                <div>
                  Step 2 CK Score: <strong className="font-mono text-slate-900">{applicantStep2Ck}</strong>
                </div>
                <div>•</div>
                <div>
                  Generated: <span className="font-medium text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Badge Cluster */}
            <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5 shrink-0">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white">
                {items.length} Programs Tracked
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {goldCount} Gold
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {silverCount} Silver
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <span>Reach: {reachCount}</span>
                <span>•</span>
                <span>Target: {targetCount}</span>
                <span>•</span>
                <span>Safety: {safetyCount}</span>
              </div>
            </div>
          </div>

          {/* Interactive Filter Pills (Hidden When Printing) */}
          <div className="no-print mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold flex items-center gap-1 text-[11px]">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Tier:
              </span>
              {(['all', 'reach', 'target', 'safety'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTierFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer capitalize ${
                    tierFilter === t
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'all' ? `All (${items.length})` : `${t} (${items.filter((i) => (i.tier || 'target') === t).length})`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Signal:</span>
              {(['all', 'gold', 'silver', 'none'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSignalFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer capitalize ${
                    signalFilter === s
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simplified Program Table with Well-Defined Vertically Aligned Columns */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Compass className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No programs found matching the selected filters.</p>
            <p className="text-xs text-slate-400">Try adjusting your tier or signal filter above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-y border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-3 w-10 text-center">#</th>
                  <th scope="col" className="py-3 px-4 min-w-[220px]">Program &amp; ACGME</th>
                  <th scope="col" className="py-3 px-3 min-w-[130px]">Location</th>
                  <th scope="col" className="py-3 px-3 min-w-[130px]">Region</th>
                  <th scope="col" className="py-3 px-3 min-w-[110px] text-center">Step 2 CK (80%)</th>
                  <th scope="col" className="py-3 px-3 min-w-[120px] text-center">Preference Signal</th>
                  <th scope="col" className="py-3 px-3 min-w-[110px] text-center">Selectivity Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.map((program, idx) => {
                  const tier = program.tier || 'target';
                  const signal = program.signal || 'none';

                  return (
                    <tr
                      key={program.id || idx}
                      className="print-row hover:bg-slate-50/80 transition-colors"
                    >
                      {/* # Number */}
                      <td className="py-3.5 px-3 text-center align-top">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                          {idx + 1}
                        </span>
                      </td>

                      {/* Program Name & ACGME */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm leading-snug">
                              {program.programName}
                            </h3>
                            {program.track && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {program.track}
                              </span>
                            )}
                          </div>
                          {(program.programNumber || program.programId) && (
                            <div className="font-mono text-[11px] text-slate-400">
                              ACGME: {program.programNumber || program.programId}
                            </div>
                          )}
                          {/* Optional Notes */}
                          {(program.notes || program.signalExplanation || program.advisorNotes) && (
                            <p className="text-[11px] text-slate-600 italic bg-amber-50/70 border border-amber-200/60 rounded px-2 py-1 mt-1 max-w-lg">
                              Strategy Note: {program.notes || program.signalExplanation || program.advisorNotes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Location (City, State) */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {program.city || program.state
                              ? `${program.city ? `${program.city}, ` : ''}${program.state || ''}`
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Region */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <span className="text-xs text-slate-600 font-medium">
                          {program.region || '—'}
                        </span>
                      </td>

                      {/* Middle-80% Step 2 CK Range */}
                      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px]">
                          <span className="font-mono font-bold text-slate-700">
                            {program.step2ScoreRange ||
                              (program.step2Min ? `${program.step2Min} - ${program.step2Max}` : 'N/A')}
                          </span>
                        </div>
                      </td>

                      {/* Preference Signal */}
                      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                        {signal === 'gold' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                            <span>Gold Signal</span>
                          </span>
                        )}
                        {signal === 'silver' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>Silver Signal</span>
                          </span>
                        )}
                        {signal === 'none' && (
                          <span className="text-[11px] text-slate-400 px-2 py-1">
                            No Signal
                          </span>
                        )}
                      </td>

                      {/* Selectivity Tier */}
                      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                        <span
                          className={`print-badge px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            tier === 'reach'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : tier === 'target'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Dossier Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Official institutional record formatted for 2027 MyERAS Season submission.
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Total Programs: {items.length} | Generated {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
