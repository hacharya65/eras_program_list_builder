import {
  UserProfile,
  Institution,
  PersonalStatementDraft,
  ExperienceDraft,
  DocumentSnapshot,
  ReviewRequest,
  ReviewStage,
  ReviewFeedback,
  CohortSummary
} from '../types';
import { AlumniResident, SAMPLE_ALUMNI_ROSTER } from '../alumni-models';

export class InMemoryStorageAdapter {
  institution: Institution = {
    id: 'inst-1',
    name: 'Apex School of Medicine',
    domain: 'apex.med.edu',
    defaultSlaDays: 14,
  };

  personas: Record<string, UserProfile> = {
    student: {
      id: 'usr-student-1',
      name: 'Alex Rivera (MS4)',
      email: 'arivera@apex.med.edu',
      role: 'student',
      institutionId: 'inst-1',
      specialty: 'Internal Medicine',
    },
    advisor: {
      id: 'usr-advisor-1',
      name: 'Dr. Marcus Chen',
      email: 'mchen@apex.med.edu',
      role: 'advisor',
      institutionId: 'inst-1',
      specialty: 'Internal Medicine',
    },
    admin: {
      id: 'usr-admin-1',
      name: 'Dr. Evelyn Taylor (Dean)',
      email: 'etaylor@apex.med.edu',
      role: 'admin',
      institutionId: 'inst-1',
    },
  };

  currentPersonaKey: string = 'student';

  personalStatement: PersonalStatementDraft = {
    id: 'ps-1',
    studentId: 'usr-student-1',
    specialty: 'Internal Medicine',
    currentVersionNumber: 1,
    content: '',
    stage: 'drafting',
    updatedAt: new Date().toISOString(),
  };

  experiences: ExperienceDraft[] = [];

  snapshots: DocumentSnapshot[] = [];

  reviewRequests: ReviewRequest[] = [];
  reviewFeedbacks: ReviewFeedback[] = [];

  alumniResidents: AlumniResident[] = [...SAMPLE_ALUMNI_ROSTER];

  getAlumniResidents(): AlumniResident[] {
    return this.alumniResidents;
  }

