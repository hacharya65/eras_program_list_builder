import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';

describe('Ticket 01: Greenfield App Scaffold & Domain Seam', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('initializes with default mock personas (Alex as Student, Dr. Chen as Advisor, Dr. Taylor as Dean)', () => {
    const personas = service.getAvailablePersonas();
    expect(personas.length).toBe(3);
    
    const student = personas.find(p => p.role === 'student');
    const advisor = personas.find(p => p.role === 'advisor');
    const dean = personas.find(p => p.role === 'admin');

    expect(student?.name).toBe('Alex Rivera (MS4)');
    expect(advisor?.name).toBe('Dr. Marcus Chen');
    expect(dean?.name).toBe('Dr. Evelyn Taylor (Dean)');
  });

  it('switches current persona seamlessly', () => {
    expect(service.getCurrentPersona().role).toBe('student');

    service.switchPersona('advisor');
    expect(service.getCurrentPersona().role).toBe('advisor');
    expect(service.getCurrentPersona().name).toBe('Dr. Marcus Chen');

    service.switchPersona('admin');
    expect(service.getCurrentPersona().role).toBe('admin');
    expect(service.getCurrentPersona().name).toBe('Dr. Evelyn Taylor (Dean)');
  });

  it('loads role-specific initial data contexts without error', () => {
    // Student context
    service.switchPersona('student');
    const studentData = service.getStudentDashboardContext();
    expect(studentData.student.id).toBeDefined();
    expect(studentData.assignedAdvisors.length).toBeGreaterThan(0);
    expect(studentData.personalStatement).toBeDefined();
    expect(studentData.experiences).toBeDefined();

    // Advisor context
    service.switchPersona('advisor');
    const advisorData = service.getAdvisorDashboardContext();
    expect(advisorData.pendingReviews).toBeDefined();
    expect(advisorData.advisees.length).toBeGreaterThan(0);

    // Dean context
    service.switchPersona('admin');
    const adminData = service.getAdminCohortContext();
    expect(adminData.institution.defaultSlaDays).toBe(14);
    expect(adminData.cohortSummary.totalStudents).toBeGreaterThan(0);
  });
});
