/**
 * Deep Applicant Strategy Engine
 * 
 * Unifies applicant competitiveness benchmarking, school list tier distribution (reach/target/safety),
 * program cutoff alerts, and AAMC signaling yield allocations behind a single high-leverage interface.
 * 
 * Free of presentation/CSS leakage.
 */

import { StudentPortfolio } from './student-portfolio';
import { SchoolListItem, SPECIALTY_SIGNALING_RULES, SpecialtySignalRule } from './school-list-models';
import {
  assessCompetitiveness,
  CompetitivenessAssessment,
  CompetitivenessTier,
  StudentMetricProfile,
} from './competitiveness-engine';
import {
  computeSignalingRecommendation,
  SignalingRecommendation,
  SignalingRecommendationTier,
} from './signaling-recommendation';

export interface SchoolListTierDistribution {
  reach: number;
  target: number;
  safety: number;
  unclassified: number;
  total: number;
}

export interface ProgramCutoffWarning {
  programId: string;
  programName: string;
  cutoffScore: number;
  studentScore: number;
  delta: number;
}

export interface SignalingHealth {
  rule: SpecialtySignalRule;
  assignedGold: number;
  assignedSilver: number;
  assignedTotal: number;
  budgetTotal: number;
  remainingGold: number;
  remainingSilver: number;
  remainingTotal: number;
  isOverBudget: boolean;
  isUnderBudget: boolean;
  programYieldGuidance: Record<string, {
    recommendedSignal: 'gold' | 'silver' | 'none';
    recommendationTier: SignalingRecommendationTier;
    explanation: string;
    multiplier?: string;
  }>;
}

export interface ApplicantStrategyReport {
  targetSpecialty: string;
  competitiveness: CompetitivenessAssessment;
  derivedProfile: StudentMetricProfile;
  tierDistribution: SchoolListTierDistribution;
  isListBalanced: boolean;
  distributionGuidance: string;
  cutoffWarnings: ProgramCutoffWarning[];
  signalingHealth: SignalingHealth;
  actionableRecommendations: string[];
}

/**
 * Automatically extracts a normalized StudentMetricProfile from the unified StudentPortfolio.
 */
export function deriveMetricProfileFromPortfolio(
  portfolio: StudentPortfolio,
  fallbackStep2: number = 245
): StudentMetricProfile {
  let step2Score = fallbackStep2;
  if (portfolio.intake && portfolio.intake.step2Score) {
    const parsed = Number(portfolio.intake.step2Score);
    if (!isNaN(parsed) && parsed > 0) {
      step2Score = parsed;
    }
  }

  // Count research experiences from portfolio experiences
  const researchExpCount = portfolio.experiences.filter((e) =>
    e.title.toLowerCase().includes('research') ||
    (e.descriptionText && e.descriptionText.toLowerCase().includes('research'))
  ).length;

  // Count volunteer and work experiences
  const volunteerExpCount = portfolio.experiences.filter((e) =>
    e.title.toLowerCase().includes('volunteer') ||
    (e.descriptionText && e.descriptionText.toLowerCase().includes('community'))
  ).length;

  const workExpCount = portfolio.experiences.filter((e) =>
    !e.title.toLowerCase().includes('research') &&
    !e.title.toLowerCase().includes('volunteer')
  ).length;

  // Count publications, abstracts, and presentations from scholarly works
  let publicationsCount = 0;
  let abstractsCount = 0;
  let presentationsCount = 0;

  for (const work of portfolio.scholarlyWorks) {
    const t = work.type.toLowerCase();
    if (t.includes('journal') || t.includes('article') || t.includes('book')) {
      publicationsCount += 1;
    } else if (t.includes('poster') || t.includes('abstract')) {
      abstractsCount += 1;
    }

    if (work.events && work.events.length > 0) {
      presentationsCount += work.events.length;
    } else if (t.includes('presentation') || t.includes('oral')) {
      presentationsCount += 1;
    }
  }

  const isAoa = Boolean((portfolio.intake as any)?.aoaStatus === 'elected');

  return {
    step2Ck: step2Score,
    researchExperiences: Math.max(researchExpCount, 2),
    abstracts: Math.max(abstractsCount, 1),
    presentations: Math.max(presentationsCount, 2),
    publications: Math.max(publicationsCount, 1),
    volunteerExperiences: Math.max(volunteerExpCount, 2),
    workExperiences: Math.max(workExpCount, 1),
    isAoaMember: isAoa,
    hasPhd: false,
    isTop40NihSchool: false,
  };
}

/**
 * Deep module interface: evaluates complete applicant strategy in one atomic call.
 */
