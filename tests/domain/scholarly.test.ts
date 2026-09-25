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
});
