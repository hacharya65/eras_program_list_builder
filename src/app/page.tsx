'use client';

import React, { useState } from 'react';
import { UserRole } from '@/domain/types';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import { StudentPortal } from '@/components/StudentPortal';
import { AdvisorPortal } from '@/components/AdvisorPortal';
import { AdminPortal } from '@/components/AdminPortal';

// Instantiate singleton service with in-memory adapter for immediate high-speed demo & testing
const storage = new InMemoryStorageAdapter();
const service = new AdvisingPlatformService(storage);

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');

  const handleSelectRole = (role: UserRole) => {
    service.switchPersona(role);
    setCurrentRole(role);
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

  const handleCreateRevision = () => {
    storage.personalStatement.currentVersionNumber += 1;
    storage.personalStatement.stage = 'drafting';
    setRefreshKey((k) => k + 1);
  };

  const getAdvisorFeedback = () => {
    const req = storage.reviewRequests.find(
      r => r.studentId === studentContext.student.id && (r.stage === 'revisions_requested' || r.stage === 'endorsed')
    );
    return req ? service.getFeedbackForReview(req.id) : undefined;
  };

  const studentContext = service.getStudentDashboardContext();
  const advisorContext = service.getAdvisorDashboardContext();
  const adminContext = service.getAdminCohortContext();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60">
      {/* Dev Persona Switcher Bar */}
      <DevPersonaSwitcher
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        institutionName={studentContext.institution.name}
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
            onCreateRevision={handleCreateRevision}
          />
        )}
        {currentRole === 'advisor' && (
          <AdvisorPortal
            context={advisorContext}
            onOpenReview={handleOpenReview}
            onSubmitFeedback={handleSubmitFeedback}
            getSnapshotContent={(id) => service.getSnapshot(id)}
            onViewingEntry={handleViewingEntry}
          />
        )}
        {currentRole === 'admin' && <AdminPortal context={adminContext} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Apex School of Medicine &bull; Pre-Season ERAS Advising Platform</span>
          <span className="text-slate-400">Grounded in 2026/2027 AAMC ERAS &amp; NRMP Match Specifications</span>
        </div>
      </footer>
    </div>
  );
}
