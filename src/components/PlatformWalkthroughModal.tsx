'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Compass,
  FileCheck,
  MailCheck,
  BookOpen,
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Contact,
  TrendingUp,
} from 'lucide-react';

export interface PlatformWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  onNavigateToView?: (view: string) => void;
}

interface WalkthroughStep {
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  headline: string;
  description: string;
  highlights: { title: string; detail: string }[];
  targetView?: string;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    title: 'Welcome to Ethmoid',
    badge: 'Getting Started',
    icon: Sparkles,
    iconBg: 'bg-emerald-100 text-emerald-800',
    headline: 'Your Personalized Residency Match & Signaling Workspace',
    description:
      'Ethmoid is designed to guide you through every milestone of your residency application. Your new account starts with a fresh, clean workspace so you can tailor every program, signal, and recommendation to your goals.',
    highlights: [
      {
        title: 'Clean Slate Account',
        detail: 'No pre-filled school lists or mock recommendations. Your data is 100% yours and private.',
      },
      {
        title: 'Evidence-Based Strategy',
        detail: 'Powered by official ACGME program data, NRMP charting outcomes, and specialty signaling rules.',
      },
      {
        title: 'Continuous Faculty Alignment',
        detail: 'Keep your specialty advisors, regional deans, and mentors in sync with your evolving match plan.',
      },
    ],
  },
  {
    title: 'Applicant Dashboard',
    badge: 'Hub & Milestones',
    icon: LayoutDashboard,
    iconBg: 'bg-[#EAF2EE] text-[#1F3A30]',
    headline: 'High-Level Progress & Advisor Collaboration',
    description:
      'The Dashboard serves as your mission control throughout the match cycle. Monitor your overall portfolio readiness, track upcoming ERAS deadlines, and review feedback from your faculty advisor.',
    highlights: [
      {
        title: 'Strategic Readiness Score',
        detail: 'Real-time assessment combining clerkship grades, board scores, and clinical engagement.',
      },
      {
        title: 'Advisor Direct Line',
        detail: 'Quickly review your assigned faculty advisor, schedule 1:1 check-ins, and prepare meeting dossiers.',
      },
      {
        title: 'Key Milestones',
        detail: 'Track token registration, MSPE release, signaling deadlines, and interview season.',
      },
    ],
    targetView: 'overview',
  },
  {
    title: 'Programs & Strategy',
    badge: 'School List & Signaling',
    icon: Compass,
    iconBg: 'bg-sky-100 text-sky-800',
    headline: '2,500+ ACGME Programs & ERAS Signal Allocation',
    description:
      'Search accredited residency programs across the United States. Classify programs into Reach, Target, and Safety tiers, and allocate your precious Gold and Silver signals according to specialty guidelines.',
    highlights: [
      {
        title: 'ACGME Master Database',
        detail: 'Filter by specialty, state, program type, and historical applicant competitiveness.',
      },
      {
        title: 'Gold & Silver Signals',
        detail: 'Stay within official specialty limits (e.g. 3 Gold + 12 Silver in IM) with automatic quota validation.',
      },
      {
        title: 'Geographic Alignment',
        detail: 'Harmonize your 3 ERAS geographic preference divisions with your target school list.',
      },
    ],
    targetView: 'school_list',
  },
  {
    title: 'Advising Intake Dossier',
    badge: 'Academic Profile',
    icon: FileCheck,
    iconBg: 'bg-amber-100 text-amber-800',
    headline: 'Comprehensive MSPE & Advising Dossier',
    description:
      'Record your core clinical clerkships, Step examination scores, research contributions, and work experiences. You can modify, add, or remove clerkships as your clinical schedule progresses.',
    highlights: [
      {
        title: 'Core Clerkships & Electives',
        detail: 'Track Honors, High Pass, and Pass grades across your 7 core rotations plus sub-internships.',
      },
      {
        title: 'NRMP Metrics',
        detail: 'Log publications, presentations, and verified work experiences for accurate statistical modeling.',
      },
      {
        title: 'Exportable Advising Packet',
        detail: 'Generate a clean, standardized summary for your department chair and specialty advisors.',
      },
    ],
    targetView: 'intake',
  },
  {
    title: 'Letters & Reflective Journal',
    badge: 'Narrative & Recommendations',
    icon: MailCheck,
    iconBg: 'bg-indigo-100 text-indigo-800',
    headline: 'LOR Tracking & Patient Encounter Repository',
    description:
      'Manage faculty letter requests, specialty assignments, and letter submission statuses. Use the Reflective Journal to capture meaningful patient cases and leadership moments for your personal statement.',
    highlights: [
      {
        title: 'Letter of Recommendation Tracker',
        detail: 'Assign letters to specific specialties and track confirmed submissions vs pending requests.',
      },
      {
        title: 'Reflective Experience Journal',
        detail: 'Document defining clinical interactions, patient care epiphanies, and meaningful extracurriculars.',
      },
      {
        title: 'Interview Story Banking',
        detail: 'Organize personal stories into STAR format (Situation, Task, Action, Result) for interview prep.',
      },
    ],
    targetView: 'letters',
  },
  {
    title: 'Advising Leadership & FAQ',
    badge: 'Support & Guidance',
    icon: Contact,
    iconBg: 'bg-emerald-100 text-emerald-800',
    headline: 'Faculty Directory & On-Demand Assistance',
    description:
      'Access the official Advising and Leadership directory at any time from the top navigation bar. If you ever have questions or want to review this walkthrough again, visit the FAQ tab right next to it.',
    highlights: [
      {
        title: 'Advising and Leadership',
        detail: 'Direct contact info, office hours, and booking links for specialty champions and deans.',
      },
      {
        title: 'FAQ & Platform Guide',
        detail: 'Answers to common questions regarding signaling rules, tiers, clerkships, and LOR best practices.',
      },
      {
        title: 'Replay Walkthrough',
        detail: 'You can re-launch this 6-step walkthrough at any time from the top of the FAQ tab.',
      },
    ],
    targetView: 'faq',
  },
];

