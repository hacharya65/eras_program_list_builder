/**
 * Ethmoid - Letter of Recommendation (LOR) Tracking Pipeline
 * Aligned with 2027 MyERAS Season Rules and product-spec.md
 */

export type LetterRequestStatus =
  | 'pending_ask'
  | 'asked'
  | 'initiated_eras'
  | 'submitted';

export interface LetterWriterRequest {
  id: string;
  writerName: string;
  writerTitle: string;
  specialty: string;
  institution: string;
  letterType: 'Department Chair / SLOE' | 'Clinical Sub-I / Attending' | 'Research Mentor' | 'General';
  status: LetterRequestStatus;
  confirmedDate?: string;
  notes?: string;
  assignedProgramIds: string[]; // ACGME program IDs this letter is assigned to
}

export interface ProgramLetterRequirement {
  programId: string;
  requiredLettersCount: number; // Student-entered after checking program website
  requiredLetterTypes?: string;
  checkedDate?: string;
  programWebsiteUrl?: string;
}

export const LOR_STORAGE_KEY = 'ethmoid_letter_writer_requests';
export const PROGRAM_LOR_REQ_STORAGE_KEY = 'ethmoid_program_lor_requirements';

export const INITIAL_MOCK_LETTER_WRITERS: LetterWriterRequest[] = [
  {
    id: 'lor-1',
    writerName: 'Dr. Marcus Chen',
    writerTitle: 'Professor & Sub-I Clerkship Director',
    specialty: 'Internal Medicine',
    institution: 'Apex / Geisinger Medical Center',
    letterType: 'Clinical Sub-I / Attending',
    status: 'submitted',
    confirmedDate: '2026-09-15',
    notes: 'Strong letter endorsing acute MICU patient care and family communication.',
    assignedProgramIds: ['1403521255', '1402421217', '1402321200'],
  },
  {
    id: 'lor-2',
    writerName: 'Dr. Rose Barham',
    writerTitle: 'Division Chief of General Internal Medicine',
    specialty: 'Internal Medicine',
    institution: 'Geisinger Health System',
    letterType: 'Department Chair / SLOE',
    status: 'initiated_eras',
    confirmedDate: '2026-09-20',
    notes: 'Department Chair summary letter; requested through ERAS Letter Portal.',
    assignedProgramIds: ['1403521255', '1402421217'],
  },
  {
    id: 'lor-3',
    writerName: 'Dr. Sarah Jenkins',
    writerTitle: 'Director of Pulmonary Vascular Research',
    specialty: 'Pulmonology',
    institution: 'Apex Cardiovascular Research Center',
    letterType: 'Research Mentor',
    status: 'asked',
    notes: 'Agreed to write highlighting prospective pulmonary registry publications.',
    assignedProgramIds: ['1403521255'],
  },
  {
    id: 'lor-4',
    writerName: 'Dr. Megan Rapp',
    writerTitle: 'Associate Professor of Surgery',
    specialty: 'General Surgery',
    institution: 'Geisinger Commonwealth',
    letterType: 'Clinical Sub-I / Attending',
    status: 'pending_ask',
    notes: 'Plan to ask during Block 5 meeting.',
    assignedProgramIds: [],
  },
];

import { isDemoStudentId, CURRENT_STUDENT_ID_KEY } from './student-registry';

export function getLorStorageKey(studentId?: string): string {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  if (sid && !isDemoStudentId(sid)) {
    return `${LOR_STORAGE_KEY}_${sid}`;
  }
  return LOR_STORAGE_KEY;
}

export function loadLetterWriterRequests(studentId?: string): LetterWriterRequest[] {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const key = getLorStorageKey(sid || undefined);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
  }
  // Non-demo users start with 0 letter writers recorded!
  if (sid && !isDemoStudentId(sid)) {
    return [];
  }
  return INITIAL_MOCK_LETTER_WRITERS;
}

export function saveLetterWriterRequests(requests: LetterWriterRequest[], studentId?: string): void {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const key = getLorStorageKey(sid || undefined);
      localStorage.setItem(key, JSON.stringify(requests));
    } catch (e) {
      console.error('Error saving letter writer requests:', e);
    }
  }
}

export function loadProgramLetterRequirements(): Record<string, ProgramLetterRequirement> {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(PROGRAM_LOR_REQ_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
  }
  return {};
}

export function saveProgramLetterRequirements(
  requirements: Record<string, ProgramLetterRequirement>
): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(PROGRAM_LOR_REQ_STORAGE_KEY, JSON.stringify(requirements));
    } catch (e) {
      console.error('Error saving program letter requirements:', e);
    }
  }
}

export interface ProgramLetterGapAnalysis {
  programId: string;
  requiredCount: number;
  assignedCount: number;
  submittedCount: number;
  gapCount: number; // requiredCount - assignedCount (if > 0)
  isSatisfied: boolean;
}

export function analyzeProgramLetterGaps(
  programId: string,
  writers: LetterWriterRequest[],
  requirements: Record<string, ProgramLetterRequirement>
): ProgramLetterGapAnalysis {
  const req = requirements[programId];
  const requiredCount = req ? req.requiredLettersCount : 3; // Default baseline requirement is 3
  const assigned = writers.filter((w) => w.assignedProgramIds.includes(programId));
  const assignedCount = assigned.length;
  const submittedCount = assigned.filter((w) => w.status === 'submitted').length;
  const gapCount = Math.max(0, requiredCount - assignedCount);

  return {
    programId,
    requiredCount,
    assignedCount,
    submittedCount,
    gapCount,
    isSatisfied: gapCount === 0,
  };
}
