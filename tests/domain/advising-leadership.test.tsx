import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import { StudentDashboardHome } from '@/components/StudentDashboardHome';
import { INITIAL_MOCK_INTAKE } from '@/domain/advising-intake-models';
import { StudentDashboardContext } from '@/domain/types';

describe('Advising Contacts Removal & Independent Student Experience', () => {
  const mockContext: StudentDashboardContext = {
    institution: {
      id: 'geisinger',
      name: 'Medical School',
      domain: 'som.edu',
      defaultSlaDays: 14,
    },
    student: {
      id: 'student-alex-rivera',
      name: 'Alex Rivera',
      email: 'arivera@som.edu',
      role: 'student',
      specialty: 'Internal Medicine',
      institutionId: 'geisinger',
    },
    assignedAdvisors: [],
    personalStatement: {
      id: 'ps-1',
      studentId: 'student-alex-rivera',
      specialty: 'Internal Medicine',
      currentVersionNumber: 1,
      content: 'Draft content',
      updatedAt: '2026-09-01T12:00:00Z',
      stage: 'drafting',
    },
    experiences: [],
    activeReviewRequests: [],
  };

  it('verifies that DevPersonaSwitcher does NOT contain the Advising and Leadership contact icon or menu link', () => {
    const markup = renderToStaticMarkup(
      <DevPersonaSwitcher
        currentRole="student"
        onSelectRole={() => {}}
        institutionName="Match Strategy & Signaling"
        defaultMenuOpen={true}
      />
    );

    // Advising and Leadership contact page must NOT be present
    expect(markup).not.toContain('title="Advising and Leadership"');
    expect(markup).not.toContain('aria-label="Advising and Leadership"');
    expect(markup).not.toContain('<span>Advising and Leadership</span>');

    // FAQ quick icon in header and Sign Out should be preserved; inner dropdown navigation links removed
    expect(markup).toContain('Frequently Asked Questions &amp; Guide');
    expect(markup).toContain('Sign Out');
    expect(markup).not.toContain('Intake Packet');
    expect(markup).not.toContain('Profile Summary');
    expect(markup).not.toContain('Profile Management &amp; Scores');
  });

  it('verifies that StudentDashboardHome does not contain an advising contacts card', () => {
    const markup = renderToStaticMarkup(
      <StudentDashboardHome
        context={mockContext}
        student={mockContext.student}
        targetSpecialty="Internal Medicine"
        onSpecialtyChange={() => {}}
        advisingIntake={{
          ...INITIAL_MOCK_INTAKE,
          studentId: mockContext.student.id,
          applyingSpecialty: 'Internal Medicine',
        }}
        onOpenIntake={() => {}}
        onOpenProfile={() => {}}
        assignedAdvisors={mockContext.assignedAdvisors}
        schoolListStats={{ count: 0, signalsAssigned: 0 }}
        onNavigate={() => {}}
      />
    );

    expect(markup).not.toContain('Official contact directory for MS4 match advising');
    expect(markup).not.toContain('Deans &amp; Student Affairs');
    expect(markup).toContain('Letters of Recommendation');
  });
});
