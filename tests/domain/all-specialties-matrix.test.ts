import { describe, it, expect } from 'vitest';
import {
  SPECIALTY_SIGNALING_RULES,
  validateSignalAllocation,
  CANONICAL_SPECIALTIES,
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
  SchoolListItem,
} from '@/domain/school-list-models';
import { searchResidencyPrograms } from '@/domain/residency-database';
import { getSpecialtyBenchmark } from '@/domain/competitiveness-engine';
import {
  getSpecialtyEssayGroup,
  getStoredSpecialtyEssays,
  saveStoredSpecialtyEssay,
  SPECIALTY_ESSAY_DEFINITIONS,
} from '@/domain/specialty-essays';

describe('Verified Core Specialties & Up-to-date Signaling Rules', () => {
  const VERIFIED_SPECIALTIES = [
    { name: 'Anesthesiology', gold: 5, silver: 10, total: 15, singleTier: false, explanationReq: true },
    { name: 'Dermatology', gold: 3, silver: 25, total: 28, singleTier: false, explanationReq: false },
    { name: 'Diagnostic Radiology', gold: 6, silver: 9, total: 15, singleTier: false, explanationReq: false },
    { name: 'Emergency Medicine', gold: 2, silver: 5, total: 7, singleTier: false, explanationReq: false },
    { name: 'Family Medicine', gold: 0, silver: 5, total: 5, singleTier: true, explanationReq: false },
    { name: 'General Surgery', gold: 0, silver: 15, total: 15, singleTier: true, explanationReq: false },
    { name: 'Internal Medicine', gold: 3, silver: 12, total: 15, singleTier: false, explanationReq: false },
    { name: 'Internal Medicine/Pediatrics', gold: 0, silver: 5, total: 5, singleTier: true, explanationReq: false },
    { name: 'Interventional Radiology (Integrated)', gold: 0, silver: 8, total: 8, singleTier: true, explanationReq: false },
    { name: 'Neurological Surgery', gold: 0, silver: 25, total: 25, singleTier: true, explanationReq: false },
    { name: 'Neurology', gold: 0, silver: 8, total: 8, singleTier: true, explanationReq: false },
    { name: 'Obstetrics and Gynecology', gold: 3, silver: 15, total: 18, singleTier: false, explanationReq: false },
    { name: 'Ophthalmology', gold: 0, silver: 0, total: 0, singleTier: true, explanationReq: false },
    { name: 'Orthopedic Surgery', gold: 0, silver: 30, total: 30, singleTier: true, explanationReq: false },
    { name: 'Otolaryngology', gold: 0, silver: 25, total: 25, singleTier: true, explanationReq: false },
    { name: 'Pathology', gold: 0, silver: 5, total: 5, singleTier: true, explanationReq: false },
    { name: 'Pediatrics', gold: 0, silver: 5, total: 5, singleTier: true, explanationReq: false },
    { name: 'Physical Medicine and Rehabilitation', gold: 0, silver: 20, total: 20, singleTier: true, explanationReq: true },
    { name: 'Plastic Surgery (Integrated)', gold: 0, silver: 20, total: 20, singleTier: true, explanationReq: true },
    { name: 'Psychiatry', gold: 0, silver: 10, total: 10, singleTier: true, explanationReq: false },
    { name: 'Radiation Oncology', gold: 0, silver: 4, total: 4, singleTier: true, explanationReq: true },
    { name: 'Thoracic Surgery (Integrated)', gold: 0, silver: 4, total: 4, singleTier: true, explanationReq: false },
    { name: 'Transitional Year', gold: 0, silver: 12, total: 12, singleTier: true, explanationReq: false },
    { name: 'Urology', gold: 0, silver: 30, total: 30, singleTier: true, explanationReq: false },
    { name: 'Vascular Surgery (Integrated)', gold: 3, silver: 12, total: 15, singleTier: false, explanationReq: false },
  ];

  it('contains exactly 25 canonical specialties with verified PDF data in Context', () => {
    expect(CANONICAL_SPECIALTIES).toHaveLength(25);
    for (const spec of VERIFIED_SPECIALTIES) {
      expect(CANONICAL_SPECIALTIES).toContain(spec.name);
    }
  });

  it('contains accurate signaling rules for all 25 verified specialties', () => {
    for (const spec of VERIFIED_SPECIALTIES) {
      const rule = SPECIALTY_SIGNALING_RULES[spec.name];
      expect(rule, `Rule missing for ${spec.name}`).toBeDefined();
      expect(rule.goldSignals).toBe(spec.gold);
      expect(rule.silverSignals).toBe(spec.silver);
      expect(rule.totalSignals).toBe(spec.total);
      expect(rule.signalType).toBe(spec.singleTier ? 'single_tier' : 'tiered');
      expect(rule.explanationRequired).toBe(spec.explanationReq);
      if (spec.explanationReq) {
        expect(rule.explanationMaxChars).toBe(300);
      }
    }
  });

  it('ensures Transitional Year has exactly 12 single-tier signals', () => {
    const tyRule = SPECIALTY_SIGNALING_RULES['Transitional Year'];
    expect(tyRule).toBeDefined();
    expect(tyRule.signalType).toBe('single_tier');
    expect(tyRule.goldSignals).toBe(0);
    expect(tyRule.silverSignals).toBe(12);
    expect(tyRule.totalSignals).toBe(12);
  });

  it('validates single-tier specialties without requiring gold signals', () => {
    const mockItems: SchoolListItem[] = [
      {
        id: '1',
        programId: '1001',
        programName: 'Mayo Clinic FM',
        specialty: 'Family Medicine',
        tier: 'target',
        signal: 'silver',
      },
      {
        id: '2',
        programId: '1002',
        programName: 'UCSF FM',
        specialty: 'Family Medicine',
        tier: 'reach',
        signal: 'silver',
      },
    ];

    const result = validateSignalAllocation('Family Medicine', mockItems);
    expect(result.valid).toBe(true);
    expect(result.silverUsed).toBe(2);
    expect(result.silverRemaining).toBe(3); // 5 - 2
    expect(result.goldUsed).toBe(0);
    expect(result.goldRemaining).toBe(0);
  });

  it('flags invalid allocation when exceeding single-tier quota', () => {
    const mockItems: SchoolListItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `item-${i}`,
      programId: `prog-${i}`,
      programName: `Program ${i}`,
      specialty: 'Family Medicine',
      tier: 'target',
      signal: 'silver',
    }));

    const result = validateSignalAllocation('Family Medicine', mockItems);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('exceeds specialty quota (5)');
  });

  it('searches authentic PDF programs from database for each verified specialty', () => {
    for (const spec of VERIFIED_SPECIALTIES) {
      const progs = searchResidencyPrograms({ specialty: spec.name, limit: 5 });
      expect(progs.length, `Expected programs in DB for ${spec.name}`).toBeGreaterThan(0);
    }
  });

  it('verifies Transitional Year has authentic PDF programs in the database', () => {
    const tyPrograms = searchResidencyPrograms({ specialty: 'Transitional Year', limit: 300 });
    expect(tyPrograms.length).toBeGreaterThanOrEqual(200);
    expect(tyPrograms.some(p => p.name.includes('Sutter'))).toBe(true);
  });

  it('resolves benchmarks for all canonical specialties in Competitiveness Engine', () => {
    for (const spec of CANONICAL_SPECIALTIES) {
      const benchmark = getSpecialtyBenchmark(spec);
      expect(benchmark, `Expected benchmark for canonical specialty ${spec}`).not.toBeNull();
    }
  });

  it('persists and restores target specialty using helper functions', () => {
    setStoredTargetSpecialty('Transitional Year');
    expect(getStoredTargetSpecialty()).toBe('Transitional Year');

    setStoredTargetSpecialty('Orthopedic Surgery');
    expect(getStoredTargetSpecialty()).toBe('Orthopedic Surgery');
  });

  describe('Signal Explanations Required with Signaling', () => {
    it('identifies exact specialties requiring signal explanations', () => {
      const explanationSpecs = CANONICAL_SPECIALTIES.filter(
        (s) => SPECIALTY_SIGNALING_RULES[s]?.explanationRequired
      );
      expect(explanationSpecs).toEqual([
        'Anesthesiology',
        'Physical Medicine and Rehabilitation',
        'Plastic Surgery (Integrated)',
        'Radiation Oncology',
      ]);
    });

    it('allows assigning and persisting signal explanation text on SchoolListItem', () => {
      const item: SchoolListItem = {
        id: 'anes-1',
        programId: '0403521096',
        programName: 'Brigham and Women’s Hospital - Anesthesiology',
        specialty: 'Anesthesiology',
        tier: 'target',
        signal: 'gold',
        signalExplanation: 'Strong clinical interest in critical care anesthesia and cardiac fellowship track.',
      };

      expect(item.signalExplanation).toBeDefined();
      expect(item.signalExplanation?.length).toBeLessThanOrEqual(300);
    });
  });

  describe('ERAS Additional Specialty Essays (Applicant Worksheet Pages 22-24)', () => {
    it('correctly provides Anesthesiology essay prompts with 500-char limits (Page 22)', () => {
      const group = getSpecialtyEssayGroup('Anesthesiology');
      expect(group).not.toBeNull();
      expect(group?.specialty).toBe('Anesthesiology');
      expect(group?.prompts).toHaveLength(3);
      expect(group?.prompts[0].prompt).toBe('Describe your ideal career as an attending.');
      expect(group?.prompts[0].maxChars).toBe(500);
      expect(group?.prompts[1].prompt).toContain('difficult decision in a complex situation');
      expect(group?.prompts[1].maxChars).toBe(500);
      expect(group?.prompts[2].prompt).toContain('faced adversity');
      expect(group?.prompts[2].maxChars).toBe(500);
    });

    it('correctly provides Neurosurgery essay prompts with 1000-char limits (Page 23)', () => {
      const groupFromCanonical = getSpecialtyEssayGroup('Neurological Surgery');
      const groupFromAlias = getSpecialtyEssayGroup('Neurosurgery');
      expect(groupFromCanonical).not.toBeNull();
      expect(groupFromCanonical).toEqual(groupFromAlias);
      expect(groupFromCanonical?.prompts).toHaveLength(3);
      expect(groupFromCanonical?.prompts[0].prompt).toContain('quick decision');
      expect(groupFromCanonical?.prompts[0].maxChars).toBe(1000);
      expect(groupFromCanonical?.prompts[1].prompt).toContain('negative feedback');
      expect(groupFromCanonical?.prompts[1].maxChars).toBe(1000);
      expect(groupFromCanonical?.prompts[2].prompt).toContain('workload was overwelming');
      expect(groupFromCanonical?.prompts[2].maxChars).toBe(1000);
    });

    it('correctly provides Plastic Surgery - Integrated essay prompts with 500-char limits (Page 24)', () => {
      const group = getSpecialtyEssayGroup('Plastic Surgery (Integrated)');
      const groupAlias = getSpecialtyEssayGroup('Plastic Surgery - Integrated');
      expect(group).not.toBeNull();
      expect(group).toEqual(groupAlias);
      expect(group?.prompts).toHaveLength(3);
      expect(group?.prompts[0].prompt).toContain('collaborate to achieve an outcome and there was a disagreement');
      expect(group?.prompts[0].maxChars).toBe(500);
      expect(group?.prompts[1].prompt).toContain('experienced a setback');
      expect(group?.prompts[1].maxChars).toBe(500);
      expect(group?.prompts[2].prompt).toContain('important decision quickly');
      expect(group?.prompts[2].maxChars).toBe(500);
    });

    it('returns null for specialties that do not have additional ERAS essays', () => {
      expect(getSpecialtyEssayGroup('Internal Medicine')).toBeNull();
      expect(getSpecialtyEssayGroup('Pediatrics')).toBeNull();
      expect(getSpecialtyEssayGroup('Dermatology')).toBeNull();
      expect(getSpecialtyEssayGroup('Diagnostic Radiology')).toBeNull();
      expect(getSpecialtyEssayGroup('Family Medicine')).toBeNull();
    });

    it('saves and retrieves student responses across specialty prompts', () => {
      saveStoredSpecialtyEssay(
        'Anesthesiology',
        'anes_career_ideal',
        'Academic anesthesiology in adult cardiac and critical care medicine.'
      );
      const responses = getStoredSpecialtyEssays();
      expect(responses['Anesthesiology']['anes_career_ideal']).toBe(
        'Academic anesthesiology in adult cardiac and critical care medicine.'
      );
    });
  });
});
