import React, { useState } from 'react';
import { StudentDashboardContext, ExperienceDraft } from '@/domain/types';
import { PersonalStatementEditor } from './PersonalStatementEditor';
import { ExperiencesManager } from './ExperiencesManager';
import { ScholarlyWorksManager } from './ScholarlyWorksManager';
import { OrderTracker } from './OrderTracker';
import { StudentFeedbackViewer } from './StudentFeedbackViewer';
import { SchoolListMatrix } from './SchoolListMatrix';
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
  Sparkles
} from 'lucide-react';

interface StudentPortalProps {
  context: StudentDashboardContext;
  onUpdatePersonalStatement?: (content: string) => void;
  onSubmitPersonalStatement?: (changelog: string) => void;
  onUpdateExperience?: (id: string, updates: Partial<ExperienceDraft>) => void;
  getAdvisorFeedback?: () => any;
  onCreateRevision?: () => void;
}

export function StudentPortal({
  context,
  onUpdatePersonalStatement,
  onSubmitPersonalStatement,
  onUpdateExperience,
  getAdvisorFeedback,
  onCreateRevision,
}: StudentPortalProps) {
  const [activeView, setActiveView] = useState<'overview' | 'personal_statement' | 'experiences' | 'scholarly_works' | 'school_list'>('overview');
  const { student, personalStatement, experiences, assignedAdvisors } = context;

  const stageLabels = {
    drafting: { label: 'Drafting Locally', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    submitted: { label: 'Queued with Advisor', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    in_review: { label: 'Under Review by Faculty', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    revisions_requested: { label: 'Revisions Requested', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    endorsed: { label: 'Endorsed & ERAS Ready', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  };

  const psStage = stageLabels[personalStatement.stage];

  if (activeView === 'personal_statement') {
    return (
      <PersonalStatementEditor
        draft={personalStatement}
        assignedAdvisor={assignedAdvisors[0]}
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
    return (
      <ExperiencesManager
        experiences={experiences}
        onSaveExperience={(id, updates) => onUpdateExperience?.(id, updates)}
        onDeleteExperience={(id) => {}}
        onBack={() => setActiveView('overview')}
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
        specialty={student.specialty}
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
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {student.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Target Specialty: <span className="font-semibold text-slate-800">{student.specialty}</span> | Medical School: <span className="text-slate-700">Apex School of Medicine</span>
          </p>
        </div>

        {/* Assigned Advisor Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            MC
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Primary Faculty Advisor</div>
            <div className="font-semibold text-slate-900">{assignedAdvisors[0]?.name || 'Dr. Marcus Chen'}</div>
            <div className="text-slate-500">{assignedAdvisors[0]?.specialty} | Apex Health</div>
          </div>
        </div>
      </div>

      {/* 5-Stage Clinical Order Pipeline Tracker */}
      <OrderTracker currentStage={personalStatement.stage} />

      {/* Advisor Rubric Feedback Banner (if returned) */}
      {getAdvisorFeedback?.() && (
        <StudentFeedbackViewer
          feedback={getAdvisorFeedback()}
          advisor={assignedAdvisors[0]}
          versionNumber={personalStatement.currentVersionNumber}
          onCreateRevision={() => {
            onCreateRevision?.();
            setActiveView('personal_statement');
          }}
        />
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
              {personalStatement.content}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Version: <strong className="text-slate-700">v{personalStatement.currentVersionNumber}</strong></span>
              <span>Characters: <strong className="text-slate-700">{personalStatement.content.length}</strong> (~800 words)</span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('personal_statement')}
            className="mt-5 w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Open Drafting Sandbox <ChevronRight className="w-4 h-4" />
          </button>
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
                2 Works Recorded
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Scholarly Works</h2>
            <p className="text-xs text-slate-600 mt-1">
              Curate articles, abstracts, and presentations with AAMC author formats and Collections.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Meaningful: <strong className="text-slate-700">2 / 3 Starred</strong></span>
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
                Specialty: IM (3 Gold / 12 Silver)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">Strategic School List</h2>
            <p className="text-xs text-slate-600 mt-1">
              Build your Reach, Target, and Safety matrix with live ERAS signaling token budget tracking and alumni insights.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Programs Saved: <strong className="text-slate-700">0 programs</strong></span>
              <span>Tokens Remaining: <strong className="text-amber-700 font-bold">15 total</strong></span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('school_list')}
            className="mt-5 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Open School List Strategy <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
