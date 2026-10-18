import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JournalRepositoryView } from '@/components/JournalRepositoryView';
import { JournalEntriesDrawer } from '@/components/JournalEntriesDrawer';
import { FloatingJournalWidget } from '@/components/FloatingJournalWidget';
import { UserProfile } from '@/domain/types';

describe('Journal Viewing Capabilities (Full Workspace & Slide-over Drawer)', () => {
  const mockStudent: UserProfile = {
    id: 'student-alex-rivera',
    name: 'Alex Rivera',
    email: 'arivera@som.edu',
    role: 'student',
    specialty: 'Internal Medicine',
    institutionId: 'geisinger',
  };

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

  describe('FloatingJournalWidget (App-Wide Floating Trigger & Entry Drawer)', () => {
    it('renders persistent floating action button with journal label and badge', () => {
      const markup = renderToStaticMarkup(
        <FloatingJournalWidget studentId={mockStudent.id} />
      );

      expect(markup).toContain('Journal');
      expect(markup).toContain('Open Clinical Journal');
      expect(markup).toContain('fixed bottom-6 right-6 z-40');
    });
  });

  describe('JournalRepositoryView (Full Page under Application Materials)', () => {
    it('renders the dedicated journal workspace with header and stored entries', () => {
      const markup = renderToStaticMarkup(
        <JournalRepositoryView student={mockStudent} onBack={() => {}} />
      );

      // Header and description
      expect(markup).toContain('Journal');
      expect(markup).toContain('Your private bank for capturing remarkable patient encounters');
      expect(markup).toContain('New Journal Entry');

      // Search & Categories
      expect(markup).toContain('Search entries by topic, note keywords, or category...');
      expect(markup).toContain('Clinical Encounter');
      expect(markup).toContain('Patient Advocacy');

      // Initial mock entries rendered
      expect(markup).toContain('Code Sepsis Resuscitation in MICU Sub-I');
      expect(markup).toContain('Discharge Barrier Resolution for Unhoused Diabetic Patient');
      expect(markup).toContain('Copy Notes');
    });
  });

  describe('JournalEntriesDrawer (Slide-over Modal from Dashboard)', () => {
    it('renders nothing when isOpen is false', () => {
      const markup = renderToStaticMarkup(
        <JournalEntriesDrawer
          isOpen={false}
          onClose={() => {}}
          studentId={mockStudent.id}
        />
      );

      expect(markup).toBe('');
    });

    it('renders drawer with entries and full-page navigation link when isOpen is true', () => {
      const markup = renderToStaticMarkup(
        <JournalEntriesDrawer
          isOpen={true}
          onClose={() => {}}
          studentId={mockStudent.id}
          onNavigateToFullPage={() => {}}
        />
      );

      expect(markup).toContain('Journal Entries');
      expect(markup).toContain('Browse, search, and copy your clinical reflections.');
      expect(markup).toContain('Code Sepsis Resuscitation in MICU Sub-I');
      expect(markup).toContain('Open Full Journal Page');
    });
  });
});
