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
  silverMultiplier?: string; // e.g. "2.4x"
  goldMultiplier?: string;   // e.g. "14.5x"
  signalMultiplier?: string; // e.g. "2.4x" for single-tier programs
}

export function computeSignalingRecommendation(
  yieldNoSignal?: number, // e.g. 5 (%)
  yieldSilver?: number,   // e.g. 25 (%) - also used as yieldSignal in single-tier
  yieldGold?: number,     // e.g. 45 (%)
  signalType: 'tiered' | 'single_tier' = 'tiered'
): SignalingRecommendation {
  if (signalType === 'single_tier') {
    if (yieldNoSignal === undefined || yieldSilver === undefined) {
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

    const deltaSignalNone = yieldSilver - yieldNoSignal;
    const signalMultiplier =
      yieldNoSignal > 0
        ? `${(yieldSilver / yieldNoSignal).toFixed(1)}x`
        : yieldSilver > 0
        ? `+${yieldSilver}%`
        : '1.0x';

    if (yieldNoSignal >= 35) {
      return {
        recommendation: 'NO_SIGNAL_SUFFICIENT',
        recommendedSignal: 'none',
        label: 'No Signal Needed',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
        explanation: `High baseline yield (${yieldNoSignal}% without signal). Conserve your signals for reach or out-of-region programs.`,
        deltaGoldSilver: 0,
        deltaSilverNone: deltaSignalNone,
        signalMultiplier,
        silverMultiplier: signalMultiplier,
      };
    }

    if (deltaSignalNone >= 10) {
      return {
        recommendation: 'SILVER_OPTIMAL',
        recommendedSignal: 'silver',
        label: 'High Yield Signal',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
        explanation: `Signaling produces a +${deltaSignalNone}% interview jump over no signal (${yieldSilver}% vs ${yieldNoSignal}%). High-value signal target.`,
        deltaGoldSilver: 0,
        deltaSilverNone: deltaSignalNone,
        signalMultiplier,
        silverMultiplier: signalMultiplier,
      };
    }

    if (deltaSignalNone < 5 && yieldSilver < 15) {
      return {
        recommendation: 'SIGNAL_INEFFICIENT',
        recommendedSignal: 'none',
        label: 'Signal Inefficient',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        explanation: `Low overall yield gain (+${deltaSignalNone}% with signal). Token yields limited interview advantage at this program.`,
        deltaGoldSilver: 0,
        deltaSilverNone: deltaSignalNone,
        signalMultiplier,
        silverMultiplier: signalMultiplier,
      };
    }

    return {
      recommendation: 'SILVER_OPTIMAL',
      recommendedSignal: 'silver',
      label: 'Recommended Signal',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
      explanation: `Program signal offers positive yield advantage (+${deltaSignalNone}%).`,
      deltaGoldSilver: 0,
      deltaSilverNone: deltaSignalNone,
      signalMultiplier,
      silverMultiplier: signalMultiplier,
    };
  }

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

  const silverMultiplier =
    yieldNoSignal > 0
      ? `${(yieldSilver / yieldNoSignal).toFixed(1)}x`
      : yieldSilver > 0
      ? `+${yieldSilver}%`
      : '1.0x';

  const goldMultiplier =
    yieldNoSignal > 0
      ? `${(yieldGold / yieldNoSignal).toFixed(1)}x`
      : yieldGold > 0
      ? `+${yieldGold}%`
      : '1.0x';

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
      silverMultiplier,
      goldMultiplier,
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
      silverMultiplier,
      goldMultiplier,
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
      silverMultiplier,
      goldMultiplier,
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
      silverMultiplier,
      goldMultiplier,
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
      silverMultiplier,
      goldMultiplier,
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
    silverMultiplier,
    goldMultiplier,
  };
}
