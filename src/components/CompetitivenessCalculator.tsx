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
  APPLICANT_PROFILE_STORAGE_KEY,
} from '@/domain/school-list-models';
import {
  loadStudentAdvisingIntake,
} from '@/domain/advising-intake-models';
import { CURRENT_STUDENT_ID_KEY } from '@/domain/student-registry';
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
  studentId?: string;
  initialAoaMember?: boolean;
  onBack: () => void;
  onNavigateToIntake?: () => void;
}

export function CompetitivenessCalculator({
  initialSpecialty = 'Internal Medicine',
  studentId,
  initialAoaMember,
  onBack,
  onNavigateToIntake,
}: CompetitivenessCalculatorProps) {
  const [specialty, setSpecialty] = useState(initialSpecialty);

  const handleNavigateToIntake = () => {
    if (onNavigateToIntake) {
      onNavigateToIntake();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigate_to_intake'));
    }
  };

  // Sync state whenever initialSpecialty updates from parent
  React.useEffect(() => {
    if (initialSpecialty) {
      setSpecialty(initialSpecialty);
    }
  }, [initialSpecialty]);

  // Resolve initial student metrics from intake or stored profile
  const resolveInitialMetrics = () => {
    let aoa = false;
    let step2 = getStoredApplicantStep2Ck() || 250;
    let research = 4;
    let abs = 2;
    let pres = 4;
    let pubs = 2;
    let vol = 5;

    const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_STUDENT_ID_KEY) : null);
    if (sid) {
      const intake = loadStudentAdvisingIntake(sid);
      if (intake) {
        if (intake.isAoaMember !== undefined) aoa = Boolean(intake.isAoaMember);
        if (intake.step2Score) step2 = intake.step2Score;
        if (intake.researchExperiences !== undefined) research = intake.researchExperiences;
        if (intake.abstracts !== undefined) abs = intake.abstracts;
        if (intake.presentations !== undefined) pres = intake.presentations;
        if (intake.publications !== undefined) pubs = intake.publications;
        if (intake.volunteerExperiences !== undefined) vol = intake.volunteerExperiences;
      }
    }

    if (initialAoaMember !== undefined) {
      aoa = Boolean(initialAoaMember);
    } else if (typeof localStorage !== 'undefined') {
      try {
        const profileRaw = localStorage.getItem(APPLICANT_PROFILE_STORAGE_KEY);
        if (profileRaw) {
          const parsed = JSON.parse(profileRaw);
          if (parsed.isAoaMember !== undefined) aoa = Boolean(parsed.isAoaMember);
          if (parsed.publications !== undefined && parsed.publications !== null) pubs = Number(parsed.publications);
          if (parsed.researchExperiences !== undefined && parsed.researchExperiences !== null) research = Number(parsed.researchExperiences);
          if (parsed.abstracts !== undefined && parsed.abstracts !== null) abs = Number(parsed.abstracts);
          if (parsed.presentations !== undefined && parsed.presentations !== null) pres = Number(parsed.presentations);
          if (parsed.volunteerExperiences !== undefined && parsed.volunteerExperiences !== null) vol = Number(parsed.volunteerExperiences);
        }
      } catch {}
    }

    return { aoa, step2, research, abs, pres, pubs, vol };
  };

  const initialMetrics = React.useMemo(() => resolveInitialMetrics(), [studentId, initialAoaMember]);

  // Student metrics state
  const [step2Ck, setStep2CkState] = useState<number>(() => initialMetrics.step2);
  const [researchExperiences, setResearchExperiences] = useState<number>(() => initialMetrics.research);
  const [abstracts, setAbstracts] = useState<number>(() => initialMetrics.abs);
  const [presentations, setPresentations] = useState<number>(() => initialMetrics.pres);
  const [publications, setPublications] = useState<number>(() => initialMetrics.pubs);
  const [volunteerExperiences, setVolunteerExperiences] = useState<number>(() => initialMetrics.vol);
  const [isAoaMember, setIsAoaMember] = useState<boolean>(() => initialMetrics.aoa);

  // Synchronize state if props update
  React.useEffect(() => {
    if (initialAoaMember !== undefined) {
      setIsAoaMember(Boolean(initialAoaMember));
    }
  }, [initialAoaMember]);

  // Real-time synchronization when AOA or intake is updated across the platform
  React.useEffect(() => {
    const handleAoaSync = (e: any) => {
      if (e.detail !== undefined) {
        setIsAoaMember(Boolean(e.detail));
      }
    };
    const handleIntakeSync = (e: any) => {
      if (e.detail) {
        const intake = e.detail;
        if (intake.isAoaMember !== undefined) setIsAoaMember(Boolean(intake.isAoaMember));
        if (intake.step2Score) setStep2CkState(intake.step2Score);
        if (intake.researchExperiences !== undefined) setResearchExperiences(intake.researchExperiences);
        if (intake.abstracts !== undefined) setAbstracts(intake.abstracts);
        if (intake.presentations !== undefined) setPresentations(intake.presentations);
        if (intake.publications !== undefined) setPublications(intake.publications);
        if (intake.volunteerExperiences !== undefined) setVolunteerExperiences(intake.volunteerExperiences);
      }
    };

    window.addEventListener('applicant_aoa_updated', handleAoaSync);
    window.addEventListener('student_intake_saved', handleIntakeSync);
    return () => {
      window.removeEventListener('applicant_aoa_updated', handleAoaSync);
      window.removeEventListener('student_intake_saved', handleIntakeSync);
    };
  }, [studentId]);

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

        {/* Declared Target Specialty Badge (Locked) */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Target Specialty:</span>
          <span className="text-xs font-bold text-slate-900">{specialty}</span>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Analytics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metrics Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Your Academic &amp; Portfolio Metrics
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Read-Only Record
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized student records benchmarked against official matched cohort medians.
              </p>
            </div>

            {/* Advisory Alert with Hyperlink to Intake Form */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-sky-950">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="leading-relaxed">
                  Metrics cannot be modified here to protect data integrity with your official student advising records. To update your Step scores, research counts, or portfolio activities, please{' '}
                  <button
                    type="button"
                    onClick={handleNavigateToIntake}
                    className="font-bold underline text-sky-700 hover:text-sky-900 cursor-pointer inline-flex items-center gap-0.5 transition-colors"
                  >
                    <span>edit your Intake Packet</span>
                    <ExternalLink className="w-3 h-3 inline" />
                  </button>
                  .
                </p>
              </div>
            </div>

            {/* USMLE Step 2 CK */}
            <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">USMLE Step 2 CK Score</span>
                  <p className="text-[10px] text-slate-500">Official applicant baseline score</p>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
                  {step2Ck}
                </span>
              </div>
              <div className="pt-1">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.max(((step2Ck - 200) / (285 - 200)) * 100, 5), 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Passing (214)</span>
                  <span className="font-medium text-slate-600">Specialty Matched Median: {benchmark?.step2Ck.matched ?? 245}</span>
                  <span>Max (285)</span>
                </div>
              </div>
            </div>

            {/* Research Experiences & Publications */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs font-medium text-slate-600 block">Research Experiences</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {researchExperiences}
                </div>
                <span className="text-[10px] text-slate-400">
                  Specialty Median: {benchmark?.researchExperiences.matched ?? 4}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs font-medium text-slate-600 block">Publications</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {publications}
                </div>
                <span className="text-[10px] text-slate-400">Peer-reviewed manuscripts</span>
              </div>
            </div>

            {/* Abstracts & Presentations */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs font-medium text-slate-600 block">Abstracts</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {abstracts}
                </div>
                <span className="text-[10px] text-slate-400">Accepted abstracts</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs font-medium text-slate-600 block">Presentations / Posters</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {presentations}
                </div>
                <span className="text-[10px] text-slate-400">Oral &amp; poster presentations</span>
              </div>
            </div>

            {/* Volunteer Experiences */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-600 block">Volunteer Experiences</span>
                  <span className="text-[10px] text-slate-400">Community service &amp; outreach</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono">
                  {volunteerExperiences}
                </div>
              </div>
            </div>

            {/* Honor Societies */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Alpha Omega Alpha (AOA) Honor Society
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {benchmark ? `${benchmark.aoaPercentage.matched}% of matched seniors hold AOA in this specialty` : ''}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                  isAoaMember
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isAoaMember ? 'Inducted (Member)' : 'Not Inducted'}
              </span>
            </div>
          </div>

          {/* Unified Dataset Provenance & Ethical Guardrail Disclaimer */}
          <div className="bg-[#F4F8F6] rounded-xl border border-[#D6E5DF] p-4 text-xs text-slate-600 space-y-2.5">
            <div className="font-bold text-[#1F3A30] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#4E8773]" />
              <span>Dataset Provenance &amp; Ethical Guardrails</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">
              Derived from <strong className="text-slate-900">NRMP Charting Outcomes™ 2026: Summary Statistics</strong> (Page {benchmark?.page || 1}), based on {benchmark?.sampleSize.matched?.toLocaleString() || '1,000+'} matched U.S. MD seniors.
            </p>
            <div className="border-t border-[#D6E5DF]/70 pt-2 space-y-1 text-[10px]">
              <p className="text-slate-600 leading-relaxed">
                <strong>Citation:</strong> National Resident Matching Program. 2026. <em>Characteristics of Applicants Who Matched to Their Preferred Specialty, U.S. MD Seniors</em> (Main Residency Match, 2026 Appointment Year).
              </p>
              <p className="italic text-slate-500 leading-relaxed">
                Disclaimer: Historical reference medians represent retrospective population benchmarks from matched U.S. seniors and do not imply an admission guarantee, individual program cutoff, or predicted Match outcome for the 2027 cycle.
              </p>
            </div>
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

                {/* Residency Explorer Cross-Reference Link */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500">
                    Cross-reference with interview conversion rates:
                  </span>
                  <a
                    href={generateResidencyExplorerLink(assessment.specialty)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    Open Residency Explorer Yield Table <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
