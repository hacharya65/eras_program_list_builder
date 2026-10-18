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
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'dashboard');
      window.history.replaceState({ view: 'overview' }, '', url.toString());
    }
    setAuthenticatedSession(true);
    setCurrentAccount(acc);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.pathname);
    }
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
        onLogout={handleLogout}
        onOpenFaq={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'faq');
            window.history.pushState({ view: 'faq' }, '', url.toString());
            window.scrollTo({ top: 0, behavior: 'instant' });
            window.dispatchEvent(new CustomEvent('navigate_to_faq'));
          }
        }}
        onOpenDashboard={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'dashboard');
            window.history.pushState({ view: 'overview' }, '', url.toString());
            window.scrollTo({ top: 0, behavior: 'instant' });
            window.dispatchEvent(new CustomEvent('navigate_to_dashboard'));
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

      {/* Centered Professional Disclaimer Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-4 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
            Data reflects the 2026 ACGME Accredited Program Database and population-level outcome statistics published by the NRMP. Designed as an independent decision-support tool for residency application strategy and signaling.
          </p>
        </div>
      </footer>
    </div>
  );
}
