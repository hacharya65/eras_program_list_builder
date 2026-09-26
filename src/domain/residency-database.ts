import residencyData from '@/data/residency-programs.json';

export type CensusRegion =
  | 'New England'
  | 'Middle Atlantic'
  | 'East North Central'
  | 'West North Central'
  | 'South Atlantic'
  | 'East South Central'
  | 'West South Central'
  | 'Mountain'
  | 'Pacific';

export const CENSUS_DIVISIONS: CensusRegion[] = [
  'New England',
  'Middle Atlantic',
  'East North Central',
  'West North Central',
  'South Atlantic',
  'East South Central',
  'West South Central',
  'Mountain',
  'Pacific',
];

export const STATE_TO_CENSUS_REGION: Record<string, CensusRegion> = {
  // New England: CT, ME, MA, NH, RI, VT
  CT: 'New England',
  ME: 'New England',
  MA: 'New England',
  NH: 'New England',
  RI: 'New England',
  VT: 'New England',

  // Middle Atlantic: NJ, NY, PA
  NJ: 'Middle Atlantic',
  NY: 'Middle Atlantic',
  PA: 'Middle Atlantic',

  // East North Central: IL, IN, MI, OH, WI
  IL: 'East North Central',
  IN: 'East North Central',
  MI: 'East North Central',
  OH: 'East North Central',
  WI: 'East North Central',

  // West North Central: IA, KS, MN, MO, NE, ND, SD
  IA: 'West North Central',
  KS: 'West North Central',
  MN: 'West North Central',
  MO: 'West North Central',
  NE: 'West North Central',
  ND: 'West North Central',
  SD: 'West North Central',

  // South Atlantic: DE, DC, FL, GA, MD, NC, PR, SC, VA, WV
  DE: 'South Atlantic',
  DC: 'South Atlantic',
  FL: 'South Atlantic',
  GA: 'South Atlantic',
  MD: 'South Atlantic',
  NC: 'South Atlantic',
  PR: 'South Atlantic',
  SC: 'South Atlantic',
  VA: 'South Atlantic',
  WV: 'South Atlantic',

  // East South Central: AL, KY, MS, TN
  AL: 'East South Central',
  KY: 'East South Central',
  MS: 'East South Central',
  TN: 'East South Central',

  // West South Central: AR, LA, OK, TX
  AR: 'West South Central',
  LA: 'West South Central',
  OK: 'West South Central',
  TX: 'West South Central',

  // Mountain: AZ, CO, ID, MT, NV, NM, UT, WY
  AZ: 'Mountain',
  CO: 'Mountain',
  ID: 'Mountain',
  MT: 'Mountain',
  NV: 'Mountain',
  NM: 'Mountain',
  UT: 'Mountain',
  WY: 'Mountain',

  // Pacific: AK, CA, HI, OR, WA
  AK: 'Pacific',
  CA: 'Pacific',
  HI: 'Pacific',
  OR: 'Pacific',
  WA: 'Pacific',
};

export function getCensusRegionForState(state: string): CensusRegion {
  const normalized = state?.trim().toUpperCase();
  return STATE_TO_CENSUS_REGION[normalized] || 'Middle Atlantic';
}

export interface ResidencyProgramRecord {
  id: string;
  programNumber?: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
  region: CensusRegion | string;
  address?: string;
  email?: string;
  phone?: string;
  programDirector?: string;
  offersPreliminary?: boolean;
  residencyExplorerUrl?: string;
  doximityUrl?: string;
  // Residency Explorer middle 80% & interview yield data
  step2CkLow?: number;
  step2CkHigh?: number;
  step2ScoreRange?: string;
  silverSignal?: number;
  goldSignal?: number;
  noSignal?: number;
  level2CeRange?: string;
  mdApplicantYield?: number;
}

export interface SearchProgramsQuery {
  specialty?: string;
  region?: string;
  search?: string;
  limit?: number;
}

const typedPrograms: ResidencyProgramRecord[] = residencyData as ResidencyProgramRecord[];

export function getAllResidencyPrograms(): ResidencyProgramRecord[] {
  return typedPrograms;
}

export function getProgramsForSpecialty(specialty: string): ResidencyProgramRecord[] {
  return typedPrograms.filter((p) => p.specialty.toLowerCase() === specialty.toLowerCase());
}

