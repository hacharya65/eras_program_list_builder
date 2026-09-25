import summaryStatsData from '@/data/summary-statistics.json';

export interface MetricComparison {
  matched: number | null;
  notMatched: number | null;
}

export interface SpecialtyBenchmark {
  specialty: string;
  page: number;
  sampleSize: MetricComparison;
  step2Ck: MetricComparison;
  researchExperiences: MetricComparison;
  abstracts: MetricComparison;
  presentations: MetricComparison;
  publications: MetricComparison;
  workExperiences: MetricComparison;
  volunteerExperiences: MetricComparison;
  aoaPercentage: MetricComparison;
  top40NihPercentage: MetricComparison;
  phdPercentage: MetricComparison;
  otherGraduateDegreePercentage: MetricComparison;
  contiguousRanks: MetricComparison;
}

export interface StudentMetricProfile {
  step2Ck: number;
  researchExperiences: number;
  abstracts: number;
  presentations: number;
  publications: number;
  volunteerExperiences: number;
  workExperiences?: number;
  isAoaMember: boolean;
  hasPhd?: boolean;
  isTop40NihSchool?: boolean;
}

export type CompetitivenessTier = 'comfortable' | 'competitive' | 'stretch';

export interface DimensionBreakdown {
  dimension: string;
  studentValue: number | string;
  matchedMedian: number | string;
  notMatchedMedian: number | string;
  status: 'above' | 'at_median' | 'below';
  delta?: number;
  unit?: string;
  note?: string;
}

export interface CompetitivenessAssessment {
  specialty: string;
  overallTier: CompetitivenessTier;
  overallScore: number;
  step2Delta: number;
  totalScholarlyStudent: number;
  totalScholarlyMatchedMedian: number;
  dimensionBreakdowns: DimensionBreakdown[];
  advisorySummary: string;
  recommendedSignalingStrategy: string;
}

// Specialty name normalization map
const SPECIALTY_ALIASES: Record<string, string> = {
  'anesthesiology': 'ANESTHESIOLOGY',
  'anesthesia': 'ANESTHESIOLOGY',
  'child neurology': 'CHILD NEUROLOGY',
  'dermatology': 'DERMATOLOGY',
  'derm': 'DERMATOLOGY',
  'emergency medicine': 'EMERGENCY MEDICINE',
  'em': 'EMERGENCY MEDICINE',
  'family medicine': 'FAMILY MEDICINE',
  'fm': 'FAMILY MEDICINE',
  'internal medicine': 'INTERNAL MEDICINE',
  'im': 'INTERNAL MEDICINE',
  'internal medicine/pediatrics': 'INTERNAL MEDICINE/PEDIATRICS',
  'med-peds': 'INTERNAL MEDICINE/PEDIATRICS',
  'interventional radiology (integrated)': 'INTERVENTIONAL RADIOLOGY (INTEGRATED)',
  'interventional radiology': 'INTERVENTIONAL RADIOLOGY (INTEGRATED)',
  'ir': 'INTERVENTIONAL RADIOLOGY (INTEGRATED)',
  'neurological surgery': 'NEUROLOGICAL SURGERY',
  'neurosurgery': 'NEUROLOGICAL SURGERY',
  'neurology': 'NEUROLOGY',
  'neuro': 'NEUROLOGY',
  'obstetrics and gynecology': 'OBSTETRICS AND GYNECOLOGY',
  'obgyn': 'OBSTETRICS AND GYNECOLOGY',
  'ob/gyn': 'OBSTETRICS AND GYNECOLOGY',
  'orthopaedic surgery': 'ORTHOPAEDIC SURGERY',
  'ortho': 'ORTHOPAEDIC SURGERY',
  'orthopedics': 'ORTHOPAEDIC SURGERY',
  'otolaryngology': 'OTOLARYNGOLOGY',
  'ent': 'OTOLARYNGOLOGY',
  'pathology-anatomic and clinical': 'PATHOLOGY-ANATOMIC AND CLINICAL',
  'pathology': 'PATHOLOGY-ANATOMIC AND CLINICAL',
  'pediatrics': 'PEDIATRICS',
  'peds': 'PEDIATRICS',
  'physical medicine and rehabilitation': 'PHYSICAL MEDICINE AND REHABILITATION',
  'pm&r': 'PHYSICAL MEDICINE AND REHABILITATION',
  'pmr': 'PHYSICAL MEDICINE AND REHABILITATION',
  'plastic surgery (integrated)': 'PLASTIC SURGERY (INTEGRATED)',
  'plastic surgery': 'PLASTIC SURGERY (INTEGRATED)',
  'plastics': 'PLASTIC SURGERY (INTEGRATED)',
  'psychiatry': 'PSYCHIATRY',
  'psych': 'PSYCHIATRY',
  'radiation oncology': 'RADIATION ONCOLOGY',
  'radonc': 'RADIATION ONCOLOGY',
  'radiology-diagnostic': 'RADIOLOGY-DIAGNOSTIC',
  'diagnostic radiology': 'RADIOLOGY-DIAGNOSTIC',
  'dr': 'RADIOLOGY-DIAGNOSTIC',
  'surgery-general': 'SURGERY-GENERAL',
  'general surgery': 'SURGERY-GENERAL',
  'surgery': 'SURGERY-GENERAL',
  'gen surg': 'SURGERY-GENERAL',
  'thoracic surgery (integrated)': 'THORACIC SURGERY (INTEGRATED)',
  'thoracic surgery': 'THORACIC SURGERY (INTEGRATED)',
  'vascular surgery (integrated)': 'VASCULAR SURGERY (INTEGRATED)',
  'vascular surgery': 'VASCULAR SURGERY (INTEGRATED)',
};

