/**
 * Official AAMC ERAS Scholarly Work Standards
 * Extracted directly from primary source PDF: Context/Scholarly Work _ Students & Residents.pdf
 */

export const AAMC_SCHOLARLY_TYPES = [
  'Journal Articles (peer reviewed)',
  'Book Chapter (peer reviewed)',
  'Journal Abstracts (peer reviewed)',
  'Oral Presentation',
  'Poster Presentation',
] as const;

export type AamcScholarlyType = typeof AAMC_SCHOLARLY_TYPES[number];

export interface PresentationEvent {
  eventName: string;
  presentationDate: string;
  country: string;
  city: string;
  stateProvince?: string;
  eventUrl?: string;
  conferenceAbstractUrl?: string;
}

export interface ScholarlyCollection {
  id: string;
  studentId: string;
  title: string; // Max 100 chars
}

export interface ScholarlyWork {
  id: string;
  studentId: string;
  type: AamcScholarlyType;
  title: string;
  authors: string; // Format: Smith CB, Rivera A
  isFirstAuthor: boolean;
  publicationStatus?: 'Submitted' | 'Accepted/In-Press' | 'Published';
  statusDate?: string;
  journalName?: string;
  volume?: string;
  issueNumber?: string;
  pages?: string;
  pmid?: string;
  prePrintUrl?: string;
  events?: PresentationEvent[];
  collectionId?: string;
  isMeaningful: boolean; // Max 3 starred
}

export function formatAamcAuthor(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1];
  const firstAndMiddle = parts.slice(0, parts.length - 1);
  const initials = firstAndMiddle.map(p => p[0].toUpperCase()).join('');

  return `${lastName} ${initials}`;
}

export function validateScholarlyCollectionTitle(title: string): { valid: boolean; error?: string } {
  if (!title) return { valid: false, error: 'Collection title cannot be empty' };
  if (title.length > 100) {
    return { valid: false, error: `Collection title exceeds 100 characters (currently ${title.length})` };
  }
  return { valid: true };
}

export function validateScholarlyWorkDraft(work: Partial<ScholarlyWork>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!work.title?.trim()) {
    errors.push('Title is required for scholarly works');
  }
  if (!work.authors?.trim()) {
    errors.push('Author list is required');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
