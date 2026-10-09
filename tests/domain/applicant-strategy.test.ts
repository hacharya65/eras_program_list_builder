import { describe, it, expect } from 'vitest';
import {
  assessApplicantStrategy,
  deriveMetricProfileFromPortfolio,
} from '@/domain/applicant-strategy';
import { createDefaultPortfolio } from '@/domain/student-portfolio';
import { SchoolListItem } from '@/domain/school-list-models';

describe('Deep Applicant Strategy Engine', () => {
  it('automatically derives normalized applicant metric profile directly from portfolio', () => {
    const portfolio = createDefaultPortfolio('student-1', 'Alex Rivera', 'Internal Medicine');
    portfolio.intake.step2Score = 252;

    const derived = deriveMetricProfileFromPortfolio(portfolio);

    expect(derived.step2Ck).toBe(252);
    expect(derived.publications).toBeGreaterThanOrEqual(1);
    expect(derived.presentations).toBeGreaterThanOrEqual(2);
  });

  it('performs complete strategic assessment: competitiveness, tier balance, and signaling health', () => {
    const portfolio = createDefaultPortfolio('student-1', 'Alex Rivera', 'Internal Medicine');
    portfolio.intake.step2Score = 248;

    const customSchoolList: SchoolListItem[] = [
      {
        id: 'prog-1',
        programId: '1403521255',
        programName: 'Johns Hopkins Hospital',
        specialty: 'Internal Medicine',
        tier: 'reach',
        signal: 'gold',
        yieldNoSignal: 2,
        yieldSilver: 12,
        yieldGold: 38,
        step2Min: 255, // Higher than applicant score 248 -> triggers cutoff warning
      },
      {
        id: 'prog-2',
        programId: '1402421217',
        programName: 'Penn State Hershey',
        specialty: 'Internal Medicine',
        tier: 'target',
        signal: 'silver',
        yieldNoSignal: 8,
        yieldSilver: 28,
        yieldGold: 45,
        step2Min: 235,
      },
      {
        id: 'prog-3',
        programId: '1402321200',
        programName: 'Geisinger Medical Center',
        specialty: 'Internal Medicine',
        tier: 'safety',
        signal: 'none',
        yieldNoSignal: 36, // High baseline yield -> no signal needed
        yieldSilver: 42,
        yieldGold: 50,
        step2Min: 220,
      },
    ];

    const report = assessApplicantStrategy({
      portfolio,
      schoolList: customSchoolList,
      targetSpecialty: 'Internal Medicine',
    });

    expect(report.targetSpecialty).toBe('Internal Medicine');
    expect(typeof report.competitiveness.overallScore).toBe('number');
    expect(report.competitiveness.overallTier).toBeDefined();
    expect(report.tierDistribution.total).toBe(3);
    expect(report.tierDistribution.reach).toBe(1);
    expect(report.tierDistribution.target).toBe(1);
    expect(report.tierDistribution.safety).toBe(1);

    // Verify cutoff warning was identified for Johns Hopkins (cutoff 255 vs student 248)
    expect(report.cutoffWarnings).toHaveLength(1);
    expect(report.cutoffWarnings[0].programName).toBe('Johns Hopkins Hospital');
    expect(report.cutoffWarnings[0].delta).toBe(7);

    // Verify signaling health
    expect(report.signalingHealth.budgetTotal).toBe(15);
    expect(report.signalingHealth.assignedGold).toBe(1);
    expect(report.signalingHealth.assignedSilver).toBe(1);
    expect(report.signalingHealth.remainingTotal).toBe(13);
    expect(report.signalingHealth.isOverBudget).toBe(false);

    // Verify program yield guidance
    const geisingerGuidance = report.signalingHealth.programYieldGuidance['prog-3'];
    expect(geisingerGuidance.recommendationTier).toBe('NO_SIGNAL_SUFFICIENT');
    expect(geisingerGuidance.recommendedSignal).toBe('none');
  });

  it('detects over-budget signaling allocation invariant', () => {
    const portfolio = createDefaultPortfolio('student-1', 'Alex Rivera', 'Internal Medicine');
    // Internal Medicine cap: 3 gold, 12 silver, 15 total
    const overBudgetList: SchoolListItem[] = Array.from({ length: 4 }, (_, i) => ({
      id: `gold-prog-${i}`,
      programId: `gold-acgme-${i}`,
      programName: `Program Gold ${i}`,
      specialty: 'Internal Medicine',
      tier: 'reach',
      signal: 'gold', // 4 gold exceeds cap of 3!
    }));

    const report = assessApplicantStrategy({
      portfolio,
      schoolList: overBudgetList,
      targetSpecialty: 'Internal Medicine',
    });

    expect(report.signalingHealth.assignedGold).toBe(4);
    expect(report.signalingHealth.isOverBudget).toBe(true);
    expect(report.actionableRecommendations.some((r) => r.includes('Signaling Budget Exceeded'))).toBe(true);
  });
});