export function assessApplicantStrategy(params: {
  portfolio: StudentPortfolio;
  schoolList?: SchoolListItem[];
  targetSpecialty?: string;
  customProfile?: Partial<StudentMetricProfile>;
}): ApplicantStrategyReport {
  const targetSpecialty = params.targetSpecialty || params.portfolio.targetSpecialty || 'Internal Medicine';
  const schoolList = params.schoolList || params.portfolio.schoolList || [];

  // 1. Derive or merge profile
  const baseProfile = deriveMetricProfileFromPortfolio(params.portfolio);
  const profile: StudentMetricProfile = {
    ...baseProfile,
    ...(params.customProfile || {}),
  };

  // 2. Compute competitiveness assessment
  const competitiveness = assessCompetitiveness(profile, targetSpecialty);

  // 3. Evaluate school list distribution
  const tierDistribution: SchoolListTierDistribution = {
    reach: 0,
    target: 0,
    safety: 0,
    unclassified: 0,
    total: schoolList.length,
  };

  const cutoffWarnings: ProgramCutoffWarning[] = [];

  for (const prog of schoolList) {
    if (prog.tier === 'reach') tierDistribution.reach += 1;
    else if (prog.tier === 'target') tierDistribution.target += 1;
    else if (prog.tier === 'safety') tierDistribution.safety += 1;
    else tierDistribution.unclassified += 1;

    // Check cutoff warning
    if (prog.step2Min !== undefined && prog.step2Min > profile.step2Ck) {
      cutoffWarnings.push({
        programId: prog.id,
        programName: prog.programName || (prog as any).name || 'Residency Program',
        cutoffScore: prog.step2Min,
        studentScore: profile.step2Ck,
        delta: prog.step2Min - profile.step2Ck,
      });
    }
  }

  // Assess balance based on tier
  let isListBalanced = true;
  let distributionGuidance = 'Your school list displays a healthy distribution across tiers.';

  if (tierDistribution.total > 0) {
    const reachPct = (tierDistribution.reach / tierDistribution.total) * 100;
    const safetyPct = (tierDistribution.safety / tierDistribution.total) * 100;

    if (competitiveness.overallTier === 'below_average' && reachPct > 40) {
      isListBalanced = false;
      distributionGuidance =
        'High Risk: Over 40% of your list is comprised of Reach programs. For your competitiveness tier, expand Target and Safety options to safeguard interview volume.';
    } else if (competitiveness.overallTier === 'above_average' && safetyPct > 60) {
      distributionGuidance =
        'Conservative: Over 60% of your list is Safety programs. Consider deploying signals toward ambitious Target or Reach programs.';
    } else if (tierDistribution.safety === 0 && tierDistribution.total >= 10) {
      isListBalanced = false;
      distributionGuidance =
        'Zero Safety Programs: Your list lacks safety anchors. We advise adding at least 3-5 high-yield safety programs.';
    }
  }

  // 4. Evaluate signaling budget and program recommendations
  const rule = SPECIALTY_SIGNALING_RULES[targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'] || {
    specialty: targetSpecialty,
    goldSignals: 3,
    silverSignals: 12,
    totalSignals: 15,
    signalType: 'tiered',
  };

  let assignedGold = 0;
  let assignedSilver = 0;
  const programYieldGuidance: SignalingHealth['programYieldGuidance'] = {};

  for (const prog of schoolList) {
    const isGold = prog.signal === 'gold' || (prog as any).signalingTier === 'gold';
    const isSilver = prog.signal === 'silver' || (prog as any).signalingTier === 'silver';
    if (isGold) assignedGold += 1;
    if (isSilver) assignedSilver += 1;

    const yieldRec = computeSignalingRecommendation(
      prog.yieldNoSignal,
      prog.yieldSilver,
      prog.yieldGold,
      rule.signalType
    );

    programYieldGuidance[prog.id] = {
      recommendedSignal: yieldRec.recommendedSignal,
      recommendationTier: yieldRec.recommendation,
      explanation: yieldRec.explanation,
      multiplier: yieldRec.silverMultiplier || yieldRec.goldMultiplier || yieldRec.signalMultiplier,
    };
  }

  const assignedTotal = assignedGold + assignedSilver;
  const isOverBudget =
    rule.signalType === 'tiered'
      ? assignedGold > rule.goldSignals || assignedSilver > rule.silverSignals
      : assignedTotal > rule.totalSignals;

  const signalingHealth: SignalingHealth = {
    rule,
    assignedGold,
    assignedSilver,
    assignedTotal,
    budgetTotal: rule.totalSignals,
    remainingGold: Math.max(0, rule.goldSignals - assignedGold),
    remainingSilver: Math.max(0, rule.silverSignals - assignedSilver),
    remainingTotal: Math.max(0, rule.totalSignals - assignedTotal),
    isOverBudget,
    isUnderBudget: assignedTotal < rule.totalSignals,
    programYieldGuidance,
  };

  // 5. Actionable guidance synthesis
  const actionableRecommendations: string[] = [];

  if (isOverBudget) {
    actionableRecommendations.push(
      `Signaling Budget Exceeded: You have assigned ${assignedTotal} signals against a cap of ${rule.totalSignals} for ${targetSpecialty}.`
    );
  }
  if (signalingHealth.isUnderBudget && tierDistribution.total >= rule.totalSignals) {
    actionableRecommendations.push(
      `Unassigned Signals: You have ${signalingHealth.remainingTotal} unassigned signal token(s). Maximize your chances by assigning all signals before submitting.`
    );
  }
  if (cutoffWarnings.length > 0) {
    actionableRecommendations.push(
      `Score Cutoff Warning: ${cutoffWarnings.length} program(s) on your list list a Step 2 minimum above your score.`
    );
  }
  if (!isListBalanced) {
    actionableRecommendations.push(distributionGuidance);
  }

  return {
    targetSpecialty,
    competitiveness,
    derivedProfile: profile,
    tierDistribution,
    isListBalanced,
    distributionGuidance,
    cutoffWarnings,
    signalingHealth,
    actionableRecommendations,
  };
}
