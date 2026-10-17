'use client';

import React, { useState, useEffect } from 'react';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import { StudentPortal } from '@/components/StudentPortal';
import { StudentAuthModal } from '@/components/StudentAuthModal';
import { ThalamusAuthExperience } from '@/components/ThalamusAuthExperience';
import { BrowserStoragePortfolioAdapter } from '@/domain/student-portfolio';
import {
  StudentAccount,
  getCurrentStudentId,
  getStudentAccount,
  loadStudentRegistry,
  isUserAuthenticated,
  logoutSession,
  setAuthenticatedSession,
} from '@/domain/student-registry';

// Instantiate singleton service with in-memory adapter and browser storage portfolio adapter
const storage = new InMemoryStorageAdapter();
const portfolioRepo = new BrowserStoragePortfolioAdapter();
const service = new AdvisingPlatformService(storage, portfolioRepo);

export default function HomePage() {
  const studentContext = service.getStudentDashboardContext();
  const [currentAccount, setCurrentAccount] = useState<StudentAccount | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const authed = isUserAuthenticated();
    setIsAuthenticated(authed);

    if (authed) {
      const id = getCurrentStudentId();
      const acc = getStudentAccount(id);
      if (acc) {
        setCurrentAccount(acc);
      } else {
        const registry = loadStudentRegistry();
        if (registry.length > 0) {
          setCurrentAccount(registry[0]);
        }
      }
    }

    const handleSwitched = (e: any) => {
      const switchedId = e.detail?.studentId;
      if (switchedId) {
        const found = getStudentAccount(switchedId);
        if (found) setCurrentAccount(found);
      }
    };

    window.addEventListener('student_account_switched', handleSwitched);
    return () => window.removeEventListener('student_account_switched', handleSwitched);
  }, []);

  const handleAuthenticated = (acc: StudentAccount) => {
    setAuthenticatedSession(true);
    setCurrentAccount(acc);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logoutSession();
    setIsAuthenticated(false);
  };

  // If not mounted yet (SSR) or not authenticated, render ThalamusAuthExperience
  if (!isMounted || !isAuthenticated) {
    return (
      <ThalamusAuthExperience
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const currentSchool = currentAccount?.medicalSchool || '';
  const currentName = currentAccount?.name || studentContext.student.name;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F5] text-neutral-800">
      {/* Student Navigation Header */}
      <DevPersonaSwitcher
        currentRole="student"
        onSelectRole={() => {}}
        institutionName={currentSchool || 'Medical Student Match Strategy'}
        medicalSchool={currentSchool}
        userName={currentName}
        userRoleTitle="MS4 Applicant"
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAdvisingLeadership={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'advising_leadership');
            window.history.pushState({ view: 'advising_leadership' }, '', url.toString());
            window.scrollTo({ top: 0, behavior: 'instant' });
            window.dispatchEvent(new CustomEvent('navigate_to_advising_leadership'));
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentPortal
          context={studentContext}
          currentStudentAccount={currentAccount}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onStudentSwitched={(acc) => setCurrentAccount(acc)}
        />
      </main>

      {/* Multi-Student Intake & Login Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={(acc) => {
          handleAuthenticated(acc);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Institutional Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#1F3A30] text-sm">Ethmoid Match Strategy</span>
            {currentSchool && (
              <>
                <span className="text-neutral-300">&bull;</span>
                <span className="font-medium text-neutral-700">{currentSchool}</span>
              </>
            )}
          </div>
          <span className="text-neutral-400 text-[11px]">
            Grounded in 2026/2027 AAMC ERAS &amp; NRMP Match Specifications &bull; Student Decision Support &bull; Multi-Student Cohort
          </span>
        </div>
      </footer>
    </div>
  );
}
