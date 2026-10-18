import React, { useState, useEffect } from 'react';
import { StudentDashboardContext } from '@/domain/types';
import { SchoolListMatrix } from './SchoolListMatrix';
import { CompetitivenessCalculator } from './CompetitivenessCalculator';
import { ApplicantProfileModal } from './ApplicantProfileModal';
import { SpecialtyAdvisingFormModal } from './SpecialtyAdvisingFormModal';
import { LetterOfRecommendationTracker } from './LetterOfRecommendationTracker';
import { SpecialtySwitchingSafetyModal } from './SpecialtySwitchingSafetyModal';
import { StudentDashboardHome } from './StudentDashboardHome';
import { ProfileManagementView } from './ProfileManagementView';
import { JournalRepositoryView } from './JournalRepositoryView';
import { StudentAuthModal } from './StudentAuthModal';
import { PlatformWalkthroughModal } from './PlatformWalkthroughModal';
import { FaqAndGuideView } from './FaqAndGuideView';
import {
  StudentAccount,
  getCurrentStudentId,
  getStudentAccount,
  isDemoStudentId,
} from '@/domain/student-registry';
import {
  CANONICAL_SPECIALTIES,
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
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
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  Compass,
  MailCheck,
  TrendingUp,
  Download,
  FileCheck,
  ArrowLeft,
} from 'lucide-react';

interface StudentPortalProps {
  context: StudentDashboardContext;
  currentStudentAccount?: StudentAccount | null;
  onOpenAuthModal?: () => void;
  onStudentSwitched?: (account: StudentAccount) => void;
}

