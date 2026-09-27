import { describe, it, expect } from 'vitest';
import {
  crossReferenceRosterProgram,
  parseMatchDayRosterText,
  ParsedRosterEntry,
} from '@/domain/alumni-roster-parser';
import { getAllResidencyPrograms } from '@/domain/residency-database';

describe('Match Day Roster Parsing & ACGME Program Cross-Referencing', () => {
  const allPrograms = getAllResidencyPrograms();

  it('accurately cross-references program name, specialty, and location against ACGME database', () => {
    // Exact or near-exact match
    const result = crossReferenceRosterProgram(
      'Massachusetts General Hospital',
      'Internal Medicine',
      'Boston, MA',
      allPrograms
    );

    expect(result.matchedProgram).toBeDefined();
    expect(result.matchedProgram?.name).toContain('Massachusetts General Hospital');
    expect(result.matchedProgram?.specialty).toBe('Internal Medicine');
    expect(result.matchedProgram?.state).toBe('MA');
    expect(result.confidence).toBe('high');
    expect(result.acgmeId).toBeDefined();
  });

  it('matches partial hospital names (e.g. Johns Hopkins or Brigham) with correct state and specialty', () => {
    const result = crossReferenceRosterProgram(
      'Johns Hopkins',
      'Internal Medicine',
      'MD',
      allPrograms
    );

    expect(result.matchedProgram).toBeDefined();
    expect(result.matchedProgram?.name).toContain('Johns Hopkins');
    expect(result.matchedProgram?.state).toBe('MD');
    expect(result.confidence).toBe('high');
  });

  it('flags unverified programs when no ACGME entry matches', () => {
    const result = crossReferenceRosterProgram(
      'Fictional Community Health Clinic',
      'Internal Medicine',
      'ZZ',
      allPrograms
    );

    expect(result.matchedProgram).toBeNull();
    expect(result.confidence).toBe('none');
  });

  it('parses multi-line Match Day text and preloads staged alumni records with predicted PGY', () => {
    const rosterSample = `
Dr. Maya Patel - Internal Medicine - Stanford Health Care - Stanford, CA
Dr. Liam Connor - General Surgery - Brigham and Women's Hospital - Boston, MA
Dr. Chloe Bennett - Pediatrics - Children's Hospital of Philadelphia - Philadelphia, PA
    `.trim();

    const staged: ParsedRosterEntry[] = parseMatchDayRosterText(rosterSample, 2026, allPrograms);

    expect(staged).toHaveLength(3);

    // Maya Patel
    expect(staged[0].name).toBe('Dr. Maya Patel');
    expect(staged[0].specialty).toBe('Internal Medicine');
    expect(staged[0].institutionName).toContain('Stanford');
    expect(staged[0].programState).toBe('CA');
    expect(staged[0].currentPgy).toBeDefined();
    expect(staged[0].matchedProgram).toBeDefined();

    // Liam Connor
    expect(staged[1].name).toBe('Dr. Liam Connor');
    expect(staged[1].specialty).toBe('General Surgery');
    expect(staged[1].programState).toBe('MA');
    expect(staged[1].matchedProgram).toBeDefined();

    // Chloe Bennett
    expect(staged[2].name).toBe('Dr. Chloe Bennett');
    expect(staged[2].specialty).toBe('Pediatrics');
    expect(staged[2].programState).toBe('PA');
  });
});
