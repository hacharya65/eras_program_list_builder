import medicalSchoolsData from '@/data/medical-schools.json';

/**
 * Complete internal database of all accredited U.S. and Canadian allopathic & osteopathic medical schools.
 * Derived from canonical institutional registry.
 */
export const CANONICAL_MEDICAL_SCHOOLS: readonly string[] = Object.freeze(
  [...medicalSchoolsData].sort((a, b) => a.localeCompare(b))
);

const SCHOOL_SET_LOWER = new Map<string, string>(
  CANONICAL_MEDICAL_SCHOOLS.map((name) => [name.toLowerCase(), name])
);

/**
 * Validates whether the given string is an accredited medical school in the canonical registry.
 */
export function isValidMedicalSchool(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  return SCHOOL_SET_LOWER.has(name.trim().toLowerCase());
}

/**
 * Returns the exact canonical casing for a medical school name, or undefined if not found.
 */
export function getCanonicalMedicalSchoolName(name: string): string | undefined {
  if (!name || typeof name !== 'string') return undefined;
  return SCHOOL_SET_LOWER.get(name.trim().toLowerCase());
}

/**
 * Multi-term fuzzy / substring search across all canonical medical schools.
 */
export function searchMedicalSchools(query: string, limit = 20): string[] {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) {
    return CANONICAL_MEDICAL_SCHOOLS.slice(0, limit);
  }

  const terms = clean.split(/\s+/).filter(Boolean);

  const matched = CANONICAL_MEDICAL_SCHOOLS.filter((school) => {
    const lower = school.toLowerCase();
    // Every query term must be present
    return terms.every((term) => lower.includes(term));
  });

  return matched.slice(0, limit);
}
