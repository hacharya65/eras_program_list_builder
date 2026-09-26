# Issue 22: Multi-Campus & Identical-Name Institution Disambiguation

## Status
- **Type**: Bugfix / Enhancement
- **Priority**: High
- **Status**: Completed

## Problem Statement
In the School List Matrix, institutions with identical base names (e.g. *New York Presbyterian Hospital* with independent Columbia and Cornell campuses, *Mayo Clinic College* in Jacksonville vs Rochester vs Scottsdale, *Creighton University* in Omaha vs Phoenix, *Naval Medical Center* in Portsmouth vs San Diego, and *Louisiana State University* in New Orleans vs Shreveport) were previously conflated as the same institution.
Because deduplication checked solely against `prog.name.toLowerCase() === item.programName.toLowerCase()`, adding one campus blocked adding the other. Furthermore, if added, rows displayed identical names without clarifying the campus/branch.

## Root Causes
1. **Name-Only Deduplication Check**: `handleAddFromDatabase` and browse modal checks in `SchoolListMatrix.tsx` checked `prog.name` rather than unique ACGME IDs (`prog.id`, `prog.programNumber`).
2. **Missing Campus Qualifier in Display**: Raw scraped names in `residency-programs.json` held identical base names while the campus details resided in the address field (`(Columbia, Campus)`, `(Cornell, Campus)`, `(Jacksonville)`, `(Phoenix)`, etc.).

## Changes Implemented
1. **`formatProgramDisplayName(prog)` in `src/domain/residency-database.ts`**:
   - Parses campus qualifiers from leading parentheses (e.g. `(Columbia, Campus)` -> `New York Presbyterian Hospital (Columbia Campus)`).
   - Extracts Mayo Clinic campus city tags (`(Jacksonville)`, `(Rochester)`, `(Scottsdale)`).
   - Extracts Creighton University campus tags (`(Phoenix)`, `(Omaha)`).
   - Disambiguates Naval Medical Centers (`Portsmouth`, `San Diego`).
   - Disambiguates Larkin campuses (`South Miami`, `Palm Springs`).
   - Reconstructs truncated names (e.g. `University` -> `University at Buffalo`, `University of Alabama Hospital (Birmingham)`).
   - Supports search filtering by campus keyword directly in `searchResidencyPrograms`.
2. **School List Matrix Deduplication & Display (`src/components/SchoolListMatrix.tsx`)**:
   - Deduplication compares ACGME ID (`programId`, `programNumber`) and formatted name + city + state.
   - Distinct campuses sharing the same parent hospital can now be added independently.
   - Display renders formatted campus names in both search results and table rows.
   - Table search filter supports searching by campus name (e.g. "Columbia" or "Cornell").
3. **Model & Rehydration Integration (`src/domain/school-list-models.ts`)**:
   - `loadItemsForSpecialty` formats program display names for initial items.

## Verification
- Stored tests in `tests/domain/campus-distinction-dedup.test.ts` (3/3 passing).
- Full test suite passing (19 test files, 121 tests passing).
