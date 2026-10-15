import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdvisingLeadershipView } from '@/components/AdvisingLeadershipView';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import { StudentDashboardHome } from '@/components/StudentDashboardHome';
import { INITIAL_MOCK_INTAKE } from '@/domain/advising-intake-models';
import { StudentDashboardContext } from '@/domain/types';

describe('AdvisingLeadership Integration & Navigation', () => {
  const mockContext: StudentDashboardContext = {
    institution: {
      id: 'geisinger',
      name: 'Geisinger Commonwealth School of Medicine',
      domain: 'som.geisinger.edu',
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
    assignedAdvisors: [
      {
        id: 'adv-marcus-chen',
        name: 'Dr. Marcus Chen',
        email: 'mchen@som.edu',
        role: 'advisor',
        specialty: 'Internal Medicine',
        institutionId: 'geisinger',
      },
    ],
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

  it('renders AdvisingLeadershipView with full directory leadership contacts and navigation', () => {
    const markup = renderToStaticMarkup(
      <AdvisingLeadershipView
        targetSpecialty="Internal Medicine"
        onBack={() => {}}
      />
    );

    // Verify key titles and header
    expect(markup).toContain('Geisinger Advising Leadership');
    expect(markup).toContain('Official contact directory for MS4 match advising');

    // Verify leadership members are rendered
    expect(markup).toContain('Dr. Marcus Chen');
    expect(markup).toContain('Dr. Evelyn Taylor');
    expect(markup).toContain('Sarah Jenkins');
    expect(markup).toContain('David Alvarez');
    expect(markup).toContain('Specialty Faculty Advisor');
    expect(markup).toContain('Associate Dean of Student Affairs');

    // Verify search and category filter controls are present
    expect(markup).toContain('Search by name, role, specialty, campus, or focus area');
    expect(markup).toContain('Specialty Advising');
    expect(markup).toContain('Deans &amp; Student Affairs');

    // Verify Back to Applicant Dashboard button exists
    expect(markup).toContain('Back to Applicant Dashboard');
  });

  it('verifies that StudentDashboardHome does not contain the old Advising Leadership directory card', () => {
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
        personalStatement={mockContext.personalStatement}
        experiences={[]}
        assignedAdvisors={mockContext.assignedAdvisors}
        scholarlyStats={{ count: 0, meaningful: 0 }}
        schoolListStats={{ count: 0, signalsAssigned: 0 }}
        onNavigate={() => {}}
        onOpenSplitCanvas={() => {}}
      />
    );

    // Old home page card description must not be in the home page
    expect(markup).not.toContain('Official contact directory for MS4 match advising and student affairs.');

    // Letters of Recommendation Tracker should be rendered
    expect(markup).toContain('Letters of Recommendation');
  });

  it('renders the contact icon on the top bar in DevPersonaSwitcher', () => {
    const markup = renderToStaticMarkup(
      <DevPersonaSwitcher
        currentRole="student"
        onSelectRole={() => {}}
        institutionName="Geisinger Commonwealth School of Medicine"
      />
    );

    // Verify contact icon button has accessible title
    expect(markup).toContain('Geisinger Advising Leadership Directory');
    // Verify user profile tab is also present
    expect(markup).toContain('Alex Rivera');
  });
});
