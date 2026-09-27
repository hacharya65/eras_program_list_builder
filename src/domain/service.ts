import {
  UserProfile,
  StudentDashboardContext,
  AdvisorDashboardContext,
  AdminCohortContext,
  RubricEvaluation,
  ReviewFeedback,
  DocumentSnapshot,
  DocumentFeedbackSummary
} from './types';
import { InMemoryStorageAdapter } from './storage/in-memory-adapter';
import { validateExperiencesSubmission } from './experience-validation';
import { saveStoredAnnotations, saveStoredThreads } from './annotation-models';
import { AlumniResident } from './alumni-models';

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

  forkPersonalStatementRevision() {
    return this.storage.forkPersonalStatementRevision();
  }

  getPersonalStatementVersionHistory() {
    return this.storage.getPersonalStatementVersionHistory();
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

    // Ensure newly submitted draft version starts completely clean with cleared markups
    saveStoredAnnotations('personal_statement', [], `v${snapshot.versionNumber}`);
    saveStoredThreads('personal_statement', [], `v${snapshot.versionNumber}`);

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

  submitExperiencesForReview(params: {
    studentId: string;
    advisorId: string;
    changelogNote?: string;
  }) {
    const validation = validateExperiencesSubmission(this.storage.experiences);
    if (!validation.canSubmit) {
      throw new Error(validation.errors.join('; '));
    }

    const snapshot = this.storage.createExperiencesSnapshot(params.changelogNote);
    const student = this.storage.personas.student;
    const request = this.storage.createReviewRequest({
      snapshotId: snapshot.id,
      studentId: params.studentId,
      studentName: student.name,
      advisorId: params.advisorId,
      documentType: 'experience_portfolio',
    });

    return request;
  }

  setAdvisorViewingEntry(reviewRequestId: string, entryIndex: number) {
    return this.storage.setAdvisorViewingEntry(reviewRequestId, entryIndex);
  }

  openReviewAsAdvisor(reviewRequestId: string, advisorId: string) {
    return this.storage.updateReviewStage(reviewRequestId, 'in_review', {
      inReviewAt: new Date().toISOString(),
    });
  }

  getSnapshot(snapshotId: string) {
    return this.storage.snapshots.find(s => s.id === snapshotId);
  }

  getPreviousSnapshot(snapshotId: string): DocumentSnapshot | undefined {
    const current = this.storage.snapshots.find(s => s.id === snapshotId);
    if (!current || current.versionNumber <= 1) return undefined;
    return this.storage.snapshots
      .filter(
        s =>
          s.documentType === current.documentType &&
          s.documentId === current.documentId &&
          s.versionNumber < current.versionNumber
      )
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  }

  submitAdvisorFeedback(params: {
    reviewRequestId: string;
    advisorId: string;
    evaluation: RubricEvaluation;
  }): ReviewFeedback {
    const stage = params.evaluation.overallVerdict === 'ready_to_lock' ? 'endorsed' : 'revisions_requested';
    this.storage.updateReviewStage(params.reviewRequestId, stage, {
      completedAt: new Date().toISOString(),
    });

    const feedback: ReviewFeedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      reviewRequestId: params.reviewRequestId,
      advisorId: params.advisorId,
      evaluation: params.evaluation,
      submittedAt: new Date().toISOString(),
    };
    this.storage.reviewFeedbacks.push(feedback);
    return feedback;
  }

  endorseReview(reviewRequestId: string, advisorId: string): ReviewFeedback {
    return this.submitAdvisorFeedback({
      reviewRequestId,
      advisorId,
      evaluation: {
        narrativeMotivation: 4,
        clinicalReflection: 4,
        toneAndFit: 4,
        structureAndMechanics: 4,
        overallVerdict: 'ready_to_lock',
        generalNotes: 'Endorsed as ERAS ready.',
      },
    });
  }

  setExperienceApprovalStatus(id: string, status: 'drafting' | 'approved' | 'revisions_needed', note?: string) {
    return this.storage.setExperienceApprovalStatus(id, status, note);
  }

  getFeedbackForReview(reviewRequestId: string): ReviewFeedback | undefined {
    return this.storage.reviewFeedbacks.find(f => f.reviewRequestId === reviewRequestId);
  }

  getLatestPersonalStatementFeedback(studentId: string): DocumentFeedbackSummary | undefined {
    const history = this.getPersonalStatementFeedbackHistory(studentId);
    return history.length > 0 ? history[0] : undefined;
  }

  getPersonalStatementFeedbackHistory(studentId: string): DocumentFeedbackSummary[] {
    const defaultAdvisor = this.storage.personas.advisor;

    const reviewedRequests = this.storage.reviewRequests.filter(
      r =>
        r.studentId === studentId &&
        r.documentType === 'personal_statement' &&
        (r.stage === 'revisions_requested' || r.stage === 'endorsed')
    );

    const summaries: DocumentFeedbackSummary[] = [];

    for (const req of reviewedRequests) {
      const feedback = this.storage.reviewFeedbacks.find(f => f.reviewRequestId === req.id);
      if (!feedback) continue;

      const snapshot = this.storage.snapshots.find(s => s.id === req.snapshotId);
      const versionNumber = snapshot ? snapshot.versionNumber : 1;
      const adv = Object.values(this.storage.personas).find(p => p.id === req.advisorId) || defaultAdvisor;

      summaries.push({
        feedback,
        reviewRequest: req,
        snapshot: snapshot || {
          id: req.snapshotId,
          documentType: 'personal_statement',
          documentId: this.storage.personalStatement.id,
          versionNumber,
          content: this.storage.personalStatement.content,
          submittedAt: req.submittedAt,
        },
        advisor: adv,
        versionNumber,
      });
    }

    // Sort descending by version number so the most recent reviewed revision is first
    return summaries.sort((a, b) => b.versionNumber - a.versionNumber);
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
      snapshots: this.storage.snapshots.filter(s => s.documentType === 'personal_statement'),
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
      personalStatement: this.storage.personalStatement,
      snapshots: this.storage.snapshots,
      experiences: this.storage.experiences,
      scholarlyStats: { count: 2, meaningful: 2 },
      schoolListStats: { count: 0, signalsAssigned: 0, signalsBudget: 15 },
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
      alumniResidents: this.storage.alumniResidents,
    };
  }

  getAlumniResidents(): AlumniResident[] {
    return this.storage.getAlumniResidents();
  }

  addAlumniResident(resident: Omit<AlumniResident, 'id'>): AlumniResident {
    return this.storage.addAlumniResident(resident);
  }

  updateAlumniResident(id: string, updates: Partial<AlumniResident>): AlumniResident | null {
    return this.storage.updateAlumniResident(id, updates);
  }

  deleteAlumniResident(id: string): boolean {
    return this.storage.deleteAlumniResident(id);
  }

  getAlumniByProgram(programName: string): AlumniResident[] {
    return this.storage.getAlumniByProgram(programName);
  }

  getAlumniBySpecialty(specialty: string): AlumniResident[] {
    return this.storage.getAlumniBySpecialty(specialty);
  }
}
