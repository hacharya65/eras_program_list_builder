/**
 * Deep Alumni Registry Module
 * 
 * Unifies ACGME master program database cross-referencing, perpetual PGY predictions,
 * batch Match Day roster ingestion, and live mentorship directory queries into a single deep module.
 * 
 * Purges stale static default parameter traps.
 */

import {
  AlumniResident,
  ProgramAlumniSummary,
  OutreachTemplate,
  SAMPLE_ALUMNI_ROSTER,
  calculateCurrentPgy,
  getNonRoboticOutreachGuide,
  generateDoximityProgramUrl,
} from './alumni-models';
import {
  parseMatchDayRosterText,
  crossReferenceRosterProgram,
  ParsedRosterEntry,
} from './alumni-roster-parser';
import { getAllResidencyPrograms, ResidencyProgramRecord } from './residency-database';

export interface BatchImportResult {
  importedCount: number;
  matchedCount: number;
  unmatchedCount: number;
  entries: AlumniResident[];
}

export class AlumniRegistry {
  private roster: AlumniResident[];
  private allPrograms: ResidencyProgramRecord[];

  constructor(initialRoster?: AlumniResident[]) {
    this.roster = initialRoster ? [...initialRoster] : [...SAMPLE_ALUMNI_ROSTER];
    this.allPrograms = getAllResidencyPrograms();
  }

  getAllAlumni(): AlumniResident[] {
    return [...this.roster];
  }

  getAlumniForProgram(institutionName: string, specialty?: string): AlumniResident[] {
    if (!institutionName?.trim()) return [];
    const query = institutionName.trim().toLowerCase();

    return this.roster.filter((alum) => {
      const instMatch =
        alum.institutionName.toLowerCase().includes(query) ||
        query.includes(alum.institutionName.toLowerCase());
      if (!instMatch) return false;
      if (specialty) {
        return alum.specialty.toLowerCase() === specialty.toLowerCase();
      }
      return true;
    });
  }

  getProgramSummary(
    institutionName: string,
    specialty: string = 'Internal Medicine'
  ): ProgramAlumniSummary {
    const residents = this.getAlumniForProgram(institutionName, specialty);
    const years = Array.from(new Set(residents.map((r) => r.graduationYear))).sort((a, b) => b - a);

    return {
      institutionName,
      specialty,
      totalAlumni: residents.length,
      availableMentors: residents.filter((r) => r.isAvailableForMentorship).length,
      recentMatchYears: years,
      doximityReviewUrl: generateDoximityProgramUrl(institutionName, specialty),
      residents,
    };
  }

  searchAlumni(query: {
    specialty?: string;
    searchTerm?: string;
    availableOnly?: boolean;
    minGraduationYear?: number;
  }): AlumniResident[] {
    return this.roster.filter((alum) => {
      if (query.specialty && query.specialty !== 'All Specialties') {
        if (alum.specialty.toLowerCase() !== query.specialty.toLowerCase()) return false;
      }
      if (query.availableOnly && !alum.isAvailableForMentorship) {
        return false;
      }
      if (query.minGraduationYear && alum.graduationYear < query.minGraduationYear) {
        return false;
      }
      if (query.searchTerm?.trim()) {
        const q = query.searchTerm.toLowerCase().trim();
        const matches =
          alum.name.toLowerCase().includes(q) ||
          alum.institutionName.toLowerCase().includes(q) ||
          alum.specialty.toLowerCase().includes(q) ||
          alum.programCity.toLowerCase().includes(q) ||
          alum.programState.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }

  addAlumnus(
    resident: Omit<AlumniResident, 'id'> | (Omit<AlumniResident, 'id' | 'currentPgy'> & { currentPgy?: string })
  ): AlumniResident {
    if (!resident.name?.trim()) throw new Error('Alumni validation: Name is required.');
    if (!resident.institutionName?.trim()) throw new Error('Alumni validation: Institution is required.');
    if (!resident.specialty?.trim()) throw new Error('Alumni validation: Specialty is required.');

    const newResident: AlumniResident = {
      ...resident,
      id: `alum-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: resident.name.trim(),
      institutionName: resident.institutionName.trim(),
      specialty: resident.specialty.trim(),
      currentPgy: resident.currentPgy || calculateCurrentPgy(resident.graduationYear),
    };

    this.roster.push(newResident);
    return newResident;
  }

  updateAlumnus(id: string, updates: Partial<AlumniResident>): AlumniResident | null {
    const idx = this.roster.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.roster[idx] = { ...this.roster[idx], ...updates };
    return this.roster[idx];
  }

  deleteAlumnus(id: string): boolean {
    const initialLen = this.roster.length;
    this.roster = this.roster.filter((a) => a.id !== id);
    return this.roster.length < initialLen;
  }

  /**
   * Atomic batch ingestion of raw Match Day text.
   * Parses, cross-references against ACGME, auto-calculates PGY, and adds to registry.
   */
  importMatchRoster(params: {
    rawText: string;
    graduationYear: number;
    medicalSchool?: string;
  }): BatchImportResult {
    const { rawText, graduationYear, medicalSchool = 'Geisinger Commonwealth School of Medicine' } = params;

    const parsedEntries = parseMatchDayRosterText(rawText, graduationYear, this.allPrograms);

    let matchedCount = 0;
    let unmatchedCount = 0;
    const addedEntries: AlumniResident[] = [];

    for (const entry of parsedEntries) {
      if (entry.confidence !== 'none') {
        matchedCount += 1;
      } else {
        unmatchedCount += 1;
      }

      const resident: AlumniResident = {
        id: `alum-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: entry.name,
        graduationYear: entry.graduationYear,
        currentPgy: entry.currentPgy || calculateCurrentPgy(entry.graduationYear),
        medicalSchool: entry.medicalSchool,
        institutionName: entry.institutionName,
        specialty: entry.specialty,
        programCity: entry.programCity,
        programState: entry.programState,
        email: entry.email,
        isAvailableForMentorship: entry.isAvailableForMentorship,
        contactPreference: entry.contactPreference,
        verificationStatus: entry.verificationStatus,
        lastVerifiedPeriod: entry.lastVerifiedPeriod,
        lastVerifiedAt: entry.lastVerifiedAt,
      };

      this.roster.push(resident);
      addedEntries.push(resident);
    }

    return {
      importedCount: addedEntries.length,
      matchedCount,
      unmatchedCount,
      entries: addedEntries,
    };
  }

  generateOutreachTemplate(params: {
    studentName: string;
    mentorName: string;
    programName: string;
    specialty: string;
  }): OutreachTemplate {
    return getNonRoboticOutreachGuide(
      params.studentName,
      params.mentorName,
      params.programName,
      params.specialty
    );
  }
}

export const defaultAlumniRegistry = new AlumniRegistry();
