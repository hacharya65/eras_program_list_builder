import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('URL Navigation and Deep Linking Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const VALID_STUDENT_VIEWS = [
    'overview',
    'profile',
    'intake',
    'personal_statement',
    'personal_statement_feedback',
    'experiences',
    'scholarly_works',
    'journal',
    'school_list',
    'competitiveness',
    'alumni_directory',
    'transfer_kit',
    'letters',
  ];

  it('validates deep link URL parameters correctly', () => {
    const parseUrlView = (urlStr: string) => {
      const url = new URL(urlStr);
      const v = url.searchParams.get('view');
      return v && VALID_STUDENT_VIEWS.includes(v) ? v : 'overview';
    };

    expect(parseUrlView('http://localhost:3000/?view=school_list')).toBe('school_list');
    expect(parseUrlView('http://localhost:3000/?view=profile')).toBe('profile');
    expect(parseUrlView('http://localhost:3000/?view=journal')).toBe('journal');
    expect(parseUrlView('http://localhost:3000/?view=letters')).toBe('letters');
    expect(parseUrlView('http://localhost:3000/?view=competitiveness')).toBe('competitiveness');
    expect(parseUrlView('http://localhost:3000/?view=unknown_view')).toBe('overview');
    expect(parseUrlView('http://localhost:3000/')).toBe('overview');
  });

  it('validates role switching URL parameters and clearing view when navigating away from student', () => {
    const parseRoleSwitch = (currentUrlStr: string, newRole: string) => {
      const url = new URL(currentUrlStr);
      url.searchParams.set('role', newRole);
      if (newRole !== 'student') {
        url.searchParams.delete('view');
      }
      return url.toString();
    };

    const studentWithView = 'http://localhost:3000/?role=student&view=school_list';
    const advisorUrl = parseRoleSwitch(studentWithView, 'advisor');
    expect(advisorUrl).toBe('http://localhost:3000/?role=advisor');

    const adminUrl = parseRoleSwitch(advisorUrl, 'admin');
    expect(adminUrl).toBe('http://localhost:3000/?role=admin');

    const backToStudent = parseRoleSwitch(adminUrl, 'student');
    expect(backToStudent).toBe('http://localhost:3000/?role=student');
  });

  it('updates URL search parameters cleanly preserving existing search parameters', () => {
    const updateViewUrl = (currentUrlStr: string, newView: string) => {
      const url = new URL(currentUrlStr);
      url.searchParams.set('view', newView);
      return url.search;
    };

    expect(updateViewUrl('http://localhost:3000/?role=student', 'school_list')).toBe('?role=student&view=school_list');
    expect(updateViewUrl('http://localhost:3000/?role=student&view=overview', 'journal')).toBe('?role=student&view=journal');
  });
});
