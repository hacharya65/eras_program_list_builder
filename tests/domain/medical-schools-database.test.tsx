import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CANONICAL_MEDICAL_SCHOOLS,
  isValidMedicalSchool,
  getCanonicalMedicalSchoolName,
  searchMedicalSchools,
} from '@/domain/medical-schools-database';
import { MedicalSchoolCombobox } from '@/components/MedicalSchoolCombobox';

describe('Canonical Medical Schools Database & Selection Guardrails', () => {
  it('loads the full accredited database of exactly 255 unique medical schools', () => {
    expect(CANONICAL_MEDICAL_SCHOOLS).toHaveLength(255);
    const unique = new Set(CANONICAL_MEDICAL_SCHOOLS);
    expect(unique.size).toBe(255);
  });

  it('validates accredited medical schools case-insensitively and rejects arbitrary free text', () => {
    // Valid schools
    expect(isValidMedicalSchool('Geisinger Commonwealth School of Medicine')).toBe(true);
    expect(isValidMedicalSchool('geisinger commonwealth school of medicine')).toBe(true);
    expect(isValidMedicalSchool('Johns Hopkins University School of Medicine')).toBe(true);
    expect(isValidMedicalSchool('Harvard Medical School')).toBe(true);
    expect(isValidMedicalSchool('Mayo Clinic Alix School of Medicine')).toBe(true);
    expect(isValidMedicalSchool('Yale School of Medicine')).toBe(true);

    // Invalid free text
    expect(isValidMedicalSchool('Random Unaccredited University')).toBe(false);
    expect(isValidMedicalSchool('Fake Med 123')).toBe(false);
    expect(isValidMedicalSchool('')).toBe(false);
  });

  it('retrieves the exact canonical name casing for a given input', () => {
    expect(getCanonicalMedicalSchoolName('harvard medical school')).toBe('Harvard Medical School');
    expect(
      getCanonicalMedicalSchoolName('geisinger commonwealth school of medicine')
    ).toBe('Geisinger Commonwealth School of Medicine');
    expect(getCanonicalMedicalSchoolName('nonexistent')).toBeUndefined();
  });

  it('performs multi-term substring searches across all accredited schools', () => {
    const pennResults = searchMedicalSchools('penn');
    expect(pennResults.length).toBeGreaterThan(0);
    expect(pennResults).toContain('Pennsylvania State University College of Medicine');
    expect(pennResults).toContain('Perelman School of Medicine at the University of Pennsylvania');

    const hopkinsResults = searchMedicalSchools('hopkins');
    expect(hopkinsResults).toContain('Johns Hopkins University School of Medicine');

    const multiTerm = searchMedicalSchools('california los angeles');
    expect(multiTerm).toContain(
      'University of California Los Angeles David Geffen School of Medicine'
    );
  });

  it('renders MedicalSchoolCombobox with placeholder, combobox role, and accredited list count', () => {
    const markup = renderToStaticMarkup(
      <MedicalSchoolCombobox
        value=""
        onChange={() => {}}
        placeholder="Type to search all 255 accredited medical schools..."
      />
    );

    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('Type to search all 255 accredited medical schools...');
  });

  it('displays verified badge when an accredited institution is selected', () => {
    const markup = renderToStaticMarkup(
      <MedicalSchoolCombobox
        value="Geisinger Commonwealth School of Medicine"
        onChange={() => {}}
      />
    );

    expect(markup).toContain('Accredited Institution Verified');
    expect(markup).toContain('Geisinger Commonwealth School of Medicine');
  });

  it('does not display verified badge when value is empty or not in accredited database', () => {
    const markup = renderToStaticMarkup(
      <MedicalSchoolCombobox
        value="Unaccredited Free Text"
        onChange={() => {}}
      />
    );

    expect(markup).not.toContain('Accredited Institution Verified');
  });
});
