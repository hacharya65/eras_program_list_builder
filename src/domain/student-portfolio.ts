/**
 * Deep Student Portfolio Module & Persistence Seam
 * 
 * Consolidates all student dossier facets (intake, personal statement, experiences,
 * scholarly portfolio, school list, letters of recommendation, and reflective journal)
 * behind a unified high-leverage interface and persistence port.
 */

import { PersonalStatementDraft, ExperienceDraft } from './types';
import { SpecialtyAdvisingIntake, INITIAL_MOCK_INTAKE, loadStudentAdvisingIntake, saveStudentAdvisingIntake } from './advising-intake-models';
import { ScholarlyWork, deserializeScholarlyPortfolio, serializeScholarlyPortfolio, SAMPLE_SCHOLARLY_WORKS } from './scholarly-models';
import { SchoolListItem, SPECIALTY_SIGNALING_RULES, loadItemsForSpecialty, getStorageKeyForSpecialty } from './school-list-models';
import { LetterWriterRequest, loadLetterWriterRequests, saveLetterWriterRequests, INITIAL_MOCK_LETTER_WRITERS } from './lor-models';
import { ExperienceJournalEntry, loadExperienceJournalEntries, saveExperienceJournalEntries, INITIAL_MOCK_JOURNAL_ENTRIES } from './experience-journal-models';
import { getStudentAccount, isDemoStudentId } from './student-registry';

export interface StudentPortfolio {
  studentId: string;
  studentName: string;
  targetSpecialty: string;
  intake: SpecialtyAdvisingIntake;
  personalStatement: PersonalStatementDraft;
  experiences: ExperienceDraft[];
  scholarlyWorks: ScholarlyWork[];
  schoolList: SchoolListItem[];
  lorRequests: LetterWriterRequest[];
  journalEntries: ExperienceJournalEntry[];
  updatedAt: string;
}

export interface PortfolioSummaryStats {
  scholarlyStats: { count: number; meaningful: number };
  schoolListStats: { count: number; signalsAssigned: number; signalsBudget: number };
  experiencesStats: { total: number; meaningful: number; approved: number };
  lorStats: { total: number; confirmed: number; received: number };
  journalStats: { total: number };
}

/**
 * Derives real-time summary statistics across the whole student portfolio.
 */
export function calculatePortfolioStats(portfolio: StudentPortfolio): PortfolioSummaryStats {
  const specialtyRule = SPECIALTY_SIGNALING_RULES[portfolio.targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];
  const signalsBudget = specialtyRule ? specialtyRule.totalSignals : 15;

  const signalsAssigned = portfolio.schoolList.filter(
    (p) => p.signal === 'gold' || p.signal === 'silver'
  ).length;

  const scholarlyMeaningful = portfolio.scholarlyWorks.filter((w) => w.isMeaningful).length;
  const expMeaningful = portfolio.experiences.filter((e) => e.isMostMeaningful).length;
  const expApproved = portfolio.experiences.filter((e) => e.status === 'approved').length;

  const lorConfirmed = portfolio.lorRequests.filter(
    (r) => r.status === 'submitted' || r.status === 'initiated_eras'
  ).length;
  const lorReceived = portfolio.lorRequests.filter((r) => r.status === 'submitted').length;

  return {
    scholarlyStats: {
      count: portfolio.scholarlyWorks.length,
      meaningful: scholarlyMeaningful,
    },
    schoolListStats: {
      count: portfolio.schoolList.length,
      signalsAssigned,
      signalsBudget,
    },
    experiencesStats: {
      total: portfolio.experiences.length,
      meaningful: expMeaningful,
      approved: expApproved,
    },
    lorStats: {
      total: portfolio.lorRequests.length,
      confirmed: lorConfirmed,
      received: lorReceived,
    },
    journalStats: {
      total: portfolio.journalEntries.length,
    },
  };
}

/**
 * Creates a clean default portfolio for a new or uninitialized student.
 */
