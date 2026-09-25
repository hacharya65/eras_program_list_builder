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
    content: 'Standing in the intensive care unit on my third-year medicine clerkship, I watched my attending discuss a complex prognosis with the family of Mr. K...',
    stage: 'drafting',
    updatedAt: new Date().toISOString(),
  };

  experiences: ExperienceDraft[] = [
    {
      id: 'exp-1',
      studentId: 'usr-student-1',
      title: 'Free Clinic Triage Coordinator',
      orgName: 'Hope Community Health Center',
      roleName: 'Lead Student Volunteer',
      experienceType: 'Volunteer/service/advocacy',
      frequency: 'Weekly (recurring)',
      primaryFocusArea: 'Improving access to health care',
      keyCharacteristic: 'Cultural humility and awareness',
      startDate: '2023-08-01',
      isCurrent: true,
      descriptionText: 'Coordinated intake and clinical vitals for over 350 uninsured patients weekly. Mentored incoming MS1 volunteers on cultural humility.',
      isMostMeaningful: true,
      reflectionText: 'Witnessing patients navigate systemic barriers solidified my dedication to primary care and longitudinal advocacy.',
    },
  ];

  snapshots: DocumentSnapshot[] = [];

  reviewRequests: ReviewRequest[] = [];
  reviewFeedbacks: ReviewFeedback[] = [];

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
    this.personalStatement.content = content;
    this.personalStatement.updatedAt = new Date().toISOString();
    return this.personalStatement;
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
    this.personalStatement.stage = 'submitted';
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
