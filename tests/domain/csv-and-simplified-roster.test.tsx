import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SchoolListItem,
  exportSchoolListToCsv,
} from '@/domain/school-list-models';
import { SimplifiedProgramListRoster } from '@/components/SimplifiedProgramListRoster';

describe('CSV Export & Simplified Program List Roster', () => {
  const sampleItems: SchoolListItem[] = [
    {
      id: 'item-1',
      programId: 'prog-1',
      programNumber: '1403521254',
      programName: 'Massachusetts General Hospital Program',
      specialty: 'Internal Medicine',
      city: 'Boston',
      state: 'MA',
      region: 'New England',
      tier: 'reach',
      signal: 'gold',
      track: 'categorical',
      step2ScoreRange: '260 - 278',
      step2Min: 260,
      step2Max: 278,
      notes: 'Strong alumni connections in critical care track',
    },
    {
      id: 'item-2',
      programId: 'prog-2',
      programNumber: '1403521255',
      programName: 'Geisinger Medical Center Program',
      specialty: 'Internal Medicine',
      city: 'Danville',
      state: 'PA',
      region: 'Middle Atlantic',
      tier: 'safety',
      signal: 'silver',
      track: 'categorical',
      step2ScoreRange: '220 - 240',
      step2Min: 220,
      step2Max: 240,
    },
    {
      id: 'item-3',
      programId: 'prog-3',
      programNumber: '1403521256',
      programName: 'Penn State Milton S. Hershey Medical Center',
      specialty: 'Internal Medicine',
      city: 'Hershey',
      state: 'PA',
      region: 'Middle Atlantic',
      tier: 'target',
      signal: 'none',
      track: 'categorical',
      step2ScoreRange: '244 - 265',
      step2Min: 244,
      step2Max: 265,
    },
  ];

  beforeEach(() => {
    const store: Record<string, string> = {
      'eras_school_list_matrix_stu-test_internal_medicine': JSON.stringify(sampleItems),
      'eras_applicant_step2_ck_stu-test': '252',
    };
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
  });

  describe('exportSchoolListToCsv()', () => {
    it('creates and triggers download of a properly structured CSV with headers and quoted fields', () => {
      let createdBlob: Blob | null = null;
      let downloadFilename = '';

      const mockCreateObjectURL = vi.fn((blob: Blob) => {
        createdBlob = blob;
        return 'blob:mock-url';
      });
      const mockRevokeObjectURL = vi.fn();

      (globalThis as any).URL = {
        ...(globalThis.URL || {}),
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      };

      const clickSpy = vi.fn();
      const mockLink = {
        setAttribute: vi.fn((name: string, value: string) => {
          if (name === 'download') downloadFilename = value;
        }),
        click: clickSpy,
      };

      (globalThis as any).window = (globalThis as any).window || {};
      (globalThis as any).document = {
        createElement: vi.fn((tag: string) => {
          if (tag === 'a') return mockLink;
          return {};
        }),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      };

      exportSchoolListToCsv(sampleItems, 'Internal Medicine', 'Alex Rivera');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(downloadFilename).toContain('ERAS_Program_List_Internal_Medicine_Alex_Rivera');
      expect(downloadFilename).toContain('.csv');
      expect(clickSpy).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('<SimplifiedProgramListRoster /> Component', () => {
    it('renders the institutional header, statistics, and high-legibility rows', () => {
      const html = renderToStaticMarkup(
        <SimplifiedProgramListRoster
          studentId="stu-test"
          studentName="Alex Rivera"
          medicalSchool="Geisinger Commonwealth School of Medicine"
          specialty="Internal Medicine"
        />
      );

      // Check header details
      expect(html).toContain('Alex Rivera — ERAS Strategic Program List');
      expect(html).toContain('Geisinger Commonwealth School of Medicine');
      expect(html).toContain('3 Programs Tracked');

      // Check well-defined table columns
      expect(html).toContain('Program &amp; ACGME');
      expect(html).toContain('Location');
      expect(html).toContain('Region');
      expect(html).toContain('Step 2 CK (80%)');
      expect(html).toContain('Preference Signal');
      expect(html).toContain('Selectivity Tier');

      // Check program rows and separated location / region cells
      expect(html).toContain('Massachusetts General Hospital Program');
      expect(html).toContain('Boston, MA');
      expect(html).toContain('New England');

      expect(html).toContain('Geisinger Medical Center Program');
      expect(html).toContain('Danville, PA');
      expect(html).toContain('Middle Atlantic');

      expect(html).toContain('Penn State Milton S. Hershey Medical Center');
      expect(html).toContain('Hershey, PA');

      // Check signals and tiers
      expect(html).toContain('Gold Signal');
      expect(html).toContain('Silver Signal');
      expect(html).toContain('No Signal');
      expect(html).toContain('reach');
      expect(html).toContain('safety');
      expect(html).toContain('target');

      // Check Action Buttons
      expect(html).toContain('Export CSV');
      expect(html).toContain('Print / Save to PDF');
    });

    it('renders empty state nicely when student has no programs added', () => {
      const html = renderToStaticMarkup(
        <SimplifiedProgramListRoster
          studentId="stu-empty"
          studentName="Jordan Lee"
          specialty="Internal Medicine"
        />
      );

      expect(html).toContain('No programs found matching the selected filters');
      expect(html).toContain('Jordan Lee — ERAS Strategic Program List');
    });
  });
});
