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
  programName: string;
  specialty: string;
  city?: string;
  state?: string;
  tier: ProgramTier;
  signal: SignalType;
  track: ApplicationTrack;
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
