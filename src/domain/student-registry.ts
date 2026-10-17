/**
 * Student Account Registry for Multi-Student Match Strategy Tool
 * Supports managing and persisting profiles for 200+ students.
 */

export interface StudentAccount {
  id: string;
  name: string;
  email: string;
  medicalSchool: string;
  specialty: string;
  pronouns?: string;
  gradYear?: number;
  createdAt: string;
  lastActiveAt: string;
}

export const STUDENT_REGISTRY_KEY = 'ethmoid_student_registry_v1';
export const CURRENT_STUDENT_ID_KEY = 'ethmoid_current_student_id_v1';

export const INITIAL_DEFAULT_STUDENT: StudentAccount = {
  id: 'stu-alex-rivera',
  name: 'Alex Rivera',
  email: 'arivera@som.edu',
  medicalSchool: 'School of Medicine',
  specialty: 'Internal Medicine',
  pronouns: 'she/her',
  gradYear: 2027,
  createdAt: '2026-08-01T10:00:00Z',
  lastActiveAt: '2026-09-01T12:00:00Z',
};

export function loadStudentRegistry(): StudentAccount[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [INITIAL_DEFAULT_STUDENT];
  }

  try {
    const raw = localStorage.getItem(STUDENT_REGISTRY_KEY);
    if (!raw) {
      const initial = [INITIAL_DEFAULT_STUDENT];
      localStorage.setItem(STUDENT_REGISTRY_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [INITIAL_DEFAULT_STUDENT];
  } catch {
    return [INITIAL_DEFAULT_STUDENT];
  }
}

export function saveStudentRegistry(accounts: StudentAccount[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STUDENT_REGISTRY_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save student registry:', err);
  }
}

export function getCurrentStudentId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return INITIAL_DEFAULT_STUDENT.id;
  }

  try {
    const current = localStorage.getItem(CURRENT_STUDENT_ID_KEY);
    if (current) return current;
    localStorage.setItem(CURRENT_STUDENT_ID_KEY, INITIAL_DEFAULT_STUDENT.id);
    return INITIAL_DEFAULT_STUDENT.id;
  } catch {
    return INITIAL_DEFAULT_STUDENT.id;
  }
}

export function setCurrentStudentId(id: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_STUDENT_ID_KEY, id);
    const registry = loadStudentRegistry();
    const updated = registry.map((s) =>
      s.id === id ? { ...s, lastActiveAt: new Date().toISOString() } : s
    );
    saveStudentRegistry(updated);
    window.dispatchEvent(new CustomEvent('student_account_switched', { detail: { studentId: id } }));
  } catch (err) {
    console.error('Failed to set current student id:', err);
  }
}

export function getStudentAccount(id: string): StudentAccount | null {
  const registry = loadStudentRegistry();
  return registry.find((s) => s.id === id) || null;
}

export function createStudentAccount(data: {
  name: string;
  email: string;
  medicalSchool: string;
  specialty: string;
  pronouns?: string;
  gradYear?: number;
}): StudentAccount {
  const registry = loadStudentRegistry();
  const cleanEmail = data.email.trim().toLowerCase();
  
  // Check if account already exists with same email
  const existing = registry.find((s) => s.email.toLowerCase() === cleanEmail);
  if (existing) {
    const updatedAccount: StudentAccount = {
      ...existing,
      name: data.name.trim(),
      medicalSchool: data.medicalSchool.trim(),
      specialty: data.specialty.trim() || existing.specialty,
      pronouns: data.pronouns || existing.pronouns,
      gradYear: data.gradYear || existing.gradYear,
      lastActiveAt: new Date().toISOString(),
    };
    const updatedList = registry.map((s) => (s.id === existing.id ? updatedAccount : s));
    saveStudentRegistry(updatedList);
    setCurrentStudentId(existing.id);
    return updatedAccount;
  }

  const id = `stu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const newAccount: StudentAccount = {
    id,
    name: data.name.trim(),
    email: cleanEmail,
    medicalSchool: data.medicalSchool.trim(),
    specialty: data.specialty.trim() || 'Internal Medicine',
    pronouns: data.pronouns?.trim() || 'they/them',
    gradYear: data.gradYear || 2027,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  const updatedRegistry = [newAccount, ...registry];
  saveStudentRegistry(updatedRegistry);
  setCurrentStudentId(id);
  return newAccount;
}

export function updateStudentAccount(id: string, updates: Partial<StudentAccount>): void {
  const registry = loadStudentRegistry();
  const updated = registry.map((s) =>
    s.id === id ? { ...s, ...updates, lastActiveAt: new Date().toISOString() } : s
  );
  saveStudentRegistry(updated);
}
