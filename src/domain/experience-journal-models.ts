/**
 * Ethmoid - Remarkable Experiences Journal & Clinical Moments Repository
 * Dedicated scratchpad/bank for capturing clinical encounters, remarkable memories,
 * and leadership reflections for future reference when drafting the official 10 MyERAS experiences.
 */

export type JournalCategory =
  | 'Clinical Encounter'
  | 'Research Breakthrough'
  | 'Teaching & Mentorship'
  | 'Patient Advocacy'
  | 'Leadership Moment'
  | 'Personal Reflection';

export const JOURNAL_CATEGORIES: JournalCategory[] = [
  'Clinical Encounter',
  'Patient Advocacy',
  'Teaching & Mentorship',
  'Research Breakthrough',
  'Leadership Moment',
  'Personal Reflection',
];

export interface ExperienceJournalEntry {
  id: string;
  studentId: string;
  title: string;
  category: JournalCategory;
  date: string; // YYYY-MM-DD
  setting: string;
  notableObservation: string; // Raw clinical narrative / patient dynamics
  keyTakeaway: string; // What was learned / specialty motivation
  isKeyMemory: boolean;
  createdAt: string;
}

export const JOURNAL_STORAGE_KEY_PREFIX = 'ethmoid_experience_journal_entries_';

export const INITIAL_MOCK_JOURNAL_ENTRIES: ExperienceJournalEntry[] = [
  {
    id: 'journal-1',
    studentId: 'usr-student-1',
    title: 'Code Sepsis Resuscitation in MICU Sub-I',
    category: 'Clinical Encounter',
    date: '2026-08-14',
    setting: 'Geisinger Medical Center (Danville) — Medical Intensive Care Unit',
    notableObservation:
      'Participated in active resuscitation of a 68yo patient presenting with severe urosepsis and hypotension. Helped calculate initial fluid bolus, tracked mean arterial pressures, and assisted fellow with ultrasound-guided arterial line placement. Spent 30 minutes debriefing with the patient\'s daughter to explain septic shock physiology in plain terms.',
    keyTakeaway:
      'Reinforced my passion for complex critical care physiology and the profound impact of empathetic bedside family communication during acute decompensation.',
    isKeyMemory: true,
    createdAt: '2026-08-14T22:30:00.000Z',
  },
  {
    id: 'journal-2',
    studentId: 'usr-student-1',
    title: 'Discharge Barrier Resolution for Unhoused Diabetic Patient',
    category: 'Patient Advocacy',
    date: '2026-07-28',
    setting: 'Geisinger Community Medical Center (Scranton) — General Medicine Service',
    notableObservation:
      'Patient had recurrent DKA admissions primarily due to inability to refrigerate basal insulin. Coordinated directly with hospital social work and regional free clinic to transition regimen to a durable room-temperature pen and secure subsidized community refrigeration locker.',
    keyTakeaway:
      'Clinical management is ineffective if social determinants of health are neglected. True inpatient care requires rigorous structural advocacy prior to discharge.',
    isKeyMemory: true,
    createdAt: '2026-07-28T19:15:00.000Z',
  },
  {
    id: 'journal-3',
    studentId: 'usr-student-1',
    title: 'MS2 Bedside Physical Exam Mentorship Session',
    category: 'Teaching & Mentorship',
    date: '2026-06-19',
    setting: 'Geisinger Commonwealth Clinical Skills Lab',
    notableObservation:
      'Led small group of 4 second-year medical students through cardiac auscultation maneuvers and JVP estimation techniques on hospitalized volunteers. Observed immediate growth in their clinical confidence.',
    keyTakeaway:
      'Solidified my intention to pursue a Clinician-Educator track residency with dedicated resident-as-teacher curricula.',
    isKeyMemory: false,
    createdAt: '2026-06-19T17:00:00.000Z',
  },
];

import { isDemoStudentId } from './student-registry';

export function loadExperienceJournalEntries(studentId: string): ExperienceJournalEntry[] {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${JOURNAL_STORAGE_KEY_PREFIX}${studentId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading experience journal entries:', e);
    }
  }
  return isDemoStudentId(studentId) ? INITIAL_MOCK_JOURNAL_ENTRIES : [];
}

export function saveExperienceJournalEntries(
  studentId: string,
  entries: ExperienceJournalEntry[]
): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${JOURNAL_STORAGE_KEY_PREFIX}${studentId}`, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving experience journal entries:', e);
    }
  }
}

export function addExperienceJournalEntry(
  studentId: string,
  entry: ExperienceJournalEntry
): ExperienceJournalEntry[] {
  const current = loadExperienceJournalEntries(studentId);
  const updated = [entry, ...current];
  saveExperienceJournalEntries(studentId, updated);
  return updated;
}

export function deleteExperienceJournalEntry(
  studentId: string,
  entryId: string
): ExperienceJournalEntry[] {
  const current = loadExperienceJournalEntries(studentId);
  const updated = current.filter((e) => e.id !== entryId);
  saveExperienceJournalEntries(studentId, updated);
  return updated;
}
