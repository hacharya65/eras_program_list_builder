/**
 * Official 2026/2027 AAMC ERAS Taxonomy
 * Ingested directly from official AAMC Applicant Worksheet & Experience guidelines.
 */
export const AAMC_TAXONOMY = {
  experienceTypes: [
    'Education/training',
    'Military service',
    'Professional organization',
    'Other extracurricular activity, club, hobby',
    'Research',
    'Teaching/mentoring',
    'Volunteer/service/advocacy',
    'Work',
  ] as const,

  frequencyTypes: [
    'One time (not recurring)',
    'Daily (recurring)',
    'Weekly (recurring)',
    'Monthly (recurring)',
    'Quarterly (recurring)',
    'Annually (recurring)',
  ] as const,

  primaryFocusAreas: [
    'Basic science',
    'Clinical/translational science',
    'Community involvement/outreach',
    'Customer service',
    'Health care administration',
    'Improving access to health care',
    'Medical education',
    'Music/athletics/art',
    'Promoting wellness',
    'Public health',
    'Quality improvement',
    'Social Justice/advocacy',
    'Technology',
  ] as const,

  keyCharacteristics: [
    'Communication',
    'Critical thinking and problem solving',
    'Cultural humility and awareness',
    'Empathy and compassion',
    'Ethical responsibility',
    'Ingenuity and innovation',
    'Reliability and dependability',
    'Resilience and adaptability',
    'Self-Reflection and improvement',
    'Teamwork and leadership',
  ] as const,
};

export type ExperienceType = typeof AAMC_TAXONOMY.experienceTypes[number];
export type FrequencyType = typeof AAMC_TAXONOMY.frequencyTypes[number];
export type PrimaryFocusArea = typeof AAMC_TAXONOMY.primaryFocusAreas[number];
export type KeyCharacteristic = typeof AAMC_TAXONOMY.keyCharacteristics[number];