export function StudentPortal({
  context,
  currentStudentAccount,
  onOpenAuthModal,
  onStudentSwitched,
}: StudentPortalProps) {
  const [activeView, setActiveView] = useState<
    | 'overview'
    | 'profile'
    | 'intake'
    | 'journal'
    | 'school_list'
    | 'competitiveness'
    | 'letters'
    | 'faq'
  >('overview');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const { student, assignedAdvisors } = context;

  // Active Student ID
  const activeStudentId = currentStudentAccount?.id || student.id;

  // Specialty Advising Intake State (Deterministic SSR initialization to prevent hydration mismatches)
  const [advisingIntake, setAdvisingIntake] = useState<SpecialtyAdvisingIntake>({
    ...INITIAL_MOCK_INTAKE,
    studentId: activeStudentId,
    applyingSpecialty: currentStudentAccount?.specialty || student.specialty || 'Internal Medicine',
    medicalSchool: currentStudentAccount?.medicalSchool || INITIAL_MOCK_INTAKE.medicalSchool,
  });
  const [pendingSpecialtySwitch, setPendingSpecialtySwitch] = useState<string | null>(null);

  // Student Target Specialty State (Deterministic SSR initialization)
  const [targetSpecialty, setTargetSpecialty] = useState<string>(
    student.specialty || 'Internal Medicine'
  );

  // Scroll to top and synchronize URL search parameters on view navigation
  const updateView = (newView: typeof activeView, replaceHistory = false) => {
    setActiveView(newView);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      try {
        const url = new URL(window.location.href);
        const urlParam = newView === 'overview' ? 'dashboard' : newView;
        url.searchParams.set('view', urlParam);
        if (replaceHistory) {
          window.history.replaceState({ view: newView }, '', url.toString());
        } else {
          window.history.pushState({ view: newView }, '', url.toString());
        }
      } catch (e) {
        // Fallback
      }
    }
  };

  // Always reset to dashboard when activeStudentId changes (login, switch, demo)
  useEffect(() => {
    updateView('overview', true);
  }, [activeStudentId]);

  // Auto-launch platform walkthrough for new (non-demo) accounts on first visit
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (!isDemoStudentId(activeStudentId)) {
        const completed = localStorage.getItem(`ethmoid_walkthrough_completed_${activeStudentId}`);
        if (completed !== 'true') {
          setIsWalkthroughOpen(true);
        }
      }
    }
  }, [activeStudentId]);

  const handleCloseWalkthrough = () => {
    setIsWalkthroughOpen(false);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(`ethmoid_walkthrough_completed_${activeStudentId}`, 'true');
    }
  };

  // Sync with browser history and URL search params on mount and popstate
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rawView = params.get('view');
      const urlView = rawView === 'dashboard' ? 'overview' : (rawView as typeof activeView | null);
      if (
        urlView &&
        [
          'overview',
          'profile',
          'intake',
          'journal',
          'school_list',
          'competitiveness',
          'letters',
          'faq',
        ].includes(urlView)
      ) {
        setActiveView(urlView);
      } else {
        // Default to dashboard and ensure dedicated URL
        setActiveView('overview');
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'dashboard');
        window.history.replaceState({ view: 'overview' }, '', url.toString());
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const rawView = params.get('view');
        const urlView = rawView === 'dashboard' ? 'overview' : ((rawView || 'overview') as typeof activeView);
        if (
          [
            'overview',
            'profile',
            'intake',
            'journal',
            'school_list',
            'competitiveness',
            'letters',
            'faq',
          ].includes(urlView)
        ) {
          setActiveView(urlView);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to custom navigation events from top nav or external components
  useEffect(() => {
    const handleNavDashboard = () => updateView('overview');
    const handleNavProfile = () => updateView('profile');
    const handleNavIntake = () => updateView('intake');
    const handleNavFaq = () => updateView('faq');
    const handleNavLetters = () => updateView('letters');
    const handleNavSchoolList = () => updateView('school_list');
    const handleOpenWalkthrough = () => setIsWalkthroughOpen(true);
    const handleOpenAuth = () => {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        setIsAuthModalOpen(true);
      }
    };

    window.addEventListener('navigate_to_dashboard', handleNavDashboard);
    window.addEventListener('navigate_to_overview', handleNavDashboard);
    window.addEventListener('navigate_to_profile', handleNavProfile);
    window.addEventListener('navigate_to_profile_management', handleNavProfile);
    window.addEventListener('navigate_to_intake', handleNavIntake);
    window.addEventListener('navigate_to_faq', handleNavFaq);
    window.addEventListener('navigate_to_letters', handleNavLetters);
    window.addEventListener('navigate_to_school_list', handleNavSchoolList);
    window.addEventListener('open_platform_walkthrough', handleOpenWalkthrough);
    window.addEventListener('open_student_auth_modal', handleOpenAuth);

    return () => {
      window.removeEventListener('navigate_to_dashboard', handleNavDashboard);
      window.removeEventListener('navigate_to_overview', handleNavDashboard);
      window.removeEventListener('navigate_to_profile', handleNavProfile);
      window.removeEventListener('navigate_to_profile_management', handleNavProfile);
      window.removeEventListener('navigate_to_intake', handleNavIntake);
      window.removeEventListener('navigate_to_faq', handleNavFaq);
      window.removeEventListener('navigate_to_letters', handleNavLetters);
      window.removeEventListener('navigate_to_school_list', handleNavSchoolList);
      window.removeEventListener('open_platform_walkthrough', handleOpenWalkthrough);
      window.removeEventListener('open_student_auth_modal', handleOpenAuth);
    };
  }, [onOpenAuthModal]);

  // Sync client-side intake and target specialty in useEffect
  useEffect(() => {
    const loadedIntake = loadStudentAdvisingIntake(activeStudentId);
    if (loadedIntake) {
      setAdvisingIntake(loadedIntake);
      if (loadedIntake.applyingSpecialty) {
        setTargetSpecialty(loadedIntake.applyingSpecialty);
        return;
      }
    }
    const stored = getStoredTargetSpecialty();
    if (stored) {
      setTargetSpecialty(stored);
    }
  }, [activeStudentId]);

  // School List Summary Stats (Deterministic SSR default)
  const [schoolListStats, setSchoolListStats] = useState({
    count: 0,
    signalsAssigned: 0,
  });

  // Update stats on mount and specialty switch
  useEffect(() => {
    const items = loadItemsForSpecialty(targetSpecialty);
    const assignedSignals = items.filter((i) => i.signal === 'gold' || i.signal === 'silver').length;
    setSchoolListStats({
      count: items.length,
      signalsAssigned: assignedSignals,
    });
  }, [targetSpecialty]);

  const handleSpecialtyChange = (newSpecialty: string) => {
    const currentItems = loadItemsForSpecialty(targetSpecialty);
    if (currentItems.length > 0 && newSpecialty !== targetSpecialty) {
      setPendingSpecialtySwitch(newSpecialty);
    } else {
      applySpecialtySwitch(newSpecialty);
    }
  };

  const applySpecialtySwitch = (newSpecialty: string) => {
    setStoredTargetSpecialty(newSpecialty);
    setTargetSpecialty(newSpecialty);

    const defaultAdvisor = getDefaultAdvisorForSpecialty(newSpecialty);
    const updatedIntake: SpecialtyAdvisingIntake = {
      ...advisingIntake,
      applyingSpecialty: newSpecialty,
      specialtyAdvisorName: defaultAdvisor || advisingIntake.specialtyAdvisorName,
    };
    setAdvisingIntake(updatedIntake);
    saveStudentAdvisingIntake(updatedIntake);

    const newItems = loadItemsForSpecialty(newSpecialty);
    const assigned = newItems.filter((i) => i.signal === 'gold' || i.signal === 'silver').length;
    setSchoolListStats({
      count: newItems.length,
      signalsAssigned: assigned,
    });

    setPendingSpecialtySwitch(null);
  };

  type MainTabKey = 'dashboard' | 'programs' | 'journal' | 'documents';

  const getMainTabForView = (view: typeof activeView): MainTabKey => {
    switch (view) {
      case 'overview':
      case 'profile':
        return 'dashboard';
      case 'school_list':
      case 'competitiveness':
      case 'letters':
        return 'programs';
      case 'journal':
        return 'journal';
      case 'intake':
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
        { id: 'letters', label: 'Letters of Recommendation', icon: MailCheck },
        { id: 'competitiveness', label: 'Specialty Appraisal', icon: TrendingUp },
      ],
    },
    {
      id: 'journal',
      label: 'Reflective Journal',
      icon: BookOpen,
      defaultView: 'journal',
    },
    {
      id: 'documents',
      label: 'Documents & Packet',
      icon: FileCheck,
      defaultView: 'intake',
      subSections: [
        {
          id: 'intake',
          label: 'Advising Intake Packet',
          icon: FileCheck,
          badge: advisingIntake.isCompleted ? 'Complete' : 'In Progress',
        },
      ],
    },
  ];

  const currentMainTabConfig = mainNavigationTabs.find((t) => t.id === activeMainTab);

  const currentActiveStudent = {
    ...student,
    id: activeStudentId,
    name: currentStudentAccount?.name || student.name,
    email: currentStudentAccount?.email || student.email,
    specialty: currentStudentAccount?.specialty || student.specialty,
  };

  const renderViewContent = () => {
    if (activeView === 'intake') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => updateView('overview')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3A30] hover:text-[#142720] bg-white border border-[#D6E5DF] px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <SpecialtyAdvisingFormModal
            isOpen={true}
            isEmbedded={true}
            onClose={() => updateView('overview')}
            studentId={activeStudentId}
            onSaved={(updated) => {
              setAdvisingIntake(updated);
              if (updated.applyingSpecialty && updated.applyingSpecialty !== targetSpecialty) {
                applySpecialtySwitch(updated.applyingSpecialty);
              }
            }}
          />
        </div>
      );
    }

    if (activeView === 'journal') {
      return (
        <JournalRepositoryView
          student={currentActiveStudent}
          onBack={() => updateView('overview')}
        />
      );
    }

    if (activeView === 'school_list') {
      return (
        <SchoolListMatrix
          specialty={targetSpecialty}
          studentId={activeStudentId}
          onBack={() => updateView('overview')}
          onNavigateToLetters={() => updateView('letters')}
        />
      );
    }

    if (activeView === 'competitiveness') {
      return (
        <CompetitivenessCalculator
          initialSpecialty={targetSpecialty}
          onBack={() => updateView('overview')}
        />
      );
    }

    if (activeView === 'letters') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => updateView('overview')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3A30] hover:text-[#142720] bg-white border border-[#D6E5DF] px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <LetterOfRecommendationTracker
            specialty={targetSpecialty}
            studentId={activeStudentId}
            onOpenSchoolList={() => updateView('school_list')}
          />
        </div>
      );
    }

    if (activeView === 'profile') {
      const assignedAdvisor = assignedAdvisors && assignedAdvisors.length > 0 ? assignedAdvisors[0] : undefined;
      return (
        <ProfileManagementView
          student={currentActiveStudent}
          targetSpecialty={targetSpecialty}
          onSpecialtyChange={handleSpecialtyChange}
          advisingIntake={advisingIntake}
          onOpenIntake={() => updateView('intake')}
          onBack={() => updateView('overview')}
          assignedAdvisor={assignedAdvisor}
        />
      );
    }

    if (activeView === 'faq') {
      return (
        <FaqAndGuideView
          onBack={() => updateView('overview')}
          onStartWalkthrough={() => setIsWalkthroughOpen(true)}
          onNavigateToView={(view) => updateView(view as any)}
          targetSpecialty={targetSpecialty}
        />
      );
    }

    return (
      <StudentDashboardHome
        context={context}
        student={currentActiveStudent}
        targetSpecialty={targetSpecialty}
        onSpecialtyChange={handleSpecialtyChange}
        advisingIntake={advisingIntake}
        onOpenIntake={() => updateView('intake')}
        onOpenProfile={() => updateView('profile')}
        assignedAdvisors={assignedAdvisors}
        schoolListStats={schoolListStats}
        onNavigate={(view) => updateView(view)}
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
                  updateView(tab.defaultView);
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
              const isSubActive = activeView === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => updateView(sub.id as any)}
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
        studentName={currentStudentAccount?.name || student.name}
        specialty={targetSpecialty}
        onOpenCompetitivenessEngine={() => {
          setIsProfileModalOpen(false);
          updateView('competitiveness');
        }}
      />

      {/* Multi-Student Intake & Authentication Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={(newAcc) => {
          setIsAuthModalOpen(false);
          if (onStudentSwitched) {
            onStudentSwitched(newAcc);
          }
          const loaded = loadStudentAdvisingIntake(newAcc.id);
          setAdvisingIntake(loaded);
          if (newAcc.specialty) {
            applySpecialtySwitch(newAcc.specialty);
          }
        }}
      />

      {/* Platform Interactive Walkthrough Modal */}
      <PlatformWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={handleCloseWalkthrough}
        studentName={currentStudentAccount?.name || student.name}
        onNavigateToView={(view) => updateView(view as any)}
      />
    </div>
  );
}
