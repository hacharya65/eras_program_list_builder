/**
 * Student Account Registry for Multi-Student Match Strategy Tool
 * Supports managing and persisting profiles for 200+ students.
 */

export interface StudentAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  medicalSchool: string;
  specialty: string;
  pronouns?: string;
  gradYear?: number;
  createdAt: string;
  lastActiveAt: string;
  isDemo?: boolean;
}

export const STUDENT_REGISTRY_KEY = 'ethmoid_student_registry_v1';
export const CURRENT_STUDENT_ID_KEY = 'ethmoid_current_student_id_v1';
export const AUTH_SESSION_KEY = 'ethmoid_auth_session_active_v1';

export const DEMO_STUDENT_ACCOUNT: StudentAccount = {
  id: 'stu-alex-rivera',
  name: 'Alex Rivera',
  email: 'alex.rivera@demo.edu',
  medicalSchool: 'Geisinger Commonwealth School of Medicine',
  specialty: 'Internal Medicine',
  pronouns: 'she/her/hers',
  gradYear: 2027,
  createdAt: '2026-08-01T10:00:00Z',
  lastActiveAt: '2026-09-01T12:00:00Z',
  isDemo: true,
};

export const INITIAL_DEFAULT_STUDENT: StudentAccount = DEMO_STUDENT_ACCOUNT;

export function isDemoStudentId(id?: string | null): boolean {
  if (!id) return false;
  return (
    id === DEMO_STUDENT_ACCOUNT.id ||
    id === 'stu-alex-rivera' ||
    id === 'student-alex-rivera' ||
    id === 'usr-student-1' ||
    id === 'student-test-sync' ||
    id.startsWith('demo-')
  );
}

export function isUserAuthenticated(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(AUTH_SESSION_KEY) === 'true';
}

export function setAuthenticatedSession(active: boolean): void {
  if (typeof localStorage === 'undefined') return;
  if (active) {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export function logoutSession(): void {
  setAuthenticatedSession(false);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('student_logged_out'));
  }
}

export function loadStudentRegistry(): StudentAccount[] {
  if (typeof localStorage === 'undefined') {
    return [DEMO_STUDENT_ACCOUNT];
  }

  try {
    const raw = localStorage.getItem(STUDENT_REGISTRY_KEY);
    if (!raw) {
      const initial = [DEMO_STUDENT_ACCOUNT];
      localStorage.setItem(STUDENT_REGISTRY_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure demo account is present
      const hasDemo = parsed.some((s) => s.id === DEMO_STUDENT_ACCOUNT.id);
      if (!hasDemo) {
        const withDemo = [DEMO_STUDENT_ACCOUNT, ...parsed];
        localStorage.setItem(STUDENT_REGISTRY_KEY, JSON.stringify(withDemo));
        return withDemo;
      }
      return parsed;
    }
    return [DEMO_STUDENT_ACCOUNT];
  } catch {
    return [DEMO_STUDENT_ACCOUNT];
  }
}

export function saveStudentRegistry(accounts: StudentAccount[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STUDENT_REGISTRY_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save student registry:', err);
  }
}

export function getCurrentStudentId(): string {
  if (typeof localStorage === 'undefined') {
    return DEMO_STUDENT_ACCOUNT.id;
  }

  try {
    const current = localStorage.getItem(CURRENT_STUDENT_ID_KEY);
    if (current) return current;
    localStorage.setItem(CURRENT_STUDENT_ID_KEY, DEMO_STUDENT_ACCOUNT.id);
    return DEMO_STUDENT_ACCOUNT.id;
  } catch {
    return DEMO_STUDENT_ACCOUNT.id;
  }
}

export function setCurrentStudentId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_STUDENT_ID_KEY, id);
    const registry = loadStudentRegistry();
    const updated = registry.map((s) =>
      s.id === id ? { ...s, lastActiveAt: new Date().toISOString() } : s
    );
    saveStudentRegistry(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('student_account_switched', { detail: { studentId: id } }));
    }
  } catch (err) {
    console.error('Failed to set current student id:', err);
  }
}

export function getStudentAccount(id: string): StudentAccount | null {
  const registry = loadStudentRegistry();
  const direct = registry.find((s) => s.id === id);
  if (direct) return direct;
  if (isDemoStudentId(id)) {
    return registry.find((s) => isDemoStudentId(s.id)) || DEMO_STUDENT_ACCOUNT;
  }
  return null;
}

export function getStudentAccountByEmail(email: string): StudentAccount | null {
  const registry = loadStudentRegistry();
  const clean = email.trim().toLowerCase();
  return registry.find((s) => s.email.toLowerCase() === clean) || null;
}

export function createStudentAccount(data: {
  name: string;
  email: string;
  password?: string;
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
      password: data.password ? data.password.trim() : existing.password,
      medicalSchool: data.medicalSchool.trim(),
      specialty: data.specialty.trim() || existing.specialty,
      pronouns: data.pronouns || existing.pronouns,
      gradYear: data.gradYear || existing.gradYear,
      lastActiveAt: new Date().toISOString(),
    };
    const updatedList = registry.map((s) => (s.id === existing.id ? updatedAccount : s));
    saveStudentRegistry(updatedList);
    setCurrentStudentId(existing.id);
    setAuthenticatedSession(true);
    return updatedAccount;
  }

  const id = `stu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const newAccount: StudentAccount = {
    id,
    name: data.name.trim(),
    email: cleanEmail,
    password: data.password ? data.password.trim() : undefined,
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
  setAuthenticatedSession(true);
  return newAccount;
}

export function updateStudentAccount(id: string, updates: Partial<StudentAccount>): StudentAccount | null {
  const registry = loadStudentRegistry();
  let existing = registry.find((s) => s.id === id);
  if (!existing && isDemoStudentId(id)) {
    existing = registry.find((s) => isDemoStudentId(s.id)) || DEMO_STUDENT_ACCOUNT;
  }

  if (!existing) {
    if (isDemoStudentId(id)) {
      Object.assign(DEMO_STUDENT_ACCOUNT, updates);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('student_account_updated', { detail: { account: DEMO_STUDENT_ACCOUNT } }));
      }
      return DEMO_STUDENT_ACCOUNT;
    }
    return null;
  }

  const effectiveId = existing.id;
  const updatedAccount: StudentAccount = {
    ...existing,
    ...updates,
    lastActiveAt: new Date().toISOString(),
  };
  const updatedList = registry.map((s) => (s.id === effectiveId ? updatedAccount : s));
  saveStudentRegistry(updatedList);
  if (isDemoStudentId(effectiveId) || isDemoStudentId(id)) {
    Object.assign(DEMO_STUDENT_ACCOUNT, updates);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('student_account_updated', { detail: { account: updatedAccount } }));
  }
  return updatedAccount;
}

export function updateStudentMedicalSchool(id: string, medicalSchool: string): StudentAccount | null {
  return updateStudentAccount(id, { medicalSchool: medicalSchool.trim() });
}

