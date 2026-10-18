'use client';

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  PersonalStatementDraft,
  ExperienceDraft,
  DocumentFeedbackSummary,
  StudentDashboardContext,
} from '@/domain/types';
import { SpecialtyAdvisingIntake } from '@/domain/advising-intake-models';
import {
  CANONICAL_SPECIALTIES,
  SPECIALTY_SIGNALING_RULES,
  SchoolListItem,
  loadItemsForSpecialty,
} from '@/domain/school-list-models';
import {
  LetterWriterRequest,
  LetterRequestStatus,
  loadLetterWriterRequests,
  saveLetterWriterRequests,
  INITIAL_MOCK_LETTER_WRITERS,
} from '@/domain/lor-models';
import {
  ExperienceJournalEntry,
  JournalCategory,
  JOURNAL_CATEGORIES,
  loadExperienceJournalEntries,
  addExperienceJournalEntry,
} from '@/domain/experience-journal-models';
import { JournalEntriesDrawer } from './JournalEntriesDrawer';
import {
  Compass,
  FileText,
  Briefcase,
  MailCheck,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Columns,
  Edit3,
  Mail,
  UserCheck,
  Building,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Info,
  X,
  Edit2,
  Calendar,
  Send,
  Star,
  Pencil,
  FileCheck,
  Copy,
  BookOpen,
  Stethoscope,
} from 'lucide-react';

interface StudentDashboardHomeProps {
  context: StudentDashboardContext;
  student: UserProfile;
  targetSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
  advisingIntake: SpecialtyAdvisingIntake;
  onOpenIntake: () => void;
  onOpenProfile: () => void;
  assignedAdvisors: UserProfile[];
  schoolListStats: { count: number; signalsAssigned: number };
  onNavigate: (
    view:
      | 'overview'
      | 'intake'
      | 'profile'
      | 'competitiveness'
      | 'school_list'
      | 'letters'
      | 'journal'
  ) => void;
}

