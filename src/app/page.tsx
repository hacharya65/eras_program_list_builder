'use client';

import React, { useState } from 'react';
import { UserRole } from '@/domain/types';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import { StudentPortal } from '@/components/StudentPortal';
import { AdvisorPortal } from '@/components/AdvisorPortal';
import { AdminPortal } from '@/components/AdminPortal';

import { BrowserStoragePortfolioAdapter } from '@/domain/student-portfolio';

// Instantiate singleton service with in-memory adapter and browser storage portfolio adapter
const storage = new InMemoryStorageAdapter();
const portfolioRepo = new BrowserStoragePortfolioAdapter();
const service = new AdvisingPlatformService(storage, portfolioRepo);

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');

  // Synchronize role with URL query parameter and scroll to top
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role') as UserRole | null;
      if (urlRole && ['student', 'advisor', 'admin'].includes(urlRole)) {
        service.switchPersona(urlRole);
        setCurrentRole(urlRole);
      }
    }

    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlRole = (params.get('role') || 'student') as UserRole;
        if (['student', 'advisor', 'admin'].includes(urlRole)) {
          service.switchPersona(urlRole);
          setCurrentRole(urlRole);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectRole = (role: UserRole) => {
    service.switchPersona(role);
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('role', role);
        // Clear sub-view if changing role so student views don't clash with advisor/admin
        if (role !== 'student') {
          url.searchParams.delete('view');
        }
        window.history.pushState({ role }, '', url.toString());
      } catch (e) {
        // Fallback
      }
    }
  };

  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdatePS = (content: string) => {
    service.updatePersonalStatement(content);
    setRefreshKey((k) => k + 1);
  };

  const handleSubmitPS = (changelog: string) => {
    service.submitPersonalStatementForReview({
      studentId: studentContext.student.id,
      advisorId: studentContext.assignedAdvisors[0].id,
      changelogNote: changelog,
    });
    setRefreshKey((k) => k + 1);
  };

  const handleUpdateExp = (id: string, updates: any) => {
    service.updateExperience(id, updates);
    setRefreshKey((k) => k + 1);
  };

  const handleOpenReview = (reviewId: string) => {
    service.openReviewAsAdvisor(reviewId, advisorContext.advisor.id);
    setRefreshKey((k) => k + 1);
  };

  const handleSubmitFeedback = (reviewId: string, evaluation: any) => {
    service.submitAdvisorFeedback({
      reviewRequestId: reviewId,
      advisorId: advisorContext.advisor.id,
      evaluation,
    });
    setRefreshKey((k) => k + 1);
  };

  const handleEndorseReview = (reviewId: string) => {
    service.endorseReview(reviewId, advisorContext.advisor.id);
    setRefreshKey((k) => k + 1);
  };

  const handleSubmitExperiences = (changelog: string) => {
    try {
      service.submitExperiencesForReview({
        studentId: studentContext.student.id,
        advisorId: studentContext.assignedAdvisors[0].id,
        changelogNote: changelog,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Could not submit experiences portfolio.');
    }
  };

  const handleViewingEntry = (reviewId: string, entryIndex: number) => {
    service.setAdvisorViewingEntry(reviewId, entryIndex);
    setRefreshKey((k) => k + 1);
  };

  const handleCreateRevision = (targetVersion?: number) => {
    if (targetVersion && targetVersion > storage.personalStatement.currentVersionNumber) {
      storage.personalStatement.currentVersionNumber = targetVersion;
    } else if (!targetVersion) {
      storage.personalStatement.currentVersionNumber += 1;
    }
    storage.personalStatement.stage = 'drafting';
    setRefreshKey((k) => k + 1);
  };

  const handleAddAlumnus = (resident: any) => {
    service.addAlumniResident(resident);
    setRefreshKey((k) => k + 1);
  };

  const handleUpdateAlumnus = (id: string, updates: any) => {
    service.updateAlumniResident(id, updates);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteAlumnus = (id: string) => {
    service.deleteAlumniResident(id);
    setRefreshKey((k) => k + 1);
  };

  const studentContext = service.getStudentDashboardContext();
  const advisorContext = service.getAdvisorDashboardContext();
  const adminContext = service.getAdminCohortContext();

  const latestPSFeedback = service.getLatestPersonalStatementFeedback(studentContext.student.id);
  const psFeedbackHistory = service.getPersonalStatementFeedbackHistory(studentContext.student.id);

  const getAdvisorFeedback = () => {
    return latestPSFeedback?.feedback;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F5] text-neutral-800">
      {/* Dev Persona Switcher Bar */}
      <DevPersonaSwitcher
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        institutionName={studentContext.institution.name}
        onOpenAdvisingLeadership={() => {
          if (currentRole !== 'student') {
            service.switchPersona('student');
            setCurrentRole('student');
          }
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('role', 'student');
            url.searchParams.set('view', 'advising_leadership');
            window.history.pushState({ role: 'student', view: 'advising_leadership' }, '', url.toString());
            window.scrollTo({ top: 0, behavior: 'instant' });
            window.dispatchEvent(new CustomEvent('navigate_to_advising_leadership'));
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRole === 'student' && (
          <StudentPortal
            context={studentContext}
            onUpdatePersonalStatement={handleUpdatePS}
            onSubmitPersonalStatement={handleSubmitPS}
            onUpdateExperience={handleUpdateExp}
            onSubmitExperiences={handleSubmitExperiences}
            getAdvisorFeedback={getAdvisorFeedback}
            latestPSFeedback={latestPSFeedback}
            psFeedbackHistory={psFeedbackHistory}
            onCreateRevision={handleCreateRevision}
            alumniResidents={service.getAlumniResidents()}
          />
        )}
        {currentRole === 'advisor' && (
          <AdvisorPortal
            context={advisorContext}
            onOpenReview={handleOpenReview}
            onSubmitFeedback={handleSubmitFeedback}
            onEndorseReview={handleEndorseReview}
            getSnapshotContent={(id) => service.getSnapshot(id)}
            getPreviousSnapshot={(id) => service.getPreviousSnapshot(id)}
            onViewingEntry={handleViewingEntry}
          />
        )}
        {currentRole === 'admin' && (
          <AdminPortal
            context={adminContext}
            onAddAlumnus={handleAddAlumnus}
            onUpdateAlumnus={handleUpdateAlumnus}
            onDeleteAlumnus={handleDeleteAlumnus}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#1F3A30] text-sm">Ethmoid</span>
            <span className="text-neutral-300">&bull;</span>
            <span className="font-medium text-neutral-700">Geisinger Commonwealth School of Medicine</span>
          </div>
          <span className="text-neutral-400 text-[11px]">
            Grounded in 2026/2027 AAMC ERAS &amp; NRMP Match Specifications &bull; Fictional Demonstration
          </span>
        </div>
      </footer>
    </div>
  );
}
