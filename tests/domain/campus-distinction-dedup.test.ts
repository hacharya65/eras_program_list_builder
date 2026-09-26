import { describe, it, expect } from 'vitest';
import {
  formatProgramDisplayName,
  searchResidencyPrograms,
  getResidencyProgramById,
} from '@/domain/residency-database';

describe('School List Matrix: Multi-Campus & Identical-Name Program Distinction', () => {
  it('correctly formats and distinguishes distinct campuses for institutions sharing the same base name', () => {
    // 1. New York Presbyterian Hospital (Columbia vs Cornell)
    const nypColumbia = getResidencyProgramById('1403511297'); // Internal Medicine Columbia
    const nypCornell = getResidencyProgramById('1403521270'); // Internal Medicine Cornell

    expect(nypColumbia).toBeDefined();
    expect(nypCornell).toBeDefined();
    expect(nypColumbia?.name).toBe('New York Presbyterian Hospital');
    expect(nypCornell?.name).toBe('New York Presbyterian Hospital');
    expect(nypColumbia?.id).not.toBe(nypCornell?.id);

    const columbiaDisplay = formatProgramDisplayName(nypColumbia!);
    const cornellDisplay = formatProgramDisplayName(nypCornell!);

    expect(columbiaDisplay).toContain('Columbia Campus');
    expect(cornellDisplay).toContain('Cornell Campus');
    expect(columbiaDisplay).not.toBe(cornellDisplay);

    // 2. Mayo Clinic College (Jacksonville vs Rochester vs Scottsdale)
    const mayoJax = getResidencyProgramById('1401121509');
    const mayoRoch = getResidencyProgramById('1402621208');
    const mayoScotts = getResidencyProgramById('1400321512');

    expect(mayoJax).toBeDefined();
    expect(mayoRoch).toBeDefined();
    expect(mayoScotts).toBeDefined();

    const jaxDisplay = formatProgramDisplayName(mayoJax!);
    const rochDisplay = formatProgramDisplayName(mayoRoch!);
    const scottsDisplay = formatProgramDisplayName(mayoScotts!);

    expect(jaxDisplay).toContain('Jacksonville');
    expect(rochDisplay).toContain('Rochester');
    expect(scottsDisplay).toContain('Scottsdale');
    expect(jaxDisplay).not.toBe(rochDisplay);

    // 3. Creighton University (Omaha vs Phoenix vs East Valley)
    const creightonOmaha = getResidencyProgramById('1403021222');
    const creightonPhoenix = getResidencyProgramById('1400311027');

    expect(creightonOmaha).toBeDefined();
    expect(creightonPhoenix).toBeDefined();

    const omahaDisplay = formatProgramDisplayName(creightonOmaha!);
    const phoenixDisplay = formatProgramDisplayName(creightonPhoenix!);

    expect(omahaDisplay).toContain('Omaha');
    expect(phoenixDisplay).toContain('Phoenix');
    expect(omahaDisplay).not.toBe(phoenixDisplay);

    // 4. Naval Medical Center (Portsmouth vs San Diego)
    const navalPortsmouth = getResidencyProgramById('1405111014');
    const navalSanDiego = getResidencyProgramById('1400512012');

    expect(navalPortsmouth).toBeDefined();
    expect(navalSanDiego).toBeDefined();

    const portsmouthDisplay = formatProgramDisplayName(navalPortsmouth!);
    const sanDiegoDisplay = formatProgramDisplayName(navalSanDiego!);

    expect(portsmouthDisplay).toContain('Portsmouth');
    expect(sanDiegoDisplay).toContain('San Diego');
  });

  it('allows both Columbia and Cornell campuses to be added independently by ACGME program ID', () => {
    const nypColumbia = getResidencyProgramById('1403511297')!;
    const nypCornell = getResidencyProgramById('1403521270')!;

    // Simulated existing items in applicant School List containing Columbia
    const existingItems = [
      {
        id: 'item-1',
        programId: nypColumbia.id,
        programNumber: nypColumbia.programNumber || nypColumbia.id,
        programName: formatProgramDisplayName(nypColumbia),
        specialty: nypColumbia.specialty,
        city: nypColumbia.city,
        state: nypColumbia.state,
      },
    ];

    // Helper checking if a program is already in the list
    const isProgramInList = (prog: typeof nypColumbia, list: typeof existingItems) => {
      const displayName = formatProgramDisplayName(prog);
      return list.some(
        (i) =>
          (i.programId && (i.programId === prog.id || i.programId === prog.programNumber)) ||
          (i.programNumber && (i.programNumber === prog.id || i.programNumber === prog.programNumber)) ||
          (i.programName.toLowerCase() === displayName.toLowerCase() &&
            i.city?.toLowerCase() === prog.city?.toLowerCase() &&
            i.state?.toLowerCase() === prog.state?.toLowerCase())
      );
    };

    // Columbia should be detected as already added
    expect(isProgramInList(nypColumbia, existingItems)).toBe(true);

    // Cornell MUST NOT be conflated with Columbia, and should be eligible to add!
    expect(isProgramInList(nypCornell, existingItems)).toBe(false);

    // Add Cornell to the list
    const updatedList = [
      ...existingItems,
      {
        id: 'item-2',
        programId: nypCornell.id,
        programNumber: nypCornell.programNumber || nypCornell.id,
        programName: formatProgramDisplayName(nypCornell),
        specialty: nypCornell.specialty,
        city: nypCornell.city,
        state: nypCornell.state,
      },
    ];

    // Now both should be in the list as distinct entries
    expect(updatedList.length).toBe(2);
    expect(isProgramInList(nypColumbia, updatedList)).toBe(true);
    expect(isProgramInList(nypCornell, updatedList)).toBe(true);
    expect(updatedList[0].programName).not.toBe(updatedList[1].programName);
  });

  it('enables keyword searching by campus (e.g. "Cornell", "Columbia", "Jacksonville")', () => {
    const columbiaResults = searchResidencyPrograms({
      specialty: 'Internal Medicine',
      search: 'Columbia',
    });
    expect(columbiaResults.some((p) => p.id === '1403511297')).toBe(true);

    const cornellResults = searchResidencyPrograms({
      specialty: 'Internal Medicine',
      search: 'Cornell',
    });
    expect(cornellResults.some((p) => p.id === '1403521270')).toBe(true);
  });
});
