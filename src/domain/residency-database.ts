import residencyData from '@/data/residency-programs.json';

export interface ResidencyProgramRecord {
  id: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
  region: 'Northeast' | 'Midwest' | 'South' | 'West' | 'National' | string;
  email?: string;
  phone?: string;
  programDirector?: string;
  offersPreliminary?: boolean;
  residencyExplorerUrl?: string;
  doximityUrl?: string;
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

export function searchResidencyPrograms(query: SearchProgramsQuery): ResidencyProgramRecord[] {
  const { specialty, region, search, limit = 50 } = query;
  const searchLower = search ? search.toLowerCase().trim() : '';

  const filtered = typedPrograms.filter((p) => {
    if (specialty && specialty !== 'All' && p.specialty.toLowerCase() !== specialty.toLowerCase()) {
      return false;
    }
    if (region && region !== 'All' && p.region.toLowerCase() !== region.toLowerCase()) {
      return false;
    }
    if (searchLower) {
      const matchName = p.name.toLowerCase().includes(searchLower);
      const matchCity = p.city.toLowerCase().includes(searchLower);
      const matchState = p.state.toLowerCase().includes(searchLower);
      const matchDirector = p.programDirector ? p.programDirector.toLowerCase().includes(searchLower) : false;
      const matchId = p.id.includes(searchLower);
      if (!matchName && !matchCity && !matchState && !matchDirector && !matchId) {
        return false;
      }
    }
    return true;
  });

  return filtered.slice(0, limit);
}

export function getResidencyProgramById(id: string): ResidencyProgramRecord | undefined {
  return typedPrograms.find((p) => p.id === id);
}
