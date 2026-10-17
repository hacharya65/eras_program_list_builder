import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { isDemoStudentId } from '@/domain/student-registry';
import { loadLetterWriterRequests } from '@/domain/lor-models';
import { loadItemsForSpecialty } from '@/domain/school-list-models';
import { loadExperienceJournalEntries } from '@/domain/experience-journal-models';
import { PlatformWalkthroughModal } from '@/components/PlatformWalkthroughModal';
import { FaqAndGuideView } from '@/components/FaqAndGuideView';
import { DevPersonaSwitcher } from '@/components/DevPersonaSwitcher';
import { StudentDashboardHome } from '@/components/StudentDashboardHome';
import { INITIAL_MOCK_INTAKE } from '@/domain/advising-intake-models';
import { StudentDashboardContext } from '@/domain/types';

describe('Fresh Account Isolation, Walkthrough Modal & FAQ Tab', () => {
  const newStudentId = 'stu-new-applicant-987';
  const demoStudentId = 'stu-alex-rivera';

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

  describe('New User Clean Slate Isolation', () => {
    it('correctly identifies demo vs non-demo student IDs', () => {
      expect(isDemoStudentId('stu-alex-rivera')).toBe(true);
      expect(isDemoStudentId('usr-student-1')).toBe(true);
      expect(isDemoStudentId('demo-user-123')).toBe(true);
      expect(isDemoStudentId(newStudentId)).toBe(false);
      expect(isDemoStudentId('student-456')).toBe(false);
      expect(isDemoStudentId(null)).toBe(false);
    });

    it('initializes non-demo student accounts with 0 letter writers, 0 schools, and 0 journal entries', () => {
      // 1. Letters of Recommendation
      const newLors = loadLetterWriterRequests(newStudentId);
      expect(newLors).toEqual([]);
      expect(newLors.length).toBe(0);

      // 2. School List Matrix
      const newSchools = loadItemsForSpecialty('Internal Medicine', undefined, newStudentId);
      expect(newSchools).toEqual([]);
      expect(newSchools.length).toBe(0);

      // 3. Reflective Journal Entries
      const newJournals = loadExperienceJournalEntries(newStudentId);
      expect(newJournals).toEqual([]);
      expect(newJournals.length).toBe(0);
    });

    it('preserves rich pre-populated mock dataset for the Alex Rivera demo account', () => {
      // 1. Letters of Recommendation for demo user
      const demoLors = loadLetterWriterRequests(demoStudentId);
      expect(demoLors.length).toBeGreaterThanOrEqual(2);

      // 2. School List Matrix for demo user
      const demoSchools = loadItemsForSpecialty('Internal Medicine', undefined, demoStudentId);
      expect(demoSchools.length).toBeGreaterThanOrEqual(3);

      // 3. Reflective Journal for demo user
      const demoJournals = loadExperienceJournalEntries(demoStudentId);
      expect(demoJournals.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Platform Walkthrough Modal Rendering', () => {
    it('renders the interactive walkthrough modal with all tour steps and navigation controls', () => {
      const markup = renderToStaticMarkup(
        <PlatformWalkthroughModal
          isOpen={true}
          onClose={() => {}}
          studentName="Jordan Smith"
        />
      );

      // Header & personalization
      expect(markup).toContain('Welcome to Ethmoid, Jordan Smith');
      expect(markup).toContain('Platform Tour');

      // First step contents
      expect(markup).toContain('Your Personalized Residency Match &amp; Signaling Workspace');
      expect(markup).not.toContain('Clean Slate Account');
      expect(markup).not.toContain('No pre-filled school lists or mock recommendations');
      expect(markup).toContain('Evidence-Based Strategy');
      expect(markup).toContain('Continuous Faculty Alignment');

      // Step progress counter
      expect(markup).toContain('Step 1 of 6');
      expect(markup).toContain('Skip Walkthrough');
      expect(markup).toContain('Next');
    });

    it('does not render markup when isOpen is false', () => {
      const markup = renderToStaticMarkup(
        <PlatformWalkthroughModal
          isOpen={false}
          onClose={() => {}}
          studentName="Jordan Smith"
        />
      );

      expect(markup).toBe('');
    });
  });

  describe('FAQ and Platform Guide View', () => {
    it('renders the FAQ knowledgebase, replay walkthrough banner, and category filters', () => {
      const markup = renderToStaticMarkup(
        <FaqAndGuideView
          onBack={() => {}}
          onStartWalkthrough={() => {}}
          targetSpecialty="Internal Medicine"
        />
      );

      // Hero Title & Replay Walkthrough Banner
      expect(markup).toContain('Frequently Asked Questions &amp; Guide');
      expect(markup).toContain('Replay Platform Walkthrough');
      expect(markup).toContain('Need a guided refresher of the platform?');

      // Category filters
      expect(markup).toContain('All Questions');
      expect(markup).toContain('Programs &amp; Strategy');
      expect(markup).toContain('Gold &amp; Silver Signals');
      expect(markup).toContain('Advising Intake');
      expect(markup).toContain('Letters of Rec');
      expect(markup).toContain('Reflective Journal');
      expect(markup).toContain('Advising &amp; Leadership');

      // Key sample questions rendered
      expect(markup).toContain('How does Ethmoid personalize my residency strategy?');
      expect(markup).toContain('What do the Reach, Target, and Safety program tiers mean?');
      expect(markup).toContain('What is the difference between Gold and Silver preference signals?');
      expect(markup).toContain('How do I record and modify my Core Clinical Clerkships?');
      expect(markup).toContain('Why does Ethmoid ask about Work Experiences count?');
      expect(markup).toContain('Who are the official Specialty Advising Champions?');
    });
  });

  describe('DevPersonaSwitcher Header Icons & Dropdown', () => {
    it('renders the Advising and Leadership icon and FAQ icon side by side on the top bar', () => {
      const markup = renderToStaticMarkup(
        <DevPersonaSwitcher
          currentRole="student"
          userName="Jordan Smith"
          userRoleTitle="MS4 Applicant"
          defaultMenuOpen={true}
        />
      );

      // Top bar button titles
      expect(markup).toContain('title="Advising and Leadership"');
      expect(markup).toContain('aria-label="Advising and Leadership"');
      expect(markup).toContain('title="Frequently Asked Questions &amp; Guide"');
      expect(markup).toContain('aria-label="Frequently Asked Questions &amp; Guide"');

      // Ethmoid Logo and brand name button to return to dashboard
      expect(markup).toContain('title="Return to Dashboard"');
      expect(markup).toContain('aria-label="Return to Dashboard"');
      expect(markup).toContain('alt="Ethmoid logo"');
      expect(markup).toContain('Ethmoid');

      // Profile menu dropdown items
      expect(markup).toContain('Advising and Leadership');
      expect(markup).toContain('FAQ &amp; Platform Walkthrough');
      expect(markup).toContain('Profile Management &amp; Scores');

      // Verify top dark green demonstration strip is removed
      expect(markup).not.toContain('Demonstration — fictional applicant records');
      expect(markup).not.toContain('Student Match Strategy &amp; Signaling Workspace');
    });
  });

  describe('StudentDashboardHome 3-Column Layout Visibility', () => {
    it('renders School List Strategy, Letters of Rec, and compact Journal concurrently in 3 columns without burying School List', () => {
      const mockContext: StudentDashboardContext = {
        institution: {
          id: 'geisinger',
          name: 'Geisinger Commonwealth School of Medicine',
          domain: 'som.geisinger.edu',
          defaultSlaDays: 14,
        },
        student: {
          id: 'stu-alex-rivera',
          name: 'Alex Rivera',
          email: 'alex.rivera@geisinger.edu',
          role: 'student',
          institutionId: 'geisinger',
          specialty: 'Internal Medicine',
        },
        assignedAdvisors: [],
        personalStatement: {
          id: 'ps-1',
          studentId: 'stu-alex-rivera',
          specialty: 'Internal Medicine',
          currentVersionNumber: 1,
          content: 'Draft content',
          updatedAt: '2026-09-01T12:00:00Z',
          stage: 'drafting',
        },
        experiences: [],
        activeReviewRequests: [],
      };

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

      // Verify Column 1: School List Building & Signaling Strategy is present and unburied
      expect(markup).toContain('School List Building &amp; Signaling Strategy');
      expect(markup).not.toContain('Added');
      expect(markup).toContain('Tier Balance Distribution');
      expect(markup).toContain('Preference Signals Allocation');

      // Verify Column 2: Letters of Recommendation
      expect(markup).toContain('Letters of Recommendation');
      expect(markup).toContain('Add Writer');

      // Verify Column 3: Compact Reflective Journal
      expect(markup).toContain('Journal');
      expect(markup).toContain('Encounter &amp; takeaway scratchpad');
      expect(markup).toContain('Private scratchpad');
      expect(markup).toContain('3 saved');
    });

    it('renders a fresh non-demo student account with 0 saved journal entries and empty letter writers on dashboard home', () => {
      const freshContext: StudentDashboardContext = {
        institution: {
          id: 'geisinger',
          name: 'Geisinger Commonwealth School of Medicine',
          domain: 'som.geisinger.edu',
          defaultSlaDays: 14,
        },
        student: {
          id: newStudentId,
          name: 'Jordan Smith',
          email: 'jordan.smith@medschool.edu',
          role: 'student',
          institutionId: 'geisinger',
          specialty: 'Internal Medicine',
        },
        assignedAdvisors: [],
        personalStatement: {
          id: 'ps-2',
          studentId: newStudentId,
          specialty: 'Internal Medicine',
          currentVersionNumber: 1,
          content: '',
          updatedAt: new Date().toISOString(),
          stage: 'drafting',
        },
        experiences: [],
        activeReviewRequests: [],
      };

      const markup = renderToStaticMarkup(
        <StudentDashboardHome
          context={freshContext}
          student={freshContext.student}
          targetSpecialty="Internal Medicine"
          onSpecialtyChange={() => {}}
          advisingIntake={{
            ...INITIAL_MOCK_INTAKE,
            studentId: newStudentId,
            applyingSpecialty: 'Internal Medicine',
          }}
          onOpenIntake={() => {}}
          onOpenProfile={() => {}}
          assignedAdvisors={[]}
          schoolListStats={{ count: 0, signalsAssigned: 0 }}
          onNavigate={() => {}}
        />
      );

      // Verify fresh slate: 0 saved journal entries, NOT 3 saved
      expect(markup).toContain('0 saved');
      expect(markup).not.toContain('3 saved');

      // Verify letters of rec: 0 of 0 submitted and empty state prompt
      expect(markup).toContain('0 of 0 submitted');
      expect(markup).toContain('No letter writers added yet');
    });
  });
});
