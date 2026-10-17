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
    expect(markup).toContain('Connecting the Match');
    expect(markup).toContain('Sign In');
    expect(markup).toContain('Email');
    expect(markup).toContain('Quick Demo: Sign In as Alex Rivera (MS4)');
    expect(markup).toContain('Sign In with AAMC Account');
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
