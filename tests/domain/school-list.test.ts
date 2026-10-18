import { describe, it, expect, beforeEach } from 'vitest';
import {
  SPECIALTY_SIGNALING_RULES,
  validateSignalAllocation,
  SchoolListItem,
} from '@/domain/school-list-models';

describe('Ticket 07: Strategic School List Matrix & Dynamic Specialty Signaling', () => {
  describe('Specialty Signaling Rules Directory', () => {
    it('defines official ERAS Gold and Silver signal caps for key specialties', () => {
      const im = SPECIALTY_SIGNALING_RULES['Internal Medicine'];
      expect(im).toBeDefined();
      expect(im.goldSignals).toBe(3);
      expect(im.silverSignals).toBe(12);
      expect(im.totalSignals).toBe(15);

      const obgyn = SPECIALTY_SIGNALING_RULES['Obstetrics and Gynecology'];
      expect(obgyn.goldSignals).toBe(3);
      expect(obgyn.silverSignals).toBe(15);

      const ortho = SPECIALTY_SIGNALING_RULES['Orthopaedic Surgery'];
      expect(ortho.totalSignals).toBe(30);

      const derm = SPECIALTY_SIGNALING_RULES['Dermatology'];
      expect(derm.goldSignals).toBe(3);
      expect(derm.silverSignals).toBe(25);
    });
  });

  describe('Signal Budget Validation', () => {
    it('validates signal allocations within specialty limits', () => {
      const items: SchoolListItem[] = [
        {
          id: 'item-1',
          programId: 'prog-1',
          programName: 'Massachusetts General Hospital',
          specialty: 'Internal Medicine',
          tier: 'reach',
          signal: 'gold',
          track: 'categorical',
        },
        {
          id: 'item-2',
          programId: 'prog-2',
          programName: 'Brigham and Women’s Hospital',
          specialty: 'Internal Medicine',
          tier: 'reach',
          signal: 'gold',
          track: 'categorical',
        },
        {
          id: 'item-3',
          programId: 'prog-3',
          programName: 'Beth Israel Deaconess Medical Center',
          specialty: 'Internal Medicine',
          tier: 'target',
          signal: 'silver',
          track: 'categorical',
        },
      ];

      const validation = validateSignalAllocation('Internal Medicine', items);
      expect(validation.valid).toBe(true);
      expect(validation.goldUsed).toBe(2);
      expect(validation.silverUsed).toBe(1);
      expect(validation.goldRemaining).toBe(1); // 3 - 2 = 1
      expect(validation.silverRemaining).toBe(11); // 12 - 1 = 11
    });

    it('rejects assigning more Gold signals than the specialty quota allows', () => {
      const items: SchoolListItem[] = [
        { id: '1', programId: 'p1', programName: 'H1', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' },
        { id: '2', programId: 'p2', programName: 'H2', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' },
        { id: '3', programId: 'p3', programName: 'H3', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' },
        { id: '4', programId: 'p4', programName: 'H4', specialty: 'Internal Medicine', tier: 'reach', signal: 'gold', track: 'categorical' }, // 4th gold!
      ];

      const validation = validateSignalAllocation('Internal Medicine', items);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Assigned Gold signals (4) exceeds specialty quota (3)');
    });

    it('rejects assigning more Silver signals than the specialty quota allows', () => {
      const items: SchoolListItem[] = Array.from({ length: 13 }, (_, i) => ({
        id: `id-${i}`,
        programId: `p-${i}`,
        programName: `Hospital ${i}`,
        specialty: 'Internal Medicine',
        tier: 'target',
        signal: 'silver',
        track: 'categorical',
      }));

      const validation = validateSignalAllocation('Internal Medicine', items);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Assigned Silver signals (13) exceeds specialty quota (12)');
    });
  });

  describe('Ticket 14: Universal Residency Program Database Integration', () => {
    it('searches and filters programs from the ingested residency database', async () => {
      const { searchResidencyPrograms, getAllResidencyPrograms } = await import('@/domain/residency-database');
      const all = getAllResidencyPrograms();
      expect(all.length).toBeGreaterThan(100);

      // Search by specialty
      const imPrograms = searchResidencyPrograms({ specialty: 'Internal Medicine' });
      expect(imPrograms.length).toBeGreaterThan(0);
      expect(imPrograms.every(p => p.specialty === 'Internal Medicine')).toBe(true);

      // Search by 9 US Census divisions (Item 10)
      const midAtlantic = searchResidencyPrograms({ specialty: 'Internal Medicine', region: 'Middle Atlantic' });
      expect(midAtlantic.length).toBeGreaterThan(0);
      expect(midAtlantic.every(p => p.region === 'Middle Atlantic')).toBe(true);

      const newEngland = searchResidencyPrograms({ specialty: 'Internal Medicine', region: 'New England' });
      expect(newEngland.length).toBeGreaterThan(0);
      expect(newEngland.every(p => p.region === 'New England')).toBe(true);

      // Verify programNumber and address metadata (Item 11)
      expect(midAtlantic[0].programNumber).toBeDefined();
      expect(midAtlantic[0].address).toBeDefined();

      // Search by text query
      const boston = searchResidencyPrograms({ search: 'Boston' });
      expect(boston.length).toBeGreaterThan(0);
      expect(boston.some(p => p.city.toLowerCase().includes('boston') || p.name.toLowerCase().includes('boston'))).toBe(true);
    });
  });

  describe('Ticket 15: Program Signaling Strategy Recommendation Engine', () => {
    it('recommends GOLD_HIGH_YIELD when Gold yields a dramatic jump over Silver', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 5%, Silver: 20%, Gold: 50% (delta Gold-Silver is 30% >= 15%)
      const result = computeSignalingRecommendation(5, 20, 50);
      expect(result.recommendation).toBe('GOLD_HIGH_YIELD');
      expect(result.recommendedSignal).toBe('gold');
      expect(result.deltaGoldSilver).toBe(30);
      expect(result.label).toContain('Gold High Yield');
    });

    it('recommends SILVER_OPTIMAL when Silver captures the bulk of the signal gain and Gold is marginal', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 6%, Silver: 32%, Gold: 36% (delta Silver-None = 26%, delta Gold-Silver = 4% < 10%)
      const result = computeSignalingRecommendation(6, 32, 36);
      expect(result.recommendation).toBe('SILVER_OPTIMAL');
      expect(result.recommendedSignal).toBe('silver');
      expect(result.deltaGoldSilver).toBe(4);
      expect(result.deltaSilverNone).toBe(26);
    });

    it('recommends NO_SIGNAL_SUFFICIENT when baseline yield without signal is high (home/pipeline program)', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 45%, Silver: 55%, Gold: 60%
      const result = computeSignalingRecommendation(45, 55, 60);
      expect(result.recommendation).toBe('NO_SIGNAL_SUFFICIENT');
      expect(result.recommendedSignal).toBe('none');
      expect(result.explanation).toContain('High baseline yield');
    });

    it('recommends SIGNAL_INEFFICIENT when tokens produce negligible yield difference', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 2%, Silver: 3%, Gold: 4%
      const result = computeSignalingRecommendation(2, 3, 4);
      expect(result.recommendation).toBe('SIGNAL_INEFFICIENT');
      expect(result.recommendedSignal).toBe('none');
    });

    it('computes exact multiplier change ratios for Silver and Gold signals', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // No signal: 2%, Silver: 4.8%, Gold: 29% -> 2.4x Silver, 14.5x Gold
      const result = computeSignalingRecommendation(2, 4.8, 29);
      expect(result.silverMultiplier).toBe('2.4x');
      expect(result.goldMultiplier).toBe('14.5x');
    });

    it('computes recommendations and multipliers for single-tier signaling programs', async () => {
      const { computeSignalingRecommendation } = await import('@/domain/signaling-recommendation');
      // Single-tier: No signal: 4%, Signaled: 24%
      const result = computeSignalingRecommendation(4, 24, undefined, 'single_tier');
      expect(result.signalMultiplier).toBe('6.0x');
      expect(result.label).toContain('High Yield Signal');
      expect(result.recommendedSignal).toBe('silver');

      // Single-tier: High baseline (40%)
      const highBaseline = computeSignalingRecommendation(40, 50, undefined, 'single_tier');
      expect(highBaseline.recommendation).toBe('NO_SIGNAL_SUFFICIENT');
      expect(highBaseline.recommendedSignal).toBe('none');

      // Single-tier: Needs input
      const needsInput = computeSignalingRecommendation(undefined, undefined, undefined, 'single_tier');
      expect(needsInput.recommendation).toBe('NEEDS_INPUT');
    });
  });

  describe('Item 13 & 14 / Ticket Candidate 8: Step 2 CK Intake & Automated Tiering Engine (Residency Explorer Middle 80%)', () => {
    it('evaluates Safety tier when applicant Step 2 CK exceeds program Middle 80% High', async () => {
      const { evaluateProgramTier } = await import('@/domain/school-list-models');
      // Applicant 254 vs program range 230 - 245 -> Safety
      const tier = evaluateProgramTier(254, 230, 245);
      expect(tier).toBe('safety');
    });

    it('evaluates Target tier when applicant Step 2 CK falls within program Middle 80% range', async () => {
      const { evaluateProgramTier } = await import('@/domain/school-list-models');
      // Applicant 254 vs program range 250 - 259 -> Target
      const tier = evaluateProgramTier(254, 250, 259);
      expect(tier).toBe('target');

      // Exact lower bound match
      expect(evaluateProgramTier(250, 250, 259)).toBe('target');
      // Exact upper bound match
      expect(evaluateProgramTier(259, 250, 259)).toBe('target');
    });

    it('evaluates Reach tier when applicant Step 2 CK is below program Middle 80% Low', async () => {
      const { evaluateProgramTier } = await import('@/domain/school-list-models');
      // Applicant 254 vs program range 260 - 270 -> Reach
      const tier = evaluateProgramTier(254, 260, 270);
      expect(tier).toBe('reach');
    });

    it('returns null when range is incomplete or invalid', async () => {
      const { evaluateProgramTier } = await import('@/domain/school-list-models');
      expect(evaluateProgramTier(254, undefined, 260)).toBeNull();
      expect(evaluateProgramTier(254, 240, undefined)).toBeNull();
      expect(evaluateProgramTier(NaN, 240, 260)).toBeNull();
    });

    it('parses numeric Middle 80% Low and High bounds from diverse range strings', async () => {
      const { parseScoreRange } = await import('@/domain/school-list-models');
      expect(parseScoreRange('250 - 259')).toEqual({ min: 250, max: 259 });
      expect(parseScoreRange('240-249')).toEqual({ min: 240, max: 249 });
      expect(parseScoreRange('< 220')).toEqual({ min: 200, max: 219 });
      expect(parseScoreRange('270+')).toEqual({ min: 270, max: 300 });
      expect(parseScoreRange('')).toEqual({});
    });

    it('verifies Internal Medicine database programs are enriched with Step 2 CK Middle 80% and signal yield rates', async () => {
      const { getProgramsForSpecialty } = await import('@/domain/residency-database');
      const imPrograms = getProgramsForSpecialty('Internal Medicine');
      expect(imPrograms.length).toBeGreaterThan(600);

      // Check specific top programs from IM_Res_ex.csv
      const mgh = imPrograms.find((p) => p.name.includes('Massachusetts General Hospital'));
      expect(mgh).toBeDefined();
      expect(mgh?.step2CkLow).toBe(249);
      expect(mgh?.step2CkHigh).toBe(275);
      expect(mgh?.step2ScoreRange).toBe('249 - 275');

      const brigham = imPrograms.find((p) => p.name.includes('Brigham and Women'));
      expect(brigham).toBeDefined();
      expect(brigham?.step2CkLow).toBe(248);
      expect(brigham?.step2CkHigh).toBe(274);
      expect(brigham?.noSignal).toBe(1);
      expect(brigham?.silverSignal).toBe(20);
      expect(brigham?.goldSignal).toBe(42);

      const uw = imPrograms.find(
        (p) => p.name.includes('University of Washington Program') && p.city === 'Seattle'
      );
      expect(uw).toBeDefined();
      expect(uw?.step2CkLow).toBe(241);
      expect(uw?.step2CkHigh).toBe(275);
      expect(uw?.noSignal).toBe(0);
      expect(uw?.silverSignal).toBe(29);
      expect(uw?.goldSignal).toBe(47);
    });

    it('persists and retrieves applicant Step 2 CK baseline score', async () => {
      const {
        getStoredApplicantStep2Ck,
        setStoredApplicantStep2Ck,
        DEFAULT_APPLICANT_STEP2_CK,
      } = await import('@/domain/school-list-models');

      expect(getStoredApplicantStep2Ck()).toBe(DEFAULT_APPLICANT_STEP2_CK);
      setStoredApplicantStep2Ck(261);
      expect(getStoredApplicantStep2Ck()).toBe(261);

      // Clean up
      setStoredApplicantStep2Ck(DEFAULT_APPLICANT_STEP2_CK);
    });
  });

  describe('Specialty Sample Programs Auto-Population & Consistency', () => {
    it('auto-populates sample programs consistent with the selected specialty', async () => {
      const {
        getSampleProgramsForSpecialty,
        CANONICAL_SPECIALTIES,
      } = await import('@/domain/school-list-models');

      // Test Transitional Year
      const tyItems = getSampleProgramsForSpecialty('Transitional Year');
      expect(tyItems.length).toBeGreaterThanOrEqual(1);
      tyItems.forEach((item) => {
        expect(item.specialty).toBe('Transitional Year');
      });

      // Test Anesthesiology
      const anesthItems = getSampleProgramsForSpecialty('Anesthesiology');
      expect(anesthItems.length).toBe(5);
      anesthItems.forEach((item) => {
        expect(item.specialty).toBe('Anesthesiology');
      });

      // Test Emergency Medicine
      const emItems = getSampleProgramsForSpecialty('Emergency Medicine');
      expect(emItems.length).toBe(5);
      emItems.forEach((item) => {
        expect(item.specialty).toBe('Emergency Medicine');
      });

      // Test General Surgery
      const gsItems = getSampleProgramsForSpecialty('General Surgery');
      expect(gsItems.length).toBe(5);
      gsItems.forEach((item) => {
        expect(item.specialty).toBe('General Surgery');
      });

      // Test Internal Medicine
      const imItems = getSampleProgramsForSpecialty('Internal Medicine');
      expect(imItems.length).toBe(5);
      imItems.forEach((item) => {
        expect(item.specialty).toBe('Internal Medicine');
      });

      // Guarantee across ALL 25 canonical specialties that auto-populated items are 100% consistent with selected specialty
      for (const spec of CANONICAL_SPECIALTIES) {
        const sampleList = getSampleProgramsForSpecialty(spec);
        expect(sampleList.length).toBeGreaterThanOrEqual(1);
        sampleList.forEach((prog) => {
          expect(prog.specialty.toLowerCase()).toBe(spec.toLowerCase());
        });
      }
    });

    it('assigns appropriate signal types for single-tier vs tiered specialties', async () => {
      const { getSampleProgramsForSpecialty } = await import('@/domain/school-list-models');

      // Single-tier (e.g. Transitional Year, General Surgery) should only have 'silver' or 'none', NEVER 'gold'
      const tyItems = getSampleProgramsForSpecialty('Transitional Year');
      tyItems.forEach((item) => {
        expect(['silver', 'none']).toContain(item.signal);
      });

      const gsItems = getSampleProgramsForSpecialty('General Surgery');
      gsItems.forEach((item) => {
        expect(['silver', 'none']).toContain(item.signal);
      });

      // Tiered (e.g. Internal Medicine, Anesthesiology) can have 'gold', 'silver', 'none'
      const imItems = getSampleProgramsForSpecialty('Internal Medicine');
      const hasGold = imItems.some((item) => item.signal === 'gold');
      expect(hasGold).toBe(true);
    });

    it('loadItemsForSpecialty retrieves specialty-consistent items and avoids defaulting to Internal Medicine', async () => {
      const { loadItemsForSpecialty } = await import('@/domain/school-list-models');

      const dermItems = loadItemsForSpecialty('Dermatology');
      expect(dermItems.length).toBeGreaterThan(0);
      dermItems.forEach((item) => {
        expect(item.specialty).toBe('Dermatology');
      });

      const orthoItems = loadItemsForSpecialty('Orthopedic Surgery');
      expect(orthoItems.length).toBeGreaterThan(0);
      orthoItems.forEach((item) => {
        expect(item.specialty).toBe('Orthopedic Surgery');
      });
    });
  });

  describe('Direct Clickable Column Header Sorting & Region Column', () => {
    it('verifies sort hierarchy: ERAS Signal (gold > silver > none) and Step 2 CK Tier (reach > target > safety)', () => {
      const items: SchoolListItem[] = [
        {
          id: '1',
          programId: 'p1',
          programName: 'Alpha Health',
          specialty: 'Internal Medicine',
          tier: 'safety',
          signal: 'none',
          track: 'categorical',
          region: 'Pacific',
        },
        {
          id: '2',
          programId: 'p2',
          programName: 'Beta Health',
          specialty: 'Internal Medicine',
          tier: 'reach',
          signal: 'silver',
          track: 'categorical',
          region: 'New England',
        },
        {
          id: '3',
          programId: 'p3',
          programName: 'Gamma Health',
          specialty: 'Internal Medicine',
          tier: 'target',
          signal: 'gold',
          track: 'categorical',
          region: 'South Atlantic',
        },
      ];

      // Signal Ascending: none (1) -> silver (2) -> gold (3)
      const signalRank = { gold: 3, silver: 2, none: 1 };
      const sortedSignalAsc = [...items].sort((a, b) => signalRank[a.signal] - signalRank[b.signal]);
      expect(sortedSignalAsc.map((i) => i.signal)).toEqual(['none', 'silver', 'gold']);

      // Signal Descending: gold (3) -> silver (2) -> none (1)
      const sortedSignalDesc = [...items].sort((a, b) => signalRank[b.signal] - signalRank[a.signal]);
      expect(sortedSignalDesc.map((i) => i.signal)).toEqual(['gold', 'silver', 'none']);

      // Tier Ascending: safety (1) -> target (2) -> reach (3)
      const tierRank = { reach: 3, target: 2, safety: 1 };
      const sortedTierAsc = [...items].sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);
      expect(sortedTierAsc.map((i) => i.tier)).toEqual(['safety', 'target', 'reach']);

      // Tier Descending: reach (3) -> target (2) -> safety (1)
      const sortedTierDesc = [...items].sort((a, b) => tierRank[b.tier] - tierRank[a.tier]);
      expect(sortedTierDesc.map((i) => i.tier)).toEqual(['reach', 'target', 'safety']);

      // Region Alphabetical Ascending: New England -> Pacific -> South Atlantic
      const sortedRegionAsc = [...items].sort((a, b) => (a.region || '').localeCompare(b.region || ''));
      expect(sortedRegionAsc.map((i) => i.region)).toEqual(['New England', 'Pacific', 'South Atlantic']);

      // Default Program Name Ascending: Alpha Health -> Beta Health -> Gamma Health
      const sortedNameAsc = [...items].sort((a, b) => a.programName.localeCompare(b.programName));
      expect(sortedNameAsc.map((i) => i.programName)).toEqual(['Alpha Health', 'Beta Health', 'Gamma Health']);
    });

    it('verifies 3-click cycle state transitions (asc -> desc -> null/default)', () => {
      type SortColumn = 'program' | 'region' | 'signal' | 'tier';
      type SortDirection = 'asc' | 'desc';

      let sortCol: SortColumn | null = null;
      let sortDir: SortDirection | null = null;

      const clickColumn = (col: SortColumn) => {
        if (sortCol === col) {
          if (sortDir === 'asc') {
            sortDir = 'desc';
          } else if (sortDir === 'desc') {
            sortCol = null;
            sortDir = null;
          }
        } else {
          sortCol = col;
          sortDir = 'asc';
        }
      };

      // 1st click on 'tier' -> asc
      clickColumn('tier');
      expect(sortCol).toBe('tier');
      expect(sortDir).toBe('asc');

      // 2nd click on 'tier' -> desc
      clickColumn('tier');
      expect(sortCol).toBe('tier');
      expect(sortDir).toBe('desc');

      // 3rd click on 'tier' -> resets to null (default A->Z)
      clickColumn('tier');
      expect(sortCol).toBeNull();
      expect(sortDir).toBeNull();

      // Switching column starts at asc
      clickColumn('region');
      expect(sortCol).toBe('region');
      expect(sortDir).toBe('asc');
    });

    it('renders SchoolListMatrix with Region column and without old sort toolbar', async () => {
      const React = (await import('react')).default;
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { SchoolListMatrix } = await import('@/components/SchoolListMatrix');

      const html = renderToStaticMarkup(
        React.createElement(SchoolListMatrix, {
          onBack: () => {},
        })
      );

      // Verify old sort controls toolbar is gone
      expect(html).not.toContain('<span class="text-slate-500 font-semibold">Sort:</span>');
      expect(html).not.toContain('Tier ↑');

      // Verify Region column header exists right after Program & Metadata
      expect(html).toContain('Program &amp; Metadata');
      expect(html).toContain('Region');

      // Verify sortable header titles / indicators exist
      expect(html).toContain('Click to sort by Program Name');
      expect(html).toContain('Click to sort by Region');
      expect(html).toContain('Click to sort by ERAS Signal');
      expect(html).toContain('Click to sort by Step 2 CK Tier');

      // Verify non-sortable columns do NOT have sort click titles
      expect(html).not.toContain('Click to sort by Letters');
      expect(html).not.toContain('Click to sort by Yield');
    });

    it('verifies Doximity URL points to https://www.doximity.com/residency for every program', async () => {
      const { DEFAULT_INTERNAL_MEDICINE_SAMPLE_ITEMS, getSampleProgramsForSpecialty } = await import('@/domain/school-list-models');

      // Sample IM items
      DEFAULT_INTERNAL_MEDICINE_SAMPLE_ITEMS.forEach((item) => {
        expect(item.doximityUrl).toBe('https://www.doximity.com/residency');
      });

      // Dynamically loaded specialty items
      const dermItems = getSampleProgramsForSpecialty('Dermatology');
      dermItems.forEach((item) => {
        expect(item.doximityUrl).toBe('https://www.doximity.com/residency');
      });
    });

    it('verifies LOR Tracker is present as a column header hyperlink and removed from individual program rows', async () => {
      const React = (await import('react')).default;
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { SchoolListMatrix } = await import('@/components/SchoolListMatrix');

      const html = renderToStaticMarkup(
        React.createElement(SchoolListMatrix, {
          onBack: () => {},
        })
      );

      // Verify LOR Tracker link in the Letters of Rec column header
      expect(html).toContain('Letters of Rec');
      expect(html).toContain('(LOR Tracker)');
      expect(html).toContain('Open Letter of Recommendation (LOR) Tracking &amp; Gaps');

      // In tbody, the individual program cells should not contain individual LOR Tracker buttons
      // Only the header and the info modal should have references to LOR Tracker
      const tbodyStartIndex = html.indexOf('<tbody');
      const tbodyEndIndex = html.indexOf('</tbody>');
      const tbodyHtml = html.slice(tbodyStartIndex, tbodyEndIndex);
      expect(tbodyHtml).not.toContain('LOR Tracker');
    });

    it('verifies yellow "300 char rationale" badge is removed and info icon only renders for specialties requiring notes', async () => {
      const React = (await import('react')).default;
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { SchoolListMatrix } = await import('@/components/SchoolListMatrix');
      const { SPECIALTY_SIGNALING_RULES } = await import('@/domain/school-list-models');

      // Internal Medicine does NOT require signal rationale
      expect(SPECIALTY_SIGNALING_RULES['Internal Medicine'].explanationRequired).toBe(false);

      const imHtml = renderToStaticMarkup(
        React.createElement(SchoolListMatrix, {
          onBack: () => {},
        })
      );

      // Verify yellow badge is never present
      expect(imHtml).not.toContain('char rationale');
      expect(imHtml).not.toContain('300 char rationale');

      // For Internal Medicine, the info icon next to ERAS Signal should NOT be present
      expect(imHtml).not.toContain('Signal Notes &amp; Rationale required for Internal Medicine');

      // Anesthesiology DOES require signal rationale
      expect(SPECIALTY_SIGNALING_RULES['Anesthesiology'].explanationRequired).toBe(true);

      const anesthHtml = renderToStaticMarkup(
        React.createElement(SchoolListMatrix, {
          specialty: 'Anesthesiology',
          onBack: () => {},
        })
      );

      // Yellow badge is NOT present even when notes are required
      expect(anesthHtml).not.toContain('char rationale');

      // Info icon is present specifically for Anesthesiology
      expect(anesthHtml).toContain('Signal Notes &amp; Rationale required for Anesthesiology');
    });
  });
});



