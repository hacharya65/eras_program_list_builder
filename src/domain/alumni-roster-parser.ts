import { ResidencyProgramRecord, getAllResidencyPrograms, formatProgramDisplayName } from './residency-database';
import { calculateCurrentPgy, AlumniResident } from './alumni-models';

export interface CrossReferenceResult {
  matchedProgram: ResidencyProgramRecord | null;
  confidence: 'high' | 'medium' | 'none';
  canonicalInstitution: string;
  city: string;
  state: string;
  acgmeId?: string;
}

export interface ParsedRosterEntry {
  id: string;
  name: string;
  graduationYear: number;
  currentPgy: string;
  medicalSchool: string;
  institutionName: string;
  specialty: string;
  programCity: string;
  programState: string;
  email: string;
  isAvailableForMentorship: boolean;
  contactPreference: AlumniResident['contactPreference'];
  confidence: 'high' | 'medium' | 'none';
  matchedProgram?: ResidencyProgramRecord;
  acgmeProgramId?: string;
  verificationStatus: 'verified' | 're_attestation_pending';
  lastVerifiedPeriod: string;
  lastVerifiedAt: string;
}

/**
 * Cross-references raw roster fields against the 2,500+ ACGME master program database.
 */
export function crossReferenceRosterProgram(
  rawProgram: string,
  specialty: string,
  rawLocation?: string,
  allPrograms: ResidencyProgramRecord[] = getAllResidencyPrograms()
): CrossReferenceResult {
  const normProg = rawProgram.trim().toLowerCase();
  const normSpec = specialty.trim().toLowerCase();

  // Extract 2-letter state if present in location or program name
  let targetState: string | undefined;
  if (rawLocation) {
    const stateMatch = rawLocation.match(/\b([A-Z]{2})\b/i);
    if (stateMatch) {
      targetState = stateMatch[1].toUpperCase();
    }
  }

  // Filter candidate programs by exact specialty first, then substring
  let specialtyCandidates = allPrograms.filter(
    (p) => p.specialty.toLowerCase() === normSpec
  );
  if (specialtyCandidates.length === 0) {
    specialtyCandidates = allPrograms.filter(
      (p) => p.specialty.toLowerCase().includes(normSpec) ||
        normSpec.includes(p.specialty.toLowerCase())
    );
  }

  const pool = specialtyCandidates.length > 0 ? specialtyCandidates : allPrograms;

  // 1. High-confidence exact/contained match with state check
  for (const prog of pool) {
    const progName = (prog.name || '').toLowerCase();
    const displayName = formatProgramDisplayName(prog).toLowerCase();
    const stateMatches = !targetState || prog.state.toUpperCase() === targetState;

    if (stateMatches) {
      if (progName.includes(normProg) || normProg.includes(progName) ||
          displayName.includes(normProg) || normProg.includes(displayName)) {
        return {
          matchedProgram: prog,
          confidence: 'high',
          canonicalInstitution: formatProgramDisplayName(prog),
          city: prog.city,
          state: prog.state,
          acgmeId: prog.programNumber || prog.id,
        };
      }
    }
  }

  // 2. High-confidence token match with state check (e.g. "Johns Hopkins" matching "Johns Hopkins University")
  const progTokens = normProg.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length >= 4);
  if (progTokens.length > 0) {
    for (const prog of pool) {
      const progName = (prog.name || '').toLowerCase();
      const displayName = formatProgramDisplayName(prog).toLowerCase();
      const stateMatches = !targetState || prog.state.toUpperCase() === targetState;
      if (stateMatches) {
        const matchesAllTokens = progTokens.every((t) => progName.includes(t) || displayName.includes(t));
        if (matchesAllTokens) {
          return {
            matchedProgram: prog,
            confidence: 'high',
            canonicalInstitution: formatProgramDisplayName(prog),
            city: prog.city,
            state: prog.state,
            acgmeId: prog.programNumber || prog.id,
          };
        }
      }
    }
  }

  // 3. Medium-confidence match (matching tokens across any state if no target state specified)
  for (const prog of pool) {
    const progName = (prog.name || '').toLowerCase();
    const displayName = formatProgramDisplayName(prog).toLowerCase();
    const matchesAllTokens = progTokens.length > 0 && progTokens.every((t) => progName.includes(t) || displayName.includes(t));
    if (matchesAllTokens) {
      return {
        matchedProgram: prog,
        confidence: 'medium',
        canonicalInstitution: formatProgramDisplayName(prog),
        city: prog.city,
        state: prog.state,
        acgmeId: prog.programNumber || prog.id,
      };
    }
  }

  return {
    matchedProgram: null,
    confidence: 'none',
    canonicalInstitution: rawProgram,
    city: '',
    state: targetState || '',
  };
}

/**
 * Parses multi-line Match Day text / PDF export lines and attaches canonical ACGME records.
 */
export function parseMatchDayRosterText(
  rawText: string,
  graduationYear: number = new Date().getFullYear(),
  allPrograms: ResidencyProgramRecord[] = getAllResidencyPrograms()
): ParsedRosterEntry[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const results: ParsedRosterEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Attempt delimiters: dash, pipe, tab, or comma
    let parts: string[] = [];
    if (line.includes(' - ')) {
      parts = line.split(' - ');
    } else if (line.includes(' | ')) {
      parts = line.split(' | ');
    } else if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else {
      continue;
    }

    parts = parts.map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) continue;

    const rawName = parts[0];
    const rawSpecialty = parts[1];
    const rawProgram = parts[2];
    const rawLocation = parts.slice(3).join(', ');

    const crossRef = crossReferenceRosterProgram(rawProgram, rawSpecialty, rawLocation, allPrograms);

    const institutionName = crossRef.matchedProgram
      ? formatProgramDisplayName(crossRef.matchedProgram)
      : rawProgram;
    const specialty = crossRef.matchedProgram?.specialty || rawSpecialty;
    const programCity = crossRef.city || (rawLocation ? rawLocation.split(',')[0].trim() : '');
    const programState = crossRef.state || '';

    // Auto-generate placeholder student institutional email
    const nameClean = rawName.toLowerCase().replace(/^dr\.\s*/, '').replace(/[^a-z]/g, '');
    const email = `${nameClean}@${institutionName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}.edu`;

    const currentPgy = calculateCurrentPgy(graduationYear, new Date(), undefined, specialty);

    results.push({
      id: `staged-${Date.now()}-${i}`,
      name: rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`,
      graduationYear,
      currentPgy,
      medicalSchool: 'Apex School of Medicine',
      institutionName,
      specialty,
      programCity,
      programState,
      email,
      isAvailableForMentorship: true,
      contactPreference: 'email',
      confidence: crossRef.confidence,
      matchedProgram: crossRef.matchedProgram || undefined,
      acgmeProgramId: crossRef.acgmeId,
      verificationStatus: 'verified',
      lastVerifiedPeriod: `${graduationYear} Match Cohort`,
      lastVerifiedAt: new Date().toISOString().split('T')[0],
    });
  }

  return results;
}
