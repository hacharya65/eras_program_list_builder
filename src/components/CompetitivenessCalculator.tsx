'use client';

import React, { useState } from 'react';
import {
  assessCompetitiveness,
  getSpecialtyBenchmark,
  getAllBenchmarkSpecialties,
  generateResidencyExplorerLink,
  StudentMetricProfile,
  CompetitivenessAssessment,
} from '@/domain/competitiveness-engine';
import {
  CANONICAL_SPECIALTIES,
  getStoredApplicantStep2Ck,
  setStoredApplicantStep2Ck,
  APPLICANT_PROFILE_STORAGE_KEY,
} from '@/domain/school-list-models';
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface CompetitivenessCalculatorProps {
  initialSpecialty?: string;
  onBack: () => void;
}

export function CompetitivenessCalculator({
  initialSpecialty = 'Internal Medicine',
  onBack,
}: CompetitivenessCalculatorProps) {
  const [specialty, setSpecialty] = useState(initialSpecialty);

  // Sync state whenever initialSpecialty updates from parent
  React.useEffect(() => {
    if (initialSpecialty) {
      setSpecialty(initialSpecialty);
    }
  }, [initialSpecialty]);

  // Student metrics state
  const [step2Ck, setStep2CkState] = useState<number>(() => getStoredApplicantStep2Ck());
  const [researchExperiences, setResearchExperiences] = useState<number>(4);
  const [abstracts, setAbstracts] = useState<number>(2);
  const [presentations, setPresentations] = useState<number>(4);
  const [publications, setPublications] = useState<number>(2);
  const [volunteerExperiences, setVolunteerExperiences] = useState<number>(5);
  const [isAoaMember, setIsAoaMember] = useState<boolean>(false);

  const handleStep2Change = (newVal: number) => {
    setStep2CkState(newVal);
    setStoredApplicantStep2Ck(newVal);
  };

  const profile: StudentMetricProfile = {
    step2Ck: Number(step2Ck) || 0,
    researchExperiences: Number(researchExperiences) || 0,
    abstracts: Number(abstracts) || 0,
    presentations: Number(presentations) || 0,
    publications: Number(publications) || 0,
    volunteerExperiences: Number(volunteerExperiences) || 0,
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

  const allSpecialties = getAllBenchmarkSpecialties();

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Official NRMP 2026 Data
              </span>
              <span className="text-xs text-slate-500">Summary Statistics Medians</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Multimodal Competitiveness Engine
            </h1>
          </div>
        </div>

        {/* Specialty Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-600">Target Specialty:</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CANONICAL_SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Analytics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metrics Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Your Academic & Portfolio Metrics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Metrics entered here are benchmarked against official matched cohort medians.
              </p>
            </div>

            {/* USMLE Step 2 CK */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">USMLE Step 2 CK Score</label>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {step2Ck}
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="285"
                step="1"
                value={step2Ck}
                onChange={(e) => handleStep2Change(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Passing (214)</span>
                <span>Specialty Matched Median: {benchmark?.step2Ck.matched ?? 245}</span>
                <span>Max (285)</span>
              </div>
            </div>

            {/* Research Experiences */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Research Experiences
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={researchExperiences}
                  onChange={(e) => setResearchExperiences(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Publications
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={publications}
                  onChange={(e) => setPublications(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Abstracts & Presentations */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Abstracts
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={abstracts}
                  onChange={(e) => setAbstracts(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Presentations / Posters
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={presentations}
                  onChange={(e) => setPresentations(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Volunteer Experiences */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Volunteer Experiences
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={volunteerExperiences}
                onChange={(e) => setVolunteerExperiences(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Honor Societies */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAoaMember}
                  onChange={(e) => setIsAoaMember(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Inducted into Alpha Omega Alpha (AOA) Honor Society
                </span>
              </label>
              <p className="text-[11px] text-slate-500 ml-6 mt-0.5">
                {benchmark ? `${benchmark.aoaPercentage.matched}% of matched seniors hold AOA in this specialty` : ''}
              </p>
            </div>
          </div>

          {/* Source Document Citation Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-slate-600" />
              Dataset Provenance
            </div>
            <p className="text-[11px] leading-relaxed">
              Derived from <strong className="text-slate-800">NRMP Charting Outcomes 2026: Summary Statistics</strong> (Page {benchmark?.page || 1}).
              Based on {benchmark?.sampleSize.matched?.toLocaleString() || '1,000+'} matched U.S. MD seniors.
            </p>
          </div>
        </div>

        {/* Right Column: Multimodal Analysis & Tier Assessment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {assessment && (
            <>
              {/* Overall Competitiveness Tier Banner */}
              <div
                className={`p-6 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  assessment.overallTier === 'above_average'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : assessment.overallTier === 'average'
                    ? 'bg-blue-50 border-blue-200 text-blue-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        assessment.overallTier === 'above_average'
                          ? 'bg-emerald-600 text-white'
                          : assessment.overallTier === 'average'
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {assessment.overallTier === 'above_average'
                        ? 'ABOVE AVERAGE APPLICANT TIER'
                        : assessment.overallTier === 'average'
                        ? 'AVERAGE APPLICANT TIER'
                        : 'BELOW AVERAGE APPLICANT TIER'}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Target: {assessment.specialty}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mt-2">
                    {assessment.overallTier === 'above_average'
                      ? 'Solid Advantage Over National Matched Medians'
                      : assessment.overallTier === 'average'
                      ? 'Well-Balanced & Aligned with Matched Cohort'
                      : 'High-Risk Profile Requiring Strategic Mitigation'}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {assessment.advisorySummary}
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 text-center shrink-0">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Step 2 CK Delta
                  </div>
                  <div
                    className={`text-2xl font-black ${
                      assessment.step2Delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {assessment.step2Delta >= 0 ? `+${assessment.step2Delta}` : assessment.step2Delta}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    vs {benchmark?.step2Ck.matched} median
                  </div>
                </div>
              </div>

              {/* Strategic Signaling Advisory Recommendation */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Faculty Signaling Strategy Recommendation
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {assessment.recommendedSignalingStrategy}
                </p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Cross-reference with interview conversion rates:
                  </span>
                  <a
                    href={generateResidencyExplorerLink(assessment.specialty)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Open Residency Explorer Yield Table <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 6-Dimension Comparison Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Multimodal Dimension Breakdown vs National Cohort
                  </h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {assessment.dimensionBreakdowns.map((dim, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">{dim.dimension}</div>
                        {dim.note && <div className="text-[11px] text-slate-500">{dim.note}</div>}
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase">Your Metric</div>
                          <div className="font-bold text-slate-900 text-sm">{dim.studentValue}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase">Matched Median</div>
                          <div className="font-semibold text-slate-700 text-sm">{dim.matchedMedian}</div>
                        </div>

                        <div className="w-20">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              dim.status === 'above'
                                ? 'bg-emerald-100 text-emerald-800'
                                : dim.status === 'at_median'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {dim.status === 'above' ? 'Above' : dim.status === 'at_median' ? 'At Median' : 'Below'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provenance Attribution & Ethical Guardrail Disclaimer */}
              <div className="bg-[#F4F8F6] rounded-xl border border-[#D6E5DF] p-4 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-[#1F3A30] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#4E8773]" />
                  <span>Provenance &amp; Ethical Guardrails</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  <strong>Citation:</strong> National Resident Matching Program. 2026. <em>Charting Outcomes™: Characteristics of Applicants Who Matched to Their Preferred Specialty, U.S. MD Seniors</em>, (Main Residency Match, 2026 Appointment Year).
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  Note: Historical reference values represent population associations from matched U.S. MD seniors and do not imply an admission probability, individual program requirement, or predicted Match outcome for the 2027 cycle.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
