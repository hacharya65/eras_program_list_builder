import { describe, it, expect, beforeEach } from 'vitest';
import {
  StudentPortfolio,
  createDefaultPortfolio,
  calculatePortfolioStats,
  InMemoryPortfolioAdapter,
  BrowserStoragePortfolioAdapter,
} from '@/domain/student-portfolio';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';

describe('Deep StudentPortfolio Module and Persistence Seam', () => {
  let inMemoryRepo: InMemoryPortfolioAdapter;

  beforeEach(() => {
    inMemoryRepo = new InMemoryPortfolioAdapter();
  });

  it('creates and calculates complete portfolio summary statistics across all facets', () => {
    const portfolio = createDefaultPortfolio('test-student-1', 'Jordan Rivera', 'Internal Medicine');
    
    const stats = calculatePortfolioStats(portfolio);

    expect(stats.scholarlyStats.count).toBeGreaterThan(0);
    expect(stats.scholarlyStats.meaningful).toBe(2);
    expect(stats.schoolListStats.count).toBeGreaterThan(0);
    expect(stats.schoolListStats.signalsBudget).toBe(15); // Internal medicine rule
    expect(stats.lorStats.total).toBeGreaterThan(0);
    expect(stats.journalStats.total).toBeGreaterThan(0);
  });

  it('persists and updates portfolio deterministically via InMemoryPortfolioAdapter', () => {
    const studentId = 'student-sarah';
    const initial = inMemoryRepo.loadPortfolio(studentId, 'Dermatology');
    expect(initial.targetSpecialty).toBe('Dermatology');

    inMemoryRepo.updatePortfolio(studentId, (draft) => {
      draft.targetSpecialty = 'Anesthesiology';
      draft.scholarlyWorks.push({
        id: 'work-new',
        studentId,
        type: 'Journal Articles (peer reviewed)',
        title: 'Novel Anesthetic Protocols in Ambulatory Surgery',
        authors: 'Lee S, Smith J',
        isFirstAuthor: true,
        isMeaningful: true,
      });
    });

    const reloaded = inMemoryRepo.loadPortfolio(studentId);
    expect(reloaded.targetSpecialty).toBe('Anesthesiology');
    expect(reloaded.scholarlyWorks.some((w) => w.id === 'work-new')).toBe(true);

    const stats = calculatePortfolioStats(reloaded);
    expect(stats.scholarlyStats.meaningful).toBe(3); // 2 default + 1 new
  });

  it('allows AdvisingPlatformService to compute real advisee breakdowns rather than hardcoded stubs', () => {
    const storage = new InMemoryStorageAdapter();
    const service = new AdvisingPlatformService(storage, inMemoryRepo);

    const student = storage.personas.student;
    
    // Mutate the student portfolio in the repository
    inMemoryRepo.updatePortfolio(student.id, (draft) => {
      draft.schoolList = [
        {
          id: 'prog-1',
          programId: '1403521255',
          programName: 'Penn State Health',
          specialty: 'Internal Medicine',
          tier: 'target',
          signal: 'gold',
        },
        {
          id: 'prog-2',
          programId: '1402321200',
          programName: 'Geisinger Medical Center',
          specialty: 'Internal Medicine',
          tier: 'safety',
          signal: 'silver',
        },
      ];
    });

    const advisorContext = service.getAdvisorDashboardContext();
    const studentBreakdown = advisorContext.adviseeComponentBreakdowns![student.id];

    expect(studentBreakdown).toBeDefined();
    expect(studentBreakdown.schoolListCount).toBe(2);
    expect(studentBreakdown.signalsAssigned).toBe(2); // 1 gold + 1 silver
    expect(studentBreakdown.signalsBudget).toBe(15);
    expect(advisorContext.schoolListStats?.count).toBe(2);
    expect(advisorContext.schoolListStats?.signalsAssigned).toBe(2);
  });

  it('demonstrates two adapters satisfying the exact same PortfolioRepository interface', () => {
    const browserAdapter = new BrowserStoragePortfolioAdapter();
    const studentId = 'cross-adapter-test';

    // Both implement loadPortfolio and savePortfolio
    const p1 = inMemoryRepo.loadPortfolio(studentId);
    expect(p1.studentId).toBe(studentId);

    // In Node test environment, BrowserStoragePortfolioAdapter gracefully falls back to in-memory behavior
    const p2 = browserAdapter.loadPortfolio(studentId);
    expect(p2.studentId).toBe(studentId);
  });
});
