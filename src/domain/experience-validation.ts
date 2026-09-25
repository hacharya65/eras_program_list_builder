import { ExperienceDraft } from './types';

export function validateExperiencesSubmission(experiences: ExperienceDraft[]): {
  canSubmit: boolean;
  errors: string[];
  filledCount: number;
} {
  const errors: string[] = [];

  const completedExperiences = experiences.filter(
    (e) =>
      e.title &&
      e.title.trim().length > 0 &&
      e.orgName &&
      e.orgName.trim().length > 0 &&
      e.descriptionText &&
      e.descriptionText.trim().length > 0
  );

  const filledCount = completedExperiences.length;

  if (experiences.length < 10 || filledCount < 10) {
    errors.push(
      `All 10 selected experiences must be completely filled out before submitting for faculty review (currently ${filledCount} of 10 completed).`
    );
  }

  experiences.forEach((exp, idx) => {
    const num = idx + 1;
    const title = exp.title ? `"${exp.title}"` : `Entry #${num}`;
    if (exp.descriptionText && exp.descriptionText.length > 750) {
      errors.push(
        `Experience #${num} (${title}) exceeds the 750-character limit (${exp.descriptionText.length} characters).`
      );
    }
    if (exp.isMostMeaningful && exp.reflectionText && exp.reflectionText.length > 300) {
      errors.push(
        `Most Meaningful reflection for #${num} (${title}) exceeds the 300-character limit (${exp.reflectionText.length} characters).`
      );
    }
  });

  const meaningfulCount = experiences.filter((e) => e.isMostMeaningful).length;
  if (meaningfulCount > 3) {
    errors.push(`A maximum of 3 experiences can be designated as Most Meaningful (currently ${meaningfulCount} designated).`);
  }

  return {
    canSubmit: errors.length === 0,
    errors,
    filledCount,
  };
}
