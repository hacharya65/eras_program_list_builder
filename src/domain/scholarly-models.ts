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

export function createDefaultScholarlyWork(studentId: string): ScholarlyWork {
  const uniqueId = `sw-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  return {
    id: uniqueId,
    studentId,
    type: 'Journal Articles (peer reviewed)',
    title: 'New Scholarly Output',
    authors: 'Rivera A',
    isFirstAuthor: true,
    publicationStatus: 'Submitted',
    isMeaningful: false,
  };
}

export function upsertScholarlyWork(works: ScholarlyWork[], work: ScholarlyWork): ScholarlyWork[] {
  const idx = works.findIndex(w => w.id === work.id);
  if (idx !== -1) {
    const copy = [...works];
    copy[idx] = { ...work };
    return copy;
  }
  return [work, ...works];
}

export function deleteScholarlyWork(works: ScholarlyWork[], workId: string): ScholarlyWork[] {
  return works.filter(w => w.id !== workId);
}

export function upsertScholarlyCollection(
  collections: ScholarlyCollection[],
  collection: ScholarlyCollection
): ScholarlyCollection[] {
  const idx = collections.findIndex(c => c.id === collection.id);
  if (idx !== -1) {
    const copy = [...collections];
    copy[idx] = { ...collection };
    return copy;
  }
  return [...collections, collection];
}

export function deleteScholarlyCollection(
  collections: ScholarlyCollection[],
  collectionId: string
): ScholarlyCollection[] {
  return collections.filter(c => c.id !== collectionId);
}

export const SAMPLE_SCHOLARLY_WORKS: ScholarlyWork[] = [
  {
    id: 'sw-1',
    studentId: 'student-1',
    type: 'Journal Articles (peer reviewed)',
    title: 'Longitudinal Pulmonary Function Trends Following ARDS in ICU Survivors',
    authors: 'Rivera A, Chen M, Vance S',
    isFirstAuthor: true,
    publicationStatus: 'Published',
    statusDate: '2024-05-12',
    journalName: 'American Journal of Respiratory and Critical Care Medicine',
    volume: '198',
    pages: '412-420',
    pmid: '38721904',
    collectionId: 'col-1',
    isMeaningful: true,
  },
  {
    id: 'sw-2',
    studentId: 'student-1',
    type: 'Poster Presentation',
    title: 'Community Health Worker Intervention for Uncontrolled Type 2 Diabetes',
    authors: 'Patel P, Rivera A, Hayes R',
    isFirstAuthor: false,
    publicationStatus: 'Accepted/In-Press',
    statusDate: '2023-11-18',
    collectionId: 'col-2',
    isMeaningful: true,
    events: [
      {
        eventName: 'Society of General Internal Medicine Annual Meeting',
        presentationDate: '2024-04-15',
        city: 'Boston',
        country: 'United States',
        stateProvince: 'MA',
      },
    ],
  },
];

export const SAMPLE_SCHOLARLY_COLLECTIONS: ScholarlyCollection[] = [
  { id: 'col-1', studentId: 'student-1', title: 'Critical Care & Pulmonary Outcomes' },
  { id: 'col-2', studentId: 'student-1', title: 'Community Health Interventions' },
];

export function serializeScholarlyPortfolio(
  worksOrPayload: ScholarlyWork[] | { works: ScholarlyWork[]; collections?: ScholarlyCollection[]; lastUpdated?: string },
  maybeCollections?: ScholarlyCollection[]
): string {
  if (Array.isArray(worksOrPayload)) {
    return JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      works: worksOrPayload,
      collections: maybeCollections || [],
    });
  }
  return JSON.stringify({
    version: 1,
    savedAt: worksOrPayload.lastUpdated || new Date().toISOString(),
    works: worksOrPayload.works || [],
    collections: worksOrPayload.collections || [],
  });
}

export function deserializeScholarlyPortfolio(
  json: string | null
): { works: ScholarlyWork[]; collections: ScholarlyCollection[] } | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.works)) {
      return {
        works: parsed.works,
        collections: Array.isArray(parsed.collections) ? parsed.collections : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}


