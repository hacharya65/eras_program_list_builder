'use client';

import React, { useState, useEffect } from 'react';
import {
  assessCompetitiveness,
  getSpecialtyBenchmark,
  StudentMetricProfile,
  CompetitivenessAssessment,
} from '@/domain/competitiveness-engine';
import {
  getStoredApplicantStep2Ck,
  setStoredApplicantStep2Ck,
  APPLICANT_PROFILE_STORAGE_KEY,
} from '@/domain/school-list-models';
import {
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Shield,
  Target,
  Compass,
  SlidersHorizontal,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface ApplicantBaselineIntakeProps {
  specialty?: string;
  onOpenFullCompetitiveness: () => void;
  onOpenSchoolList: () => void;
}

export function ApplicantBaselineIntake({
  specialty = 'Internal Medicine',
  onOpenFullCompetitiveness,
  onOpenSchoolList,
}: ApplicantBaselineIntakeProps) {
  // Step 2 CK state synchronized with global storage
  const [step2Ck, setStep2Ck] = useState<number>(() => getStoredApplicantStep2Ck());

  // Additional profile metrics state
  const [researchExperiences, setResearchExperiences] = useState<number>(4);
  const [publications, setPublications] = useState<number>(2);
  const [presentations, setPresentations] = useState<number>(4);
  const [isAoaMember, setIsAoaMember] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Rehydrate profile metrics from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(APPLICANT_PROFILE_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.researchExperiences !== undefined) setResearchExperiences(parsed.researchExperiences);
          if (parsed.publications !== undefined) setPublications(parsed.publications);
          if (parsed.presentations !== undefined) setPresentations(parsed.presentations);
          if (parsed.isAoaMember !== undefined) setIsAoaMember(parsed.isAoaMember);
        }
      } catch {}
    }
  }, []);

  // Save metrics whenever updated
  const saveProfileMetrics = (updates: Partial<{
    step2Ck: number;
    researchExperiences: number;
    publications: number;
    presentations: number;
    isAoaMember: boolean;
  }>) => {
    if (updates.step2Ck !== undefined) {
      setStep2Ck(updates.step2Ck);
      setStoredApplicantStep2Ck(updates.step2Ck);
    }
    if (typeof window !== 'undefined') {
      try {
        const current = {
          step2Ck: updates.step2Ck !== undefined ? updates.step2Ck : step2Ck,
          researchExperiences: updates.researchExperiences !== undefined ? updates.researchExperiences : researchExperiences,
          publications: updates.publications !== undefined ? updates.publications : publications,
          presentations: updates.presentations !== undefined ? updates.presentations : presentations,
          isAoaMember: updates.isAoaMember !== undefined ? updates.isAoaMember : isAoaMember,
        };
        localStorage.setItem(APPLICANT_PROFILE_STORAGE_KEY, JSON.stringify(current));
      } catch {}
    }
  };

  const profile: StudentMetricProfile = {
    step2Ck: Number(step2Ck) || 0,
    researchExperiences: Number(researchExperiences) || 0,
    abstracts: 2,
    presentations: Number(presentations) || 0,
    publications: Number(publications) || 0,
    volunteerExperiences: 5,
    isAoaMember,
  };

  const benchmark = getSpecialtyBenchmark(specialty);
  let assessment: CompetitivenessAssessment | null = null;
  try {
    if (benchmark) {
      assessment = assessCompetitiveness(profile, specialty);
    }
  } catch (err) {
    console.error(err);
  }

  const matchedStep2Median = benchmark?.step2Ck.matched ?? 248;
  const delta = step2Ck - matchedStep2Median;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/80 relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Primary Intake &amp; Automated Tiering Engine
              </span>
              <span className="text-xs text-slate-400">Official NRMP 2026 Medians</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              Applicant Baseline Intake &amp; Competitiveness Profile
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Enter your baseline USMLE Step 2 CK score and profile metrics to benchmark against national matched applicants and power dynamic tiering across your School List Matrix.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenFullCompetitiveness}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Deep-Dive Analyzer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenSchoolList}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>View School List</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
            </button>
          </div>
        </div>

        {/* Primary Intake Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Step 2 CK Intake */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Baseline Step 2 CK Score
              </label>
              <span className="text-[10px] text-sky-400 font-medium">Free-text input</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={180}
                max={300}
                value={step2Ck}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  saveProfileMetrics({ step2Ck: isNaN(val) ? 0 : val });
                }}
                className="w-28 text-2xl font-mono font-bold bg-slate-900 border-2 border-sky-500/60 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-sky-400 shadow-inner"
              />
              <div className="text-xs space-y-0.5">
                <div className="text-slate-400">Target Specialty:</div>
                <div className="font-semibold text-slate-200">{specialty}</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1">
              <span>Matched Median:</span>
              <strong className="text-slate-200">{matchedStep2Median}</strong>
              <span
                className={`font-semibold ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                  delta >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {delta >= 0 ? `+${delta} pts` : `${delta} pts`}
              </span>
            </div>
          </div>

          {/* Card 2: Competitiveness Tier Banner */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Overall Specialty Tier
              </span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              {assessment?.overallTier === 'above_average' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Above Average Profile</span>
                </div>
              ) : assessment?.overallTier === 'average' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Competitive / Median</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Holistic Target Profile</span>
                </div>
              )}
              <div className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                {assessment?.advisorySummary || 'Profile aligned with national applicant averages.'}
              </div>
            </div>
          </div>

          {/* Card 3: Profile Research & Scholarly Metrics */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Scholarly Baseline
              </span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Research Exp:</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-slate-200">{researchExperiences}</span>
                  <span className="text-[10px] text-slate-500">med: {benchmark?.researchExperiences.matched ?? 4}</span>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Pubs &amp; Works:</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono font-bold text-slate-200">{publications + presentations}</span>
                  <span className="text-[10px] text-slate-500">med: 6</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAoaMember}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsAoaMember(checked);
                    saveProfileMetrics({ isAoaMember: checked });
                  }}
                  className="rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Alpha Omega Alpha (AOA)</span>
              </label>
            </div>
          </div>

          {/* Card 4: Automated Tiering Sync Explanation */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Live Tiering Engine
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Safety:</strong> Your Step 2 &gt; Middle 80% High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span><strong>Target:</strong> Within Middle 80% Range</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span><strong>Reach:</strong> Your Step 2 &lt; Middle 80% Low</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-2">
              Automatically updates program tier labels based on Residency Explorer middle 80% range across your School List Matrix.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
