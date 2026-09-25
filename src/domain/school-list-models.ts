/**
 * Official ERAS Signaling Rules & School List Models
 * Formatted for ACGME specialties with exact Gold and Silver signal allocations.
 */

export interface SpecialtySignalRule {
  specialty: string;
  goldSignals: number;
  silverSignals: number;
  totalSignals: number;
  signalType: 'tiered' | 'single_tier'; // e.g. Gold/Silver vs just single signal
}

export const SPECIALTY_SIGNALING_RULES: Record<string, SpecialtySignalRule> = {
  'Internal Medicine': {
    specialty: 'Internal Medicine',
    goldSignals: 3,
    silverSignals: 12,
    totalSignals: 15,
    signalType: 'tiered',
  },
  'Obstetrics and Gynecology': {
    specialty: 'Obstetrics and Gynecology',
    goldSignals: 3,
    silverSignals: 15,
    totalSignals: 18,
    signalType: 'tiered',
  },
  'Orthopaedic Surgery': {
    specialty: 'Orthopaedic Surgery',
    goldSignals: 0,
    silverSignals: 30,
    totalSignals: 30,
    signalType: 'single_tier',
  },
  'Dermatology': {
    specialty: 'Dermatology',
    goldSignals: 3,
    silverSignals: 25,
    totalSignals: 28,
    signalType: 'tiered',
  },
  'Surgery-General': {
    specialty: 'Surgery-General',
    goldSignals: 5,
    silverSignals: 25,
    totalSignals: 30,
    signalType: 'tiered',
  },
  'Emergency Medicine': {
    specialty: 'Emergency Medicine',
    goldSignals: 2,
    silverSignals: 5,
    totalSignals: 7,
    signalType: 'tiered',
  },
  'Pediatrics': {
    specialty: 'Pediatrics',
    goldSignals: 5,
    silverSignals: 10,
    totalSignals: 15,
    signalType: 'tiered',
  },
  'Anesthesiology': {
    specialty: 'Anesthesiology',
    goldSignals: 5,
    silverSignals: 10,
    totalSignals: 15,
    signalType: 'tiered',
  },
  'Neurology': {
    specialty: 'Neurology',
    goldSignals: 3,
    silverSignals: 9,
    totalSignals: 12,
    signalType: 'tiered',
  },
  'Radiology-Diagnostic': {
    specialty: 'Radiology-Diagnostic',
    goldSignals: 6,
    silverSignals: 6,
    totalSignals: 12,
    signalType: 'tiered',
  },
  'Psychiatry': {
    specialty: 'Psychiatry',
    goldSignals: 5,
    silverSignals: 10,
    totalSignals: 15,
    signalType: 'tiered',
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
  step2ScoreRange?: string; // Program Step 2 CK range as reported on Residency Explorer
  step2Min?: number; // 25th percentile
  step2Max?: number; // 75th percentile
  yieldNoSignal?: number;
  yieldSilver?: number;
  yieldGold?: number;
  advisorNotes?: string;
  doximityUrl?: string;
  residencyExplorerUrl?: string;
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

  if (goldUsed > rule.goldSignals) {
    errors.push(`Assigned Gold signals (${goldUsed}) exceeds specialty quota (${rule.goldSignals})`);
  }
  if (silverUsed > rule.silverSignals) {
    errors.push(`Assigned Silver signals (${silverUsed}) exceeds specialty quota (${rule.silverSignals})`);
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
 * 25th–75th percentile range (manually entered from Residency Explorer).
 *
 * Rules:
 * - Safety: Applicant Step 2 CK > Program 75th percentile (upper bound)
 * - Target: Applicant Step 2 CK is within [25th percentile, 75th percentile]
 * - Reach: Applicant Step 2 CK < Program 25th percentile (lower bound)
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

export function getStoredApplicantStep2Ck(): number {
  if (typeof localStorage !== 'undefined') {
    try {
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

export function setStoredApplicantStep2Ck(score: number): void {
  inMemoryStep2Ck = score;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(APPLICANT_STEP2_CK_STORAGE_KEY, score.toString());
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

