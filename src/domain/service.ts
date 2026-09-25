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
