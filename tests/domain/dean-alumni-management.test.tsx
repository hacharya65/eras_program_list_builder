import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdvisingPlatformService } from '@/domain/service';
import { InMemoryStorageAdapter } from '@/domain/storage/in-memory-adapter';
import { AdminPortal } from '@/components/AdminPortal';
import { AlumniResidentDirectory } from '@/components/AlumniResidentDirectory';

describe('Dean of Student Affairs Alumni Management & Student View Sync', () => {
  let service: AdvisingPlatformService;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    service = new AdvisingPlatformService(storage);
  });

  it('allows Dean to add, modify, and remove alumni residents through service', () => {
    const initialCount = service.getAlumniResidents().length;
    expect(initialCount).toBeGreaterThan(0);

    // 1. Add new alumnus
    const newAlum = service.addAlumniResident({
      name: 'Dr. Maya Patel',
      graduationYear: 2025,
      currentPgy: 'PGY-1',
      medicalSchool: 'Apex School of Medicine',
      institutionName: 'Stanford Health Care',
      specialty: 'Internal Medicine',
      programCity: 'Stanford',
      programState: 'CA',
      isAvailableForMentorship: true,
      contactPreference: 'virtual_coffee',
      email: 'mpatel@stanford.edu',
      signalStrategyUsed: 'Gold',
      adviceQuote: 'Stanford values research inquiry and leadership in health equity.',
    });

    expect(newAlum.id).toBeDefined();
    expect(service.getAlumniResidents()).toHaveLength(initialCount + 1);

    // Verify program lookup
    const stanfordAlumni = service.getAlumniByProgram('Stanford Health Care');
    expect(stanfordAlumni.some((a) => a.name === 'Dr. Maya Patel')).toBe(true);

    // 2. Modify alumnus
    const updated = service.updateAlumniResident(newAlum.id, {
      currentPgy: 'PGY-2',
      adviceQuote: 'Updated advice for 2026 applicants.',
    });
    expect(updated?.currentPgy).toBe('PGY-2');
    expect(updated?.adviceQuote).toBe('Updated advice for 2026 applicants.');

    // 3. Remove alumnus
    const deleted = service.deleteAlumniResident(newAlum.id);
    expect(deleted).toBe(true);
    expect(service.getAlumniResidents()).toHaveLength(initialCount);
    expect(service.getAlumniByProgram('Stanford Health Care').some((a) => a.name === 'Dr. Maya Patel')).toBe(false);
  });

  it('renders Alumni Resident Management in AdminPortal for the Dean', () => {
    const adminContext = service.getAdminCohortContext();
    const html = renderToStaticMarkup(
      React.createElement(AdminPortal, {
        context: adminContext,
      })
    );

    expect(html).toContain('Alumni Residency Network');
    expect(html).toContain('Add Matched Alumnus');
    expect(html).toContain('Dr. Sarah Jenkins');
  });

  it('synchronizes Dean modifications directly into AlumniResidentDirectory in Student view', () => {
    // Dean adds a newly matched alumnus
    service.addAlumniResident({
      name: 'Dr. Jordan Lee',
      graduationYear: 2025,
      currentPgy: 'PGY-1',
      medicalSchool: 'Apex School of Medicine',
      institutionName: 'UCSF Medical Center',
      specialty: 'Internal Medicine',
      programCity: 'San Francisco',
      programState: 'CA',
      isAvailableForMentorship: true,
      contactPreference: 'email',
      email: 'jordan.lee@ucsf.edu',
      signalStrategyUsed: 'Gold',
      adviceQuote: 'Feel free to reach out about UCSF primary care track!',
    });

    // Student views the Alumni Directory
    const html = renderToStaticMarkup(
      React.createElement(AlumniResidentDirectory, {
        studentSpecialty: 'Internal Medicine',
        studentName: 'Alex Rivera (MS4)',
        alumniResidents: service.getAlumniResidents(),
      })
    );

    expect(html).toContain('Dr. Jordan Lee');
    expect(html).toContain('UCSF Medical Center');
    expect(html).toContain('Feel free to reach out about UCSF primary care track!');
  });

  it('enforces validation invariants when adding and updating alumni in service', () => {
    // Missing name
    expect(() => {
      service.addAlumniResident({
        name: '',
        graduationYear: 2025,
        currentPgy: 'PGY-1',
        medicalSchool: 'Apex School of Medicine',
        institutionName: 'UCSF',
        specialty: 'Internal Medicine',
        programCity: 'SF',
        programState: 'CA',
        isAvailableForMentorship: true,
        contactPreference: 'email',
        email: 'doc@ucsf.edu',
        signalStrategyUsed: 'Gold',
      });
    }).toThrow(/Full name is required/);

    // Invalid email
    expect(() => {
      service.addAlumniResident({
        name: 'Dr. Valid Name',
        graduationYear: 2025,
        currentPgy: 'PGY-1',
        medicalSchool: 'Apex School of Medicine',
        institutionName: 'UCSF',
        specialty: 'Internal Medicine',
        programCity: 'SF',
        programState: 'CA',
        isAvailableForMentorship: true,
        contactPreference: 'email',
        email: 'invalid-email-format',
        signalStrategyUsed: 'Gold',
      });
    }).toThrow(/Valid contact email is required/);
  });
});

