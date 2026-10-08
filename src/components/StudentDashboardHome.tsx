'use client';

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  PersonalStatementDraft,
  ExperienceDraft,
  DocumentFeedbackSummary,
  StudentDashboardContext,
} from '@/domain/types';
import { OrderTracker } from './OrderTracker';
import { SpecialtyAdvisingIntake } from '@/domain/advising-intake-models';
import {
  CANONICAL_SPECIALTIES,
  SPECIALTY_SIGNALING_RULES,
  SchoolListItem,
  loadItemsForSpecialty,
  getStoredApplicantStep2Ck,
} from '@/domain/school-list-models';
import {
  LetterWriterRequest,
  LetterRequestStatus,
  loadLetterWriterRequests,
  saveLetterWriterRequests,
} from '@/domain/lor-models';
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
} from 'lucide-react';

interface StudentDashboardHomeProps {
  context: StudentDashboardContext;
  student: UserProfile;
  targetSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
  advisingIntake: SpecialtyAdvisingIntake;
  onOpenIntake: () => void;
  onOpenProfile: () => void;
  personalStatement: PersonalStatementDraft;
  latestPSFeedback?: DocumentFeedbackSummary;
  experiences: ExperienceDraft[];
  onUpdateExperience?: (id: string, updates: Partial<ExperienceDraft>) => void;
  assignedAdvisors: UserProfile[];
  scholarlyStats: { count: number; meaningful: number };
  schoolListStats: { count: number; signalsAssigned: number };
  onNavigate: (
    view:
      | 'overview'
      | 'intake'
      | 'competitiveness'
      | 'school_list'
      | 'personal_statement'
      | 'personal_statement_feedback'
      | 'letters'
      | 'experiences'
      | 'scholarly_works'
      | 'transfer_kit'
      | 'alumni_directory'
  ) => void;
  onOpenSplitCanvas: () => void;
  alumniResidents?: import('@/domain/alumni-models').AlumniResident[];
}

