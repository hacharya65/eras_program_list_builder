'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/domain/types';
import {
  Stethoscope,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  User,
  Sparkles,
  ClipboardCopy,
  Settings,
  FileText,
  Contact,
  Mail,
  LogOut,
  HelpCircle,
} from 'lucide-react';

interface DevPersonaSwitcherProps {
  currentRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
  institutionName?: string;
  medicalSchool?: string;
  userName?: string;
  userRoleTitle?: string;
  onOpenProfileManagement?: () => void;
  onOpenAdvisingLeadership?: () => void;
  onOpenFaq?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  defaultMenuOpen?: boolean;
}

export function DevPersonaSwitcher({
  currentRole = 'student',
  onSelectRole,
  institutionName,
  medicalSchool,
  userName = 'Alex Rivera',
  userRoleTitle = 'MS4 Applicant',
  onOpenProfileManagement,
  onOpenAdvisingLeadership,
  onOpenFaq,
  onOpenAuthModal,
  onLogout,
  defaultMenuOpen = false,
}: DevPersonaSwitcherProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(defaultMenuOpen);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const personas: { role: UserRole; name: string; title: string; icon: React.ReactNode }[] = [
    {
      role: 'student',
      name: 'Alex Rivera',
      title: 'MS4 Applicant',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
    },
    {
      role: 'advisor',
      name: 'Dr. Marcus Chen',
      title: 'Faculty Advisor',
      icon: <Stethoscope className="w-3.5 h-3.5" />,
    },
    {
      role: 'admin',
      name: 'Dr. Evelyn Taylor',
      title: 'Dean of Student Affairs',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  ];

  const handleProfileClick = () => {
    if (onOpenProfileManagement) {
      onOpenProfileManagement();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigate_to_profile_management'));
    }
    setIsProfileMenuOpen(false);
  };

  const handleIntakeClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigate_to_intake'));
    }
    setIsProfileMenuOpen(false);
  };

  const handleLeadershipClick = () => {
    if (onOpenAdvisingLeadership) {
      onOpenAdvisingLeadership();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigate_to_advising_leadership'));
    }
    setIsProfileMenuOpen(false);
  };

  const handleFaqClick = () => {
    if (onOpenFaq) {
      onOpenFaq();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigate_to_faq'));
    }
    setIsProfileMenuOpen(false);
  };

  const activePersonaName =
    currentRole === 'student' ? userName : currentRole === 'advisor' ? 'Dr. Marcus Chen' : 'Dr. Evelyn Taylor';
  const activePersonaTitle =
    currentRole === 'student' ? userRoleTitle : currentRole === 'advisor' ? 'Faculty Advisor' : 'Dean of Student Affairs';

  return (
    <div className="sticky top-0 z-50 shadow-xs">
      {/* Level 0: Top Demonstration Strip (Solid Dark Spruce #1F3A30) with Shifted Active Persona Switcher */}
      <div className="bg-[#1F3A30] text-white py-1.5 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          {/* Demonstration Notice */}
          <div className="font-medium tracking-wide text-white/90 text-center sm:text-left flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>Demonstration — fictional applicant records</span>
          </div>

          {/* Student Status Tag */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border border-white/10">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Match Strategy &amp; Signaling Workspace</span>
            </span>
          </div>
        </div>
      </div>

      {/* Level 1: Main Institutional Navigation Header (Pure White #FFFFFF) with Classic Profile Tab */}
      <header className="bg-white border-b border-neutral-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Ethmoid Logo & School Name */}
          <div className="flex items-center gap-3">
            <img
              src="/ethmoid-square.jpeg"
              alt="Ethmoid logo"
              className="h-9 w-9 object-contain"
            />
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold tracking-tight text-neutral-900">
                Ethmoid
              </span>
              <span className="h-4 w-px bg-neutral-300 hidden sm:block" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-600 hidden sm:block">
                {medicalSchool || institutionName || 'Match Strategy & Signaling'}
              </span>
            </div>
          </div>

          {/* Right: Advising Leadership Quick Icon, FAQ Quick Icon & Classic Profile Tab */}
          <div className="flex items-center gap-2">
            {/* Advising and Leadership Quick Icon */}
            <button
              onClick={handleLeadershipClick}
              className="flex items-center justify-center w-9 h-9 rounded-2xl border border-neutral-200/80 bg-white hover:bg-[#EAF2EE] text-neutral-600 hover:text-[#1F3A30] hover:border-[#1F3A30]/30 transition-all cursor-pointer shadow-2xs group relative"
              title="Advising and Leadership"
              aria-label="Advising and Leadership"
            >
              <Contact className="w-4 h-4 text-neutral-600 group-hover:text-[#1F3A30] group-hover:scale-105 transition-all" />
              <span className="sr-only">Advising and Leadership</span>
            </button>

            {/* Frequently Asked Questions Quick Icon */}
            <button
              onClick={handleFaqClick}
              className="flex items-center justify-center w-9 h-9 rounded-2xl border border-neutral-200/80 bg-white hover:bg-[#EAF2EE] text-neutral-600 hover:text-[#1F3A30] hover:border-[#1F3A30]/30 transition-all cursor-pointer shadow-2xs group relative"
              title="Frequently Asked Questions & Guide"
              aria-label="Frequently Asked Questions & Guide"
            >
              <HelpCircle className="w-4 h-4 text-neutral-600 group-hover:text-[#1F3A30] group-hover:scale-105 transition-all" />
              <span className="sr-only">Frequently Asked Questions & Guide</span>
            </button>

            {/* Classic Profile Tab with User Name & Circular Picture */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 p-1.5 pl-2.5 rounded-2xl hover:bg-neutral-50 border border-neutral-200/80 transition-all cursor-pointer group"
                aria-expanded={isProfileMenuOpen}
                title="Open Profile Management"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-neutral-900 group-hover:text-[#1F3A30] transition-colors leading-tight">
                    {activePersonaName}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-medium truncate max-w-[150px]">
                    {medicalSchool || activePersonaTitle}
                  </div>
                </div>

                {/* User Avatar Circle */}
                <div className="w-9 h-9 rounded-full bg-[#1F3A30] text-white flex items-center justify-center font-bold text-xs ring-2 ring-neutral-200 group-hover:ring-[#7EAE9B] transition-all shrink-0 shadow-2xs">
                  {activePersonaName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-neutral-200/90 shadow-lg p-2 z-50 text-xs">
                  <div className="p-3 border-b border-neutral-100">
                    <div className="font-bold text-neutral-900 text-sm">{activePersonaName}</div>
                    <div className="text-[11px] text-neutral-500">{activePersonaTitle}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
                      {medicalSchool || 'Medical School'}
                    </div>
                  </div>

                  <div className="py-1.5 space-y-0.5">
                    {onOpenAuthModal && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-800 hover:bg-[#EAF2EE] hover:text-[#1F3A30] font-bold transition-colors text-left cursor-pointer border-b border-neutral-100 mb-1"
                      >
                        <User className="w-4 h-4 text-[#1F3A30]" />
                        <span>Switch Student / New Intake</span>
                      </button>
                    )}

                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-[#EAF2EE] hover:text-[#1F3A30] font-semibold transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#4E8773]" />
                      <span>Profile Management &amp; Scores</span>
                    </button>

                    <button
                      onClick={handleLeadershipClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-[#EAF2EE] hover:text-[#1F3A30] font-semibold transition-colors text-left cursor-pointer"
                    >
                      <Contact className="w-4 h-4 text-[#4E8773]" />
                      <span>Advising and Leadership</span>
                    </button>

                    <button
                      onClick={handleFaqClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-[#EAF2EE] hover:text-[#1F3A30] font-semibold transition-colors text-left cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-[#4E8773]" />
                      <span>FAQ &amp; Platform Walkthrough</span>
                    </button>

                    <button
                      onClick={handleIntakeClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-[#EAF2EE] hover:text-[#1F3A30] font-semibold transition-colors text-left cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#4E8773]" />
                      <span>Specialty Advising Dossier</span>
                    </button>

                    {onLogout && (
                      <div className="pt-1 mt-1 border-t border-neutral-100">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-700 hover:bg-red-50 hover:text-red-800 font-semibold transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
