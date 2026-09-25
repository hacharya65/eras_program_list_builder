import { ReviewRequest } from './types';

export interface SlaCalculationResult {
  daysElapsed: number;
  daysRemaining: number;
  status: 'on_track' | 'approaching_deadline' | 'breached' | 'resolved';
  isBreached: boolean;
  shouldNudgeAdvisor: boolean;
  shouldEscalateToDean: boolean;
  label: string;
  badgeClass: string;
}

export function calculateSlaStatus(
  request: ReviewRequest,
  defaultSlaDays: number = 14
): SlaCalculationResult {
  // If the review has concluded (revisions requested or endorsed), it is resolved
  if (request.stage === 'revisions_requested' || request.stage === 'endorsed') {
    return {
      daysElapsed: 0,
      daysRemaining: 0,
      status: 'resolved',
      isBreached: false,
      shouldNudgeAdvisor: false,
      shouldEscalateToDean: false,
      label: 'Review Resolved',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }

  const now = Date.now();
  const submittedTime = new Date(request.submittedAt).getTime();
  const msElapsed = Math.max(0, now - submittedTime);
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, defaultSlaDays - daysElapsed);

  if (daysElapsed >= defaultSlaDays) {
    return {
      daysElapsed,
      daysRemaining: 0,
      status: 'breached',
      isBreached: true,
      shouldNudgeAdvisor: true,
      shouldEscalateToDean: true,
      label: `SLA Breached (${daysElapsed}d elapsed)`,
      badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold animate-pulse',
    };
  }

  if (daysElapsed >= 10) {
    return {
      daysElapsed,
      daysRemaining,
      status: 'approaching_deadline',
      isBreached: false,
      shouldNudgeAdvisor: true,
      shouldEscalateToDean: false,
      label: `Approaching SLA (${daysRemaining}d left)`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
    };
  }

  return {
    daysElapsed,
    daysRemaining,
    status: 'on_track',
    isBreached: false,
    shouldNudgeAdvisor: false,
    shouldEscalateToDean: false,
    label: `On Track (${daysRemaining}d left)`,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  };
}
