import {
  UserProfile,
  Institution,
  PersonalStatementDraft,
  ExperienceDraft,
  DocumentSnapshot,
  ReviewRequest,
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
