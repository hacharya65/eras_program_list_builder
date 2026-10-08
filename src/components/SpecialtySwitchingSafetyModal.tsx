'use client';

import React from 'react';
import {
  AlertTriangle,
  Download,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { getDefaultAdvisorForSpecialty } from '@/domain/advising-intake-models';
import { SchoolListItem } from '@/domain/school-list-models';

interface SpecialtySwitchingSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpecialty: string;
  newSpecialty: string;
  savedPrograms: SchoolListItem[];
  onConfirmSwitch: () => void;
}

export function SpecialtySwitchingSafetyModal({
  isOpen,
  onClose,
  currentSpecialty,
  newSpecialty,
  savedPrograms,
  onConfirmSwitch,
}: SpecialtySwitchingSafetyModalProps) {
  if (!isOpen) return null;

  const newAdvisorName = getDefaultAdvisorForSpecialty(newSpecialty);

  const handleDownloadCsv = () => {
    if (savedPrograms.length === 0) return;

    const headers = ['Program Name', 'City', 'State', 'Tier', 'Signal'];
    const rows = savedPrograms.map((p) => [
      `"${p.programName.replace(/"/g, '""')}"`,
      `"${p.city || ''}"`,
      `"${p.state || ''}"`,
      `"${p.tier || 'target'}"`,
      `"${p.signal || 'none'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentSpecialty.toLowerCase().replace(/[^a-z0-9]/g, '_')}_programs_backup.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-amber-300 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Target Specialty Switch</h3>
              <p className="text-xs text-slate-500">2027 Institutional Protocol & Data Protection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Change Banner */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center gap-3 text-xs font-bold text-slate-800">
          <span className="px-3 py-1 bg-white rounded border border-slate-300">{currentSpecialty}</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="px-3 py-1 bg-[#EAF2EE] text-[#1F3A30] rounded border border-[#7EAE9B]">
            {newSpecialty}
          </span>
        </div>

        {/* Impact Checklist */}
        <div className="space-y-2 text-xs text-slate-700 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            What happens upon confirming this specialty switch:
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-amber-950">
            <li>
              <strong>School List Matrix Cleared:</strong> Your {savedPrograms.length} shortlisted {currentSpecialty}{' '}
              program(s) will be cleared. Please export a CSV backup below!
            </li>
            <li>
              <strong>Assigned Advisor Hand-off:</strong> Your default specialty advisor will update to{' '}
              <strong>{newAdvisorName}</strong>.
            </li>
            <li>
              <strong>Writing Drafts Preserved:</strong> Your Personal Statement drafts, snapshots, and comments are
              safely kept in audit history.
            </li>
          </ul>
        </div>

        {/* CSV Export Trigger */}
        {savedPrograms.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="font-bold text-slate-800">Export Program List Backup</div>
              <div className="text-[11px] text-slate-500">{savedPrograms.length} programs ready for CSV export</div>
            </div>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Download CSV
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmSwitch}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            Confirm Switch & Clear Programs
          </button>
        </div>
      </div>
    </div>
  );
}
