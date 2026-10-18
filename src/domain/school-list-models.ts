/**
 * Official ERAS Signaling Rules & School List Models
 * Formatted for ACGME specialties with exact Gold and Silver signal allocations.
 */

import { getAllResidencyPrograms, ResidencyProgramRecord, formatProgramDisplayName } from './residency-database';
import { CURRENT_STUDENT_ID_KEY, isDemoStudentId, getStudentAccount, updateStudentAccount } from './student-registry';

export interface SpecialtySignalRule {
  specialty: string;
  goldSignals: number;
  silverSignals: number;
  totalSignals: number;
  signalType: 'tiered' | 'single_tier'; // e.g. Gold/Silver vs just single signal
  explanationRequired?: boolean;
  explanationMaxChars?: number;
}

export const CANONICAL_SPECIALTIES: string[] = [
  'Anesthesiology',
  'Dermatology',
  'Diagnostic Radiology',
  'Emergency Medicine',
  'Family Medicine',
  'General Surgery',
  'Internal Medicine',
  'Internal Medicine/Pediatrics',
  'Interventional Radiology (Integrated)',
  'Neurological Surgery',
  'Neurology',
  'Obstetrics and Gynecology',
  'Ophthalmology',
  'Orthopedic Surgery',
  'Otolaryngology',
  'Pathology',
  'Pediatrics',
  'Physical Medicine and Rehabilitation',
  'Plastic Surgery (Integrated)',
  'Psychiatry',
  'Radiation Oncology',
  'Thoracic Surgery (Integrated)',
  'Transitional Year',
  'Urology',
  'Vascular Surgery (Integrated)',
];

