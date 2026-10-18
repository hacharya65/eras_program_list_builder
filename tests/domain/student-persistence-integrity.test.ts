import { describe, it, expect, beforeEach } from 'vitest';
import {
  StudentAccount,
  createStudentAccount,
  getStudentAccount,
  loadStudentRegistry,
  setCurrentStudentId,
  STUDENT_REGISTRY_KEY,
  CURRENT_STUDENT_ID_KEY,
} from '@/domain/student-registry';
import {
  loadStudentAdvisingIntake,
  saveStudentAdvisingIntake,
  SPECIALTY_INTAKE_STORAGE_PREFIX,
} from '@/domain/advising-intake-models';
import {
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
  loadItemsForSpecialty,
  getStorageKeyForSpecialty,
  TARGET_SPECIALTY_STORAGE_KEY,
  SchoolListItem,
} from '@/domain/school-list-models';

describe('Student Data & Specialty Persistence Integrity', () => {
  beforeEach(() => {
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
    (globalThis as any).window = {
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  });

  it('preserves Anesthesiology specialty and prevents global specialty clobbering', () => {
    // Simulate James Gilmore registering for Anesthesiology
    const james = createStudentAccount({
      name: 'James Gilmore',
      email: 'jgilmore@som.edu',
      medicalSchool: 'Geisinger Commonwealth School of Medicine',
      specialty: 'Anesthesiology',
    });

    expect(james.specialty).toBe('Anesthesiology');

    // Simulate James Gilmore saving an intake packet in Anesthesiology
    const intake = loadStudentAdvisingIntake(james.id);
    expect(intake.applyingSpecialty).toBe('Anesthesiology');

    // Now simulate another user or session setting the global key to Internal Medicine
    localStorage.setItem(TARGET_SPECIALTY_STORAGE_KEY, 'Internal Medicine');

    // Reloading James Gilmore's intake MUST NOT overwrite his Anesthesiology specialty
    const reloadedIntake = loadStudentAdvisingIntake(james.id);
    expect(reloadedIntake.applyingSpecialty).toBe('Anesthesiology');

    // Active target specialty for James Gilmore must remain Anesthesiology
    expect(getStoredTargetSpecialty(james.id)).toBe('Anesthesiology');
  });

  it('guarantees school list isolation and self-healing for James Gilmore', () => {
    const james = createStudentAccount({
      name: 'James Gilmore',
      email: 'jgilmore@som.edu',
      medicalSchool: 'Geisinger Commonwealth School of Medicine',
      specialty: 'Anesthesiology',
    });

    // Simulate James Gilmore adding 2 Anesthesiology programs
    const anesthesiologyKey = getStorageKeyForSpecialty('Anesthesiology', james.id);
    const mockPrograms: SchoolListItem[] = [
      {
        id: 'prog-anes-1',
        programId: 'anes-1',
        programName: 'Brigham and Women’s Hospital Program',
        specialty: 'Anesthesiology',
        city: 'Boston',
        state: 'MA',
        tier: 'reach',
        signal: 'gold',
      },
      {
        id: 'prog-anes-2',
        programId: 'anes-2',
        programName: 'Massachusetts General Hospital Program',
        specialty: 'Anesthesiology',
        city: 'Boston',
        state: 'MA',
        tier: 'target',
        signal: 'silver',
      },
    ];

    localStorage.setItem(anesthesiologyKey, JSON.stringify(mockPrograms));

    // Load items for James in Anesthesiology
    const loaded = loadItemsForSpecialty('Anesthesiology', 250, james.id);
    expect(loaded.length).toBe(2);
    expect(loaded[0].programName).toBe('Brigham and Women’s Hospital Program');

    // If an errant query asks for Internal Medicine, but James's registered specialty is Anesthesiology,
    // self-healing recovers his actual saved programs!
    const recovered = loadItemsForSpecialty('Internal Medicine', 250, james.id);
    expect(recovered.length).toBe(2);
    expect(recovered[0].specialty).toBe('Anesthesiology');
  });

  it('self-heals James Gilmore if his account was previously corrupted by legacy keys', () => {
    // Simulate legacy corrupted registry where James Gilmore had been flipped to Internal Medicine
    const corruptedRegistry: StudentAccount[] = [
      {
        id: 'stu-james-gilmore-test',
        name: 'James Gilmore',
        email: 'jgilmore@som.edu',
        medicalSchool: 'Geisinger Commonwealth School of Medicine',
        specialty: 'Internal Medicine', // Corrupted
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STUDENT_REGISTRY_KEY, JSON.stringify(corruptedRegistry));

    // Also simulate intake had been corrupted
    localStorage.setItem(
      `${SPECIALTY_INTAKE_STORAGE_PREFIX}stu-james-gilmore-test`,
      JSON.stringify({
        studentId: 'stu-james-gilmore-test',
        studentName: 'James Gilmore',
        applyingSpecialty: 'Internal Medicine', // Corrupted
      })
    );

    // Also simulate schools were saved under unscoped anesthesiology key
    localStorage.setItem(
      'eras_school_list_matrix_anesthesiology',
      JSON.stringify([
        {
          id: 'prog-anes-3',
          programId: 'anes-3',
          programName: 'Johns Hopkins Hospital Program',
          specialty: 'Anesthesiology',
          tier: 'reach',
          signal: 'none',
        },
      ])
    );

    // Call loadStudentRegistry() which triggers self-healing
    const registry = loadStudentRegistry();
    const james = registry.find((s) => s.id === 'stu-james-gilmore-test');
    expect(james).toBeDefined();
    expect(james!.specialty).toBe('Anesthesiology');

    // Verify intake self-healed
    const healedIntake = loadStudentAdvisingIntake('stu-james-gilmore-test');
    expect(healedIntake.applyingSpecialty).toBe('Anesthesiology');

    // Verify schools were copied to his scoped key
    const loadedPrograms = loadItemsForSpecialty('Anesthesiology', 250, 'stu-james-gilmore-test');
    expect(loadedPrograms.length).toBe(1);
    expect(loadedPrograms[0].programName).toBe('Johns Hopkins Hospital Program');
  });

  it('guarantees the sample demo profile (Alex Rivera) has Step 2 CK = 252 across registry and intake', () => {
    // Corrupted or older demo student cache in localStorage
    localStorage.setItem(
      STUDENT_REGISTRY_KEY,
      JSON.stringify([
        {
          id: 'stu-alex-rivera',
          name: 'Alex Rivera',
          email: 'alex.rivera@demo.edu',
          specialty: 'Internal Medicine',
          step2Ck: 254, // older cached score
          isDemo: true,
        },
      ])
    );
    localStorage.setItem(
      `${SPECIALTY_INTAKE_STORAGE_PREFIX}stu-alex-rivera`,
      JSON.stringify({
        studentId: 'stu-alex-rivera',
        studentName: 'Alex Rivera',
        applyingSpecialty: 'Internal Medicine',
        step2Status: 'score_available',
        step2Score: 267, // older cached score
      })
    );

    const registry = loadStudentRegistry();
    const demoStudent = registry.find((s) => s.id === 'stu-alex-rivera');
    expect(demoStudent).toBeDefined();
    expect(demoStudent!.step2Ck).toBe(252);

    const demoIntake = loadStudentAdvisingIntake('stu-alex-rivera');
    expect(demoIntake.step2Score).toBe(252);
  });
});
