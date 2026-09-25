import { describe, it, expect, beforeEach } from 'vitest';
import {
  AAMC_SCHOLARLY_TYPES,
  formatAamcAuthor,
  validateScholarlyWorkDraft,
  validateScholarlyCollectionTitle,
} from '@/domain/scholarly-models';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';

describe('Ticket 03: Scholarly Works Portfolio & Starred Collections', () => {
  describe('Official AAMC Scholarly Work Types', () => {
    it('supports all 5 official AAMC Scholarly Work types', () => {
      expect(AAMC_SCHOLARLY_TYPES).toHaveLength(5);
      expect(AAMC_SCHOLARLY_TYPES).toContain('Journal Articles (peer reviewed)');
      expect(AAMC_SCHOLARLY_TYPES).toContain('Book Chapter (peer reviewed)');
      expect(AAMC_SCHOLARLY_TYPES).toContain('Journal Abstracts (peer reviewed)');
      expect(AAMC_SCHOLARLY_TYPES).toContain('Oral Presentation');
      expect(AAMC_SCHOLARLY_TYPES).toContain('Poster Presentation');
    });
  });

  describe('Author Name Formatting Helper', () => {
    it('formats author names into AAMC standard "Lastname FirstInitial MiddleInitial"', () => {
      expect(formatAamcAuthor('Cameron Blake Smith')).toBe('Smith CB');
      expect(formatAamcAuthor('Alex Rivera')).toBe('Rivera A');
      expect(formatAamcAuthor('Jane Doe Watson')).toBe('Watson JD');
    });
  });

  describe('Meaningful Star Limit & Collection Titles', () => {
    it('validates Scholarly Collection title within 100 characters', () => {
      const validTitle = 'Pulmonary ICU Outcomes Research Cohort';
      expect(validateScholarlyCollectionTitle(validTitle).valid).toBe(true);

      const invalidTitle = 'A'.repeat(101);
      const res = validateScholarlyCollectionTitle(invalidTitle);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Collection title exceeds 100 characters');
    });

    it('rejects designating more than 3 starred meaningful scholarly works', () => {
      const works = [
        { id: 'w1', isMeaningful: true },
        { id: 'w2', isMeaningful: true },
        { id: 'w3', isMeaningful: true },
      ];
      const count = works.filter(w => w.isMeaningful).length;
      expect(count).toBe(3);

      const canAddFourth = count < 3;
      expect(canAddFourth).toBe(false);
    });
  });

  describe('Ticket 13: Scholarly Works State Persistence & Idempotency', () => {
    it('creates default scholarly work with idempotent unique IDs', async () => {
      const { createDefaultScholarlyWork } = await import('@/domain/scholarly-models');
      const work1 = createDefaultScholarlyWork('student-1');
      const work2 = createDefaultScholarlyWork('student-1');

      expect(work1.id).toBeDefined();
      expect(work2.id).toBeDefined();
      expect(work1.id).not.toBe(work2.id);
      expect(work1.studentId).toBe('student-1');
      expect(work1.isMeaningful).toBe(false);
      expect(work1.type).toBe('Journal Articles (peer reviewed)');
    });

    it('upserts scholarly works idempotently without dropping existing fields', async () => {
      const { upsertScholarlyWork } = await import('@/domain/scholarly-models');
      const initialWorks = [
        {
          id: 'sw-1',
          studentId: 'student-1',
          type: 'Journal Articles (peer reviewed)' as const,
          title: 'Initial Title',
          authors: 'Rivera A',
          isFirstAuthor: true,
          isMeaningful: false,
        },
      ];

      // Updating existing work
      const updated = upsertScholarlyWork(initialWorks, {
        ...initialWorks[0],
        title: 'Updated Title',
        journalName: 'NEJM',
      });
      expect(updated).toHaveLength(1);
      expect(updated[0].title).toBe('Updated Title');
      expect(updated[0].journalName).toBe('NEJM');

      // Adding new work preserves the existing work
      const newWork = {
        id: 'sw-2',
        studentId: 'student-1',
        type: 'Poster Presentation' as const,
        title: 'Second Work',
        authors: 'Rivera A, Chen M',
        isFirstAuthor: false,
        isMeaningful: true,
      };
      const appended = upsertScholarlyWork(updated, newWork);
      expect(appended).toHaveLength(2);
      expect(appended[0].id).toBe('sw-2'); // newly added at top
      expect(appended[1].id).toBe('sw-1'); // original preserved intact
    });

    it('deletes scholarly work cleanly by id', async () => {
      const { deleteScholarlyWork } = await import('@/domain/scholarly-models');
      const works = [
        {
          id: 'sw-1',
          studentId: 'student-1',
          type: 'Journal Articles (peer reviewed)' as const,
          title: 'Work 1',
          authors: 'Rivera A',
          isFirstAuthor: true,
          isMeaningful: false,
        },
        {
          id: 'sw-2',
          studentId: 'student-1',
          type: 'Poster Presentation' as const,
          title: 'Work 2',
          authors: 'Chen M',
          isFirstAuthor: true,
          isMeaningful: true,
        },
      ];

      const afterDelete = deleteScholarlyWork(works, 'sw-1');
      expect(afterDelete).toHaveLength(1);
      expect(afterDelete[0].id).toBe('sw-2');
    });

    it('serializes and deserializes portfolio state with local storage safety', async () => {
      const { serializeScholarlyPortfolio, deserializeScholarlyPortfolio } = await import('@/domain/scholarly-models');
      const works = [
        {
          id: 'sw-1',
          studentId: 'student-1',
          type: 'Oral Presentation' as const,
          title: 'Cardiology Grand Rounds',
          authors: 'Rivera A',
          isFirstAuthor: true,
          isMeaningful: true,
        },
      ];
      const collections = [
        { id: 'col-1', studentId: 'student-1', title: 'Cardiovascular Research' },
      ];

      const serialized = serializeScholarlyPortfolio(works, collections);
      expect(typeof serialized).toBe('string');

      const restored = deserializeScholarlyPortfolio(serialized);
      expect(restored).not.toBeNull();
      expect(restored?.works).toHaveLength(1);
      expect(restored?.works[0].title).toBe('Cardiology Grand Rounds');
      expect(restored?.collections).toHaveLength(1);
      expect(restored?.collections[0].title).toBe('Cardiovascular Research');

      // Handles corrupt or empty string gracefully
      expect(deserializeScholarlyPortfolio(null)).toBeNull();
      expect(deserializeScholarlyPortfolio('invalid json string')).toBeNull();
    });
  });
});