export const SPECIALTY_SIGNALING_RULES: Record<string, SpecialtySignalRule> = {
  'Anesthesiology': {
    specialty: 'Anesthesiology',
    goldSignals: 5,
    silverSignals: 10,
    totalSignals: 15,
    signalType: 'tiered',
    explanationRequired: true,
    explanationMaxChars: 300,
  },
  'Dermatology': {
    specialty: 'Dermatology',
    goldSignals: 3,
    silverSignals: 25,
    totalSignals: 28,
    signalType: 'tiered',
    explanationRequired: false,
  },
  'Diagnostic Radiology': {
    specialty: 'Diagnostic Radiology',
    goldSignals: 6,
    silverSignals: 9,
    totalSignals: 15,
    signalType: 'tiered',
    explanationRequired: false,
  },
  'Emergency Medicine': {
    specialty: 'Emergency Medicine',
    goldSignals: 2,
    silverSignals: 5,
    totalSignals: 7,
    signalType: 'tiered',
    explanationRequired: false,
  },
  'Family Medicine': {
    specialty: 'Family Medicine',
    goldSignals: 0,
    silverSignals: 5,
    totalSignals: 5,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'General Surgery': {
    specialty: 'General Surgery',
    goldSignals: 0,
    silverSignals: 15,
    totalSignals: 15,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Internal Medicine': {
    specialty: 'Internal Medicine',
    goldSignals: 3,
    silverSignals: 12,
    totalSignals: 15,
    signalType: 'tiered',
    explanationRequired: false,
  },
  'Internal Medicine/Pediatrics': {
    specialty: 'Internal Medicine/Pediatrics',
    goldSignals: 0,
    silverSignals: 5,
    totalSignals: 5,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Interventional Radiology (Integrated)': {
    specialty: 'Interventional Radiology (Integrated)',
    goldSignals: 0,
    silverSignals: 8,
    totalSignals: 8,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Interventional Radiology (Independent)': {
    specialty: 'Interventional Radiology (Independent)',
    goldSignals: 0,
    silverSignals: 8,
    totalSignals: 8,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Neurological Surgery': {
    specialty: 'Neurological Surgery',
    goldSignals: 0,
    silverSignals: 25,
    totalSignals: 25,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Neurology': {
    specialty: 'Neurology',
    goldSignals: 0,
    silverSignals: 8,
    totalSignals: 8,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Obstetrics and Gynecology': {
    specialty: 'Obstetrics and Gynecology',
    goldSignals: 3,
    silverSignals: 15,
    totalSignals: 18,
    signalType: 'tiered',
    explanationRequired: false,
  },
  'Ophthalmology': {
    specialty: 'Ophthalmology',
    goldSignals: 0,
    silverSignals: 0,
    totalSignals: 0,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Orthopedic Surgery': {
    specialty: 'Orthopedic Surgery',
    goldSignals: 0,
    silverSignals: 30,
    totalSignals: 30,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Otolaryngology': {
    specialty: 'Otolaryngology',
    goldSignals: 0,
    silverSignals: 25,
    totalSignals: 25,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Pathology': {
    specialty: 'Pathology',
    goldSignals: 0,
    silverSignals: 5,
    totalSignals: 5,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Pediatrics': {
    specialty: 'Pediatrics',
    goldSignals: 0,
    silverSignals: 5,
    totalSignals: 5,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Physical Medicine and Rehabilitation': {
    specialty: 'Physical Medicine and Rehabilitation',
    goldSignals: 0,
    silverSignals: 20,
    totalSignals: 20,
    signalType: 'single_tier',
    explanationRequired: true,
    explanationMaxChars: 300,
  },
  'Plastic Surgery': {
    specialty: 'Plastic Surgery',
    goldSignals: 0,
    silverSignals: 20,
    totalSignals: 20,
    signalType: 'single_tier',
    explanationRequired: true,
    explanationMaxChars: 300,
  },
  'Plastic Surgery (Integrated)': {
    specialty: 'Plastic Surgery (Integrated)',
    goldSignals: 0,
    silverSignals: 20,
    totalSignals: 20,
    signalType: 'single_tier',
    explanationRequired: true,
    explanationMaxChars: 300,
  },
  'Psychiatry': {
    specialty: 'Psychiatry',
    goldSignals: 0,
    silverSignals: 10,
    totalSignals: 10,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Radiation Oncology': {
    specialty: 'Radiation Oncology',
    goldSignals: 0,
    silverSignals: 4,
    totalSignals: 4,
    signalType: 'single_tier',
    explanationRequired: true,
    explanationMaxChars: 300,
  },
  'Thoracic Surgery (Independent)': {
    specialty: 'Thoracic Surgery (Independent)',
    goldSignals: 0,
    silverSignals: 4,
    totalSignals: 4,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Thoracic Surgery (Integrated)': {
    specialty: 'Thoracic Surgery (Integrated)',
    goldSignals: 0,
    silverSignals: 4,
    totalSignals: 4,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Transitional Year': {
    specialty: 'Transitional Year',
    goldSignals: 0,
    silverSignals: 12,
    totalSignals: 12,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Urology': {
    specialty: 'Urology',
    goldSignals: 0,
    silverSignals: 30,
    totalSignals: 30,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Vascular Surgery (Integrated)': {
    specialty: 'Vascular Surgery (Integrated)',
    goldSignals: 3,
    silverSignals: 12,
    totalSignals: 15,
    signalType: 'tiered',
    explanationRequired: false,
  },

  // Aliases for alternate naming / historical compatibility
  'Surgery-General': {
    specialty: 'Surgery-General',
    goldSignals: 0,
    silverSignals: 15,
    totalSignals: 15,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Radiology-Diagnostic': {
    specialty: 'Radiology-Diagnostic',
    goldSignals: 6,
    silverSignals: 9,
    totalSignals: 15,
    signalType: 'tiered',
    explanationRequired: false,
  },
  'Orthopaedic Surgery': {
    specialty: 'Orthopaedic Surgery',
    goldSignals: 0,
    silverSignals: 30,
    totalSignals: 30,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'Neurosurgery': {
    specialty: 'Neurosurgery',
    goldSignals: 0,
    silverSignals: 25,
    totalSignals: 25,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'ENT': {
    specialty: 'ENT',
    goldSignals: 0,
    silverSignals: 25,
    totalSignals: 25,
    signalType: 'single_tier',
    explanationRequired: false,
  },
  'PM&R': {
    specialty: 'PM&R',
    goldSignals: 0,
    silverSignals: 20,
    totalSignals: 20,
    signalType: 'single_tier',
    explanationRequired: true,
    explanationMaxChars: 300,
  },
  'RadOnc': {
    specialty: 'RadOnc',
    goldSignals: 0,
    silverSignals: 4,
    totalSignals: 4,
    signalType: 'single_tier',
    explanationRequired: true,
    explanationMaxChars: 300,
  },
};

export type ProgramTier = 'reach' | 'target' | 'safety';
export type SignalType = 'gold' | 'silver' | 'none';
export type ApplicationTrack = 'categorical' | 'preliminary' | 'pstp';

export interface SchoolListItem {
  id: string;
  programId: string;
  programNumber?: string;
  programName: string;
  specialty: string;
  city?: string;
  state?: string;
  region?: string;
  address?: string;
  programDirector?: string;
  tier: ProgramTier;
  signal: SignalType;
  track?: ApplicationTrack;
  signalExplanation?: string;
  step2ScoreRange?: string; // Program Step 2 CK Middle 80% range as reported on Residency Explorer
  step2Min?: number; // Middle 80% LOW (10th percentile of invited applicants)
  step2Max?: number; // Middle 80% HIGH (90th percentile of invited applicants)
  step2CkLow?: number;
  step2CkHigh?: number;
  step2Ck25th?: number;
  step2Ck75th?: number;
  yieldNoSignal?: number;
  yieldSilver?: number;
  yieldGold?: number;
  noSignal?: number;
  silverSignal?: number;
  goldSignal?: number;
  advisorNotes?: string;
  doximityUrl?: string;
  residencyExplorerUrl?: string;
  level2CeRange?: string;
  mdApplicantYield?: number;
}

export interface SignalValidationResult {
  valid: boolean;
  goldUsed: number;
  silverUsed: number;
  goldRemaining: number;
  silverRemaining: number;
  totalRemaining: number;
  errors: string[];
}

export function validateSignalAllocation(
  specialty: string,
  items: SchoolListItem[]
): SignalValidationResult {
  const rule = SPECIALTY_SIGNALING_RULES[specialty] || {
    specialty,
    goldSignals: 3,
    silverSignals: 12,
    totalSignals: 15,
    signalType: 'tiered',
  };

  const goldUsed = items.filter((i) => i.signal === 'gold').length;
  const silverUsed = items.filter((i) => i.signal === 'silver').length;

  const goldRemaining = Math.max(0, rule.goldSignals - goldUsed);
  const silverRemaining = Math.max(0, rule.silverSignals - silverUsed);
  const totalRemaining = Math.max(0, rule.totalSignals - (goldUsed + silverUsed));

  const errors: string[] = [];

  if (rule.signalType === 'single_tier') {
    if (goldUsed > 0) {
      errors.push(`${specialty} uses single-tier signaling; Gold signals are not permitted.`);
    }
    if (silverUsed > rule.silverSignals) {
      errors.push(`Assigned signals (${silverUsed}) exceeds specialty quota (${rule.silverSignals})`);
    }
  } else {
    if (goldUsed > rule.goldSignals) {
      errors.push(`Assigned Gold signals (${goldUsed}) exceeds specialty quota (${rule.goldSignals})`);
    }
    if (silverUsed > rule.silverSignals) {
      errors.push(`Assigned Silver signals (${silverUsed}) exceeds specialty quota (${rule.silverSignals})`);
    }
  }

  return {
    valid: errors.length === 0,
    goldUsed,
    silverUsed,
    goldRemaining,
    silverRemaining,
    totalRemaining,
    errors,
  };
}

/**
 * Automatically evaluates whether a residency program is Safety, Target, or Reach
 * by comparing the applicant's baseline Step 2 CK score against the program's
 * Middle 80% range (LOW to HIGH) reported on Residency Explorer.
 *
 * Rules:
 * - Safety: Applicant Step 2 CK > Program Middle 80% HIGH (exceeds top 10% cutoff of invitees)
 * - Target: Applicant Step 2 CK is within the Middle 80% range [Low, High]
 * - Reach: Applicant Step 2 CK < Program Middle 80% LOW (below bottom 10th percentile of invitees)
 */
export function evaluateProgramTier(
  applicantScore: number,
  minScore?: number,
  maxScore?: number
): ProgramTier | null {
  if (
    applicantScore === undefined ||
    applicantScore === null ||
    isNaN(applicantScore) ||
    minScore === undefined ||
    minScore === null ||
    isNaN(minScore) ||
    maxScore === undefined ||
    maxScore === null ||
    isNaN(maxScore)
  ) {
    return null;
  }

  if (applicantScore > maxScore) {
    return 'safety';
  }
  if (applicantScore < minScore) {
    return 'reach';
  }
  return 'target';
}

/**
 * Parses numeric lower and upper bounds from common score range strings
 * (e.g., "250 - 259", "240-249", "< 220", "270+").
 */
export function parseScoreRange(rangeStr?: string): { min?: number; max?: number } {
  if (!rangeStr) return {};
  const cleaned = rangeStr.trim();
  const dashMatch = cleaned.match(/^(\d{3})\s*[-–—]\s*(\d{3})$/);
  if (dashMatch) {
    return { min: parseInt(dashMatch[1], 10), max: parseInt(dashMatch[2], 10) };
  }
  const ltMatch = cleaned.match(/^<\s*(\d{3})$/);
  if (ltMatch) {
    return { min: 200, max: parseInt(ltMatch[1], 10) - 1 };
  }
  const gtMatch = cleaned.match(/^(\d{3})\+$/);
  if (gtMatch) {
    return { min: parseInt(gtMatch[1], 10), max: 300 };
  }
  return {};
}

export const DEFAULT_APPLICANT_STEP2_CK = 254;
export const APPLICANT_STEP2_CK_STORAGE_KEY = 'eras_applicant_step2_ck';
export const APPLICANT_PROFILE_STORAGE_KEY = 'eras_applicant_profile';

let inMemoryStep2Ck = DEFAULT_APPLICANT_STEP2_CK;

export function getStoredApplicantStep2Ck(studentId?: string): number {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  if (typeof localStorage !== 'undefined') {
    try {
      if (sid && !isDemoStudentId(sid)) {
        const scoped = localStorage.getItem(`${APPLICANT_STEP2_CK_STORAGE_KEY}_${sid}`);
        if (scoped) {
          const parsed = parseInt(scoped, 10);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
      const stored = localStorage.getItem(APPLICANT_STEP2_CK_STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // fallback
    }
  }
  return inMemoryStep2Ck;
}

export function setStoredApplicantStep2Ck(score: number, studentId?: string): void {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  inMemoryStep2Ck = score;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(APPLICANT_STEP2_CK_STORAGE_KEY, score.toString());
      if (sid && !isDemoStudentId(sid)) {
        localStorage.setItem(`${APPLICANT_STEP2_CK_STORAGE_KEY}_${sid}`, score.toString());
        updateStudentAccount(sid, { step2Ck: score });
      }
    } catch {
      // fallback
    }
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('applicant_step2_ck_updated', { detail: score }));
    } catch {
      // fallback
    }
  }
}

export const TARGET_SPECIALTY_STORAGE_KEY = 'eras_applicant_target_specialty';

let inMemoryTargetSpecialty = 'Internal Medicine';

export function getStoredTargetSpecialty(studentId?: string): string {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  if (typeof localStorage !== 'undefined') {
    try {
      // 1. Scoped student specialty key
      if (sid && !isDemoStudentId(sid)) {
        const studentScoped = localStorage.getItem(`${TARGET_SPECIALTY_STORAGE_KEY}_${sid}`);
        if (studentScoped) return studentScoped;
      }
      
      // 2. Student account from registry
      if (sid) {
        const acc = getStudentAccount(sid);
        if (acc?.specialty) return acc.specialty;
      }

      // 3. Fallback to global storage key
      const stored = localStorage.getItem(TARGET_SPECIALTY_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // fallback
    }
  }
  return inMemoryTargetSpecialty;
}

export function setStoredTargetSpecialty(specialty: string, studentId?: string): void {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  inMemoryTargetSpecialty = specialty;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(TARGET_SPECIALTY_STORAGE_KEY, specialty);
      if (sid && !isDemoStudentId(sid)) {
        localStorage.setItem(`${TARGET_SPECIALTY_STORAGE_KEY}_${sid}`, specialty);
        updateStudentAccount(sid, { specialty });
      }
    } catch {
      // fallback
    }
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('applicant_specialty_updated', { detail: specialty }));
    } catch {
      // fallback
    }
  }
}

