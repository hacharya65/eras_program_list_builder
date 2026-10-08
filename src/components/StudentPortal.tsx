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
import { SpecialtyAdvisingFormModal } from './SpecialtyAdvisingFormModal';
import { LetterOfRecommendationTracker } from './LetterOfRecommendationTracker';
import { SpecialtySwitchingSafetyModal } from './SpecialtySwitchingSafetyModal';
import { AlumniResidentDirectory } from './AlumniResidentDirectory';
import { ErasTransferKit } from './ErasTransferKit';
import { StudentDashboardHome } from './StudentDashboardHome';
import {
  CANONICAL_SPECIALTIES,
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
  SPECIALTY_SIGNALING_RULES,
  loadItemsForSpecialty,
  getStorageKeyForSpecialty,
} from '@/domain/school-list-models';
import {
  SpecialtyAdvisingIntake,
  loadStudentAdvisingIntake,
  saveStudentAdvisingIntake,
  getDefaultAdvisorForSpecialty,
  calculateClerkshipHonorsCount,
  INITIAL_MOCK_INTAKE,
} from '@/domain/advising-intake-models';
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
  Mail,
  FileCheck,
  LayoutDashboard,
  Compass,
  MailCheck,
  TrendingUp,
  Download,
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
  alumniResidents?: import('@/domain/alumni-models').AlumniResident[];
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
  alumniResidents,
}: StudentPortalProps) {
  const [activeView, setActiveView] = useState<
    | 'overview'
    | 'intake'
    | 'personal_statement'
    | 'personal_statement_feedback'
    | 'experiences'
    | 'scholarly_works'
    | 'school_list'
    | 'competitiveness'
    | 'alumni_directory'
    | 'transfer_kit'
    | 'letters'
  >('overview');
  const [psEditorMode, setPsEditorMode] = useState<'editor' | 'annotations' | 'split'>('split');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const { student, personalStatement, experiences, assignedAdvisors } = context;

  // Specialty Advising Intake State (Deterministic SSR initialization to prevent hydration mismatches)
  const [advisingIntake, setAdvisingIntake] = useState<SpecialtyAdvisingIntake>({
    ...INITIAL_MOCK_INTAKE,
    studentId: student.id,
    applyingSpecialty: student.specialty || 'Internal Medicine',
  });
  const [pendingSpecialtySwitch, setPendingSpecialtySwitch] = useState<string | null>(null);

  // Student Target Specialty State (Deterministic SSR initialization)
  const [targetSpecialty, setTargetSpecialty] = useState<string>(
    student.specialty || 'Internal Medicine'
  );

  // Sync client-persisted localStorage after hydration mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSpec = getStoredTargetSpecialty();
      if (storedSpec) {
        setTargetSpecialty(storedSpec);
      }
      const storedIntake = loadStudentAdvisingIntake(student.id);
      if (storedIntake) {
        setAdvisingIntake(storedIntake);
      }
    }
  }, [student.id]);

  const handleSpecialtyChange = (newSpecialty: string) => {
    if (newSpecialty === targetSpecialty) return;
    const currentProgs = loadItemsForSpecialty(targetSpecialty);
    if (currentProgs && currentProgs.length > 0) {
      setPendingSpecialtySwitch(newSpecialty);
    } else {
      applySpecialtySwitch(newSpecialty);
    }
  };

  const applySpecialtySwitch = (newSpecialty: string) => {
    setTargetSpecialty(newSpecialty);
    setStoredTargetSpecialty(newSpecialty);
    const updatedIntake: SpecialtyAdvisingIntake = {
      ...advisingIntake,
      applyingSpecialty: newSpecialty,
      specialtyAdvisorName: getDefaultAdvisorForSpecialty(newSpecialty),
    };
    setAdvisingIntake(updatedIntake);
    saveStudentAdvisingIntake(updatedIntake);
    setPendingSpecialtySwitch(null);
  };

  const specialtyRule = SPECIALTY_SIGNALING_RULES[targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  // Real-time synced counts across modules
  const [scholarlyStats, setScholarlyStats] = useState({ count: 2, meaningful: 2 });
  const [schoolListStats, setSchoolListStats] = useState({ count: 0, signalsAssigned: 0 });
  const [alumniSearchFilter, setAlumniSearchFilter] = useState('');

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

  type MainTabKey = 'dashboard' | 'programs' | 'application' | 'documents';

  const getMainTabForView = (view: typeof activeView): MainTabKey => {
    switch (view) {
      case 'overview':
        return 'dashboard';
      case 'school_list':
      case 'intake':
      case 'competitiveness':
      case 'alumni_directory':
        return 'programs';
      case 'personal_statement':
      case 'personal_statement_feedback':
      case 'experiences':
      case 'scholarly_works':
        return 'application';
      case 'letters':
      case 'transfer_kit':
        return 'documents';
      default:
        return 'dashboard';
    }
  };

  const activeMainTab = getMainTabForView(activeView);

  interface SubSectionItem {
    id: typeof activeView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  interface MainNavigationTab {
    id: MainTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    defaultView: typeof activeView;
    badge?: string;
    subSections?: SubSectionItem[];
  }

  const mainNavigationTabs: MainNavigationTab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      defaultView: 'overview',
    },
    {
      id: 'programs',
      label: 'Programs & Strategy',
      icon: Compass,
      defaultView: 'school_list',
      subSections: [
        { id: 'school_list', label: 'Program List & Signals', icon: Compass },
        {
          id: 'intake',
          label: 'Advising Intake',
          icon: FileCheck,
          badge: advisingIntake.isCompleted ? 'Complete' : 'In Progress',
        },
        { id: 'competitiveness', label: 'Specialty Appraisal', icon: TrendingUp },
        { id: 'alumni_directory', label: 'Alumni Network', icon: GraduationCap },
      ],
    },
    {
      id: 'application',
      label: 'Application Materials',
      icon: FileText,
      defaultView: 'personal_statement',
      badge: psStage.label,
      subSections: [
        {
          id: 'personal_statement',
          label: 'Personal Statement',
          icon: FileText,
          badge: psStage.label,
        },
        { id: 'experiences', label: '10 Selected Experiences', icon: Briefcase },
        { id: 'scholarly_works', label: 'Scholarly Works', icon: BookOpen },
      ],
    },
    {
      id: 'documents',
      label: 'Documents & Packet',
      icon: MailCheck,
      defaultView: 'letters',
      subSections: [
        { id: 'letters', label: 'Letters of Recommendation', icon: MailCheck },
        { id: 'transfer_kit', label: 'Packet & Exports', icon: Download },
      ],
    },
  ];

  const currentMainTabConfig = mainNavigationTabs.find((t) => t.id === activeMainTab);

  const renderViewContent = () => {
    if (activeView === 'intake') {
      return (
        <SpecialtyAdvisingFormModal
          isOpen={true}
          isEmbedded={true}
          onClose={() => setActiveView('overview')}
          studentId={student.id}
          onSaved={(updated) => {
            setAdvisingIntake(updated);
            if (updated.applyingSpecialty && updated.applyingSpecialty !== targetSpecialty) {
              applySpecialtySwitch(updated.applyingSpecialty);
            }
          }}
        />
      );
    }

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
          alumniResidents={alumniResidents}
          onNavigateToAlumni={(programName) => {
            setAlumniSearchFilter(programName);
            setActiveView('alumni_directory');
          }}
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
          initialSearchQuery={alumniSearchFilter}
          alumniResidents={alumniResidents}
          onBack={() => {
            setAlumniSearchFilter('');
            setActiveView('overview');
          }}
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

    if (activeView === 'letters') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveView('overview')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3A30] hover:text-[#142720] bg-white border border-[#D6E5DF] px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
            >
              &larr; Back to Student Hub
            </button>
          </div>
          <LetterOfRecommendationTracker
            specialty={targetSpecialty}
            onOpenSchoolList={() => setActiveView('school_list')}
          />
        </div>
      );
    }

    return (
      <StudentDashboardHome
        context={context}
        student={student}
        targetSpecialty={targetSpecialty}
        onSpecialtyChange={handleSpecialtyChange}
        advisingIntake={advisingIntake}
        onOpenIntake={() => setIsIntakeModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        personalStatement={personalStatement}
        latestPSFeedback={latestPSFeedback}
        experiences={experiences}
        onUpdateExperience={onUpdateExperience}
        assignedAdvisors={assignedAdvisors}
        scholarlyStats={scholarlyStats}
        schoolListStats={schoolListStats}
        onNavigate={(view) => setActiveView(view)}
        onOpenSplitCanvas={() => {
          setPsEditorMode('split');
          setActiveView('personal_statement');
        }}
        alumniResidents={alumniResidents}
      />
    );
  };

  return (
    <div className="space-y-3">
      {/* Level 1: Primary 4-Tab Navigation (AAMC MyERAS / Thalamus Pattern) */}
      <div className="flex justify-center">
        <nav
          aria-label="Applicant Main Navigation"
          className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-1.5 flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-none"
        >
          {mainNavigationTabs.map((tab) => {
            const isTabActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeMainTab !== tab.id) {
                    setActiveView(tab.defaultView);
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isTabActive
                    ? 'bg-[#1F3A30] text-white shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isTabActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isTabActive
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Level 2: Sub-Navigation Pills for Nested Sections */}
      {currentMainTabConfig && 'subSections' in currentMainTabConfig && currentMainTabConfig.subSections && (
        <div className="flex justify-center">
          <nav
            aria-label={`${currentMainTabConfig.label} Sub-sections`}
            className="bg-[#F2F4F2]/80 backdrop-blur-xs rounded-xl border border-neutral-200/70 p-1 flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-none"
          >
            {currentMainTabConfig.subSections.map((sub) => {
              const isSubActive =
                activeView === sub.id ||
                (sub.id === 'personal_statement' &&
                  (activeView === 'personal_statement' || activeView === 'personal_statement_feedback'));
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    if (sub.id === 'personal_statement') {
                      setActiveView('personal_statement');
                    } else {
                      setActiveView(sub.id as any);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-white text-[#1F3A30] shadow-xs font-bold border border-neutral-200/80'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                  }`}
                >
                  <sub.icon className={`w-3.5 h-3.5 ${isSubActive ? 'text-[#1F3A30]' : 'text-neutral-500'}`} />
                  <span>{sub.label}</span>
                  {sub.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isSubActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.badge === 'Complete'
                          ? 'bg-emerald-100/70 text-emerald-800'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Subview Content */}
      {renderViewContent()}

      {/* Specialty Advising Form Modal (Geisinger Intake) */}
      <SpecialtyAdvisingFormModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        studentId={student.id}
        onSaved={(updated) => {
          setAdvisingIntake(updated);
          if (updated.applyingSpecialty && updated.applyingSpecialty !== targetSpecialty) {
            setTargetSpecialty(updated.applyingSpecialty);
          }
        }}
      />

      {/* Specialty Switching Safety Hand-off Modal */}
      <SpecialtySwitchingSafetyModal
        isOpen={Boolean(pendingSpecialtySwitch)}
        onClose={() => setPendingSpecialtySwitch(null)}
        currentSpecialty={targetSpecialty}
        newSpecialty={pendingSpecialtySwitch || ''}
        savedPrograms={loadItemsForSpecialty(targetSpecialty)}
        onConfirmSwitch={() => {
          if (pendingSpecialtySwitch) {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
              const key = getStorageKeyForSpecialty(targetSpecialty);
              localStorage.removeItem(key);
            }
            setSchoolListStats({ count: 0, signalsAssigned: 0 });
            applySpecialtySwitch(pendingSpecialtySwitch);
          }
        }}
      />

      {/* Applicant Profile Questionnaire Modal (Legacy Metrics) */}
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
