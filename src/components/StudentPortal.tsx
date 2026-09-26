import React, { useState, useEffect } from 'react';
import { StudentDashboardContext, ExperienceDraft, DocumentFeedbackSummary } from '@/domain/types';
import { deserializeScholarlyPortfolio } from '@/domain/scholarly-models';
import { PersonalStatementEditor } from './PersonalStatementEditor';
import { ExperiencesManager } from './ExperiencesManager';
import { ScholarlyWorksManager } from './ScholarlyWorksManager';
import { OrderTracker } from './OrderTracker';
import { StudentFeedbackViewer } from './StudentFeedbackViewer';
import { StudentFeedbackHub } from './StudentFeedbackHub';
import { SchoolListMatrix } from './SchoolListMatrix';
import { CompetitivenessCalculator } from './CompetitivenessCalculator';
import { ApplicantProfileModal } from './ApplicantProfileModal';
import { AlumniResidentDirectory } from './AlumniResidentDirectory';
import { ErasTransferKit } from './ErasTransferKit';
import {
  CANONICAL_SPECIALTIES,
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
  SPECIALTY_SIGNALING_RULES,
} from '@/domain/school-list-models';
import {
  FileText,
  Briefcase,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Sparkles,
  BarChart3,
  Users,
  ClipboardCopy,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Columns,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

interface StudentPortalProps {
  context: StudentDashboardContext;
  onUpdatePersonalStatement?: (content: string) => void;
  onSubmitPersonalStatement?: (changelog: string) => void;
  onUpdateExperience?: (id: string, updates: Partial<ExperienceDraft>) => void;
  onSubmitExperiences?: (changelog: string) => void;
  getAdvisorFeedback?: () => any;
  latestPSFeedback?: DocumentFeedbackSummary;
  psFeedbackHistory?: DocumentFeedbackSummary[];
  onCreateRevision?: (targetVersion?: number) => void;
}

export function StudentPortal({
  context,
  onUpdatePersonalStatement,
  onSubmitPersonalStatement,
  onUpdateExperience,
  onSubmitExperiences,
  getAdvisorFeedback,
  latestPSFeedback,
  psFeedbackHistory = [],
  onCreateRevision,
}: StudentPortalProps) {
  const [activeView, setActiveView] = useState<
    | 'overview'
    | 'personal_statement'
    | 'personal_statement_feedback'
    | 'experiences'
    | 'scholarly_works'
    | 'school_list'
    | 'competitiveness'
    | 'alumni_directory'
    | 'transfer_kit'
  >('overview');
  const [psEditorMode, setPsEditorMode] = useState<'editor' | 'annotations' | 'split'>('split');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { student, personalStatement, experiences, assignedAdvisors } = context;

  // Student Target Specialty State (persisted & propagates across entire portal)
  const [targetSpecialty, setTargetSpecialty] = useState<string>(() => {
    return getStoredTargetSpecialty() || student.specialty || 'Internal Medicine';
  });

  const handleSpecialtyChange = (newSpecialty: string) => {
    setTargetSpecialty(newSpecialty);
    setStoredTargetSpecialty(newSpecialty);
  };

  const specialtyRule = SPECIALTY_SIGNALING_RULES[targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  // Real-time synced counts across modules
  const [scholarlyStats, setScholarlyStats] = useState({ count: 2, meaningful: 2 });
  const [schoolListStats, setSchoolListStats] = useState({ count: 0, signalsAssigned: 0 });

  // Re-read storage whenever returning to overview or mounting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Scholarly Works sync
      const cachedScholarly = localStorage.getItem('eras_scholarly_portfolio');
      const restoredScholarly = deserializeScholarlyPortfolio(cachedScholarly);
      if (restoredScholarly) {
        setScholarlyStats({
          count: restoredScholarly.works.length,
          meaningful: restoredScholarly.works.filter((w) => w.isMeaningful).length,
        });
      }

      // School List sync
      const cachedSchoolList = localStorage.getItem('eras_school_list_matrix');
      if (cachedSchoolList) {
        try {
          const parsed = JSON.parse(cachedSchoolList);
          if (Array.isArray(parsed)) {
            const signals = parsed.filter(
              (p: any) => p.signalingTier === 'gold' || p.signalingTier === 'silver'
            ).length;
            setSchoolListStats({
              count: parsed.length,
              signalsAssigned: signals,
            });
          }
        } catch {
          // keep fallback
        }
      }
    }
  }, [activeView]);

  const stageLabels = {
    drafting: { label: 'Drafting Locally', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    submitted: { label: 'Queued with Advisor', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    in_review: { label: 'Under Review by Faculty', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    revisions_requested: { label: 'Revisions Requested', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    endorsed: { label: 'Endorsed & ERAS Ready', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  };

  const psStage = stageLabels[personalStatement.stage];

  if (activeView === 'personal_statement_feedback') {
    return (
      <StudentFeedbackHub
        latestFeedback={latestPSFeedback}
        feedbackHistory={psFeedbackHistory.length > 0 ? psFeedbackHistory : (latestPSFeedback ? [latestPSFeedback] : [])}
        currentDraftVersion={personalStatement.currentVersionNumber}
        personalStatementStage={personalStatement.stage}
        onBack={() => setActiveView('overview')}
        onStartRevision={(targetVersion) => {
          onCreateRevision?.(targetVersion);
        }}
        onOpenEditor={(initialMode = 'split') => {
          setPsEditorMode(initialMode);
          setActiveView('personal_statement');
        }}
      />
    );
  }

  if (activeView === 'personal_statement') {
    return (
      <PersonalStatementEditor
        draft={personalStatement}
        assignedAdvisor={assignedAdvisors[0]}
        snapshots={context.snapshots}
        latestFeedback={latestPSFeedback}
        feedbackHistory={psFeedbackHistory}
        initialViewMode={psEditorMode}
        onNavigateToFeedback={() => setActiveView('personal_statement_feedback')}
        onSave={(newContent) => onUpdatePersonalStatement?.(newContent)}
        onSubmitForReview={(changelog) => {
          onSubmitPersonalStatement?.(changelog);
          setActiveView('overview');
        }}
        onBack={() => setActiveView('overview')}
      />
    );
  }

  if (activeView === 'experiences') {
    const activeExpReview = context.activeReviewRequests.find(r => r.documentType === 'experience_portfolio');
    return (
      <ExperiencesManager
        experiences={experiences}
        assignedAdvisor={assignedAdvisors[0]}
        activeReviewRequest={activeExpReview}
        onSubmitForReview={onSubmitExperiences}
        onSaveExperience={(id, updates) => onUpdateExperience?.(id, updates)}
        onDeleteExperience={(id) => {}}
        onBack={() => setActiveView('overview')}
        targetSpecialty={targetSpecialty}
      />
    );
  }

  if (activeView === 'scholarly_works') {
    return (
      <ScholarlyWorksManager
        onBack={() => setActiveView('overview')}
      />
    );
  }

  if (activeView === 'school_list') {
    return (
      <SchoolListMatrix
        specialty={targetSpecialty}
        onBack={() => setActiveView('overview')}
      />
    );
  }

  if (activeView === 'competitiveness') {
    return (
      <CompetitivenessCalculator
        initialSpecialty={targetSpecialty}
        onBack={() => setActiveView('overview')}
      />
    );
  }

  if (activeView === 'alumni_directory') {
    return (
      <AlumniResidentDirectory
        studentName={student.name}
        initialSpecialty={targetSpecialty}
        onBack={() => setActiveView('overview')}
      />
    );
  }

  if (activeView === 'transfer_kit') {
    return (
      <ErasTransferKit
        context={context}
        onBack={() => setActiveView('overview')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
              MS4 Applicant
            </span>
            <span className="text-xs text-slate-500">ERAS 2027 Cycle</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span>Welcome back, {student.name.split(' ')[0]}</span>
            <button
              id="edit-profile-metrics-btn"
              onClick={() => setIsProfileModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
              title="Edit Academic & Portfolio Metrics"
              aria-label="Edit Academic & Portfolio Metrics"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
            <label htmlFor="student-specialty-select" className="font-semibold text-slate-700 whitespace-nowrap">
              Target Applying Specialty:
            </label>
            <select
              id="student-specialty-select"
              value={targetSpecialty}
              onChange={(e) => handleSpecialtyChange(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer hover:border-slate-400 transition-colors"
            >
              {CANONICAL_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-500">Medical School: <strong className="text-slate-700">Apex School of Medicine</strong></span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Assigned Advisor Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              MC
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Primary Faculty Advisor</div>
              <div className="font-semibold text-slate-900 leading-tight">{assignedAdvisors[0]?.name || 'Dr. Marcus Chen'}</div>
              <div className="text-[11px] text-slate-500">{assignedAdvisors[0]?.specialty} | Apex Health</div>
            </div>
          </div>

          {/* 1-Click Transfer Kit CTA (Compact under advisor card) */}
          <button
            onClick={() => setActiveView('transfer_kit')}
            className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
            title="Export clean plain-text copy-paste blocks for MyERAS"
          >
            <ClipboardCopy className="w-3.5 h-3.5 text-emerald-100" />
            <span>1-Click ERAS Transfer Kit</span>
          </button>
        </div>
      </div>

      {/* 5-Stage Clinical Order Pipeline Tracker with Multi-Part Application Progress */}
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

      {/* Faculty Feedback Action Banner (Ticket 19) */}
      {latestPSFeedback && (personalStatement.stage === 'revisions_requested' || personalStatement.stage === 'endorsed') && (
        <div
          id="faculty-feedback-alert-banner"
          className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${
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
              onClick={() => setActiveView('personal_statement_feedback')}
              className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                personalStatement.stage === 'endorsed'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Review Faculty Feedback &amp; Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {personalStatement.stage === 'revisions_requested' && (
              <button
                id="banner-open-split-canvas-btn"
                onClick={() => {
                  setPsEditorMode('split');
                  setActiveView('personal_statement');
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-white border border-purple-300 text-purple-900 hover:bg-purple-50 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Columns className="w-3.5 h-3.5 text-purple-600" />
                <span>Split-Screen Draft</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Pre-Season Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module 1: Personal Statement */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${psStage.color}`}>
                {psStage.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Personal Statement</h2>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {personalStatement.content || 'Draft your specialty personal statement.'}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Version: <strong className="text-slate-700">v{personalStatement.currentVersionNumber}</strong></span>
              <span>Characters: <strong className="text-slate-700">{personalStatement.content.length}</strong> (~800 words)</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {personalStatement.stage === 'revisions_requested' ? (
              <>
                <button
                  id="ps-card-review-feedback-btn"
                  onClick={() => setActiveView('personal_statement_feedback')}
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Analyze Feedback &amp; Notes</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  id="ps-card-open-draft-btn"
                  onClick={() => {
                    setPsEditorMode('split');
                    setActiveView('personal_statement');
                  }}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Columns className="w-3.5 h-3.5 text-purple-600" />
                  <span>Open Split-Screen Canvas</span>
                </button>
              </>
            ) : personalStatement.stage === 'endorsed' ? (
              <button
                id="ps-card-view-endorsed-btn"
                onClick={() => setActiveView('personal_statement_feedback')}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Review Endorsement Rubric</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="ps-card-open-sandbox-btn"
                onClick={() => {
                  setPsEditorMode('editor');
                  setActiveView('personal_statement');
                }}
                className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Open Drafting Sandbox</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Module 2: 10 Selected Experiences */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {experiences.length} / 10 Completed
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">10 Selected Experiences</h2>
            <p className="text-xs text-slate-600 mt-1">
              Curate your top 10 experiences with official 750-character limits and up to 3 Most Meaningful reflections.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Meaningful: <strong className="text-slate-700">{experiences.filter(e => e.isMostMeaningful).length} / 3 Starred</strong></span>
              <span>Max Description: <strong className="text-slate-700">750 chars</strong></span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('experiences')}
            className="mt-5 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Manage Experiences Portfolio <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Module 3: Scholarly Works Portfolio */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {scholarlyStats.count} Works Recorded
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Scholarly Works</h2>
            <p className="text-xs text-slate-600 mt-1">
              Curate articles, abstracts, and presentations with AAMC author formats and Collections.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Meaningful: <strong className="text-slate-700">{scholarlyStats.meaningful} / 3 Starred</strong></span>
              <span>Types: <strong className="text-slate-700">5 AAMC Types</strong></span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('scholarly_works')}
            className="mt-5 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Manage Scholarly Works <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Module 4: Strategic School List & Signals */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Specialty: {targetSpecialty} ({specialtyRule.totalSignals} Signals Budget)
              </span>
            </div>
            <div className="flex items-center justify-between mt-4">
              <h2 className="text-lg font-bold text-slate-900">Strategic School List</h2>
              <a
                href="https://www.doximity.com/residency/programs?specialtyKey=&sortByKey=reputation&trainingEnvironmentKey=&intendedFellowshipKey="
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
              >
                Doximity Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Build your Reach, Target, and Safety matrix with live ERAS signaling token budget tracking and multiplier benchmarks.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Programs Saved: <strong className="text-slate-700">{schoolListStats.count} programs</strong></span>
              <span>Tokens Remaining: <strong className="text-amber-700 font-bold">{Math.max(0, specialtyRule.totalSignals - schoolListStats.signalsAssigned)} total</strong></span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('school_list')}
            className="mt-5 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Open School List Strategy <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Module 5: Multimodal Competitiveness Engine */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Official NRMP 2026 Medians
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Competitiveness Engine</h2>
            <p className="text-xs text-slate-600 mt-1">
              Benchmark your Step 2 CK, research outputs, and AOA status against matched vs. unmatched national medians.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>National Medians: <strong className="text-slate-700">23 Specialties</strong></span>
              <span>Yield Explorer: <strong className="text-teal-700 font-bold">Enabled</strong></span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('competitiveness')}
            className="mt-5 w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Assess Specialty Profile <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Module 6: Alumni Resident Network */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                88% Mentors Opted-In
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Alumni Resident Roster</h2>
            <p className="text-xs text-slate-600 mt-1">
              Connect with Apex graduates training at target hospitals, browse match history, and launch outreach emails.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Match History: <strong className="text-slate-700">2022–2025</strong></span>
              <span>Doximity Reviews: <strong className="text-violet-700 font-bold">Linked</strong></span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('alumni_directory')}
            className="mt-5 w-full py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Explore Alumni Network <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Applicant Profile Questionnaire Modal (Ticket Candidate 9) */}
      <ApplicantProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        studentName={student.name}
        specialty={targetSpecialty}
        onOpenCompetitivenessEngine={() => {
          setIsProfileModalOpen(false);
          setActiveView('competitiveness');
        }}
      />
    </div>
  );
}