export const DEFAULT_INTERNAL_MEDICINE_SAMPLE_ITEMS: SchoolListItem[] = [
  {
    id: 'sample-im-1',
    programId: '1402421162',
    programNumber: '1402421162',
    programName: 'Massachusetts General Hospital',
    specialty: 'Internal Medicine',
    city: 'Boston',
    state: 'MA',
    region: 'New England',
    address: '55 Fruit Street, Bulfinch 120, Boston, MA 02114',
    programDirector: 'J. Kevin Tucker, MD',
    step2ScoreRange: '249 - 275',
    step2Min: 249,
    step2Max: 275,
    tier: 'target',
    signal: 'gold',
    yieldNoSignal: undefined,
    yieldSilver: undefined,
    yieldGold: undefined,
    advisorNotes: 'Residency Explorer Middle 80%: 249–275. Highly competitive academic institution; Gold signal essential for out-of-region consideration.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org/?utm_source=gemini',
    doximityUrl: 'https://www.doximity.com/residency',
  },
  {
    id: 'sample-im-2',
    programId: '1402421160',
    programNumber: '1402421160',
    programName: 'Brigham and Women’s Hospital',
    specialty: 'Internal Medicine',
    city: 'Boston',
    state: 'MA',
    region: 'New England',
    address: '75 Francis Street, Boston, MA 02115',
    programDirector: 'Maria A. Yialamas, MD',
    step2ScoreRange: '248 - 274',
    step2Min: 248,
    step2Max: 274,
    tier: 'target',
    signal: 'gold',
    yieldNoSignal: 1,
    yieldSilver: 20,
    yieldGold: 42,
    advisorNotes: 'Residency Explorer Middle 80%: 248–274. Gold signal produces a +22% interview surge over Silver (42% vs 20%). Prime target for Gold token.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org/?utm_source=gemini',
    doximityUrl: 'https://www.doximity.com/residency',
  },
  {
    id: 'sample-im-3',
    programId: '1405421430',
    programNumber: '1405421430',
    programName: 'University of Washington',
    specialty: 'Internal Medicine',
    city: 'Seattle',
    state: 'WA',
    region: 'Pacific',
    address: '1959 NE Pacific Street, Box 356420, Seattle, WA 98195',
    programDirector: 'Ken Steinberg, MD',
    step2ScoreRange: '241 - 275',
    step2Min: 241,
    step2Max: 275,
    tier: 'safety',
    signal: 'silver',
    yieldNoSignal: 0,
    yieldSilver: 29,
    yieldGold: 47,
    advisorNotes: 'Residency Explorer Middle 80%: 241–275. Silver signal captures strong 29% interview yield; Gold delivers 47%.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org/?utm_source=gemini',
    doximityUrl: 'https://www.doximity.com/residency',
  },
  {
    id: 'sample-im-4',
    programId: '1401221105',
    programNumber: '1401221105',
    programName: 'Emory University School of Medicine',
    specialty: 'Internal Medicine',
    city: 'Atlanta',
    state: 'GA',
    region: 'South Atlantic',
    address: '100 Woodruff Circle, Suite 400, Atlanta, GA 30322',
    programDirector: 'Wendy Armstrong, MD',
    step2ScoreRange: '243 - 271',
    step2Min: 243,
    step2Max: 271,
    tier: 'safety',
    signal: 'silver',
    yieldNoSignal: 3,
    yieldSilver: 28,
    yieldGold: 35,
    advisorNotes: 'Residency Explorer Middle 80%: 243–271. Silver captures bulk of yield leverage (28% vs 3% baseline), optimal allocation.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org/?utm_source=gemini',
    doximityUrl: 'https://www.doximity.com/residency',
  },
  {
    id: 'sample-im-5',
    programId: '1402421175',
    programNumber: '1402421175',
    programName: 'Tufts Medical Center',
    specialty: 'Internal Medicine',
    city: 'Boston',
    state: 'MA',
    region: 'New England',
    address: '800 Washington Street, Box 243, Boston, MA 02111',
    programDirector: 'Laura K. Snydman, MD',
    step2ScoreRange: '244 - 271',
    step2Min: 244,
    step2Max: 271,
    tier: 'safety',
    signal: 'silver',
    yieldNoSignal: 0,
    yieldSilver: 42,
    yieldGold: 41,
    advisorNotes: 'Residency Explorer Middle 80%: 244–271. Silver delivers equal yield to Gold (42% vs 41%), conserving your Gold token.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org/?utm_source=gemini',
    doximityUrl: 'https://www.doximity.com/residency',
  },
];

