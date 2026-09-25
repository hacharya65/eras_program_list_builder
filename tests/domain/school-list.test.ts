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
});
