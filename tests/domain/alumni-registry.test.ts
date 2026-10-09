import { describe, it, expect, beforeEach } from 'vitest';
import { AlumniRegistry } from '@/domain/alumni-registry';

describe('Deep Alumni Registry Module', () => {
  let registry: AlumniRegistry;

  beforeEach(() => {
    registry = new AlumniRegistry();
  });

  it('provides complete roster management and query interface', () => {
    const all = registry.getAllAlumni();
    expect(all.length).toBeGreaterThan(0);

    // Add a new alumnus
    const created = registry.addAlumnus({
      name: 'Dr. Jane Watson',
      graduationYear: 2025,
      medicalSchool: 'Geisinger Commonwealth School of Medicine',
      institutionName: 'Mayo Clinic School of Graduate Medical Education',
      specialty: 'Internal Medicine',
      programCity: 'Rochester',
      programState: 'MN',
      isAvailableForMentorship: true,
      contactPreference: 'email',
      email: 'watson.jane@mayo.edu',
    });

    expect(created.id).toBeDefined();
    expect(created.currentPgy).toBe('PGY-2'); // Auto-calculated perpetual PGY for 2025 grad in 2026-2027

    // Query for Mayo Clinic
    const mayoAlumni = registry.getAlumniForProgram('Mayo Clinic', 'Internal Medicine');
    expect(mayoAlumni.some((a) => a.name === 'Dr. Jane Watson')).toBe(true);

    // Summary calculation
    const summary = registry.getProgramSummary('Mayo Clinic', 'Internal Medicine');
    expect(summary.totalAlumni).toBeGreaterThanOrEqual(1);
    expect(summary.availableMentors).toBeGreaterThanOrEqual(1);
  });

  it('performs atomic batch Match Day roster ingestion with ACGME cross-referencing', () => {
    const rawMatchText = `
Dr. Emily Davis - Internal Medicine - Beth Israel Deaconess Medical Center - Boston, MA
Dr. Robert Miller - Emergency Medicine - Penn State Health - Hershey, PA
    `.trim();

    const result = registry.importMatchRoster({
      rawText: rawMatchText,
      graduationYear: 2026,
    });

    expect(result.importedCount).toBe(2);
    expect(result.matchedCount).toBeGreaterThanOrEqual(1);

    // Verify imported residents are immediately queryable in the registry
    const biAlumni = registry.getAlumniForProgram('Beth Israel', 'Internal Medicine');
    expect(biAlumni.some((a) => a.name.includes('Emily Davis'))).toBe(true);
  });

  it('searches network across multiple dimensions', () => {
    const filtered = registry.searchAlumni({
      specialty: 'Internal Medicine',
      availableOnly: true,
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((a) => a.specialty === 'Internal Medicine')).toBe(true);
    expect(filtered.every((a) => a.isAvailableForMentorship === true)).toBe(true);
  });

  it('generates non-robotic outreach templates', () => {
    const template = registry.generateOutreachTemplate({
      studentName: 'Alex Rivera',
      mentorName: 'Dr. Marcus Chen',
      programName: 'Beth Israel Deaconess Medical Center',
      specialty: 'Internal Medicine',
    });

    expect(template.subject).toContain('Alex');
    expect(template.body).toContain('Beth Israel Deaconess Medical Center');
    expect(template.dos.length).toBeGreaterThan(0);
    expect(template.donts.length).toBeGreaterThan(0);
  });
});
