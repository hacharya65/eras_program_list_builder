export type SignalingRecommendationTier =
  | 'GOLD_HIGH_YIELD'
  | 'SILVER_OPTIMAL'
  | 'NO_SIGNAL_SUFFICIENT'
  | 'SIGNAL_INEFFICIENT'
  | 'NEEDS_INPUT';

export interface SignalingRecommendation {
  recommendation: SignalingRecommendationTier;
  recommendedSignal: 'gold' | 'silver' | 'none';
  label: string;
  badgeClass: string;
  explanation: string;
  deltaGoldSilver: number;
  deltaSilverNone: number;
}

export function computeSignalingRecommendation(
  yieldNoSignal?: number, // e.g. 5 (%)
  yieldSilver?: number,   // e.g. 25 (%)
  yieldGold?: number      // e.g. 45 (%)
): SignalingRecommendation {
  if (yieldNoSignal === undefined || yieldSilver === undefined || yieldGold === undefined) {
    return {
      recommendation: 'NEEDS_INPUT',
      recommendedSignal: 'none',
      label: 'Enter Yield Data',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      explanation: 'Enter Residency Explorer interview yield % to receive algorithmic signal recommendation.',
      deltaGoldSilver: 0,
      deltaSilverNone: 0,
    };
  }

  const deltaGoldSilver = yieldGold - yieldSilver;
  const deltaSilverNone = yieldSilver - yieldNoSignal;

  // Case 1: High organic interview yield without signal (home program / strong pipeline)
  if (yieldNoSignal >= 35) {
    return {
      recommendation: 'NO_SIGNAL_SUFFICIENT',
      recommendedSignal: 'none',
      label: 'No Signal Needed',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
      explanation: `High baseline yield (${yieldNoSignal}% without signal). Conserve your valuable tokens for out-of-region or competitive reach programs.`,
      deltaGoldSilver,
      deltaSilverNone,
    };
  }

  // Case 2: Significant Gold surge over Silver (delta >= 15%)
  if (deltaGoldSilver >= 15) {
    return {
      recommendation: 'GOLD_HIGH_YIELD',
      recommendedSignal: 'gold',
      label: 'Gold High Yield',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      explanation: `Gold signal produces a dramatic +${deltaGoldSilver}% interview surge over Silver (${yieldGold}% vs ${yieldSilver}%). Prime target for Gold token.`,
      deltaGoldSilver,
      deltaSilverNone,
    };
  }

  // Case 3: Silver yields substantial gain, and Gold offers only marginal bump (< 10%)
  if (deltaSilverNone >= 12 && deltaGoldSilver < 10) {
    return {
      recommendation: 'SILVER_OPTIMAL',
      recommendedSignal: 'silver',
      label: 'Silver Optimal',
      badgeClass: 'bg-slate-200 text-slate-800 border-slate-400 font-bold',
      explanation: `Silver captures most of the signal benefit (+${deltaSilverNone}% over no signal), while Gold only adds +${deltaGoldSilver}%. Reserve Gold for programs with higher delta.`,
      deltaGoldSilver,
      deltaSilverNone,
    };
  }

  // Case 4: Signals produce marginal interview rate gain
  if (yieldGold < 15 && deltaGoldSilver < 5 && deltaSilverNone < 5) {
    return {
      recommendation: 'SIGNAL_INEFFICIENT',
      recommendedSignal: 'none',
      label: 'Signal Inefficient',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      explanation: `Low overall yield gain (+${deltaGoldSilver}% Gold / +${deltaSilverNone}% Silver). Tokens yield minimal interview advantage at this program.`,
      deltaGoldSilver,
      deltaSilverNone,
    };
  }

  // Default fallback if Silver gives good bump
  if (deltaSilverNone > deltaGoldSilver) {
    return {
      recommendation: 'SILVER_OPTIMAL',
      recommendedSignal: 'silver',
      label: 'Silver Optimal',
      badgeClass: 'bg-slate-200 text-slate-800 border-slate-400 font-bold',
      explanation: `Silver provides solid yield enhancement (+${deltaSilverNone}%).`,
      deltaGoldSilver,
      deltaSilverNone,
    };
  }

  return {
    recommendation: 'GOLD_HIGH_YIELD',
    recommendedSignal: 'gold',
    label: 'Gold Recommended',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    explanation: `Gold signal recommended (+${deltaGoldSilver}% over Silver).`,
    deltaGoldSilver,
    deltaSilverNone,
  };
}