export function PlatformWalkthroughModal({
  isOpen,
  onClose,
  studentName = 'Colleague',
  onNavigateToView,
}: PlatformWalkthroughModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset step to 0 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && currentStepIndex < WALKTHROUGH_STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        setCurrentStepIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  if (!isOpen) return null;

  const currentStep = WALKTHROUGH_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WALKTHROUGH_STEPS.length - 1;
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleStepJump = (targetView?: string) => {
    if (targetView && onNavigateToView) {
      onClose();
      onNavigateToView(targetView);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Platform Walkthrough"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1F3A30] to-[#27483C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                Platform Tour
              </div>
              <h2 className="text-base font-bold text-white leading-tight">
                Welcome to Ethmoid, {studentName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close walkthrough"
            aria-label="Close walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Dots & Bar */}
        <div className="px-6 pt-4 pb-2 border-b border-neutral-100 bg-[#F9FAF9]">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-2">
            <span>
              Step {currentStepIndex + 1} of {WALKTHROUGH_STEPS.length}:{' '}
              <strong className="text-neutral-900">{currentStep.title}</strong>
            </span>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {currentStep.badge}
            </span>
          </div>

          {/* Progress Segments */}
          <div className="grid grid-cols-6 gap-1.5">
            {WALKTHROUGH_STEPS.map((s, idx) => (
              <button
                key={s.title}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'bg-[#1F3A30]'
                    : idx < currentStepIndex
                    ? 'bg-[#4E8773]'
                    : 'bg-neutral-200 hover:bg-neutral-300'
                }`}
                title={`Go to step ${idx + 1}: ${s.title}`}
                aria-label={`Go to step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-800 flex-1">
          {/* Hero Step Intro */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${currentStep.iconBg}`}
            >
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 leading-snug">
                {currentStep.headline}
              </h3>
              <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Highlights Checklist */}
          <div className="bg-[#F8FAF9] rounded-2xl p-4 border border-[#E3ECE8] space-y-3">
            <div className="text-xs font-bold text-[#1F3A30] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4E8773]" />
              <span>Key Features &amp; Capabilities</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {currentStep.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4E8773] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-neutral-900">{h.title}: </span>
                    <span className="text-neutral-600">{h.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Jump to View Shortcut */}
          {currentStep.targetView && (
            <div className="text-right">
              <button
                onClick={() => handleStepJump(currentStep.targetView)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3A30] hover:text-[#12231D] hover:underline cursor-pointer"
              >
                <span>Jump directly to {currentStep.title}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer px-2 py-1.5 rounded-lg"
          >
            Skip Walkthrough
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-xl bg-[#1F3A30] hover:bg-[#162D25] text-white shadow-xs transition-all cursor-pointer"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