  addAlumniResident(resident: Omit<AlumniResident, 'id'>): AlumniResident {
    const newResident: AlumniResident = {
      ...resident,
      id: `alum-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    this.alumniResidents.push(newResident);
    return newResident;
  }

  updateAlumniResident(id: string, updates: Partial<AlumniResident>): AlumniResident | null {
    const index = this.alumniResidents.findIndex((a) => a.id === id);
    if (index === -1) return null;
    this.alumniResidents[index] = { ...this.alumniResidents[index], ...updates };
    return this.alumniResidents[index];
  }

  deleteAlumniResident(id: string): boolean {
    const initialLen = this.alumniResidents.length;
    this.alumniResidents = this.alumniResidents.filter((a) => a.id !== id);
    return this.alumniResidents.length < initialLen;
  }

  getAlumniByProgram(programName: string): AlumniResident[] {
    const query = programName.toLowerCase().trim();
    return this.alumniResidents.filter(
      (a) =>
        a.institutionName.toLowerCase().includes(query) ||
        query.includes(a.institutionName.toLowerCase())
    );
  }

  getAlumniBySpecialty(specialty: string): AlumniResident[] {
    return this.alumniResidents.filter(
      (a) => a.specialty.toLowerCase() === specialty.toLowerCase()
    );
  }

  setExperienceApprovalStatus(id: string, status: 'drafting' | 'approved' | 'revisions_needed', note?: string): ExperienceDraft | null {
    const exp = this.experiences.find(e => e.id === id);
    if (!exp) return null;
    exp.status = status;
    if (note !== undefined) exp.advisorNote = note;
    return exp;
  }

  getAvailablePersonas(): UserProfile[] {
    return Object.values(this.personas);
  }

  getCurrentPersona(): UserProfile {
    return this.personas[this.currentPersonaKey];
  }

  setPersona(key: 'student' | 'advisor' | 'admin'): UserProfile {
    if (this.personas[key]) {
      this.currentPersonaKey = key;
    }
    return this.getCurrentPersona();
  }

  getMeaningfulCount(): number {
    return this.experiences.filter(e => e.isMostMeaningful).length;
  }

  updatePersonalStatement(content: string): PersonalStatementDraft {
    const isLockedOrSubmitted = this.personalStatement.stage !== 'drafting';
    const hasExistingSnapshotForCurrentVersion = this.snapshots.some(
      s => s.documentType === 'personal_statement' && s.versionNumber === this.personalStatement.currentVersionNumber
    );

    if ((isLockedOrSubmitted || hasExistingSnapshotForCurrentVersion) && content !== this.personalStatement.content) {
      // Automatically fork into an active Vn+1 draft
      this.personalStatement.currentVersionNumber += 1;
      this.personalStatement.stage = 'drafting';
    }

    this.personalStatement.content = content;
    this.personalStatement.updatedAt = new Date().toISOString();
    return this.personalStatement;
  }

  forkPersonalStatementRevision(): PersonalStatementDraft {
    this.personalStatement.currentVersionNumber += 1;
    this.personalStatement.stage = 'drafting';
    this.personalStatement.updatedAt = new Date().toISOString();
    return this.personalStatement;
  }

  getPersonalStatementVersionHistory(): {
    versionNumber: number;
    snapshotId?: string;
    content: string;
    stage: ReviewStage | 'locked';
    submittedAt?: string;
    changelogNote?: string;
    isCurrentActiveDraft: boolean;
  }[] {
    const history: {
      versionNumber: number;
      snapshotId?: string;
      content: string;
      stage: ReviewStage | 'locked';
      submittedAt?: string;
      changelogNote?: string;
      isCurrentActiveDraft: boolean;
    }[] = [];

    const psSnapshots = this.snapshots
      .filter(s => s.documentType === 'personal_statement' && s.documentId === this.personalStatement.id)
      .sort((a, b) => a.versionNumber - b.versionNumber);

    for (const snap of psSnapshots) {
      const rev = this.reviewRequests.find(r => r.snapshotId === snap.id);
      history.push({
        versionNumber: snap.versionNumber,
        snapshotId: snap.id,
        content: snap.content,
        stage: rev ? rev.stage : 'submitted',
        submittedAt: snap.submittedAt,
        changelogNote: snap.changelogNote,
        isCurrentActiveDraft: false,
      });
    }

    const latestSnapshot = psSnapshots[psSnapshots.length - 1];
    if (
      !latestSnapshot ||
      latestSnapshot.versionNumber < this.personalStatement.currentVersionNumber ||
      this.personalStatement.stage === 'drafting'
    ) {
      history.push({
        versionNumber: this.personalStatement.currentVersionNumber,
        content: this.personalStatement.content,
        stage: this.personalStatement.stage,
        isCurrentActiveDraft: true,
      });
    }

    return history.sort((a, b) => a.versionNumber - b.versionNumber);
  }

  updateExperience(id: string, updates: Partial<ExperienceDraft>): ExperienceDraft {
    const index = this.experiences.findIndex(e => e.id === id);
    if (index !== -1) {
      this.experiences[index] = { ...this.experiences[index], ...updates };
      return this.experiences[index];
    }
    const newExp: ExperienceDraft = {
      id,
      studentId: this.personas.student.id,
      title: updates.title || '',
      orgName: updates.orgName || '',
      roleName: updates.roleName || '',
      experienceType: updates.experienceType || 'Education/training',
      frequency: updates.frequency || 'Weekly (recurring)',
      startDate: updates.startDate || '2024-01-01',
      isCurrent: updates.isCurrent ?? false,
      descriptionText: updates.descriptionText || '',
      isMostMeaningful: updates.isMostMeaningful ?? false,
      reflectionText: updates.reflectionText,
      primaryFocusArea: updates.primaryFocusArea,
      keyCharacteristic: updates.keyCharacteristic,
    };
    this.experiences.push(newExp);
    return newExp;
  }

  setExperienceMeaningful(id: string, isMeaningful: boolean): boolean {
    const exp = this.experiences.find(e => e.id === id);
    if (exp) {
      exp.isMostMeaningful = isMeaningful;
      return true;
    }
    // If not found, create a stub with that id
    this.updateExperience(id, { isMostMeaningful: isMeaningful });
    return true;
  }

  createPersonalStatementSnapshot(changelogNote?: string): DocumentSnapshot {
    const snapshot: DocumentSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      documentType: 'personal_statement',
      documentId: this.personalStatement.id,
      versionNumber: this.personalStatement.currentVersionNumber,
      content: this.personalStatement.content,
      changelogNote,
      submittedAt: new Date().toISOString(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  createExperiencesSnapshot(changelogNote?: string): DocumentSnapshot {
    const snapshot: DocumentSnapshot = {
      id: `snap-exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      documentType: 'experience_portfolio',
      documentId: 'exp-portfolio-1',
      versionNumber: 1,
      content: JSON.stringify(this.experiences),
      changelogNote,
      submittedAt: new Date().toISOString(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  setAdvisorViewingEntry(reviewRequestId: string, entryIndex: number): ReviewRequest | null {
    const rev = this.reviewRequests.find(r => r.id === reviewRequestId);
    if (!rev) return null;
    rev.currentViewingEntryIndex = entryIndex;
    return rev;
  }

  createReviewRequest(params: {
    snapshotId: string;
    studentId: string;
    studentName: string;
    advisorId: string;
    documentType: 'personal_statement' | 'experience_portfolio';
  }): ReviewRequest {
    const now = new Date();
    const slaDue = new Date(now.getTime() + this.institution.defaultSlaDays * 24 * 60 * 60 * 1000);

    const request: ReviewRequest = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      snapshotId: params.snapshotId,
      studentId: params.studentId,
      studentName: params.studentName,
      advisorId: params.advisorId,
      documentType: params.documentType,
      stage: 'submitted',
      submittedAt: now.toISOString(),
      slaDueAt: slaDue.toISOString(),
    };
    this.reviewRequests.push(request);
    if (params.documentType === 'personal_statement') {
      this.personalStatement.stage = 'submitted';
    }
    return request;
  }

  updateReviewStage(reviewRequestId: string, stage: ReviewStage, extra?: { inReviewAt?: string; completedAt?: string }): ReviewRequest {
    const rev = this.reviewRequests.find(r => r.id === reviewRequestId);
    if (!rev) {
      throw new Error(`Review request not found: ${reviewRequestId}`);
    }
    rev.stage = stage;
    if (extra?.inReviewAt) rev.inReviewAt = extra.inReviewAt;
    if (extra?.completedAt) rev.completedAt = extra.completedAt;

    if (rev.documentType === 'personal_statement') {
      this.personalStatement.stage = stage;
    }
    return rev;
  }

  getCohortSummary(): CohortSummary {
    return {
      totalStudents: 142,
      draftingCount: 68,
      submittedCount: 34,
      inReviewCount: 22,
      revisionsRequestedCount: 12,
      endorsedCount: 6,
      slaBreachedCount: 3,
    };
  }
}