export function StudentDashboardHome({
  context,
  student,
  targetSpecialty,
  onSpecialtyChange,
  advisingIntake,
  onOpenIntake,
  onOpenProfile,
  assignedAdvisors,
  schoolListStats,
  onNavigate,
}: StudentDashboardHomeProps) {
  // LOR State - Initialized by student.id so fresh accounts start with 0 writers
  const [writers, setWriters] = useState<LetterWriterRequest[]>(() =>
    loadLetterWriterRequests(student.id)
  );
  const [isAddWriterModalOpen, setIsAddWriterModalOpen] = useState(false);
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);

  // Modal fields for LOR
  const [writerName, setWriterName] = useState('');
  const [writerTitle, setWriterTitle] = useState('');
  const [writerSpecialty, setWriterSpecialty] = useState(targetSpecialty || '');
  const [writerInstitution, setWriterInstitution] = useState(advisingIntake.medicalSchool || 'University Medical Center');
  const [writerType, setWriterType] = useState<
    'Department Chair / SLOE' | 'Clinical Sub-I / Attending' | 'Research Mentor' | 'General'
  >('Clinical Sub-I / Attending');
  const [writerStatus, setWriterStatus] = useState<LetterRequestStatus>('asked');
  const [assignedPrograms, setAssignedPrograms] = useState<string[]>([]);

  // Experience Journal Repository State (Scoped by student.id)
  const [journalEntries, setJournalEntries] = useState<ExperienceJournalEntry[]>(() =>
    loadExperienceJournalEntries(student.id)
  );
  const [journalTitle, setJournalTitle] = useState('');
  const [journalDate, setJournalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [journalRotation, setJournalRotation] = useState('');
  const [journalCategory, setJournalCategory] = useState<JournalCategory>('Clinical Encounter');
  const [journalNotes, setJournalNotes] = useState('');
  const [journalIsKeyMemory, setJournalIsKeyMemory] = useState(false);
  const [journalSuccessMessage, setJournalSuccessMessage] = useState<string | null>(null);
  const [isJournalDrawerOpen, setIsJournalDrawerOpen] = useState(false);

  // School List Preview State (Scoped by student.id)
  const [savedPrograms, setSavedPrograms] = useState<SchoolListItem[]>(() =>
    loadItemsForSpecialty(targetSpecialty, undefined, student.id)
  );
  const [programFilter, setProgramFilter] = useState<'all' | 'gold' | 'silver' | 'reach' | 'target' | 'safety'>('all');
  const [programSearch, setProgramSearch] = useState('');

  const specialtyRule = SPECIALTY_SIGNALING_RULES[targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  // Client-side synchronization in useEffect to prevent hydration mismatches
  useEffect(() => {
    setWriters(loadLetterWriterRequests(student.id));
    setJournalEntries(loadExperienceJournalEntries(student.id));
    const progs = loadItemsForSpecialty(targetSpecialty, undefined, student.id);
    setSavedPrograms(progs);

    const handleJournalUpdate = () => {
      setJournalEntries(loadExperienceJournalEntries(student.id));
    };
    window.addEventListener('journal_entries_updated', handleJournalUpdate);
    return () => window.removeEventListener('journal_entries_updated', handleJournalUpdate);
  }, [student.id, targetSpecialty]);

  const handleOpenAddWriter = () => {
    setEditingWriterId(null);
    setWriterName('');
    setWriterTitle('');
    setWriterSpecialty(targetSpecialty || '');
    setWriterInstitution(advisingIntake.medicalSchool || 'University Medical Center');
    setWriterType('Clinical Sub-I / Attending');
    setWriterStatus('asked');
    setAssignedPrograms([]);
    setIsAddWriterModalOpen(true);
  };

  const handleOpenEditWriter = (writer: LetterWriterRequest) => {
    setEditingWriterId(writer.id);
    setWriterName(writer.writerName);
    setWriterTitle(writer.writerTitle);
    setWriterSpecialty(writer.specialty || targetSpecialty || '');
    setWriterInstitution(writer.institution || advisingIntake.medicalSchool || '');
    setWriterType(writer.letterType);
    setWriterStatus(writer.status);
    setAssignedPrograms(writer.assignedProgramIds || []);
    setIsAddWriterModalOpen(true);
  };

  const handleSaveWriterModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writerName.trim()) return;

    let updated: LetterWriterRequest[];
    if (editingWriterId) {
      updated = writers.map((w) =>
        w.id === editingWriterId
          ? {
              ...w,
              writerName: writerName.trim(),
              writerTitle: writerTitle.trim(),
              specialty: writerSpecialty.trim() || targetSpecialty || 'General',
              institution: writerInstitution.trim() || advisingIntake.medicalSchool || 'Academic Medical Center',
              letterType: writerType,
              status: writerStatus,
              assignedProgramIds: assignedPrograms,
            }
          : w
      );
    } else {
      const newWriter: LetterWriterRequest = {
        id: `lor-${Date.now()}`,
        writerName: writerName.trim(),
        writerTitle: writerTitle.trim() || 'Clinical Attending',
        specialty: writerSpecialty.trim() || targetSpecialty,
        institution: writerInstitution.trim() || advisingIntake.medicalSchool || 'Academic Medical Center',
        letterType: writerType,
        status: writerStatus,
        assignedProgramIds: assignedPrograms,
      };
      updated = [newWriter, ...writers];
    }

    setWriters(updated);
    saveLetterWriterRequests(updated, student.id);
    setIsAddWriterModalOpen(false);
  };

  const handleQuickStatusChange = (writerId: string, newStatus: LetterRequestStatus) => {
    const updated = writers.map((w) => (w.id === writerId ? { ...w, status: newStatus } : w));
    setWriters(updated);
    saveLetterWriterRequests(updated, student.id);
  };

  const handleSaveJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalNotes.trim()) return;

    const newEntry: ExperienceJournalEntry = {
      id: `journal-${Date.now()}`,
      studentId: student.id,
      title: journalTitle.trim(),
      category: journalCategory,
      date: journalDate || new Date().toISOString().slice(0, 10),
      setting: journalRotation.trim() ? `${journalRotation.trim()} Rotation` : 'Clinical Setting',
      rotation: journalRotation.trim() || undefined,
      notableObservation: journalNotes.trim(),
      keyTakeaway: '',
      isKeyMemory: journalIsKeyMemory,
      createdAt: new Date().toISOString(),
    };

    const updated = addExperienceJournalEntry(student.id, newEntry);
    setJournalEntries(updated);
    setJournalTitle('');
    setJournalDate(new Date().toISOString().slice(0, 10));
    setJournalRotation('');
    setJournalNotes('');
    setJournalIsKeyMemory(false);
    setJournalSuccessMessage(`Saved "${newEntry.title}" to your Journal!`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('journal_entries_updated'));
    }
    setTimeout(() => {
      setJournalSuccessMessage(null);
    }, 3000);
  };

  // Filtering programs
  const filteredPrograms = savedPrograms.filter((p) => {
    const matchesSearch =
      programSearch === '' ||
      (p.programName && p.programName.toLowerCase().includes(programSearch.toLowerCase())) ||
      (p.city && p.city.toLowerCase().includes(programSearch.toLowerCase())) ||
      (p.state && p.state.toLowerCase().includes(programSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (programFilter === 'gold') return p.signal === 'gold';
    if (programFilter === 'silver') return p.signal === 'silver';
    if (programFilter === 'reach') return p.tier === 'reach';
    if (programFilter === 'target') return p.tier === 'target';
    if (programFilter === 'safety') return p.tier === 'safety';
    return true;
  });

  const goldUsed = savedPrograms.filter((p) => p.signal === 'gold').length;
  const silverUsed = savedPrograms.filter((p) => p.signal === 'silver').length;

  return (
    <div className="space-y-5">
      {/* 1. Abbreviated ERAS 2027 Key Deadlines Strip (High up near top, right below middle nav) */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-900 font-bold shrink-0">
          <Calendar className="w-4 h-4 text-[#1F3A30]" />
          <span>ERAS 2027 Season Milestones:</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-neutral-500">ERAS Tokens:</span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">Active (Open)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-neutral-500">Submission Target:</span>
            <strong className="text-neutral-900">Sep 24, 2026</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-neutral-500">Match Day:</span>
            <strong className="text-neutral-900">Mar 19, 2027</strong>
          </div>
        </div>
      </div>

      {/* 2. Balanced Two-Column Strategic Command Grid: School List & Letters of Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* ==================== COLUMN 1: SCHOOL LIST & SIGNALING STRATEGY ==================== */}
        <div className="flex flex-col">
          {(() => {
            const reachCount = savedPrograms.filter((p) => p.tier === 'reach').length;
            const targetCount = savedPrograms.filter((p) => p.tier === 'target').length;
            const safetyCount = savedPrograms.filter((p) => p.tier === 'safety').length;
            const totalPrograms = savedPrograms.length;
            const reachPct = totalPrograms > 0 ? Math.round((reachCount / totalPrograms) * 100) : 0;
            const targetPct = totalPrograms > 0 ? Math.round((targetCount / totalPrograms) * 100) : 0;
            const safetyPct = totalPrograms > 0 ? Math.round((safetyCount / totalPrograms) * 100) : 0;

            return (
              <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between flex-1 min-h-[350px] space-y-3.5">
                <div className="pb-2.5 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#1F3A30]" />
                    <span>Program List Summary</span>
                  </h2>
                  <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-md">
                    {targetSpecialty}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="p-2.5 sm:p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-center">
                    <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Total</div>
                    <div className="text-xl font-black text-neutral-900 leading-tight mt-0.5">{totalPrograms}</div>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 text-center">
                    <div className="text-[9px] font-bold text-rose-800 uppercase tracking-wider">Reach ({reachPct}%)</div>
                    <div className="text-xl font-black text-rose-950 leading-tight mt-0.5">{reachCount}</div>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-center">
                    <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Target ({targetPct}%)</div>
                    <div className="text-xl font-black text-emerald-950 leading-tight mt-0.5">{targetCount}</div>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-center">
                    <div className="text-[9px] font-bold text-blue-800 uppercase tracking-wider">Safety ({safetyPct}%)</div>
                    <div className="text-xl font-black text-blue-950 leading-tight mt-0.5">{safetyCount}</div>
                  </div>
                </div>

                {/* Visual Balance Distribution Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      Tier Balance Distribution
                    </span>
                    <div className="flex items-center gap-2.5 text-[10px] font-medium text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span>Reach</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>Target</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>Safety</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                    {totalPrograms === 0 ? (
                      <div className="w-full bg-neutral-200 h-full text-center text-[8px] text-neutral-500 font-medium leading-2.5">
                        No programs added yet
                      </div>
                    ) : (
                      <>
                        <div
                          style={{ width: `${reachPct}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`Reach: ${reachCount} (${reachPct}%)`}
                        />
                        <div
                          style={{ width: `${targetPct}%` }}
                          className="bg-emerald-500 h-full transition-all"
                          title={`Target: ${targetCount} (${targetPct}%)`}
                        />
                        <div
                          style={{ width: `${safetyPct}%` }}
                          className="bg-blue-500 h-full transition-all"
                          title={`Safety: ${safetyCount} (${safetyPct}%)`}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Signaling Utilization Progress Bars */}
                {specialtyRule.totalSignals > 0 ? (
                  <div className="p-3 sm:p-3.5 bg-[#FAFBF9] rounded-xl border border-neutral-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-neutral-800 flex items-center gap-1 text-[10.5px]">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Preference Signals Allocation</span>
                      </div>
                      <span className="text-[9.5px] font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
                        {goldUsed + silverUsed} / {specialtyRule.totalSignals} assigned
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {specialtyRule.goldSignals > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9.5px]">
                            <span className="font-bold text-amber-900 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                              Gold Signals
                            </span>
                            <span className="font-bold text-amber-900">
                              {goldUsed} / {specialtyRule.goldSignals}
                            </span>
                          </div>
                          <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min((goldUsed / specialtyRule.goldSignals) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9.5px]">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
                            {specialtyRule.goldSignals > 0 ? 'Silver Signals' : 'Preference Signals'}
                          </span>
                          <span className="font-bold text-slate-900">
                            {silverUsed} / {specialtyRule.silverSignals}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-500 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((silverUsed / specialtyRule.silverSignals) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-500">
                    {targetSpecialty} does not participate in preference signaling under current AAMC guidelines.
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ==================== COLUMN 2: LETTERS OF RECOMMENDATION ==================== */}
        <div className="flex flex-col">
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between flex-1 min-h-[350px] space-y-3.5">
            <div className="pb-2.5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                  <MailCheck className="w-4 h-4 text-[#1F3A30]" />
                  <span>Letters of Recommendation</span>
                </h2>

                {/* Integrated (i) icon next to title: hover tooltip only */}
                <div className="relative group inline-flex items-center">
                  <span
                    aria-label="Letters of Recommendation Guidelines"
                    className="text-neutral-400 hover:text-[#1F3A30] transition-colors p-0.5 rounded cursor-help inline-flex items-center"
                  >
                    <Info className="w-3.5 h-3.5 text-neutral-400 hover:text-[#1F3A30]" />
                  </span>

                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-30 pointer-events-none w-72 animate-fade-in">
                    <div className="bg-neutral-900 text-white text-[11px] rounded-xl px-3 py-2 shadow-xl border border-neutral-700 leading-snug">
                      <span className="font-bold text-amber-300">Rule of Thumb:</span> Target 3–4 letters by July 15. Ensure &ge;1 Sub-I attending letter in {targetSpecialty}.
                    </div>
                    <div className="w-2 h-2 bg-neutral-900 rotate-45 mx-auto -mt-1"></div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenAddWriter}
                className="px-2.5 py-1 bg-[#1F3A30] hover:bg-[#162D25] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Writer</span>
              </button>
            </div>

            {/* Writer List: Fits at least 6 writers in a clean 2-column grid without scrolling */}
            <div className="flex-1 min-h-[240px] flex flex-col justify-start">
              {writers.length === 0 ? (
                <div className="h-full min-h-[240px] flex items-center justify-center text-center text-xs text-neutral-400">
                  No letter writers added yet. Click &quot;Add Writer&quot; above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-h-[235px] max-h-[270px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {writers.map((w) => (
                    <div
                      key={w.id}
                      className="p-2.5 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 rounded-xl text-xs hover:border-neutral-300 transition-colors flex flex-col justify-between shadow-2xs"
                    >
                      {/* Name, Letter Type & Edit pencil icon */}
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="font-bold text-neutral-900 text-xs truncate" title={w.writerName}>
                            {w.writerName}
                          </span>
                          {w.letterType && (
                            <span
                              className="text-[9.5px] px-1.5 py-0.5 rounded bg-neutral-200/70 text-neutral-700 font-medium truncate shrink-0 max-w-[140px] sm:max-w-[180px]"
                              title={w.letterType}
                            >
                              {w.letterType}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenEditWriter(w)}
                          className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded hover:bg-neutral-200/60 transition-colors cursor-pointer shrink-0"
                          title="Edit writer details"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Status Selector Pill */}
                      <div className="mt-2">
                        <select
                          value={w.status}
                          onChange={(e) => handleQuickStatusChange(w.id, e.target.value as LetterRequestStatus)}
                          className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border cursor-pointer w-full transition-colors ${
                            w.status === 'submitted'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : w.status === 'initiated_eras'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : w.status === 'asked'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          <option value="pending_ask">Pending Ask</option>
                          <option value="asked">Asked</option>
                          <option value="initiated_eras">Initiated</option>
                          <option value="submitted">Submitted</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Streamlined Clinical Reflection & Encounter Journal (Fits bottom of screen without scrolling) */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-3.5 sm:p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#EAF2EE] text-[#1F3A30] flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-[#1F3A30]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <span>Quick Journal Entry</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsJournalDrawerOpen(true)}
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Browse saved reflections"
              suppressHydrationWarning
            >
              <span>{journalEntries.length} Saved</span>
              <ChevronRight className="w-3 h-3 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('journal')}
              className="px-2.5 py-1 text-[11px] font-bold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Open Full Journal Page"
            >
              <span>Full Journal Page</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </button>
          </div>
        </div>

        {journalSuccessMessage && (
          <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-semibold">{journalSuccessMessage}</span>
          </div>
        )}

        {/* 2-Column Split: Form (Left) & Recent Stream (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <form onSubmit={handleSaveJournalEntry} className="lg:col-span-7 flex flex-col justify-between space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="Topic: ICU consult, cardiac code, night float..."
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] font-medium text-neutral-900"
                />
              </div>
              <div>
                <input
                  type="date"
                  required
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] text-neutral-800 cursor-pointer"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Rotation: MICU..."
                  value={journalRotation}
                  onChange={(e) => setJournalRotation(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] text-neutral-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <select
                  value={journalCategory}
                  onChange={(e) => setJournalCategory(e.target.value as JournalCategory)}
                  className="w-full px-2 py-1.5 text-xs font-semibold border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer"
                >
                  {JOURNAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <textarea
                  rows={2}
                  required
                  placeholder="Observations, patient dynamics, procedures & clinical takeaways while fresh..."
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] text-neutral-900 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-1.5 text-[10px] text-neutral-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={journalIsKeyMemory}
                  onChange={(e) => setJournalIsKeyMemory(e.target.checked)}
                  className="rounded border-neutral-300 text-[#1F3A30] focus:ring-[#7EAE9B] w-3 h-3 cursor-pointer"
                />
                <Star className={`w-3 h-3 ${journalIsKeyMemory ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                <span>Star as Pivotal Memory (ERAS Experience Candidate)</span>
              </label>

              <button
                type="submit"
                className="px-3 py-1 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Entry</span>
              </button>
            </div>
          </form>

          <div className="lg:col-span-5 bg-neutral-50/80 rounded-xl border border-neutral-200/70 p-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold uppercase tracking-wider pb-1 border-b border-neutral-200/60">
                <span>Recent Reflections</span>
                <button
                  type="button"
                  onClick={() => setIsJournalDrawerOpen(true)}
                  className="text-[#1F3A30] hover:underline font-semibold lowercase tracking-normal flex items-center gap-0.5 cursor-pointer"
                >
                  <span>view all ({journalEntries.length})</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>

              {journalEntries.length === 0 ? (
                <div className="py-3 text-center text-xs text-neutral-400">
                  No reflections logged yet. Jot down encounters on the left.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[82px] overflow-y-auto pr-1 scrollbar-thin">
                  {journalEntries.slice(0, 2).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => setIsJournalDrawerOpen(true)}
                      className="p-1.5 bg-white border border-neutral-200/60 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-bold text-neutral-900 text-[11px] truncate group-hover:text-[#1F3A30]">
                          {entry.title}
                        </div>
                        <span className="text-[9px] text-neutral-400 shrink-0 font-medium">
                          {entry.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-neutral-500">
                        {entry.rotation && (
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-1 rounded truncate">
                            {entry.rotation}
                          </span>
                        )}
                        <span className="truncate text-neutral-600">
                          {entry.notableObservation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-1 text-right">
              <button
                type="button"
                onClick={() => setIsJournalDrawerOpen(true)}
                className="text-[10px] text-[#1F3A30] font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Open Full Drawer</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Letter Writer Modal (Aligned with LOR Tracker) */}
      {isAddWriterModalOpen && (
        <div
          data-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 modal-backdrop"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-[#D6E5DF] animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingWriterId ? 'Edit Letter Writer' : 'Add Letter Writer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddWriterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWriterModal} className="space-y-3 text-xs">
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
                    placeholder="e.g. Internal Medicine"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Letter Type</label>
                  <select
                    value={writerType}
                    onChange={(e) => setWriterType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-slate-900 font-medium"
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
                    value={writerStatus}
                    onChange={(e) => setWriterStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-slate-900 font-bold"
                  >
                    <option value="pending_ask">Pending Ask</option>
                    <option value="asked">Asked for LOR</option>
                    <option value="initiated_eras">Initiated on ERAS</option>
                    <option value="submitted">Submitted to ERAS</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Assign to Saved Programs</label>
                  {savedPrograms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = savedPrograms.every((p) => assignedPrograms.includes(p.id));
                        if (allSelected) {
                          setAssignedPrograms([]);
                        } else {
                          setAssignedPrograms(savedPrograms.map((p) => p.id));
                        }
                      }}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      {savedPrograms.every((p) => assignedPrograms.includes(p.id))
                        ? 'Deselect All'
                        : `Select All (${savedPrograms.length})`}
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {savedPrograms.length === 0 ? (
                    <div className="text-slate-400 text-[11px] py-2 text-center">
                      No saved programs in your school list. Add programs in the Strategic School List Matrix.
                    </div>
                  ) : (
                    savedPrograms.map((prog) => {
                      const isChecked = assignedPrograms.includes(prog.id);
                      return (
                        <label
                          key={prog.id}
                          className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-slate-100/80 p-1 rounded transition-colors"
                        >
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
                            className="rounded text-[#1F3A30] focus:ring-[#1F3A30]"
                          />
                          <span className="truncate text-slate-800 font-medium">{prog.programName}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWriterModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1F3A30] hover:bg-[#142720] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Letter Writer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Journal Entries */}
      <JournalEntriesDrawer
        isOpen={isJournalDrawerOpen}
        onClose={() => {
          setIsJournalDrawerOpen(false);
          setJournalEntries(loadExperienceJournalEntries(student.id));
        }}
        studentId={student.id}
        onNavigateToFullPage={() => onNavigate('journal')}
      />
    </div>
  );
}