export function StudentDashboardHome({
  context,
  student,
  targetSpecialty,
  onSpecialtyChange,
  advisingIntake,
  onOpenIntake,
  onOpenProfile,
  personalStatement,
  latestPSFeedback,
  experiences,
  onUpdateExperience,
  assignedAdvisors,
  scholarlyStats,
  schoolListStats,
  onNavigate,
  onOpenSplitCanvas,
  alumniResidents,
}: StudentDashboardHomeProps) {
  // LOR State
  const [writers, setWriters] = useState<LetterWriterRequest[]>(() => loadLetterWriterRequests());
  const [isAddWriterModalOpen, setIsAddWriterModalOpen] = useState(false);
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);

  // Modal fields for LOR
  const [writerName, setWriterName] = useState('');
  const [writerTitle, setWriterTitle] = useState('');
  const [writerInstitution, setWriterInstitution] = useState('Geisinger Medical Center');
  const [writerType, setWriterType] = useState<
    'Department Chair / SLOE' | 'Clinical Sub-I / Attending' | 'Research Mentor' | 'General'
  >('Clinical Sub-I / Attending');
  const [writerStatus, setWriterStatus] = useState<LetterRequestStatus>('asked');
  const [writerNotes, setWriterNotes] = useState('');

  // Quick Experience Journal State
  const [quickExpTitle, setQuickExpTitle] = useState('');
  const [quickExpType, setQuickExpType] = useState('Patient Care');
  const [quickExpOrg, setQuickExpOrg] = useState('');
  const [quickExpDesc, setQuickExpDesc] = useState('');
  const [quickExpMeaningful, setQuickExpMeaningful] = useState(false);
  const [journalSuccessMessage, setJournalSuccessMessage] = useState<string | null>(null);

  // School List Preview State
  const [savedPrograms, setSavedPrograms] = useState<SchoolListItem[]>([]);
  const [programFilter, setProgramFilter] = useState<'all' | 'gold' | 'silver' | 'reach' | 'target' | 'safety'>('all');
  const [programSearch, setProgramSearch] = useState('');

  const specialtyRule = SPECIALTY_SIGNALING_RULES[targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  // Load programs for the current specialty
  useEffect(() => {
    const progs = loadItemsForSpecialty(targetSpecialty);
    setSavedPrograms(progs);
  }, [targetSpecialty]);

  // Synchronize writers whenever storage updates or mounts
  const refreshWriters = () => {
    setWriters(loadLetterWriterRequests());
  };

  const handleOpenAddWriter = () => {
    setEditingWriterId(null);
    setWriterName('');
    setWriterTitle('');
    setWriterInstitution('Geisinger Medical Center');
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
        institution: writerInstitution.trim() || 'Geisinger Health System',
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

  // Quick experience logging handler
  const handleLogQuickExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickExpTitle.trim() || !quickExpDesc.trim()) return;

    const newId = `exp-${Date.now()}`;
    const newEntry: Partial<ExperienceDraft> = {
      id: newId,
      studentId: student.id,
      title: quickExpTitle.trim(),
      orgName: quickExpOrg.trim() || 'Geisinger Health System',
      roleName: 'Student Clinician / Contributor',
      experienceType: quickExpType,
      frequency: 'Weekly',
      startDate: new Date().toISOString().slice(0, 10),
      isCurrent: true,
      descriptionText: quickExpDesc.trim(),
      isMostMeaningful: quickExpMeaningful,
    };

    onUpdateExperience?.(newId, newEntry);

    setJournalSuccessMessage(`Successfully recorded "${quickExpTitle.trim()}" in your portfolio!`);
    setQuickExpTitle('');
    setQuickExpOrg('');
    setQuickExpDesc('');
    setQuickExpMeaningful(false);

    setTimeout(() => {
      setJournalSuccessMessage(null);
    }, 4000);
  };

  // Stage labels mapping
  const stageLabels = {
    drafting: { label: 'Drafting Locally', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    submitted: { label: 'Queued with Advisor', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    in_review: { label: 'Under Review by Faculty', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    revisions_requested: { label: 'Revisions Requested', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    endorsed: { label: 'Endorsed & ERAS Ready', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  };
  const psStage = stageLabels[personalStatement.stage];

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
    <div className="space-y-6">
      {/* 1. Ethmoid Advising Intake Required Alert Banner */}
      {!advisingIntake.isCompleted && (
        <div className="bg-amber-50/90 border-l-4 border-amber-600 rounded-r-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
              <FileCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Required Advising Baseline
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  Intake Incomplete
                </span>
              </div>
              <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                Complete Your Specialty Advising Intake Form
              </h3>
              <p className="text-xs text-neutral-700 mt-1 max-w-2xl">
                Grounded in the Geisinger Commonwealth School of Medicine specialty advising form. Establishes your clinical baseline,
                verifies 7 core clerkships, discloses rotation schedules, and initializes your faculty advising relationship.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenIntake}
            className="px-5 py-2.5 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Complete Advising Intake</span>
            <ChevronRight className="w-4 h-4 text-[#7EAE9B]" />
          </button>
        </div>
      )}

      {/* 2. Welcome Bar & Target Specialty Selector */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2EE] text-[#1F3A30] border border-[#7EAE9B]/30">
              MS4 Applicant
            </span>
            <span className="text-xs text-neutral-500">ERAS 2027 Match Cycle</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A30] flex items-center gap-2">
              <span>Welcome back, {student.name.split(' ')[0]}</span>
              <button
                id="edit-profile-metrics-btn"
                onClick={onOpenProfile}
                className="p-1.5 text-neutral-400 hover:text-[#4E8773] hover:bg-neutral-100 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                title="Edit Academic & Portfolio Metrics"
                aria-label="Edit Academic & Portfolio Metrics"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </h1>

            {/* Specialty Advising Form Button */}
            <button
              onClick={onOpenIntake}
              className="px-3 py-1 rounded-xl border border-[#7EAE9B] bg-[#EAF2EE] hover:bg-[#D6E5DF] text-[#1F3A30] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#4E8773]" />
              <span>Specialty Advising Form</span>
              {advisingIntake.isCompleted ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-extrabold">
                  In Progress
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-neutral-600">
            <label htmlFor="student-specialty-select-home" className="font-semibold text-neutral-700 whitespace-nowrap">
              Target Applying Specialty:
            </label>
            <select
              id="student-specialty-select-home"
              value={targetSpecialty}
              onChange={(e) => onSpecialtyChange(e.target.value)}
              className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs cursor-pointer hover:border-neutral-400 transition-colors"
            >
              {CANONICAL_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <span className="text-neutral-500">
              Institution: <strong className="text-neutral-700">Geisinger Commonwealth School of Medicine</strong>
            </span>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-2 text-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1F3A30] text-white flex items-center justify-center font-bold text-xs">
              MC
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Assigned Advisor</div>
              <div className="font-semibold text-neutral-900 leading-tight">
                {assignedAdvisors[0]?.name || 'Dr. Marcus Chen, MD'}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('transfer_kit')}
            className="px-3.5 py-2 bg-[#1F3A30] hover:bg-[#162D25] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7EAE9B]" />
            <span>1-Click ERAS Transfer Kit</span>
          </button>
        </div>
      </div>

      {/* 5-Stage Personal Statement Review Pipeline & Multi-Part Progress Tracker */}
      {(() => {
        const psReview = context.activeReviewRequests?.find((r) => r.documentType === 'personal_statement');
        return (
          <OrderTracker
            currentStage={personalStatement.stage}
            submittedAt={psReview?.submittedAt}
            inReviewAt={psReview?.inReviewAt}
            completedAt={psReview?.completedAt}
            personalStatementChars={personalStatement.content.length}
            personalStatementVersion={personalStatement.currentVersionNumber}
            experiencesCount={experiences.length}
            experiencesMeaningfulCount={experiences.filter((e) => e.isMostMeaningful).length}
            scholarlyCount={scholarlyStats.count}
            scholarlyMeaningfulCount={scholarlyStats.meaningful}
            schoolListCount={schoolListStats.count}
            schoolListSignalsAssigned={schoolListStats.signalsAssigned}
            schoolListSignalsBudget={specialtyRule.totalSignals}
          />
        );
      })()}

      {/* Faculty Feedback Action Banner */}
      {latestPSFeedback && (personalStatement.stage === 'revisions_requested' || personalStatement.stage === 'endorsed') && (
        <div
          id="faculty-feedback-alert-banner"
          className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs transition-all ${
            personalStatement.stage === 'endorsed'
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-purple-50/90 border-purple-300 text-purple-950'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                personalStatement.stage === 'endorsed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {personalStatement.stage === 'endorsed' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <RotateCcw className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold">
                  {personalStatement.stage === 'endorsed'
                    ? `Application Endorsed: Ready to Lock (v${latestPSFeedback.versionNumber})`
                    : `Faculty Feedback Received: Revisions Requested on v${latestPSFeedback.versionNumber}`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/80 border border-slate-200 text-slate-700">
                  Rubric Score:{' '}
                  {(
                    (latestPSFeedback.feedback.evaluation.narrativeMotivation +
                      latestPSFeedback.feedback.evaluation.clinicalReflection +
                      latestPSFeedback.feedback.evaluation.toneAndFit +
                      latestPSFeedback.feedback.evaluation.structureAndMechanics) /
                    4
                  ).toFixed(1)}{' '}
                  / 5.0
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90">
                Evaluated by <strong>{latestPSFeedback.advisor.name}</strong> ({latestPSFeedback.advisor.specialty}) on{' '}
                {new Date(latestPSFeedback.feedback.submittedAt).toLocaleDateString()} &bull; Notes &amp; rubric ready for review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              id="banner-review-feedback-btn"
              onClick={() => onNavigate('personal_statement_feedback')}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                personalStatement.stage === 'endorsed'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Review Faculty Feedback</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {personalStatement.stage === 'revisions_requested' && (
              <button
                id="banner-open-split-canvas-btn"
                onClick={onOpenSplitCanvas}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-purple-300 text-purple-900 hover:bg-purple-50 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Columns className="w-3.5 h-3.5 text-purple-600" />
                <span>Split-Screen Draft</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Thalamus-Style Asymmetric 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== LEFT MAIN COLUMN (Col 1 to 7/8) ==================== */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Card A: Current Program List & Signaling Tracker (Requirement 3 - Thalamus table style) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#1F3A30]" />
                    <span>Program List &amp; Signaling Tracker</span>
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-semibold">
                    {savedPrograms.length} saved
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Reach, Target &amp; Safety distribution for <strong>{targetSpecialty}</strong>
                </p>
              </div>

              {/* Signals summary badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  Gold: {goldUsed} / {specialtyRule.goldSignals}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                  Silver: {silverUsed} / {specialtyRule.silverSignals}
                </span>
                <button
                  onClick={() => onNavigate('school_list')}
                  className="text-xs text-[#1F3A30] hover:text-[#142720] font-bold flex items-center gap-1 hover:underline ml-1 cursor-pointer"
                >
                  <span>View Full Matrix</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter and search bar */}
            <div className="px-5 py-3 bg-[#FBFBFA] border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                {(['all', 'gold', 'silver', 'reach', 'target', 'safety'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setProgramFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                      programFilter === filter
                        ? 'bg-[#1F3A30] text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                    }`}
                  >
                    {filter === 'all'
                      ? 'All'
                      : filter === 'gold'
                      ? 'Gold Tokens'
                      : filter === 'silver'
                      ? 'Silver Tokens'
                      : filter}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter programs..."
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#7EAE9B]"
                />
              </div>
            </div>

            {/* Table of Programs */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F8] text-neutral-500 font-semibold border-b border-neutral-100">
                  <tr>
                    <th className="py-2.5 px-4">Program &amp; Location</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3">Signal</th>
                    <th className="py-2.5 px-3">Step 2 CK Mid-80%</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-400">
                        No programs match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPrograms.slice(0, 6).map((prog) => (
                      <tr key={prog.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900 leading-snug">{prog.programName}</div>
                          <div className="text-[11px] text-neutral-500">
                            {prog.city}, {prog.state} &bull; {prog.region}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              prog.tier === 'reach'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : prog.tier === 'target'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {prog.tier}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {prog.signal === 'gold' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                              <Star className="w-3 h-3 text-amber-600 fill-amber-500" /> Gold
                            </span>
                          ) : prog.signal === 'silver' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1 w-fit">
                              <Star className="w-3 h-3 text-slate-500 fill-slate-400" /> Silver
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-neutral-600 font-medium">
                          {prog.step2ScoreRange || `${prog.step2Min} - ${prog.step2Max}`}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onNavigate('school_list')}
                            className="text-[#1F3A30] hover:text-[#142720] font-semibold text-[11px] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {savedPrograms.length > 6 && (
              <div className="p-3 bg-[#FBFBFA] border-t border-neutral-100 text-center">
                <button
                  onClick={() => onNavigate('school_list')}
                  className="text-xs text-[#1F3A30] hover:text-[#142720] font-bold hover:underline cursor-pointer"
                >
                  View all {savedPrograms.length} programs in full matrix &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Card B: Quick Experience Journal / Log (Requirement 1 - Low effort home journaling) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#1F3A30]" />
                  <span>Quick Experience Journal</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Low-friction capture for clinical encounters, research milestones, and leadership moments.
                </p>
              </div>
              <button
                onClick={() => onNavigate('experiences')}
                className="text-xs text-[#1F3A30] hover:text-[#142720] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Full Portfolio ({experiences.length}/10)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {journalSuccessMessage && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{journalSuccessMessage}</span>
              </div>
            )}

            {/* Low-effort journal form */}
            <form onSubmit={handleLogQuickExperience} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Activity / Experience Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ICU Night Float Sub-I Patient Advocate"
                    value={quickExpTitle}
                    onChange={(e) => setQuickExpTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Experience Type
                  </label>
                  <select
                    value={quickExpType}
                    onChange={(e) => setQuickExpType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer"
                  >
                    <option value="Patient Care">Clinical / Patient Care</option>
                    <option value="Research">Research &amp; Scholarly Work</option>
                    <option value="Education/Teaching">Education / Teaching</option>
                    <option value="Volunteer/Community Service">Volunteer / Community Service</option>
                    <option value="Extracurricular Activities">Extracurricular &amp; Leadership</option>
                    <option value="Work">Employment / Work</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Setting / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Geisinger Community Medical Center (Scranton)"
                  value={quickExpOrg}
                  onChange={(e) => setQuickExpOrg(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Quick Reflection / Key Observation *
                  </label>
                  <span className="text-[10px] text-neutral-400">Low pressure &bull; polish anytime</span>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Capture a brief 1-3 sentence clinical encounter, impact, or takeaway while it's fresh in your mind..."
                  value={quickExpDesc}
                  onChange={(e) => setQuickExpDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={quickExpMeaningful}
                    onChange={(e) => setQuickExpMeaningful(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1F3A30] focus:ring-[#7EAE9B] cursor-pointer"
                  />
                  <span>Mark as prospective <strong>Most Meaningful</strong> reflection</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Experience</span>
                </button>
              </div>
            </form>

            {/* Recent 3 Logged Experiences Snapshot */}
            {experiences.length > 0 && (
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2.5">
                  Recently Logged Entries ({experiences.length} total)
                </div>
                <div className="space-y-2">
                  {experiences.slice(0, 3).map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 bg-neutral-50/80 hover:bg-neutral-100/70 border border-neutral-200/70 rounded-xl text-xs flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 truncate">{exp.title}</span>
                          {exp.isMostMeaningful && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                              ★ Meaningful
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {exp.orgName} &bull; {exp.experienceType}
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigate('experiences')}
                        className="text-[11px] font-semibold text-[#1F3A30] hover:underline shrink-0 cursor-pointer"
                      >
                        Edit &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card C: Personal Statement Draft Preview (Requirement 5 - Live text excerpt & reminder) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1F3A30]" />
                    <span>Personal Statement Draft Preview</span>
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${psStage.color}`}>
                    {psStage.label}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Version v{personalStatement.currentVersionNumber} &bull; {personalStatement.content.length} characters
                  (~{Math.round(personalStatement.content.split(/\s+/).filter(Boolean).length)} words)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {latestPSFeedback && (
                  <button
                    onClick={() => onNavigate('personal_statement_feedback')}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                    <span>Feedback Notes</span>
                  </button>
                )}
                <button
                  onClick={onOpenSplitCanvas}
                  className="px-3.5 py-1.5 bg-[#1F3A30] hover:bg-[#162D25] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Columns className="w-3.5 h-3.5 text-[#7EAE9B]" />
                  <span>Open Split Canvas</span>
                </button>
              </div>
            </div>

            {/* Excerpt Box */}
            <div className="mt-4 p-4 bg-[#FBFBFA] border border-neutral-200/80 rounded-xl relative overflow-hidden">
              {personalStatement.content ? (
                <>
                  <p className="text-xs text-neutral-700 leading-relaxed italic line-clamp-4 font-serif">
                    &ldquo;{personalStatement.content}&rdquo;
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#FBFBFA] to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="text-xs text-neutral-500 italic text-center py-2">
                  No draft text entered yet. Begin writing your personal statement hook to start receiving faculty feedback.
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
              <span className="text-[11px]">
                Target Specialty: <strong className="text-neutral-700">{targetSpecialty}</strong>
              </span>
              <button
                onClick={() => onNavigate('personal_statement')}
                className="font-bold text-[#1F3A30] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Continue Drafting Sandbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT SIDEBAR COLUMN (Col 8 to 12) ==================== */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Card D: Letters of Recommendation Tracker (Requirement 2 - Writers list & inline add) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-[#1F3A30]" />
                  <span>Letters of Recommendation</span>
                </h2>
                <div className="text-xs text-neutral-500 mt-0.5">
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
                <strong>Geisinger Rule of Thumb:</strong> Target 3–4 letters by July 15. Ensure at least one Sub-I
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

          {/* Card E: Institutional Advising & Deans Contact Directory (Requirement 4) */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5">
            <div className="pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1F3A30]" />
                <span>Geisinger Advising Leadership</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Official contact directory for MS4 match advising and student affairs.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {/* Contact 1: Specialty Advisor */}
              <div className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1F3A30] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    MC
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900">Dr. Marcus Chen, MD</div>
                    <div className="text-[11px] text-neutral-500">Specialty Faculty Advisor ({targetSpecialty})</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-200/50 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Danville Campus</span>
                  <a
                    href="mailto:mchen@geisinger.edu"
                    className="font-bold text-[#1F3A30] hover:underline flex items-center gap-1"
                  >
                    <span>mchen@geisinger.edu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Contact 2: Regional Associate Dean */}
              <div className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    EV
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900">Dr. Eleanor Vance, MD, FACS</div>
                    <div className="text-[11px] text-neutral-500">Regional Associate Dean of Student Affairs</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-200/50 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Scranton Regional Campus</span>
                  <a
                    href="mailto:evance@geisinger.edu"
                    className="font-bold text-[#1F3A30] hover:underline flex items-center gap-1"
                  >
                    <span>evance@geisinger.edu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Contact 3: Dean of Career Advising */}
              <div className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                    GS
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900">Dr. Gregory Sterling, MD</div>
                    <div className="text-[11px] text-neutral-500">Assistant Dean of Career Advising &amp; Match</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-200/50 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Signaling &amp; MSPE Advisory</span>
                  <a
                    href="mailto:gsterling@geisinger.edu"
                    className="font-bold text-[#1F3A30] hover:underline flex items-center gap-1"
                  >
                    <span>gsterling@geisinger.edu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Contact 4: ERAS & Match Operations Coordinator */}
              <div className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                    SJ
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900">Sarah Jenkins, MS</div>
                    <div className="text-[11px] text-neutral-500">ERAS &amp; Match Operations Coordinator</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-200/50 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Tokens, Transcripts &amp; LOR</span>
                  <a
                    href="mailto:sjenkins@geisinger.edu"
                    className="font-bold text-[#1F3A30] hover:underline flex items-center gap-1"
                  >
                    <span>sjenkins@geisinger.edu</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Office hours note */}
            <div className="mt-3.5 p-2.5 bg-neutral-100/70 rounded-xl text-[11px] text-neutral-600 flex items-center justify-between">
              <span>Office Hours: Tue / Thu 2–5 PM EST</span>
              <a
                href="mailto:match-advising@geisinger.edu"
                className="font-semibold text-[#1F3A30] hover:underline"
              >
                Book 1:1 Check-in
              </a>
            </div>
          </div>

          {/* Card F: Key Match Milestones & Deadlines */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2 pb-3 border-b border-neutral-100">
              <Calendar className="w-4 h-4 text-[#1F3A30]" />
              <span>ERAS 2027 Key Deadlines</span>
            </h2>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                <div>
                  <div className="font-semibold text-neutral-900">ERAS Tokens Open</div>
                  <div className="text-[10px] text-neutral-500">Profile &amp; Personal Statement Drafting</div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                <div>
                  <div className="font-semibold text-neutral-900">Application Submission Target</div>
                  <div className="text-[10px] text-neutral-500">All 10 Experiences &amp; LORs verified</div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Sep 24, 2026</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                <div>
                  <div className="font-semibold text-neutral-900">MSPE (Dean&apos;s Letter) Release</div>
                  <div className="text-[10px] text-neutral-500">Transmitted to residency programs</div>
                </div>
                <span className="text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">Oct 1, 2026</span>
              </div>
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
                  placeholder="e.g. Geisinger Medical Center"
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
    </div>
  );
}
