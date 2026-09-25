export type UserRole = 'student' | 'advisor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string;
  specialty?: string;
  avatarUrl?: string;
}

export interface Institution {
  id: string;
  name: string;
  domain: string;
  defaultSlaDays: number;
}

export type ReviewStage = 'drafting' | 'submitted' | 'in_review' | 'revisions_requested' | 'endorsed';

export interface PersonalStatementDraft {
  id: string;
  studentId: string;
  specialty: string;
  currentVersionNumber: number;
  content: string;
  stage: ReviewStage;
  updatedAt: string;
}

export interface ExperienceDraft {
  id: string;
  studentId: string;
  title: string;
  orgName: string;
  roleName: string;
  experienceType: string;
  frequency: string;
  primaryFocusArea?: string;
  keyCharacteristic?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  descriptionText: string; // Max 750
  isMostMeaningful: boolean;
  reflectionText?: string; // Max 300
  status?: 'drafting' | 'approved' | 'revisions_needed';
  advisorNote?: string;
}

export interface RubricEvaluation {
  narrativeMotivation: number; // 1 to 5
  clinicalReflection: number; // 1 to 5
  toneAndFit: number; // 1 to 5
  structureAndMechanics: number; // 1 to 5
  overallVerdict: 'ready_to_lock' | 'revisions_requested';
  generalNotes: string;
}

export interface ReviewFeedback {
  id: string;
  reviewRequestId: string;
  advisorId: string;
  evaluation: RubricEvaluation;
  submittedAt: string;
}

export interface DocumentSnapshot {
  id: string;
  documentType: 'personal_statement' | 'experience_portfolio';
  documentId: string;
  versionNumber: number;
  content: string;
  changelogNote?: string;
  submittedAt: string;
}

export interface ReviewRequest {
  id: string;
  snapshotId: string;
  studentId: string;
  studentName: string;
  advisorId: string;
  documentType: 'personal_statement' | 'experience_portfolio';
  stage: ReviewStage;
  submittedAt: string;
  inReviewAt?: string;
  completedAt?: string;
  slaDueAt: string;
}

export interface StudentDashboardContext {
  student: UserProfile;
  institution: Institution;
  assignedAdvisors: UserProfile[];
  personalStatement: PersonalStatementDraft;
  experiences: ExperienceDraft[];
  activeReviewRequests: ReviewRequest[];
}

export interface AdvisorDashboardContext {
  advisor: UserProfile;
  institution: Institution;
  pendingReviews: ReviewRequest[];
  advisees: UserProfile[];
}

export interface CohortSummary {
  totalStudents: number;
  draftingCount: number;
  submittedCount: number;
  inReviewCount: number;
  revisionsRequestedCount: number;
  endorsedCount: number;
  slaBreachedCount: number;
}

export interface AdminCohortContext {
  admin: UserProfile;
  institution: Institution;
  cohortSummary: CohortSummary;
  overdueReviews: ReviewRequest[];
}