const benchmarksMap: Record<string, SpecialtyBenchmark> = summaryStatsData as unknown as Record<string, SpecialtyBenchmark>;

export function getSpecialtyBenchmark(specialtyName: string): SpecialtyBenchmark | null {
  if (!specialtyName) return null;
  const cleanKey = specialtyName.trim().toLowerCase();
  const canonicalKey = SPECIALTY_ALIASES[cleanKey] || specialtyName.toUpperCase();
  return benchmarksMap[canonicalKey] || null;
}

export function getAllBenchmarkSpecialties(): string[] {
  return Object.keys(benchmarksMap);
}

export function assessCompetitiveness(
  profile: StudentMetricProfile,
  specialtyName: string
): CompetitivenessAssessment {
  const benchmark = getSpecialtyBenchmark(specialtyName);

  if (!benchmark) {
    throw new Error(`Specialty benchmark not found for: ${specialtyName}`);
  }

  const breakdowns: DimensionBreakdown[] = [];
  let points = 0;

  // 1. Step 2 CK Evaluation
  const step2Matched = benchmark.step2Ck.matched ?? 245;
  const step2NotMatched = benchmark.step2Ck.notMatched ?? 230;
  const step2Delta = profile.step2Ck - step2Matched;

  let step2Status: 'above' | 'at_median' | 'below' = 'at_median';
  if (step2Delta >= 3) {
    step2Status = 'above';
    points += 3;
  } else if (step2Delta >= -3) {
    step2Status = 'at_median';
    points += 1;
  } else {
    step2Status = 'below';
    points -= profile.step2Ck < step2NotMatched ? 3 : 1;
  }

  breakdowns.push({
    dimension: 'USMLE Step 2 CK',
    studentValue: profile.step2Ck,
    matchedMedian: step2Matched,
    notMatchedMedian: benchmark.step2Ck.notMatched !== null ? benchmark.step2Ck.notMatched : 'N/A',
    status: step2Status,
    delta: step2Delta,
    unit: 'points',
    note: step2Delta >= 0 
      ? `+${step2Delta} pts above national matched median (${step2Matched})` 
      : `${step2Delta} pts below national matched median (${step2Matched})`,
  });

  // 2. Research Experiences
  const researchMatched = benchmark.researchExperiences.matched ?? 4.0;
  const researchDelta = profile.researchExperiences - researchMatched;
  let researchStatus: 'above' | 'at_median' | 'below' = 'at_median';
  if (researchDelta >= 1) {
    researchStatus = 'above';
    points += 1;
  } else if (researchDelta >= -1) {
    researchStatus = 'at_median';
  } else {
    researchStatus = 'below';
    points -= 1;
  }

  breakdowns.push({
    dimension: 'Research Experiences',
    studentValue: profile.researchExperiences,
    matchedMedian: researchMatched,
    notMatchedMedian: benchmark.researchExperiences.notMatched ?? 'N/A',
    status: researchStatus,
    delta: researchDelta,
    unit: 'experiences',
  });

  // 3. Scholarly Output (Abstracts + Presentations + Publications)
  const totalStudentScholarly = profile.abstracts + profile.presentations + profile.publications;
  const abstractsMatched = benchmark.abstracts.matched ?? 0;
  const presentationsMatched = benchmark.presentations.matched ?? 0;
  const publicationsMatched = benchmark.publications.matched ?? 0;
  const totalMatchedScholarly = abstractsMatched + presentationsMatched + publicationsMatched;
  const scholarlyDelta = totalStudentScholarly - totalMatchedScholarly;

  let scholarlyStatus: 'above' | 'at_median' | 'below' = 'at_median';
  if (scholarlyDelta >= 2) {
    scholarlyStatus = 'above';
    points += 2;
  } else if (scholarlyDelta >= -2) {
    scholarlyStatus = 'at_median';
    points += 1;
  } else {
    scholarlyStatus = 'below';
    points -= 1;
  }

  breakdowns.push({
    dimension: 'Total Scholarly Output (Pubs/Abstracts/Posters)',
    studentValue: totalStudentScholarly,
    matchedMedian: totalMatchedScholarly,
    notMatchedMedian: (benchmark.abstracts.notMatched ?? 0) + (benchmark.presentations.notMatched ?? 0) + (benchmark.publications.notMatched ?? 0),
    status: scholarlyStatus,
    delta: scholarlyDelta,
    unit: 'items',
    note: `${profile.publications} publications, ${profile.abstracts} abstracts, ${profile.presentations} presentations`,
  });

  // 4. Peer-Reviewed Publications specifically
  const pubsMatched = benchmark.publications.matched ?? 2;
  const pubsDelta = profile.publications - pubsMatched;
  breakdowns.push({
    dimension: 'Peer-Reviewed Publications',
    studentValue: profile.publications,
    matchedMedian: pubsMatched,
    notMatchedMedian: benchmark.publications.notMatched ?? 'N/A',
    status: pubsDelta > 0 ? 'above' : pubsDelta === 0 ? 'at_median' : 'below',
    delta: pubsDelta,
    unit: 'publications',
  });

  // 5. Volunteer Experiences
  const volMatched = benchmark.volunteerExperiences.matched ?? 5;
  const volDelta = profile.volunteerExperiences - volMatched;
  breakdowns.push({
    dimension: 'Volunteer Experiences',
    studentValue: profile.volunteerExperiences,
    matchedMedian: volMatched,
    notMatchedMedian: benchmark.volunteerExperiences.notMatched ?? 'N/A',
    status: volDelta >= 0 ? (volDelta > 0 ? 'above' : 'at_median') : 'below',
    delta: volDelta,
    unit: 'experiences',
  });

  // 6. AOA Honor Medical Society Membership
  const aoaRate = benchmark.aoaPercentage.matched ?? 15.0;
  if (profile.isAoaMember) {
    points += 2;
  }
  breakdowns.push({
    dimension: 'Alpha Omega Alpha (AOA)',
    studentValue: profile.isAoaMember ? 'Member (Inducted)' : 'Non-Member',
    matchedMedian: `${aoaRate}% matched cohort`,
    notMatchedMedian: `${benchmark.aoaPercentage.notMatched ?? 0}% unmatched`,
    status: profile.isAoaMember ? 'above' : 'at_median',
    note: profile.isAoaMember ? 'Strong positive signal for academic and clinical distinction' : 'Baseline for ~80%+ of applicants',
  });

  // Aggregate overall tier
  let overallTier: CompetitivenessTier = 'competitive';
  if (points >= 4 && step2Delta >= 0) {
    overallTier = 'comfortable';
  } else if (points < 0 || step2Delta < -7) {
    overallTier = 'stretch';
  } else {
    overallTier = 'competitive';
  }

  // Generate advisory summary and strategy
  let advisorySummary = '';
  let recommendedSignalingStrategy = '';

  if (overallTier === 'comfortable') {
    advisorySummary = `Your profile shows superior metrics compared to the national matched median in ${benchmark.specialty} (Step 2 CK ${profile.step2Ck} vs ${step2Matched} median; ${totalStudentScholarly} scholarly items vs ${totalMatchedScholarly} median). You are positioned as a top-tier candidate.`;
    recommendedSignalingStrategy = `Deploy Gold signals on ambitious reach academic powerhouses and regional dream programs. Maintain 3-5 high-volume Target programs to ensure interview concentration.`;
  } else if (overallTier === 'competitive') {
    advisorySummary = `Your profile matches the national median of matched U.S. MD seniors in ${benchmark.specialty} (Step 2 CK ${profile.step2Ck} vs ${step2Matched} median; ${profile.publications} publications vs ${pubsMatched} median). You have solid, credible alignment with the specialty.`;
    recommendedSignalingStrategy = `Distribute signals strategically: allocate Gold tokens to top-choice Target programs where your geographic ties and research overlap are strongest, reserving Silver tokens for high-yield programs aligned with your clinical trajectory.`;
  } else {
    advisorySummary = `Your profile sits below the matched median for ${benchmark.specialty} (Step 2 CK ${profile.step2Ck} vs ${step2Matched} median; unmatched median was ${step2NotMatched}). Faculty advising recommends an expanded safety net and targeted dual-application consideration if applicable.`;
    recommendedSignalingStrategy = `Prioritize high-yield community and regional university-affiliated Target and Safety programs for your Gold and Silver tokens. Review Residency Explorer data to avoid burning signals on programs with restrictive Step 2 cutoffs.`;
  }

  return {
    specialty: benchmark.specialty,
    overallTier,
    overallScore: points,
    step2Delta,
    totalScholarlyStudent: totalStudentScholarly,
    totalScholarlyMatchedMedian: totalMatchedScholarly,
    dimensionBreakdowns: breakdowns,
    advisorySummary,
    recommendedSignalingStrategy,
  };
}

export function generateResidencyExplorerLink(specialtyName?: string, programName?: string): string {
  const base = 'https://www.residencyexplorer.org';
  if (!specialtyName) return base;
  return `${base}/explore?specialty=${encodeURIComponent(specialtyName)}${programName ? `&query=${encodeURIComponent(programName)}` : ''}`;
}
