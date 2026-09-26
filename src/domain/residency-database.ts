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
      const matchName = p.name.toLowerCase().includes(searchLower);
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
