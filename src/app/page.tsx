'use client';

import React from 'react';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import { StudentPortal } from '@/components/StudentPortal';
import { BrowserStoragePortfolioAdapter } from '@/domain/student-portfolio';

// Instantiate singleton service with in-memory adapter and browser storage portfolio adapter
const storage = new InMemoryStorageAdapter();
const portfolioRepo = new BrowserStoragePortfolioAdapter();
const service = new AdvisingPlatformService(storage, portfolioRepo);

export default function HomePage() {
  const studentContext = service.getStudentDashboardContext();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F5] text-neutral-800">
      {/* Student Navigation Header */}
      <DevPersonaSwitcher
        currentRole="student"
        onSelectRole={() => {}}
        institutionName={studentContext.institution.name}
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
          alumniResidents={service.getAlumniResidents()}
        />
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#1F3A30] text-sm">Ethmoid Match Strategy</span>
            <span className="text-neutral-300">&bull;</span>
            <span className="font-medium text-neutral-700">Geisinger Commonwealth School of Medicine</span>
          </div>
          <span className="text-neutral-400 text-[11px]">
            Grounded in 2026/2027 AAMC ERAS &amp; NRMP Match Specifications &bull; Student Decision Support
          </span>
        </div>
      </footer>
    </div>
  );
}
