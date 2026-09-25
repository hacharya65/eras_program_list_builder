import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeErasText, validateExperienceDraft, validatePersonalStatementDraft } from '@/domain/sanitizer';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { AAMC_TAXONOMY } from '@/domain/aamc-taxonomy';

describe('Ticket 02: Strict ERAS Plain-Text Drafting Sandbox & Sanitizer', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  describe('Paste & Character Sanitizer', () => {
    it('sanitizes curly quotes, em-dashes, and rich bullets into clean ERAS plain text', () => {
      const dirtyText = `“Medicine is an art,” said Dr. Osler—a true pioneer.
• First point
• Second point
’Single quotes’ and “double quotes”`;

      const cleaned = sanitizeErasText(dirtyText);
      expect(cleaned).not.toContain('“');
      expect(cleaned).not.toContain('”');
      expect(cleaned).not.toContain('’');
      expect(cleaned).not.toContain('—');
      expect(cleaned).not.toContain('•');

      expect(cleaned).toContain('"Medicine is an art," said Dr. Osler--a true pioneer.');
      expect(cleaned).toContain('- First point');
      expect(cleaned).toContain('- Second point');
      expect(cleaned).toContain("'Single quotes' and \"double quotes\"");
    });
  });

  describe('Experience Validation Invariants', () => {
    it('accepts valid experience description within 750 characters', () => {
      const validDesc = 'A'.repeat(750);
      const result = validateExperienceDraft({
        descriptionText: validDesc,
        isMostMeaningful: false,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects experience description exceeding official 750 characters', () => {
      const overlimitDesc = 'A'.repeat(751);
      const result = validateExperienceDraft({
        descriptionText: overlimitDesc,
        isMostMeaningful: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Experience description exceeds the 750-character limit (currently 751 characters)');
    });

    it('validates Most Meaningful reflection within 300 characters', () => {
      const validReflection = 'A'.repeat(300);
      const result = validateExperienceDraft({
        descriptionText: 'Normal description',
        isMostMeaningful: true,
        reflectionText: validReflection,
      });
      expect(result.valid).toBe(true);
    });

    it('rejects Most Meaningful reflection exceeding 300 characters', () => {
      const overlimitReflection = 'A'.repeat(301);
      const result = validateExperienceDraft({
        descriptionText: 'Normal description',
        isMostMeaningful: true,
        reflectionText: overlimitReflection,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Meaningful reflection exceeds the 300-character limit (currently 301 characters)');
    });

    it('enforces maximum 3 most meaningful designations across experiences', () => {
      const result = service.canDesignateMeaningfulExperience('exp-new');
      expect(result).toBe(true);

      // Add 3 meaningful experiences
      service.setExperienceMeaningful('exp-1', true);
      service.setExperienceMeaningful('exp-2', true);
      service.setExperienceMeaningful('exp-3', true);

      // 4th should be rejected
      const canAddFourth = service.canDesignateMeaningfulExperience('exp-4');
      expect(canAddFourth).toBe(false);
    });
  });

  describe('Official AAMC Taxonomy Ingestion', () => {
    it('provides all 8 official AAMC Experience Types', () => {
      expect(AAMC_TAXONOMY.experienceTypes).toHaveLength(8);
      expect(AAMC_TAXONOMY.experienceTypes).toContain('Education/training');
      expect(AAMC_TAXONOMY.experienceTypes).toContain('Military service');
      expect(AAMC_TAXONOMY.experienceTypes).toContain('Research');
      expect(AAMC_TAXONOMY.experienceTypes).toContain('Volunteer/service/advocacy');
    });

    it('provides all 6 official AAMC Frequency Types', () => {
      expect(AAMC_TAXONOMY.frequencyTypes).toHaveLength(6);
      expect(AAMC_TAXONOMY.frequencyTypes).toContain('Daily (recurring)');
      expect(AAMC_TAXONOMY.frequencyTypes).toContain('Weekly (recurring)');
      expect(AAMC_TAXONOMY.frequencyTypes).toContain('One time (not recurring)');
    });

    it('provides all 13 official AAMC Primary Focus Areas', () => {
      expect(AAMC_TAXONOMY.primaryFocusAreas).toHaveLength(13);
      expect(AAMC_TAXONOMY.primaryFocusAreas).toContain('Basic science');
      expect(AAMC_TAXONOMY.primaryFocusAreas).toContain('Clinical/translational science');
      expect(AAMC_TAXONOMY.primaryFocusAreas).toContain('Improving access to health care');
      expect(AAMC_TAXONOMY.primaryFocusAreas).toContain('Social Justice/advocacy');
    });

    it('provides all 10 official AAMC Key Characteristics', () => {
      expect(AAMC_TAXONOMY.keyCharacteristics).toHaveLength(10);
      expect(AAMC_TAXONOMY.keyCharacteristics).toContain('Cultural humility and awareness');
      expect(AAMC_TAXONOMY.keyCharacteristics).toContain('Empathy and compassion');
      expect(AAMC_TAXONOMY.keyCharacteristics).toContain('Resilience and adaptability');
      expect(AAMC_TAXONOMY.keyCharacteristics).toContain('Teamwork and leadership');
    });
  });

  describe('Personal Statement Plain-Text Invariants', () => {
    it('calculates character count and estimated ERAS page count accurately', () => {
      const text = 'A'.repeat(5300);
      const metrics = validatePersonalStatementDraft(text);
      expect(metrics.characterCount).toBe(5300);
      expect(metrics.estimatedPages).toBeCloseTo(1.0, 1);
      expect(metrics.isWithinRecommendedRange).toBe(true);
    });

    it('warns when Personal Statement exceeds standard 1-page AAMC recommendation (>5,800 characters)', () => {
      const longText = 'A'.repeat(6000);
      const metrics = validatePersonalStatementDraft(longText);
      expect(metrics.isWithinRecommendedRange).toBe(false);
      expect(metrics.warning).toContain('exceeds standard 1-page length in ERAS');
    });
  });
});