export function formatProgramDisplayName(p: {
  name?: string;
  programName?: string;
  address?: string;
  city?: string;
  state?: string;
}): string {
  if (!p) return '';
  const baseName = (p.name || p.programName || '').trim();
  const addr = (p.address || '').trim();

  // If name is just "University" or "Medical College" or "Hospital" or "Center"
  if (/^(university|medical college|hospital|center)$/i.test(baseName)) {
    const cleanedAddr = addr.replace(/^of,?\s+/i, 'of ').replace(/^at,?\s+/i, 'at ');
    const match = cleanedAddr.match(/^([A-Za-z0-9\s\(\)\-\/&]+?)(?:,\s*Program|\s+Program|,|\n|$)/i);
    if (match && match[1].trim()) {
      const suffix = match[1].trim().replace(/^,\s*/, '').replace(/\s+,/g, ',');
      return `${baseName} ${suffix}`.replace(/\s+/g, ' ');
    }
  }

  // 1. Tag in leading parentheses: "(Columbia, Campus)" -> "Columbia Campus"
  const leadingParenMatch = addr.match(/^\s*\(([^)]+)\)/);
  if (leadingParenMatch) {
    const rawTag = leadingParenMatch[1].replace(/,\s*/g, ' ').trim();
    if (rawTag && !baseName.toLowerCase().includes(rawTag.toLowerCase())) {
      return `${baseName} (${rawTag})`;
    }
  }

  // 2. Mayo Clinic pattern: "of Medicine and Science, (Jacksonville) Program"
  const mayoMatch = addr.match(/of Medicine and Science,?\s*\(([^)]+)\)/i);
  if (mayoMatch) {
    const rawTag = mayoMatch[1].replace(/,\s*/g, ' ').trim();
    if (rawTag && !baseName.toLowerCase().includes(rawTag.toLowerCase())) {
      return `${baseName} (${rawTag})`;
    }
  }

  // 3. Creighton / School of Medicine pattern: "School of Medicine-, Phoenix Program" or "School of Medicine, (Omaha) Program"
  const schoolMatch = addr.match(/School of Medicine-?,?\s*(?:\(([^)]+)\)|([A-Za-z\s]+?))\s+Program/i);
  if (schoolMatch) {
    const rawTag = (schoolMatch[1] || schoolMatch[2]).replace(/,\s*/g, ' ').trim();
    if (rawTag && !baseName.toLowerCase().includes(rawTag.toLowerCase()) && !/^(program|department)$/i.test(rawTag)) {
      return `${baseName} (${rawTag})`;
    }
  }

  // 4. Any other "(<Campus/City>) Program" in address
  const parenProgramMatch = addr.match(/\(([^)]+)\)\s+Program/i);
  if (parenProgramMatch) {
    const rawTag = parenProgramMatch[1].replace(/,\s*/g, ' ').trim();
    if (rawTag && !baseName.toLowerCase().includes(rawTag.toLowerCase())) {
      return `${baseName} (${rawTag})`;
    }
  }

  // 5. Larkin Community Hospital campus
  if (baseName.toLowerCase().includes('larkin')) {
    if (addr.toLowerCase().includes('palm springs') && !baseName.toLowerCase().includes('palm springs')) {
      return `${baseName} (Palm Springs Campus)`;
    }
    if (addr.toLowerCase().includes('south miami') && !baseName.toLowerCase().includes('south miami')) {
      return `${baseName} (South Miami Campus)`;
    }
  }

  // 6. Louisiana State University (New Orleans vs Shreveport)
  if (baseName === 'Louisiana State University' && p.city === 'New Orleans' && !addr.includes('Shreveport')) {
    return `${baseName} (New Orleans)`;
  }

  return baseName;
}

export function searchResidencyPrograms(query: SearchProgramsQuery): ResidencyProgramRecord[] {
  const { specialty, region, search, limit = 50 } = query;
  const searchLower = search ? search.toLowerCase().trim() : '';

  const filtered = typedPrograms.filter((p) => {
    if (specialty && specialty !== 'All' && p.specialty.toLowerCase() !== specialty.toLowerCase()) {
      return false;
    }
    if (region && region !== 'All') {
      const rLower = region.toLowerCase();
      // Support 9 Census divisions directly, plus legacy broad regions
      if (rLower === 'northeast') {
        if (p.region !== 'New England' && p.region !== 'Middle Atlantic') return false;
      } else if (rLower === 'midwest') {
        if (p.region !== 'East North Central' && p.region !== 'West North Central') return false;
      } else if (rLower === 'south') {
        if (
          p.region !== 'South Atlantic' &&
          p.region !== 'East South Central' &&
          p.region !== 'West South Central'
        ) {
          return false;
        }
      } else if (rLower === 'west') {
        if (p.region !== 'Mountain' && p.region !== 'Pacific') return false;
      } else if (p.region.toLowerCase() !== rLower) {
        return false;
      }
    }
    if (searchLower) {
      const displayName = formatProgramDisplayName(p).toLowerCase();
      const matchName = displayName.includes(searchLower) || p.name.toLowerCase().includes(searchLower);
      const matchCity = p.city.toLowerCase().includes(searchLower);
      const matchState = p.state.toLowerCase().includes(searchLower);
      const matchDirector = p.programDirector
        ? p.programDirector.toLowerCase().includes(searchLower)
        : false;
      const matchId = p.id.includes(searchLower);
      const matchNum = p.programNumber ? p.programNumber.includes(searchLower) : false;
      const matchAddr = p.address ? p.address.toLowerCase().includes(searchLower) : false;
      if (!matchName && !matchCity && !matchState && !matchDirector && !matchId && !matchNum && !matchAddr) {
        return false;
      }
    }
    return true;
  });

  return filtered.slice(0, limit);
}

export function getResidencyProgramById(id: string): ResidencyProgramRecord | undefined {
  return typedPrograms.find((p) => p.id === id || p.programNumber === id);
}

