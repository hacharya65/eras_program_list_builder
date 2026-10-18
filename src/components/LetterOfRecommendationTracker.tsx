'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Mail,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  LetterWriterRequest,
  LetterRequestStatus,
  ProgramLetterRequirement,
  loadLetterWriterRequests,
  saveLetterWriterRequests,
  loadProgramLetterRequirements,
  saveProgramLetterRequirements,
  analyzeProgramLetterGaps,
} from '@/domain/lor-models';
import { SchoolListItem, loadItemsForSpecialty } from '@/domain/school-list-models';

interface LetterOfRecommendationTrackerProps {
  specialty?: string;
  studentId?: string;
  onOpenSchoolList?: () => void;
}

export function LetterOfRecommendationTracker({
  specialty = 'Internal Medicine',
  studentId,
  onOpenSchoolList,
}: LetterOfRecommendationTrackerProps) {
  const [writers, setWriters] = useState<LetterWriterRequest[]>(() => loadLetterWriterRequests(studentId));
  const [requirements, setRequirements] = useState<Record<string, ProgramLetterRequirement>>(() =>
    loadProgramLetterRequirements()
  );
  const [savedPrograms, setSavedPrograms] = useState<SchoolListItem[]>([]);
  const [isAddWriterModalOpen, setIsAddWriterModalOpen] = useState(false);
  const [editingWriter, setEditingWriter] = useState<LetterWriterRequest | null>(null);

  // New writer form state
  const [writerName, setWriterName] = useState('');
  const [writerTitle, setWriterTitle] = useState('');
  const [writerSpecialty, setWriterSpecialty] = useState(specialty);
  const [institution, setInstitution] = useState('Geisinger Medical Center');
  const [letterType, setLetterType] = useState<'Department Chair / SLOE' | 'Clinical Sub-I / Attending' | 'Research Mentor' | 'General'>(
    'Clinical Sub-I / Attending'
  );
  const [status, setStatus] = useState<LetterRequestStatus>('asked');
  const [notes, setNotes] = useState('');
  const [assignedPrograms, setAssignedPrograms] = useState<string[]>([]);

  // Sync writers and programs when specialty or studentId changes
  useEffect(() => {
    setWriters(loadLetterWriterRequests(studentId));
    setRequirements(loadProgramLetterRequirements());
  }, [studentId, specialty]);

  // Real-time synchronization when requirements or writers update across tabs or matrix
  useEffect(() => {
    const handleSync = () => {
      setRequirements(loadProgramLetterRequirements());
      setWriters(loadLetterWriterRequests(studentId));
    };
    window.addEventListener('program_lor_requirements_updated', handleSync);
    window.addEventListener('letter_writers_updated', handleSync);
    return () => {
      window.removeEventListener('program_lor_requirements_updated', handleSync);
      window.removeEventListener('letter_writers_updated', handleSync);
    };
  }, [studentId]);

  // Load programs from school list
  useEffect(() => {
    const progs = loadItemsForSpecialty(specialty, undefined, studentId);
    setSavedPrograms(progs);
  }, [specialty, studentId]);

  const handleOpenAddWriter = () => {
    setEditingWriter(null);
    setWriterName('');
    setWriterTitle('');
    setWriterSpecialty(specialty);
    setInstitution('Geisinger Medical Center');
    setLetterType('Clinical Sub-I / Attending');
    setStatus('asked');
    setNotes('');
    setAssignedPrograms([]);
    setIsAddWriterModalOpen(true);
  };

  const handleOpenEditWriter = (writer: LetterWriterRequest) => {
    setEditingWriter(writer);
    setWriterName(writer.writerName);
    setWriterTitle(writer.writerTitle);
    setWriterSpecialty(writer.specialty);
    setInstitution(writer.institution);
    setLetterType(writer.letterType);
    setStatus(writer.status);
    setNotes(writer.notes || '');
    setAssignedPrograms(writer.assignedProgramIds || []);
    setIsAddWriterModalOpen(true);
  };

  const handleSaveWriter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writerName.trim()) return;

    let updated: LetterWriterRequest[];
    if (editingWriter) {
      updated = writers.map((w) =>
        w.id === editingWriter.id
          ? {
              ...w,
              writerName,
              writerTitle,
              specialty: writerSpecialty,
              institution,
              letterType,
              status,
              notes,
              assignedProgramIds: assignedPrograms,
            }
          : w
      );
    } else {
      const newWriter: LetterWriterRequest = {
        id: `lor-${Date.now()}`,
        writerName,
        writerTitle,
        specialty: writerSpecialty,
        institution,
        letterType,
        status,
        notes,
        assignedProgramIds: assignedPrograms,
      };
      updated = [...writers, newWriter];
    }

    setWriters(updated);
    saveLetterWriterRequests(updated, studentId);
    setIsAddWriterModalOpen(false);
  };

  const handleDeleteWriter = (id: string) => {
    if (confirm('Delete this letter writer record?')) {
      const updated = writers.filter((w) => w.id !== id);
      setWriters(updated);
      saveLetterWriterRequests(updated, studentId);
    }
  };

  const handleUpdateProgramRequirement = (programId: string, count: number) => {
    const updated = {
      ...requirements,
      [programId]: {
        programId,
        requiredLettersCount: Math.max(1, count),
        checkedDate: new Date().toLocaleDateString(),
      },
    };
    setRequirements(updated);
    saveProgramLetterRequirements(updated);
  };

  // Program gap statistics
  const programGaps = savedPrograms.map((prog) =>
    analyzeProgramLetterGaps(prog.id, writers, requirements)
  );
  const totalProgramsWithGaps = programGaps.filter((g) => !g.isSatisfied).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#D6E5DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF2EE] text-[#1F3A30] border border-[#7EAE9B]/30">
              2027 MyERAS Season Rules
            </span>
            <span className="text-xs text-slate-500">Student LOR Organization Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1F3A30] mt-1 flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#7EAE9B]" />
            Letter of Recommendation (LOR) Tracking & Gaps
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Track your faculty letter writers from initial ask to confirmed ERAS submission. Manually verify program
            letter requirements on residency websites and ensure no program on your school list has unfulfilled letter gaps.
          </p>
        </div>

        <button
          onClick={handleOpenAddWriter}
          className="px-4 py-2.5 rounded-xl bg-[#1F3A30] hover:bg-[#142720] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#7EAE9B]" />
          Add Letter Writer
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#D6E5DF] p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Writers Tracked</div>
          <div className="text-2xl font-extrabold text-[#1F3A30] mt-1">{writers.length}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">Faculty & Research Mentors</div>
        </div>

        <div className="bg-white rounded-xl border border-[#D6E5DF] p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">ERAS Confirmed / Submitted</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">
            {writers.filter((w) => w.status === 'submitted').length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Ready for ERAS assignments</div>
        </div>

        <div className="bg-white rounded-xl border border-[#D6E5DF] p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">In Progress / Pending</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">
            {writers.filter((w) => w.status === 'asked' || w.status === 'initiated_eras').length}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">Follow-up recommended</div>
        </div>

        <div className="bg-white rounded-xl border border-[#D6E5DF] p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Programs with Letter Gaps</div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">{totalProgramsWithGaps}</div>
          <div className="text-[11px] text-rose-700 mt-0.5">
            {totalProgramsWithGaps === 0 ? 'All programs fully covered!' : 'Requires writer allocation'}
          </div>
        </div>
      </div>

      {/* Tracked Letter Writers Grid */}
      <div className="bg-white rounded-xl border border-[#D6E5DF] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#7EAE9B]" />
            Faculty Letter Writers ({writers.length})
          </h2>
          <span className="text-xs text-slate-500">
            Stages: Pending Ask &rarr; Asked &rarr; Initiated on ERAS &rarr; Submitted
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {writers.map((w) => {
            const statusConfig = {
              pending_ask: { label: 'Pending Ask', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
              asked: { label: 'Asked for LOR', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
              initiated_eras: { label: 'Initiated on ERAS', bg: 'bg-sky-50 text-sky-800 border-sky-300' },
              submitted: { label: 'Submitted to ERAS', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
            }[w.status];

            return (
              <div
                key={w.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-[#7EAE9B] transition-colors bg-white shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{w.writerName}</h3>
                    <p className="text-xs text-slate-600 font-medium">{w.writerTitle}</p>
                    <p className="text-[11px] text-slate-500">
                      {w.institution} &bull; <strong className="text-slate-700">{w.specialty}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusConfig.bg}`}>
                      {statusConfig.label}
                    </span>
                    <button
                      onClick={() => handleOpenEditWriter(w)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Edit letter writer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWriter(w.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete letter writer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {w.letterType}
                  </span>
                  <span className="text-slate-500">
                    Assigned to: <strong className="text-[#1F3A30]">{w.assignedProgramIds.length} Programs</strong>
                  </span>
                </div>

                {w.notes && (
                  <p className="text-xs text-slate-600 italic bg-[#F4F8F6] p-2.5 rounded-lg border border-[#D6E5DF]">
                    "{w.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Requirement & Gap Table */}
      <div className="bg-white rounded-xl border border-[#D6E5DF] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#7EAE9B]" />
              School List Letter Requirements & Gap Audit ({savedPrograms.length} Shortlisted Programs)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input the required number of letters found on each program's website to check coverage.
            </p>
          </div>

          {onOpenSchoolList && (
            <button
              onClick={onOpenSchoolList}
              className="text-xs font-bold text-[#4E8773] hover:text-[#1F3A30] flex items-center gap-1 transition-colors"
            >
              Manage School List <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {savedPrograms.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No programs saved to your Strategic School List yet. Add programs to start tracking letter requirements!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#F4F8F6] text-[#1F3A30] border-b border-[#D6E5DF] font-bold text-[11px]">
                  <th className="py-2.5 px-3">Residency Program</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Required Letters (From Site)</th>
                  <th className="py-2.5 px-3">Assigned Writers</th>
                  <th className="py-2.5 px-3">Coverage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedPrograms.map((prog) => {
                  const gap = analyzeProgramLetterGaps(prog.id, writers, requirements);
                  const assignedWriters = writers.filter((w) => w.assignedProgramIds.includes(prog.id));

                  return (
                    <tr key={prog.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{prog.programName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ACGME ID: {prog.id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {prog.city}, {prog.state}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={gap.requiredCount}
                            onChange={(e) =>
                              handleUpdateProgramRequirement(prog.id, parseInt(e.target.value) || 3)
                            }
                            className="w-14 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-center text-slate-900"
                            title="Edit required letters count from website"
                          />
                          <span className="text-[11px] text-slate-500">Letters</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {assignedWriters.length === 0 ? (
                          <span className="text-slate-400 italic">None assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedWriters.map((w) => (
                              <span
                                key={w.id}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  w.status === 'submitted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {w.writerName.split(' ').pop()} ({w.status === 'submitted' ? '✓' : '...'})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {gap.isSatisfied ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Complete ({gap.assignedCount}/{gap.requiredCount})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            {gap.gapCount} Letter Gap ({gap.assignedCount}/{gap.requiredCount})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Writer Modal */}
      {isAddWriterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-[#D6E5DF]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingWriter ? 'Edit Letter Writer' : 'Add Letter Writer'}
              </h3>
              <button onClick={() => setIsAddWriterModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWriter} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={writerName}
                  onChange={(e) => setWriterName(e.target.value)}
                  placeholder="e.g. Dr. Marcus Chen"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Faculty Title / Role</label>
                  <input
                    type="text"
                    value={writerTitle}
                    onChange={(e) => setWriterTitle(e.target.value)}
                    placeholder="e.g. Sub-I Director"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department / Specialty</label>
                  <input
                    type="text"
                    value={writerSpecialty}
                    onChange={(e) => setWriterSpecialty(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Letter Type</label>
                  <select
                    value={letterType}
                    onChange={(e) => setLetterType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                  >
                    <option value="Clinical Sub-I / Attending">Clinical Sub-I / Attending</option>
                    <option value="Department Chair / SLOE">Department Chair / SLOE</option>
                    <option value="Research Mentor">Research Mentor</option>
                    <option value="General">General Letter</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
                  >
                    <option value="pending_ask">Pending Ask</option>
                    <option value="asked">Asked for LOR</option>
                    <option value="initiated_eras">Initiated on ERAS</option>
                    <option value="submitted">Submitted to ERAS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assign to Shortlisted Programs</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {savedPrograms.map((prog) => {
                    const isChecked = assignedPrograms.includes(prog.id);
                    return (
                      <label key={prog.id} className="flex items-center gap-2 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedPrograms([...assignedPrograms, prog.id]);
                            } else {
                              setAssignedPrograms(assignedPrograms.filter((id) => id !== prog.id));
                            }
                          }}
                        />
                        <span className="truncate">{prog.programName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Private Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key clinical experiences to highlight, ask date, etc."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWriterModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1F3A30] hover:bg-[#142720] text-white font-bold rounded-lg shadow-sm"
                >
                  Save Letter Writer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
