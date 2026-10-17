import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThalamusAuthExperience } from '@/components/ThalamusAuthExperience';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import {
  DEMO_STUDENT_ACCOUNT,
  isUserAuthenticated,
  logoutSession,
  setAuthenticatedSession,
  createStudentAccount,
  getStudentAccountByEmail,
} from '@/domain/student-registry';

describe('ThalamusAuthExperience & Student Portal Auth Flow', () => {
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

  it('renders Thalamus-style sign-in screen with clean aesthetics and demo account button', () => {
    const markup = renderToStaticMarkup(
      <ThalamusAuthExperience onAuthenticated={() => {}} />
    );

    // Thalamus branding & design cues
    expect(markup).toContain('Ethmoid');
    expect(markup).not.toContain('Connecting the Match');
    expect(markup).not.toContain('Sign In');
    expect(markup).toContain('Email');
    expect(markup).toContain('Password');
    expect(markup).toContain('Log In');
    expect(markup).toContain('Quick Demo: Log In as Alex Rivera (MS4)');
    expect(markup).not.toContain('Sign In with AAMC Account');
    expect(markup).toContain('Complete 1-Question Intake Form');
  });

  it('provides a floating circular help button in bottom right', () => {
    const markup = renderToStaticMarkup(
      <ThalamusAuthExperience onAuthenticated={() => {}} />
    );

    // Floating help button
    expect(markup).toContain('Help &amp; Strategy Guidance');
    expect(markup).toContain('?');
  });

  it('renders guided intake mode with 1-question step structure', () => {
    const markup = renderToStaticMarkup(
      <ThalamusAuthExperience onAuthenticated={() => {}} initialMode="guided_intake" />
    );

    // Step 1: Medical School
    expect(markup).toContain('Question 1 of 12');
    expect(markup).toContain('What medical school do you currently attend?');
    expect(markup).toContain('Geisinger Commonwealth School of Medicine');
  });

  it('initializes guided intake questionnaire completely blank with no pre-filled answers', () => {
    const markup = renderToStaticMarkup(
      <ThalamusAuthExperience onAuthenticated={() => {}} initialMode="guided_intake" />
    );

    // Starts on Question 1 of 12
    expect(markup).toContain('Question 1 of 12');
    expect(markup).toContain('What medical school do you currently attend?');
    // The text input value is empty (value="")
    expect(markup).toContain('value=""');
    // Popular schools are available to select but none are active
    expect(markup).toContain('Penn State College of Medicine');
  });

  it('renders Question 7 with label "What are your Core Clinical Clerkship grades?" and dynamic add/remove controls starting with 7 clerkships', () => {
    const markup = renderToStaticMarkup(
      <ThalamusAuthExperience onAuthenticated={() => {}} initialMode="guided_intake" initialStep={7} />
    );

    // Exact label requested
    expect(markup).toContain('What are your Core Clinical Clerkship grades?');
    expect(markup).not.toContain('What are your 7 Core Clinical Clerkship grades?');

    // Starts with the 7 core clerkships
    expect(markup).toContain('Internal Medicine');
    expect(markup).toContain('Surgery');
    expect(markup).toContain('Pediatrics');
    expect(markup).toContain('Obstetrics &amp; Gynecology');
    expect(markup).toContain('Family Medicine');
    expect(markup).toContain('Neurology');
    expect(markup).toContain('Psychiatry');

    // Controls to add and remove clerkships
    expect(markup).toContain('Add another clerkship');
    expect(markup).toContain('Quick add:');
    expect(markup).toContain('Emergency Medicine');
    expect(markup).toContain('Remove Internal Medicine');
  });

  it('renders Question 10 with Work Experiences Count and removes Leadership Hours and School Tier', () => {
    const markup = renderToStaticMarkup(
      <ThalamusAuthExperience onAuthenticated={() => {}} initialMode="guided_intake" initialStep={10} />
    );

    // Title and question headers
    expect(markup).toContain('Question 10 of 12');
    expect(markup).toContain('Work, Volunteer &amp; Honor Societies');

    // Has Work Experiences and Volunteer Experiences
    expect(markup).toContain('Work Experiences Count');
    expect(markup).toContain('Volunteer Experiences Count');

    // Removed fields
    expect(markup).not.toContain('Leadership / Community Hours');
    expect(markup).not.toContain('Medical School Academic Tier');

    // Has Honor Societies
    expect(markup).toContain('Alpha Omega Alpha (AOA)');
    expect(markup).toContain('Gold Humanism Honor Society (GHHS)');
  });

  it('manages student accounts with password persistence', () => {
    const newStudent = createStudentAccount({
      name: 'Jordan Smith',
      email: 'jsmith@som.edu',
      password: 'SecurePassword123!',
      medicalSchool: 'Penn State College of Medicine',
      specialty: 'Orthopaedic Surgery',
      gradYear: 2027,
    });

    expect(newStudent.id).toBeDefined();
    expect(newStudent.password).toBe('SecurePassword123!');
    const retrieved = getStudentAccountByEmail('jsmith@som.edu');
    expect(retrieved?.name).toBe('Jordan Smith');
    expect(retrieved?.password).toBe('SecurePassword123!');
  });

  it('renders DevPersonaSwitcher with Sign Out button when onLogout is provided', () => {
    const markup = renderToStaticMarkup(
      <DevPersonaSwitcher
        userName="Alex Rivera"
        userRoleTitle="MS4 Applicant"
        medicalSchool="Penn State College of Medicine"
        onLogout={() => {}}
        defaultMenuOpen={true}
      />
    );

    expect(markup).toContain('Alex Rivera');
    expect(markup).toContain('Penn State College of Medicine');
    expect(markup).toContain('Sign Out');
  });

  it('manages auth session storage correctly', () => {
    expect(isUserAuthenticated()).toBe(false);
    setAuthenticatedSession(true);
    expect(isUserAuthenticated()).toBe(true);
    logoutSession();
    expect(isUserAuthenticated()).toBe(false);
  });
});
