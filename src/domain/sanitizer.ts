/**
 * ERAS Plain-Text Sanitizer & Character Limits
 * Official Limits:
 * - Experience Description: 750 characters max (including spaces)
 * - Most Meaningful Reflection: 300 characters max (including spaces)
 * - Hobbies & Interests: 300 characters max (including spaces)
 * - Personal Statement: Standard 1-page ~5,300 chars, warning >5,800 chars
 */

export function sanitizeErasText(input: string): string {
  if (!input) return '';

  let text = input;

  // Replace smart/curly quotes
  text = text.replace(/[\u201C\u201D]/g, '"'); // “ ”
  text = text.replace(/[\u2018\u2019]/g, "'"); // ‘ ’

  // Replace em-dashes and en-dashes with ASCII hyphens
  text = text.replace(/[\u2014]/g, '--'); // em-dash
  text = text.replace(/[\u2013]/g, '-'); // en-dash

  // Replace bullets
  text = text.replace(/[\u2022\u25E6\u2023\u2219]/g, '-');

  // Strip other non-printable / control ASCII except newlines and tabs
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return text;
}

export interface ExperienceValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateExperienceDraft(params: {
  descriptionText: string;
  isMostMeaningful?: boolean;
  reflectionText?: string;
}): ExperienceValidationResult {
  const errors: string[] = [];

  const descLength = params.descriptionText ? params.descriptionText.length : 0;
  if (descLength > 750) {
    errors.push(
      `Experience description exceeds the 750-character limit (currently ${descLength} characters)`
    );
  }

  if (params.isMostMeaningful && params.reflectionText) {
    const reflLength = params.reflectionText.length;
    if (reflLength > 300) {
      errors.push(
        `Meaningful reflection exceeds the 300-character limit (currently ${reflLength} characters)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface PersonalStatementMetrics {
  characterCount: number;
  wordCount: number;
  estimatedPages: number;
  isWithinRecommendedRange: boolean;
  warning?: string;
}

export function validatePersonalStatementDraft(content: string): PersonalStatementMetrics {
  const characterCount = content ? content.length : 0;
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  // AAMC ERAS standard 1 page is ~5,300 characters (~750-800 words in standard font)
  const estimatedPages = characterCount > 0 ? Number((characterCount / 5300).toFixed(1)) : 0;

  const isWithinRecommendedRange = characterCount <= 5800;
  let warning: string | undefined;

  if (characterCount > 5800) {
    warning = `Warning: Personal statement (${characterCount} characters) exceeds standard 1-page length in ERAS (~5,300 chars). Program directors frequently penalize statements that spill onto a second page.`;
  }

  return {
    characterCount,
    wordCount,
    estimatedPages,
    isWithinRecommendedRange,
    warning,
  };
}