export function getSampleProgramsForSpecialty(
  specialty: string,
  applicantScore?: number
): SchoolListItem[] {
  const normSpec = specialty?.trim() || 'Internal Medicine';
  const baseline = applicantScore ?? getStoredApplicantStep2Ck();

  if (normSpec.toLowerCase() === 'internal medicine') {
    return DEFAULT_INTERNAL_MEDICINE_SAMPLE_ITEMS.map((item) => {
      const autoTier = evaluateProgramTier(baseline, item.step2Min, item.step2Max);
      return {
        ...item,
        tier: autoTier || item.tier,
      };
    });
  }

  const all = getAllResidencyPrograms();
  const matches = all.filter(
    (p) => p.specialty.toLowerCase() === normSpec.toLowerCase()
  );

  const rule = SPECIALTY_SIGNALING_RULES[normSpec] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  // Select up to 5 programs, maximizing region diversity
  const selected: ResidencyProgramRecord[] = [];
  const seenRegions = new Set<string>();

  for (const p of matches) {
    if (!seenRegions.has(p.region)) {
      seenRegions.add(p.region);
      selected.push(p);
      if (selected.length >= 5) break;
    }
  }

  // If fewer than 5 unique regions found, fill with other matches
  if (selected.length < 5) {
    for (const p of matches) {
      if (!selected.includes(p)) {
        selected.push(p);
        if (selected.length >= 5) break;
      }
    }
  }

  // If still empty (unknown specialty not in database), create a fallback item
  if (selected.length === 0) {
    return [
      {
        id: `sample-${normSpec.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1`,
        programId: 'fallback-1',
        programNumber: '999001',
        programName: `National Medical Center (${normSpec})`,
        specialty: normSpec,
        city: 'New York',
        state: 'NY',
        region: 'Middle Atlantic',
        step2ScoreRange: '245 - 255',
        step2Min: 245,
        step2Max: 255,
        tier: evaluateProgramTier(baseline, 245, 255) || 'target',
        signal: rule.signalType === 'single_tier' ? 'silver' : 'gold',
        advisorNotes: 'Prime academic target with strong training opportunities.',
        residencyExplorerUrl: 'https://www.residencyexplorer.org/?utm_source=gemini',
      },
    ];
  }

  const sampleRanges = [
    { min: 250, max: 260, defaultTier: 'reach' as ProgramTier, advisorNotes: 'Competitive reach program; signal recommended for priority interview review.' },
    { min: 245, max: 255, defaultTier: 'target' as ProgramTier, advisorNotes: 'High-yield target institution; signal significantly boosts review odds.' },
    { min: 240, max: 250, defaultTier: 'target' as ProgramTier, advisorNotes: 'Strong clinical match; signal captures substantial interview leverage.' },
    { min: 235, max: 245, defaultTier: 'safety' as ProgramTier, advisorNotes: 'Balanced target anchor; high applicant alignment.' },
    { min: 228, max: 238, defaultTier: 'safety' as ProgramTier, advisorNotes: 'Strong regional safety anchor with favorable baseline interview yield.' },
  ];

  return selected.map((p, idx) => {
    const range = sampleRanges[idx] || sampleRanges[1];
    const minScore = p.step2CkLow !== undefined ? p.step2CkLow : range.min;
    const maxScore = p.step2CkHigh !== undefined ? p.step2CkHigh : range.max;
    const scoreRangeStr = p.step2ScoreRange || `${minScore} - ${maxScore}`;
    const autoTier = evaluateProgramTier(baseline, minScore, maxScore);
    const tier = autoTier || range.defaultTier;

    let signal: SignalType = 'none';
    if (rule.signalType === 'single_tier') {
      signal = idx < 3 ? 'silver' : 'none';
    } else {
      signal = idx < 2 ? 'gold' : idx < 4 ? 'silver' : 'none';
    }

    const explanation = rule.explanationRequired && signal !== 'none'
      ? 'Strong interest in department academic curriculum and clinical training culture.'
      : undefined;

    return {
      id: `sample-${normSpec.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${p.id || idx + 1}`,
      programId: p.id,
      programNumber: p.programNumber || p.id,
      programName: formatProgramDisplayName(p) || p.name,
      specialty: p.specialty,
      city: p.city,
      state: p.state,
      region: p.region,
      address: p.address,
      programDirector: p.programDirector,
      step2ScoreRange: scoreRangeStr,
      step2Min: minScore,
      step2Max: maxScore,
      tier,
      signal,
      signalExplanation: explanation,
      yieldNoSignal: p.noSignal,
      yieldSilver: p.silverSignal,
      yieldGold: p.goldSignal,
      level2CeRange: p.level2CeRange,
      mdApplicantYield: p.mdApplicantYield,
      advisorNotes: range.advisorNotes,
      residencyExplorerUrl: p.residencyExplorerUrl || 'https://www.residencyexplorer.org/?utm_source=gemini',
      doximityUrl: 'https://www.doximity.com/residency',
    };
  });
}

