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
  loadExperienceJournalEntries,
  saveExperienceJournalEntries,
  INITIAL_MOCK_JOURNAL_ENTRIES,
} from '@/domain/experience-journal-models';
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
  X,
  Edit2,
  Calendar,
  Send,
  Star,
  Pencil,
  FileCheck,
  Copy,
  BookOpen,
} from 'lucide-react';

import { JournalEntriesDrawer } from './JournalEntriesDrawer';

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
      | 'transfer_kit'
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
  // LOR State - Initial state uses INITIAL_MOCK_LETTER_WRITERS for identical SSR
  const [writers, setWriters] = useState<LetterWriterRequest[]>(INITIAL_MOCK_LETTER_WRITERS);
  const [isAddWriterModalOpen, setIsAddWriterModalOpen] = useState(false);
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);

  // Modal fields for LOR
  const [writerName, setWriterName] = useState('');
  const [writerTitle, setWriterTitle] = useState('');
  const [writerInstitution, setWriterInstitution] = useState(advisingIntake.medicalSchool || 'University Medical Center');
  const [writerType, setWriterType] = useState<
    'Department Chair / SLOE' | 'Clinical Sub-I / Attending' | 'Research Mentor' | 'General'
  >('Clinical Sub-I / Attending');
  const [writerStatus, setWriterStatus] = useState<LetterRequestStatus>('asked');
  const [writerNotes, setWriterNotes] = useState('');

  // Experience Journal Repository State (Completely decoupled from official 10 experiences)
  const [journalEntries, setJournalEntries] = useState<ExperienceJournalEntry[]>(INITIAL_MOCK_JOURNAL_ENTRIES);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalCategory, setJournalCategory] = useState<
    'Clinical Encounter' | 'Patient Advocacy' | 'Research Breakthrough' | 'Teaching & Mentorship' | 'Leadership Moment' | 'Personal Reflection'
  >('Clinical Encounter');
  const [journalNotes, setJournalNotes] = useState('');
  const [journalSuccessMessage, setJournalSuccessMessage] = useState<string | null>(null);
  const [isJournalDrawerOpen, setIsJournalDrawerOpen] = useState(false);

  // School List Preview State
  const [savedPrograms, setSavedPrograms] = useState<SchoolListItem[]>([]);
  const [programFilter, setProgramFilter] = useState<'all' | 'gold' | 'silver' | 'reach' | 'target' | 'safety'>('all');
  const [programSearch, setProgramSearch] = useState('');

  const specialtyRule = SPECIALTY_SIGNALING_RULES[targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  // Client-side synchronization in useEffect to prevent hydration mismatches
  useEffect(() => {
    setWriters(loadLetterWriterRequests());
    setJournalEntries(loadExperienceJournalEntries(student.id));
    const progs = loadItemsForSpecialty(targetSpecialty);
    setSavedPrograms(progs);
  }, [student.id, targetSpecialty]);

  const handleOpenAddWriter = () => {
    setEditingWriterId(null);
    setWriterName('');
    setWriterTitle('');
    setWriterInstitution(advisingIntake.medicalSchool || 'University Medical Center');
    setWriterType('Clinical Sub-I / Attending');
    setWriterStatus('asked');
    setWriterNotes('');
    setIsAddWriterModalOpen(true);
  };

  const handleOpenEditWriter = (writer: LetterWriterRequest) => {
    setEditingWriterId(writer.id);
    setWriterName(writer.writerName);
    setWriterTitle(writer.writerTitle);
    setWriterInstitution(writer.institution);
    setWriterType(writer.letterType);
    setWriterStatus(writer.status);
    setWriterNotes(writer.notes || '');
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
              institution: writerInstitution.trim(),
              letterType: writerType,
              status: writerStatus,
              notes: writerNotes.trim() || undefined,
            }
          : w
      );
    } else {
      const newWriter: LetterWriterRequest = {
        id: `lor-${Date.now()}`,
        writerName: writerName.trim(),
        writerTitle: writerTitle.trim() || 'Clinical Attending',
        specialty: targetSpecialty,
        institution: writerInstitution.trim() || advisingIntake.medicalSchool || 'Academic Medical Center',
        letterType: writerType,
        status: writerStatus,
        notes: writerNotes.trim() || undefined,
        assignedProgramIds: [],
      };
      updated = [newWriter, ...writers];
    }

    setWriters(updated);
    saveLetterWriterRequests(updated);
    setIsAddWriterModalOpen(false);
  };

  const handleQuickStatusChange = (writerId: string, newStatus: LetterRequestStatus) => {
    const updated = writers.map((w) => (w.id === writerId ? { ...w, status: newStatus } : w));
    setWriters(updated);
    saveLetterWriterRequests(updated);
  };

  // Dedicated Journal save handler (does NOT mutate official 10 experiences)
  const handleSaveJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalNotes.trim()) return;

    const newEntry: ExperienceJournalEntry = {
      id: `journal-${Date.now()}`,
      studentId: student.id,
      title: journalTitle.trim(),
      category: journalCategory,
      date: new Date().toISOString().slice(0, 10),
      setting: 'Clinical Setting',
      notableObservation: journalNotes.trim(),
      keyTakeaway: '',
      isKeyMemory: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    saveExperienceJournalEntries(student.id, updated);

    setJournalSuccessMessage(`Saved to your Journal!`);
    setJournalTitle('');
    setJournalNotes('');

    setTimeout(() => {
      setJournalSuccessMessage(null);
    }, 3500);
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
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-neutral-500">MSPE Release:</span>
            <strong className="text-neutral-900">Oct 1, 2026</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-neutral-500">Match Day:</span>
            <strong className="text-neutral-900">Mar 19, 2027</strong>
          </div>
        </div>
      </div>

      {/* 2. Thalamus-Style Asymmetric 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== LEFT MAIN COLUMN (Col 1 to 7/8) ==================== */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Card 1: Journal (Low-Friction Clinical Reflection Scratchpad - positioned ABOVE Program List) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1F3A30]" />
                    <span>Journal</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsJournalDrawerOpen(true)}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200/80 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Click to browse saved journal entries"
                    suppressHydrationWarning
                  >
                    <span>{journalEntries.length} saved entries</span>
                    <ChevronRight className="w-3 h-3 text-emerald-600" />
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Quickly capture patient encounters, clinical insights, and takeaways to draw from later.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsJournalDrawerOpen(true)}
                className="text-xs font-bold text-[#1F3A30] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <span>View Entries ({journalEntries.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {journalSuccessMessage && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{journalSuccessMessage}</span>
              </div>
            )}

            {/* Simple, low-friction journaling form: Topic + Reflection + Category + Save */}
            <form onSubmit={handleSaveJournalEntry} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Topic or Encounter *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ICU family meeting, night float consult, pediatric sedation debrief..."
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Reflection &amp; Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What happened? What patient dynamics, procedural lessons, or personal reflections stood out? Jot them down while fresh..."
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Category:
                  </span>
                  <select
                    value={journalCategory}
                    onChange={(e) => setJournalCategory(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs font-semibold border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer"
                  >
                    <option value="Clinical Encounter">Clinical Encounter</option>
                    <option value="Patient Advocacy">Patient Advocacy</option>
                    <option value="Teaching & Mentorship">Teaching &amp; Mentorship</option>
                    <option value="Research Breakthrough">Research Breakthrough</option>
                    <option value="Leadership Moment">Leadership Moment</option>
                    <option value="Personal Reflection">Personal Reflection</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Entry</span>
                </button>
              </div>
            </form>

            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-neutral-400">
                Private scratchpad &bull; not submitted to ERAS
              </span>
              <button
                type="button"
                onClick={() => setIsJournalDrawerOpen(true)}
                className="text-xs font-bold text-[#1F3A30] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Browse Saved Entries ({journalEntries.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: School List Building Progress & Strategy Summary */}
          {(() => {
            const reachCount = savedPrograms.filter((p) => p.tier === 'reach').length;
            const targetCount = savedPrograms.filter((p) => p.tier === 'target').length;
            const safetyCount = savedPrograms.filter((p) => p.tier === 'safety').length;
            const totalPrograms = savedPrograms.length;
            const reachPct = totalPrograms > 0 ? Math.round((reachCount / totalPrograms) * 100) : 0;
            const targetPct = totalPrograms > 0 ? Math.round((targetCount / totalPrograms) * 100) : 0;
            const safetyPct = totalPrograms > 0 ? Math.round((safetyCount / totalPrograms) * 100) : 0;

            return (
              <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#1F3A30]" />
                        <span>School List Building &amp; Signaling Strategy</span>
                      </h2>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                        suppressHydrationWarning
                      >
                        {totalPrograms} Added
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Live distribution across Reach, Target &amp; Safety tiers with ERAS preference signaling allocation for <strong>{targetSpecialty}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('school_list')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1F3A30] hover:bg-[#152B23] text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <span>Full School List Matrix</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Added */}
                  <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Programs</div>
                    <div className="text-2xl font-black text-neutral-900 mt-0.5">{totalPrograms}</div>
                    <div className="text-[10px] text-neutral-500 mt-1 font-medium">
                      {totalPrograms >= 25 ? 'Broad, competitive list' : totalPrograms >= 15 ? 'Target cohort range' : 'Early list building'}
                    </div>
                  </div>

                  {/* Reach */}
                  <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80">
                    <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Reach</span>
                      <span className="font-bold">{reachPct}%</span>
                    </div>
                    <div className="text-2xl font-black text-rose-950 mt-0.5">{reachCount}</div>
                    <div className="text-[10px] text-rose-700 mt-1 font-medium">High reach / stretch</div>
                  </div>

                  {/* Target */}
                  <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Target</span>
                      <span className="font-bold">{targetPct}%</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-950 mt-0.5">{targetCount}</div>
                    <div className="text-[10px] text-emerald-700 mt-1 font-medium">Core score alignment</div>
                  </div>

                  {/* Safety */}
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80">
                    <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Safety</span>
                      <span className="font-bold">{safetyPct}%</span>
                    </div>
                    <div className="text-2xl font-black text-blue-950 mt-0.5">{safetyCount}</div>
                    <div className="text-[10px] text-blue-700 mt-1 font-medium">High match probability</div>
                  </div>
                </div>

                {/* Visual Balance Distribution Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      Tier Balance Distribution
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      Benchmark: ~25% Reach &bull; ~50% Target &bull; ~25% Safety
                    </span>
                  </div>

                  <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden flex shadow-inner">
                    {totalPrograms === 0 ? (
                      <div className="w-full bg-neutral-200 h-full text-center text-[9px] text-neutral-500 font-medium leading-3">
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
                  <div className="p-4 bg-[#FAFBF9] rounded-xl border border-neutral-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{targetSpecialty} Preference Signals Allocation</span>
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
                        {goldUsed + silverUsed} / {specialtyRule.totalSignals} signals assigned
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {specialtyRule.goldSignals > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-bold text-amber-900 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                              Gold Signals (Highest Interest)
                            </span>
                            <span className="font-bold text-amber-900">
                              {goldUsed} / {specialtyRule.goldSignals} used
                            </span>
                          </div>
                          <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
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
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                            {specialtyRule.goldSignals > 0 ? 'Silver Signals (High Interest)' : 'Standard Preference Signals'}
                          </span>
                          <span className="font-bold text-slate-900">
                            {silverUsed} / {specialtyRule.silverSignals} used
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-500">
                    {targetSpecialty} does not participate in preference signaling under current AAMC guidelines.
                  </div>
                )}

                {/* Quick Link to Matrix */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-neutral-500">
                    Search 2,500+ ACGME programs with Step 2 CK ranges, signals &amp; filters
                  </span>
                  <button
                    onClick={() => onNavigate('school_list')}
                    className="text-xs font-bold text-[#1F3A30] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open School List Matrix &rarr;</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ==================== RIGHT SIDEBAR COLUMN (Col 8 to 12) ==================== */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card E: Letters of Recommendation Tracker (With inline add & quick status) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-[#1F3A30]" />
                  <span>Letters of Recommendation</span>
                </h2>
                <div className="text-xs text-neutral-500 mt-0.5" suppressHydrationWarning>
                  {writers.filter((w) => w.status === 'submitted').length} of {writers.length} submitted
                </div>
              </div>
              <button
                onClick={handleOpenAddWriter}
                className="px-2.5 py-1.5 bg-[#1F3A30] hover:bg-[#162D25] text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Writer</span>
              </button>
            </div>

            {/* Advising Tip Box */}
            <div className="mt-3.5 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-tight text-[11px]">
                <strong>Advising Rule of Thumb:</strong> Target 3–4 letters by July 15. Ensure at least one Sub-I
                attending letter in {targetSpecialty}.
              </p>
            </div>

            {/* Writer List */}
            <div className="mt-4 space-y-2.5">
              {writers.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  No letter writers added yet. Click &quot;Add Writer&quot; above.
                </div>
              ) : (
                writers.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl text-xs hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-neutral-900">{w.writerName}</div>
                        <div className="text-[11px] text-neutral-500 leading-tight">
                          {w.writerTitle} &bull; {w.institution}
                        </div>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.2 rounded bg-neutral-200/70 text-neutral-700 font-medium">
                          {w.letterType}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenEditWriter(w)}
                        className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                        title="Edit writer details"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Status Pill Selector */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                        Status:
                      </span>
                      <select
                        value={w.status}
                        onChange={(e) => handleQuickStatusChange(w.id, e.target.value as LetterRequestStatus)}
                        className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border cursor-pointer ${
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
                        <option value="initiated_eras">Initiated in ERAS</option>
                        <option value="submitted">Submitted to ERAS</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
              <button
                onClick={() => onNavigate('letters')}
                className="text-xs text-[#1F3A30] hover:text-[#142720] font-bold hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>Audit Program Letter Gaps &amp; Requirements</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add / Edit LOR Writer Modal */}
      {isAddWriterModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 text-sm">
                {editingWriterId ? 'Edit Letter Writer' : 'Add New Letter Writer'}
              </h3>
              <button
                onClick={() => setIsAddWriterModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWriterModal} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Writer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rose Barham, MD"
                  value={writerName}
                  onChange={(e) => setWriterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Academic Title / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Division Chief of General Internal Medicine"
                  value={writerTitle}
                  onChange={(e) => setWriterTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  placeholder="e.g. University Hospital, Mayo Clinic"
                  value={writerInstitution}
                  onChange={(e) => setWriterInstitution(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Letter Type
                  </label>
                  <select
                    value={writerType}
                    onChange={(e) => setWriterType(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                  >
                    <option value="Clinical Sub-I / Attending">Clinical Sub-I</option>
                    <option value="Department Chair / SLOE">Department Chair</option>
                    <option value="Research Mentor">Research Mentor</option>
                    <option value="General">General Attending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Current Status
                  </label>
                  <select
                    value={writerStatus}
                    onChange={(e) => setWriterStatus(e.target.value as LetterRequestStatus)}
                    className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                  >
                    <option value="pending_ask">Pending Ask</option>
                    <option value="asked">Asked</option>
                    <option value="initiated_eras">Initiated in ERAS</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Notes / Focus
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Agreed to highlight acute ICU patient care and family communications..."
                  value={writerNotes}
                  onChange={(e) => setWriterNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddWriterModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-2xs"
                >
                  {editingWriterId ? 'Update Writer' : 'Add Writer'}
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
