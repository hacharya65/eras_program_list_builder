import {
  UserProfile,
  StudentDashboardContext,
  AdvisorDashboardContext,
  AdminCohortContext
} from './types';
import { InMemoryStorageAdapter } from './storage/in-memory-adapter';

export class AdvisingPlatformService {
  constructor(private storage: InMemoryStorageAdapter) {}

  getAvailablePersonas(): UserProfile[] {
    return this.storage.getAvailablePersonas();
  }

  getCurrentPersona(): UserProfile {
    return this.storage.getCurrentPersona();
  }

  switchPersona(roleKey: 'student' | 'advisor' | 'admin'): UserProfile {
    return this.storage.setPersona(roleKey);
  }

  canDesignateMeaningfulExperience(targetExperienceId: string): boolean {
    const currentExp = this.storage.experiences.find(e => e.id === targetExperienceId);
    if (currentExp && currentExp.isMostMeaningful) {
      return true; // already meaningful
    }
    return this.storage.getMeaningfulCount() < 3;
  }

  setExperienceMeaningful(id: string, isMeaningful: boolean): boolean {
    if (isMeaningful && !this.canDesignateMeaningfulExperience(id)) {
      return false;
    }
    return this.storage.setExperienceMeaningful(id, isMeaningful);
  }

  updatePersonalStatement(content: string) {
    return this.storage.updatePersonalStatement(content);
  }

  submitPersonalStatementForReview(params: {
    studentId: string;
    advisorId: string;
    changelogNote?: string;
  }) {
    if (this.storage.personalStatement.currentVersionNumber > 1 && (!params.changelogNote || !params.changelogNote.trim())) {
      throw new Error('A student revision changelog note is required for submitting revisions');
    }

    const snapshot = this.storage.createPersonalStatementSnapshot(params.changelogNote);
    const student = this.storage.personas.student;
    const request = this.storage.createReviewRequest({
      snapshotId: snapshot.id,
      studentId: params.studentId,
      studentName: student.name,
      advisorId: params.advisorId,
      documentType: 'personal_statement',
    });

    return request;
  }

  openReviewAsAdvisor(reviewRequestId: string, advisorId: string) {
    return this.storage.updateReviewStage(reviewRequestId, 'in_review', {
      inReviewAt: new Date().toISOString(),
    });
  }

  getSnapshot(snapshotId: string) {
    return this.storage.snapshots.find(s => s.id === snapshotId);
  }

  updateExperience(id: string, updates: any) {
    return this.storage.updateExperience(id, updates);
  }

  getStudentDashboardContext(): StudentDashboardContext {
    const student = this.storage.personas.student;
    const advisor = this.storage.personas.advisor;
    return {
      student,
      institution: this.storage.institution,
      assignedAdvisors: [advisor],
      personalStatement: this.storage.personalStatement,
      experiences: this.storage.experiences,
      activeReviewRequests: this.storage.reviewRequests.filter(r => r.studentId === student.id),
    };
  }

  getAdvisorDashboardContext(): AdvisorDashboardContext {
    const advisor = this.storage.personas.advisor;
    const student = this.storage.personas.student;
    return {
      advisor,
      institution: this.storage.institution,
      pendingReviews: this.storage.reviewRequests.filter(r => r.advisorId === advisor.id),
      advisees: [student],
    };
  }

  getAdminCohortContext(): AdminCohortContext {
    const admin = this.storage.personas.admin;
    return {
      admin,
      institution: this.storage.institution,
      cohortSummary: this.storage.getCohortSummary(),
      overdueReviews: this.storage.reviewRequests.filter(r => {
        // e.g. status submitted and overdue
        return r.stage === 'submitted';
      }),
    };
  }
}
