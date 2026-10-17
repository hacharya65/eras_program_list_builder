import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfileManagementView } from '@/components/ProfileManagementView';
import { UserProfile } from '@/domain/types';
import { INITIAL_MOCK_INTAKE } from '@/domain/advising-intake-models';

describe('ProfileManagementView', () => {
  beforeEach(() => {
    if (typeof localStorage === 'undefined' || !globalThis.localStorage) {
      const store: Record<string, string> = {};
      (globalThis as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = String(v);
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          for (const k in store) delete store[k];
        },
      };
    } else {
      localStorage.clear();
    }
  });

  const mockStudent: UserProfile = {
    id: 'student-alex-rivera',
    name: 'Alex Rivera',
    email: 'arivera@som.edu',
    role: 'student',
    specialty: 'Internal Medicine',
    institutionId: 'geisinger',
  };

  const mockAdvisor: UserProfile = {
    id: 'adv-marcus-chen',
    name: 'Dr. Marcus Chen',
    email: 'mchen@som.edu',
    role: 'advisor',
    specialty: 'Internal Medicine',
    institutionId: 'geisinger',
  };

  it('renders student profile details and academic metrics correctly', () => {
    const markup = renderToStaticMarkup(
      <ProfileManagementView
        student={mockStudent}
        targetSpecialty="Internal Medicine"
        onSpecialtyChange={() => {}}
        advisingIntake={{
          ...INITIAL_MOCK_INTAKE,
          studentId: mockStudent.id,
          applyingSpecialty: 'Internal Medicine',
          medicalSchool: 'Penn State College of Medicine',
        }}
        onOpenIntake={() => {}}
        onOpenTransferKit={() => {}}
        onBack={() => {}}
        assignedAdvisor={mockAdvisor}
      />
    );

    // Profile header
    expect(markup).toContain('Alex Rivera');
    expect(markup).toContain('Internal Medicine');
    expect(markup).toContain('Penn State College of Medicine');

    // Key sections
    expect(markup).toContain('Academic Record &amp; Competitiveness Metrics');
    expect(markup).toContain('Target Applying Specialty Strategy');
    expect(markup).toContain('1-Click ERAS Transfer Kit');
    expect(markup).toContain('Geisinger Specialty Advising Intake Form');

    // Controls and buttons
    expect(markup).toContain('Open ERAS Transfer Kit Workspace');
    expect(markup).toContain('Open &amp; Edit Full Specialty Advising Form');
    expect(markup).toContain('Dr. Marcus Chen');
  });

  it('reflects honors count accurately from clerkship performance', () => {
    const customIntake = {
      ...INITIAL_MOCK_INTAKE,
      studentId: mockStudent.id,
      applyingSpecialty: 'Internal Medicine',
      clerkshipGrades: {
        familyMedicine: 'Honors' as const,
        internalMedicine: 'Honors' as const,
        surgery: 'Honors' as const,
        pediatrics: 'Pass' as const,
        obGyn: 'Pass' as const,
        neurology: 'Pass' as const,
        psychiatry: 'Pass' as const,
      },
    };

    const markup = renderToStaticMarkup(
      <ProfileManagementView
        student={mockStudent}
        targetSpecialty="Internal Medicine"
        onSpecialtyChange={() => {}}
        advisingIntake={customIntake}
        onOpenIntake={() => {}}
        onOpenTransferKit={() => {}}
        onBack={() => {}}
      />
    );

    expect(markup).toContain('3 of 7 Honors');
  });
});
