import { describe, it, expect } from 'vitest';
import {
  getSpecialtyBenchmark,
  getAllBenchmarkSpecialties,
  assessCompetitiveness,
  generateResidencyExplorerLink,
  StudentMetricProfile
} from '@/domain/competitiveness-engine';

describe('Multimodal Competitiveness Engine', () => {
  it('loads all 23 official specialty benchmarks from Summary Statistics', () => {
    const specialties = getAllBenchmarkSpecialties();
    expect(specialties.length).toBe(23);
    expect(specialties).toContain('INTERNAL MEDICINE');
    expect(specialties).toContain('ORTHOPAEDIC SURGERY');
    expect(specialties).toContain('DERMATOLOGY');
    expect(specialties).toContain('SURGERY-GENERAL');
    expect(specialties).toContain('ANESTHESIOLOGY');
  });

  it('normalizes specialty aliases accurately', () => {
    const im1 = getSpecialtyBenchmark('Internal Medicine');
    const im2 = getSpecialtyBenchmark('IM');
    const im3 = getSpecialtyBenchmark('INTERNAL MEDICINE');
    expect(im1).not.toBeNull();
    expect(im1?.specialty).toBe('INTERNAL MEDICINE');
    expect(im2?.specialty).toBe('INTERNAL MEDICINE');
    expect(im3?.specialty).toBe('INTERNAL MEDICINE');
    expect(im1?.step2Ck.matched).toBe(254);
    expect(im1?.step2Ck.notMatched).toBe(233);

    const ortho = getSpecialtyBenchmark('Ortho');
    expect(ortho?.specialty).toBe('ORTHOPAEDIC SURGERY');
    expect(ortho?.step2Ck.matched).toBe(259);

    const derm = getSpecialtyBenchmark('Derm');
    expect(derm?.specialty).toBe('DERMATOLOGY');
    expect(derm?.step2Ck.matched).toBe(258);
  });

  it('evaluates an above average candidate profile with high metrics', () => {
    const highProfile: StudentMetricProfile = {
      step2Ck: 262,
      researchExperiences: 6,
      abstracts: 4,
      presentations: 8,
      publications: 5,
      volunteerExperiences: 6,
      isAoaMember: true,
    };

    const assessment = assessCompetitiveness(highProfile, 'Internal Medicine');
    expect(assessment.overallTier).toBe('above_average');
    expect(assessment.step2Delta).toBe(8); // 262 - 254
    expect(assessment.totalScholarlyStudent).toBe(17);
    expect(assessment.dimensionBreakdowns.length).toBe(6);

    const step2Breakdown = assessment.dimensionBreakdowns.find(d => d.dimension === 'USMLE Step 2 CK');
    expect(step2Breakdown?.status).toBe('above');
    expect(step2Breakdown?.matchedMedian).toBe(254);
    expect(step2Breakdown?.notMatchedMedian).toBe(233);

    const aoaBreakdown = assessment.dimensionBreakdowns.find(d => d.dimension === 'Alpha Omega Alpha (AOA)');
    expect(aoaBreakdown?.status).toBe('above');
    expect(aoaBreakdown?.studentValue).toBe('Member (Inducted)');
  });

  it('evaluates an average candidate aligned with national medians', () => {
    const medianProfile: StudentMetricProfile = {
      step2Ck: 254,
      researchExperiences: 4,
      abstracts: 2,
      presentations: 4,
      publications: 2,
      volunteerExperiences: 5,
      isAoaMember: false,
    };

    const assessment = assessCompetitiveness(medianProfile, 'Internal Medicine');
    expect(assessment.overallTier).toBe('average');
    expect(assessment.step2Delta).toBe(0); // 254 - 254
    expect(assessment.totalScholarlyStudent).toBe(8);

    const step2Breakdown = assessment.dimensionBreakdowns.find(d => d.dimension === 'USMLE Step 2 CK');
    expect(step2Breakdown?.status).toBe('at_median');
  });

  it('evaluates a below average candidate with score deficits in a competitive surgical field', () => {
    const stretchProfile: StudentMetricProfile = {
      step2Ck: 242,
      researchExperiences: 3,
      abstracts: 1,
      presentations: 2,
      publications: 0,
      volunteerExperiences: 3,
      isAoaMember: false,
    };

    const assessment = assessCompetitiveness(stretchProfile, 'Orthopaedic Surgery');
    expect(assessment.overallTier).toBe('below_average');
    expect(assessment.step2Delta).toBe(242 - 259); // -17
    expect(assessment.advisorySummary).toContain('sits below the matched median');

    const step2Breakdown = assessment.dimensionBreakdowns.find(d => d.dimension === 'USMLE Step 2 CK');
    expect(step2Breakdown?.status).toBe('below');
  });

  it('generates valid deep links to Residency Explorer', () => {
    const link1 = generateResidencyExplorerLink('Internal Medicine');
    expect(link1).toContain('residencyexplorer.org/explore?specialty=Internal%20Medicine');

    const link2 = generateResidencyExplorerLink('Internal Medicine', 'Massachusetts General Hospital');
    expect(link2).toContain('query=Massachusetts%20General%20Hospital');
  });
});