export function createDefaultPortfolio(
  studentId: string,
  studentName: string = 'Alex Rivera (MS4)',
  targetSpecialty: string = 'Internal Medicine'
): StudentPortfolio {
  return {
    studentId,
    studentName,
    targetSpecialty,
    intake: {
      ...INITIAL_MOCK_INTAKE,
      studentId,
      applyingSpecialty: targetSpecialty,
    },
    personalStatement: {
      id: `ps-${studentId}`,
      studentId,
      specialty: targetSpecialty,
      currentVersionNumber: 1,
      content: '',
      stage: 'drafting',
      updatedAt: new Date().toISOString(),
    },
    experiences: [],
    scholarlyWorks: [...SAMPLE_SCHOLARLY_WORKS],
    schoolList: loadItemsForSpecialty(targetSpecialty),
    lorRequests: [...INITIAL_MOCK_LETTER_WRITERS],
    journalEntries: [...INITIAL_MOCK_JOURNAL_ENTRIES],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * The Portfolio Persistence Port (Michael Feathers seam).
 * Allows callers and tests to cross the exact same interface.
 */
export interface PortfolioRepository {
  loadPortfolio(studentId: string, fallbackSpecialty?: string): StudentPortfolio;
  savePortfolio(portfolio: StudentPortfolio): void;
  updatePortfolio(studentId: string, mutator: (p: StudentPortfolio) => void): StudentPortfolio;
}

/**
 * Adapter 1: In-Memory Adapter (for unit tests, SSR, and Node.js environments).
 */
export class InMemoryPortfolioAdapter implements PortfolioRepository {
  private store: Map<string, StudentPortfolio> = new Map();

  constructor(initialData?: StudentPortfolio[]) {
    if (initialData) {
      for (const p of initialData) {
        this.store.set(p.studentId, p);
      }
    }
  }

  loadPortfolio(studentId: string, fallbackSpecialty: string = 'Internal Medicine'): StudentPortfolio {
    let portfolio = this.store.get(studentId);
    if (!portfolio) {
      portfolio = createDefaultPortfolio(studentId, 'Alex Rivera (MS4)', fallbackSpecialty);
      this.store.set(studentId, portfolio);
    }
    return JSON.parse(JSON.stringify(portfolio));
  }

  savePortfolio(portfolio: StudentPortfolio): void {
    this.store.set(portfolio.studentId, {
      ...portfolio,
      updatedAt: new Date().toISOString(),
    });
  }

  updatePortfolio(studentId: string, mutator: (p: StudentPortfolio) => void): StudentPortfolio {
    const current = this.loadPortfolio(studentId);
    mutator(current);
    this.savePortfolio(current);
    return current;
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Adapter 2: Browser Storage Adapter (for client-side production persistence).
 * Seamlessly hydrates from and writes back to local storage while preserving
 * backwards compatibility with existing individual keys.
 */
export class BrowserStoragePortfolioAdapter implements PortfolioRepository {
  private inMemoryFallback: InMemoryPortfolioAdapter = new InMemoryPortfolioAdapter();

  loadPortfolio(studentId: string, fallbackSpecialty: string = 'Internal Medicine'): StudentPortfolio {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return this.inMemoryFallback.loadPortfolio(studentId, fallbackSpecialty);
    }

    // Attempt to load unified portfolio key first
    const unifiedKey = `eras_student_portfolio_${studentId}`;
    const unifiedRaw = localStorage.getItem(unifiedKey);
    if (unifiedRaw) {
      try {
        const parsed = JSON.parse(unifiedRaw) as StudentPortfolio;
        if (parsed && parsed.studentId === studentId) {
          return parsed;
        }
      } catch (e) {
        // Fall back to assembling from individual legacy storage keys
      }
    }

    // Hydrate by assembling from individual domain storage keys
    const intake = loadStudentAdvisingIntake(studentId) || {
      ...INITIAL_MOCK_INTAKE,
      studentId,
      applyingSpecialty: fallbackSpecialty,
    };

    const targetSpecialty = intake.applyingSpecialty || fallbackSpecialty;

    // Scholarly Works
    const cachedScholarly = localStorage.getItem('eras_scholarly_portfolio');
    const restoredScholarly = deserializeScholarlyPortfolio(cachedScholarly);
    const scholarlyWorks = restoredScholarly ? restoredScholarly.works : [...SAMPLE_SCHOLARLY_WORKS];

    // School List
    const schoolList = loadItemsForSpecialty(targetSpecialty, undefined, studentId);

    // LOR Requests
    const lorRequests = loadLetterWriterRequests(studentId);

    // Journal Entries
    const journalEntries = loadExperienceJournalEntries(studentId);

    const acc = getStudentAccount(studentId);
    const resolvedName = acc?.name || (isDemoStudentId(studentId) ? 'Alex Rivera (MS4)' : 'Medical Student Applicant');

    const portfolio: StudentPortfolio = {
      studentId,
      studentName: resolvedName,
      targetSpecialty,
      intake,
      personalStatement: {
        id: `ps-${studentId}`,
        studentId,
        specialty: targetSpecialty,
        currentVersionNumber: 1,
        content: '',
        stage: 'drafting',
        updatedAt: new Date().toISOString(),
      },
      experiences: [],
      scholarlyWorks,
      schoolList,
      lorRequests,
      journalEntries,
      updatedAt: new Date().toISOString(),
    };

    return portfolio;
  }

  savePortfolio(portfolio: StudentPortfolio): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.inMemoryFallback.savePortfolio(portfolio);
      return;
    }

    const unifiedKey = `eras_student_portfolio_${portfolio.studentId}`;
    try {
      localStorage.setItem(unifiedKey, JSON.stringify(portfolio));

      // Bi-directional write to legacy keys so existing components continue to work
      saveStudentAdvisingIntake(portfolio.intake);
      saveLetterWriterRequests(portfolio.lorRequests, portfolio.studentId);
      saveExperienceJournalEntries(portfolio.studentId, portfolio.journalEntries);
      
      const specificSchoolListKey = getStorageKeyForSpecialty(portfolio.targetSpecialty, portfolio.studentId);
      localStorage.setItem(specificSchoolListKey, JSON.stringify(portfolio.schoolList));
      if (portfolio.targetSpecialty.toLowerCase() === 'internal medicine' && isDemoStudentId(portfolio.studentId)) {
        localStorage.setItem('eras_school_list_matrix', JSON.stringify(portfolio.schoolList));
      }

      localStorage.setItem(
        'eras_scholarly_portfolio',
        serializeScholarlyPortfolio({
          works: portfolio.scholarlyWorks,
          lastUpdated: portfolio.updatedAt,
        })
      );
    } catch (e) {
      console.warn('Failed to persist portfolio to localStorage:', e);
    }
  }

  updatePortfolio(studentId: string, mutator: (p: StudentPortfolio) => void): StudentPortfolio {
    const portfolio = this.loadPortfolio(studentId);
    mutator(portfolio);
    portfolio.updatedAt = new Date().toISOString();
    this.savePortfolio(portfolio);
    return portfolio;
  }
}
