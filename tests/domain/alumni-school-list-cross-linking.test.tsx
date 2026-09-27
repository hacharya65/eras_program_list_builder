import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchoolListMatrix } from '@/components/SchoolListMatrix';
import { AlumniResidentDirectory } from '@/components/AlumniResidentDirectory';
import { SAMPLE_ALUMNI_ROSTER, getAlumniByProgram } from '@/domain/alumni-models';

describe('School List Matrix & Alumni Resident Directory Cross-Linking', () => {
  it('correctly matches alumni to programs and renders alumni link inside SchoolListMatrix', () => {
    // 1. Verify getAlumniByProgram matches MGH alumni
    const mghAlumni = getAlumniByProgram('Massachusetts General Hospital', 'Internal Medicine', SAMPLE_ALUMNI_ROSTER);
    expect(mghAlumni.length).toBeGreaterThan(0);
    expect(mghAlumni[0].name).toBe('Dr. Sarah Jenkins');

    // 2. Render SchoolListMatrix with MGH in items
    const html = renderToStaticMarkup(
      React.createElement(SchoolListMatrix, {
        onBack: () => {},
        alumniResidents: SAMPLE_ALUMNI_ROSTER,
      })
    );

    // Should indicate presence of alumni on school rows
    expect(html).toContain('Alumni');
    expect(html).toContain('Massachusetts General Hospital');
  });

  it('renders prior verified status and pending re-attestation badge in AlumniResidentDirectory', () => {
    const testRoster = [
      {
        ...SAMPLE_ALUMNI_ROSTER[2], // Dr. Emily Chen with re_attestation_pending
        verificationStatus: 're_attestation_pending' as const,
        lastVerifiedPeriod: '2024–2025 Academic Year',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(AlumniResidentDirectory, {
        studentSpecialty: 'Internal Medicine',
        studentName: 'Alex Rivera (MS4)',
        alumniResidents: testRoster,
      })
    );

    expect(html).toContain('Dr. Emily Chen');
    // Must display previous verified period
    expect(html).toContain('2024–2025 Academic Year');
    // Must display pending verification indicator
    expect(html).toContain('Annual Re-attestation Pending');
    // Must NOT contain Signal tags
    expect(html).not.toContain('Gold Signal');
    expect(html).not.toContain('Silver Signal');
  });
});
