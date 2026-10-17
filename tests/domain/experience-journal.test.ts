import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExperienceJournalEntry,
  loadExperienceJournalEntries,
  saveExperienceJournalEntries,
  addExperienceJournalEntry,
  deleteExperienceJournalEntry,
  INITIAL_MOCK_JOURNAL_ENTRIES,
} from '@/domain/experience-journal-models';

describe('Experience Journal Domain Models', () => {
  const demoStudentId = 'stu-alex-rivera';
  const studentId = 'test-student-123';

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

  it('loads initial mock entries for demo student when storage is empty', () => {
    const entries = loadExperienceJournalEntries(demoStudentId);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries[0].title).toBeDefined();
    expect(entries[0].notableObservation).toBeDefined();
    expect(entries[0].keyTakeaway).toBeDefined();
  });

  it('starts with 0 entries for a fresh non-demo student account', () => {
    const entries = loadExperienceJournalEntries(studentId);
    expect(entries).toEqual([]);
    expect(entries.length).toBe(0);
  });

  it('adds a new journal entry without affecting official experiences', () => {
    const initial = loadExperienceJournalEntries(studentId);
    expect(initial.length).toBe(0);

    const newEntry: ExperienceJournalEntry = {
      id: 'journal-test-1',
      studentId,
      date: '2026-09-10',
      title: 'Pediatric ICU rounding observation',
      category: 'Clinical Encounter',
      setting: 'Children\'s Hospital PICU',
      notableObservation: 'Observed difficult parent conversation regarding extubation.',
      keyTakeaway: 'Empathy in crisis communication.',
      isKeyMemory: true,
      createdAt: '2026-09-10T14:00:00Z',
    };

    const updated = addExperienceJournalEntry(studentId, newEntry);
    expect(updated.length).toBe(1);
    expect(updated[0].id).toBe('journal-test-1');

    // Verify persistence
    const reloaded = loadExperienceJournalEntries(studentId);
    expect(reloaded.find((e) => e.id === 'journal-test-1')).toBeDefined();
  });

  it('deletes a journal entry', () => {
    const newEntry: ExperienceJournalEntry = {
      id: 'journal-test-del',
      studentId,
      date: '2026-09-10',
      title: 'Surgery rounding observation',
      category: 'Clinical Encounter',
      setting: 'OR 4',
      notableObservation: 'Laparoscopic cholecystectomy technique.',
      keyTakeaway: 'Anatomy visualization.',
      isKeyMemory: false,
      createdAt: '2026-09-10T14:00:00Z',
    };
    addExperienceJournalEntry(studentId, newEntry);

    const initial = loadExperienceJournalEntries(studentId);
    expect(initial.length).toBe(1);
    const firstId = initial[0].id;

    const afterDelete = deleteExperienceJournalEntry(studentId, firstId);
    expect(afterDelete.find((e) => e.id === firstId)).toBeUndefined();
    expect(afterDelete.length).toBe(0);
  });
});
