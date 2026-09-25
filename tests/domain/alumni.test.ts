import { describe, it, expect } from 'vitest';
import {
  getAlumniByProgram,
  getProgramAlumniSummary,
  getMatchHistoryBySpecialty,
  getNonRoboticOutreachGuide,
  generateDoximityProgramUrl,
  SAMPLE_ALUMNI_ROSTER,
} from '@/domain/alumni-models';

describe('Alumni Resident Directory & Doximity Integration', () => {
  it('correctly retrieves alumni residents for a specific program and specialty', () => {
    const mghAlumni = getAlumniByProgram('Massachusetts General Hospital', 'Internal Medicine');
    expect(mghAlumni.length).toBeGreaterThanOrEqual(2);
    expect(mghAlumni.map((a) => a.name)).toContain('Dr. Sarah Jenkins');
    expect(mghAlumni.map((a) => a.name)).toContain('Dr. David Okafor');
  });

  it('generates program-level alumni summary with match years and verified mentor count', () => {
    const summary = getProgramAlumniSummary('Massachusetts General Hospital', 'Internal Medicine');
    expect(summary.totalAlumni).toBe(2);
    expect(summary.availableMentors).toBe(2);
    expect(summary.recentMatchYears).toEqual([2024, 2023]);
    expect(summary.doximityReviewUrl).toContain('doximity.com/residency/search');
    expect(summary.doximityReviewUrl).toContain('Massachusetts%20General%20Hospital');
  });

  it('filters match history over the past 3-5 years by specialty', () => {
    const imHistory = getMatchHistoryBySpecialty('Internal Medicine', 2022);
    expect(imHistory.length).toBeGreaterThanOrEqual(5);
    imHistory.forEach((alum) => {
      expect(alum.specialty).toBe('Internal Medicine');
      expect(alum.graduationYear).toBeGreaterThanOrEqual(2022);
    });
  });

  it('generates personalized non-robotic outreach templates with explicit do/dont guidelines', () => {
    const template = getNonRoboticOutreachGuide(
      'Alex Rivera',
      'Dr. Sarah Jenkins',
      'Massachusetts General Hospital',
      'Internal Medicine'
    );

    expect(template.subject).toContain('Apex Med MS4');
    expect(template.body).toContain('Hi Dr. Sarah');
    expect(template.body).toContain('Alex Rivera');
    expect(template.body).toContain('Massachusetts General Hospital');
    expect(template.dos.length).toBeGreaterThanOrEqual(3);
    expect(template.donts.length).toBeGreaterThanOrEqual(3);
    expect(template.donts[0]).toContain('DO NOT ask the resident to speak with the Program Director');
  });

  it('produces valid Doximity search review URLs', () => {
    const url = generateDoximityProgramUrl('Johns Hopkins Hospital', 'Internal Medicine');
    expect(url).toBe('https://www.doximity.com/residency/search?keywords=Johns%20Hopkins%20Hospital%20Internal%20Medicine%20residency%20reviews');
  });
});
