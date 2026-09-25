import { describe, it, expect, beforeEach } from 'vitest';
import {
  SPECIALTY_SIGNALING_RULES,
  validateSignalAllocation,
  SchoolListItem,
} from '@/domain/school-list-models';

describe('Ticket 07: Strategic School List Matrix & Dynamic Specialty Signaling', () => {
  describe('Specialty Signaling Rules Directory', () => {
    it('defines official ERAS Gold and Silver signal caps for key specialties', () => {
      const im = SPECIALTY_SIGNALING_RULES['Internal Medicine'];
      expect(im).toBeDefined();
      expect(im.goldSignals).toBe(3);
      expect(im.silverSignals).toBe(12);
      expect(im.totalSignals).toBe(15);

      const obgyn = SPECIALTY_SIGNALING_RULES['Obstetrics and Gynecology'];
      expect(obgyn.goldSignals).toBe(3);
      expect(obgyn.silverSignals).toBe(15);

      const ortho = SPECIALTY_SIGNALING_RULES['Orthopaedic Surgery'];
      expect(ortho.totalSignals).toBe(30);

      const derm = SPECIALTY_SIGNALING_RULES['Dermatology'];
      expect(derm.goldSignals).toBe(3);
      expect(derm.silverSignals).toBe(25);
    });
  });

  describe('Signal Budget Validation', () => {
    it('validates signal allocations within specialty limits', () => {
      const items: SchoolListItem[] = [
        {
          id: 'item-1',
          programId: 'prog-1',
          programName: 'Massachusetts General Hospital',
          specialty: 'Internal Medicine',
          tier: 'reach',
          signal: 'gold',
          track: 'categorical',
        },
        {
          id: 'item-2',
          programId: 'prog-2',
          programName: 'Brigham and Women’s Hospital',
          specialty: 'Internal Medicine',
          tier: 'reach',
          signal: 'gold',
          track: 'categorical',
        },
        {
          id: 'item-3',
          programId: 'prog-3',
          programName: 'Beth Israel Deaconess Medical Center',
          specialty: 'Internal Medicine',
          tier: 'target',
          signal: 'silver',
          track: 'categorical',
        },
      ];

      const validation = validateSignalAllocation('Internal Medicine', items);
      expect(validation.valid).toBe(true);
      expect(validation.goldUsed).toBe(2);
      expect(validation.silverUsed).toBe(1);
      expect(validation.goldRemaining).toBe(1); // 3 - 2 = 1
      expect(validation.silverRemaining).toBe(11); // 12 - 1 = 11
    });

    it('rejects assigning more Gold signals than the specialty quota allows', () => {
      const items: SchoolListItem[] = [
        { id: '1', programId: 'p1', programName: 'H1', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' },
        { id: '2', programId: 'p2', programName: 'H2', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' },
        { id: '3', programId: 'p3', programName: 'H3', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' },
        { id: '4', programId: 'p4', programName: 'H4', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' }, // 4th gold!
      ];

      const validation = validateSignalAllocation('Internal Medicine', items);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Assigned Gold signals (4) exceeds specialty quota (3)');
    });

    it('rejects assigning more Silver signals than the specialty quota allows', () => {
      const items: SchoolListItem[] = Array.from({ length: 13 }, (_, i) => ({
        id: `id-${i}`,
        programId: `p-${i}`,
        programName: `Hospital ${i}`,
        specialty: 'Internal Medicine',
        tier: 'target',
        signal: 'silver',
        track: 'categorical',
      }));

      const validation = validateSignalAllocation('Internal Medicine', items);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Assigned Silver signals (13) exceeds specialty quota (12)');
    });
  });

  describe('Ticket 14: Universal Residency Program Database Integration', () => {
    it('searches and filters programs from the ingested residency database', async () => {
      const { searchResidencyPrograms, getAllResidencyPrograms } = await import('@/domain/residency-database');
      const all = getAllResidencyPrograms();
      expect(all.length).toBeGreaterThan(100);

      // Search by specialty
      const imPrograms = searchResidencyPrograms({ specialty: 'Internal Medicine' });
      expect(imPrograms.length).toBeGreaterThan(0);
      expect(imPrograms.every(p => p.specialty === 'Internal Medicine')).toBe(true);

      // Search by region
      const northeast = searchResidencyPrograms({ specialty: 'Internal Medicine', region: 'Northeast' });
      expect(northeast.length).toBeGreaterThan(0);
      expect(northeast.every(p => p.region === 'Northeast')).toBe(true);

      // Search by text query
      const boston = searchResidencyPrograms({ search: 'Boston' });
      expect(boston.length).toBeGreaterThan(0);
      expect(boston.some(p => p.city.toLowerCase().includes('boston') || p.name.toLowerCase().includes('boston'))).toBe(true);
    });
  });

  describe('Ticket 15: Program Signaling Strategy Recommendation Engine', () => {
    it('recommends GOLD_HIGH_YIELD when Gold yields a dramatic jump over Silver', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 5%, Silver: 20%, Gold: 50% (delta Gold-Silver is 30% >= 15%)
      const result = computeSignalingRecommendation(5, 20, 50);
      expect(result.recommendation).toBe('GOLD_HIGH_YIELD');
      expect(result.recommendedSignal).toBe('gold');
      expect(result.deltaGoldSilver).toBe(30);
      expect(result.label).toContain('Gold High Yield');
    });

    it('recommends SILVER_OPTIMAL when Silver captures the bulk of the signal gain and Gold is marginal', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 6%, Silver: 32%, Gold: 36% (delta Silver-None = 26%, delta Gold-Silver = 4% < 10%)
      const result = computeSignalingRecommendation(6, 32, 36);
      expect(result.recommendation).toBe('SILVER_OPTIMAL');
      expect(result.recommendedSignal).toBe('silver');
      expect(result.deltaGoldSilver).toBe(4);
      expect(result.deltaSilverNone).toBe(26);
    });

    it('recommends NO_SIGNAL_SUFFICIENT when baseline yield without signal is high (home/pipeline program)', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 45%, Silver: 55%, Gold: 60%
      const result = computeSignalingRecommendation(45, 55, 60);
      expect(result.recommendation).toBe('NO_SIGNAL_SUFFICIENT');
      expect(result.recommendedSignal).toBe('none');
      expect(result.explanation).toContain('High baseline yield');
    });

    it('recommends SIGNAL_INEFFICIENT when tokens produce negligible yield difference', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 2%, Silver: 3%, Gold: 4%
      const result = computeSignalingRecommendation(2, 3, 4);
      expect(result.recommendation).toBe('SIGNAL_INEFFICIENT');
      expect(result.recommendedSignal).toBe('none');
    });
  });
});