export function getStorageKeyForSpecialty(specialty: string, studentId?: string): string {
  const safe = (specialty || 'Internal Medicine').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem('ethmoid_current_student_id_v1') : null);
  const isDemo = !sid || sid === 'stu-alex-rivera' || sid === 'usr-student-1' || sid === 'student-test-sync' || sid.startsWith('demo-');
  if (sid && !isDemo) {
    return `eras_school_list_matrix_${sid}_${safe}`;
  }
  return `eras_school_list_matrix_${safe}`;
}

export function loadItemsForSpecialty(
  specialty: string,
  applicantScore?: number,
  studentId?: string
): SchoolListItem[] {
  const normSpec = specialty?.trim() || 'Internal Medicine';
  const baseline = applicantScore ?? getStoredApplicantStep2Ck(studentId);
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
  const isDemo = !sid || isDemoStudentId(sid);

  const mapItems = (rawList: SchoolListItem[]) => {
    return rawList.map((item: SchoolListItem) => {
      let min = item.step2Min;
      let max = item.step2Max;
      if ((min === undefined || max === undefined) && item.step2ScoreRange) {
        const p = parseScoreRange(item.step2ScoreRange);
        if (p.min !== undefined && p.max !== undefined) {
          min = p.min;
          max = p.max;
        }
      }
      const autoTier = evaluateProgramTier(baseline, min, max);
      return {
        ...item,
        step2Min: min,
        step2Max: max,
        ...(autoTier ? { tier: autoTier } : {}),
      };
    });
  };

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const safe = normSpec.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const specificKey = getStorageKeyForSpecialty(normSpec, sid || undefined);
    const cached = localStorage.getItem(specificKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mapItems(parsed);
        }
      } catch {}
    }

    // Self-healing fallback 1: If student is non-demo and doesn't have a scoped copy yet,
    // check if schools were saved under the unscoped key for this specialty
    if (sid && !isDemo) {
      const unscopedKey = `eras_school_list_matrix_${safe}`;
      const unscopedCached = localStorage.getItem(unscopedKey);
      if (unscopedCached) {
        try {
          const parsed = JSON.parse(unscopedCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(specificKey, unscopedCached);
            return mapItems(parsed);
          }
        } catch {}
      }

      // Self-healing fallback 2: Check if student has saved programs under their registered account specialty
      const acc = getStudentAccount(sid);
      if (acc?.specialty && acc.specialty.toLowerCase() !== normSpec.toLowerCase()) {
        const accSafe = acc.specialty.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const accScopedKey = `eras_school_list_matrix_${sid}_${accSafe}`;
        const accCached = localStorage.getItem(accScopedKey) || localStorage.getItem(`eras_school_list_matrix_${accSafe}`);
        if (accCached) {
          try {
            const parsed = JSON.parse(accCached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return mapItems(parsed);
            }
          } catch {}
        }
      }
    }

    // Non-demo users start with a fresh, empty school list!
    if (sid && !isDemo) {
      return [];
    }

    // Check legacy key if specialty is Internal Medicine
    if (normSpec.toLowerCase() === 'internal medicine') {
      const legacyCached = localStorage.getItem('eras_school_list_matrix');
      if (legacyCached) {
        try {
          const parsed = JSON.parse(legacyCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const isIM = parsed.every((p: SchoolListItem) => !p.specialty || p.specialty.toLowerCase() === 'internal medicine');
            if (isIM) {
              return mapItems(parsed);
            }
          }
        } catch {}
      }
    }
  }

  // Non-demo users start with an empty school list
  if (sid && !isDemo) {
    return [];
  }

  return getSampleProgramsForSpecialty(normSpec, baseline);
}

