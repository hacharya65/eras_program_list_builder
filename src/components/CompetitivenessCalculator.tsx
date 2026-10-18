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
    let step2 = getStoredApplicantStep2Ck(studentId) || 250;
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

  // Step 2 CK Bell Curve Calculation & Coordinates
  const specialtyMedian = benchmark?.step2Ck.matched ?? 250;
  const nationalMedian = 250;
  const passingScore = 218;
  const studentScore = Number(step2Ck) || 250;

  // Domain: 195 to 285 (expanded width to accommodate overlapping medians and user score)
  const minScore = 195;
  const maxScore = 285;
  const plotLeft = 32;
  const plotWidth = 536;
  const baselineY = 138;
  const peakHeight = 72;
  const curveSigma = 24; // Wider standard deviation so the curve is broader and spacious

  const scoreToX = (score: number) => {
    const clamped = Math.max(minScore, Math.min(maxScore, score));
    return plotLeft + ((clamped - minScore) / (maxScore - minScore)) * plotWidth;
  };

  const scoreToY = (score: number) => {
    const z = (score - 250) / curveSigma;
    const pdf = Math.exp(-0.5 * z * z);
    return baselineY - peakHeight * pdf;
  };

  const curvePoints: string[] = [];
  for (let s = minScore; s <= maxScore; s += 2) {
    const x = scoreToX(s);
    const y = scoreToY(s);
    curvePoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const curvePathD = `M ${curvePoints.join(' L ')}`;
  const areaPathD = `${curvePathD} L ${scoreToX(maxScore).toFixed(1)},${baselineY} L ${scoreToX(minScore).toFixed(1)},${baselineY} Z`;

  const xPassing = scoreToX(passingScore);
  const xNational = scoreToX(nationalMedian);
  const xSpecialty = scoreToX(specialtyMedian);
  const xStudent = scoreToX(studentScore);
  const yStudent = scoreToY(studentScore);

  // Staggered Y offsets to guarantee collision-free annotations even when user score is at or near medians
  const nationalBadgeY = 10;
  const specialtyBadgeY = Math.abs(xSpecialty - xNational) < 68 ? 28 : 10;

  // Collision detection for student score badge:
  const distToNational = Math.abs(xStudent - xNational);
  const distToSpecialty = specialtyMedian !== nationalMedian ? Math.abs(xStudent - xSpecialty) : 999;
  const distToPassing = Math.abs(xStudent - xPassing);
  const isNearMedians = distToNational < 44 || distToSpecialty < 44;
  const isNearPassing = distToPassing < 36;

  let studentBadgeY = Math.max(10, yStudent - 24);
  if (isNearMedians) {
    studentBadgeY = 48; // Elevate/stack to Tier 3 when score fits at or around medians
  } else if (isNearPassing) {
    studentBadgeY = 54;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Overview"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Multimodal Competitiveness Engine</span>
            </h1>
          </div>
        </div>

        {/* Declared Target Specialty Badge (Locked) */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-xs">
          <span className="text-slate-600 font-bold whitespace-nowrap">Target Specialty:</span>
          <span className="font-bold text-slate-900">{specialty}</span>
        </div>
      </div>

      {/* Main Grid: Summary on Left, Metrics Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Competitiveness Tier Summary & Bell Curve (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          {assessment && (
            <div
              className={`p-6 rounded-xl border shadow-sm space-y-4 h-full flex flex-col justify-between ${
                assessment.overallTier === 'above_average'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : assessment.overallTier === 'average'
                  ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
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
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 border border-slate-200 text-slate-800">
                  {assessment.specialty}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {assessment.overallTier === 'above_average'
                    ? 'Metrics Above National Matched Median'
                    : assessment.overallTier === 'average'
                    ? 'Metrics Aligned with National Matched Median'
                    : 'Metrics Below National Matched Median'}
                </h3>
                <p className="text-xs mt-1.5 leading-relaxed text-slate-700 opacity-95">
                  {assessment.advisorySummary}
                </p>
              </div>

              {/* Step 2 CK Bell Curve Visualizer */}
              <div className="bg-white/90 rounded-xl border border-slate-200/90 p-4 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      USMLE Step 2 CK Distribution
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      National matched cohort benchmarks vs your official score
                    </p>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox="0 0 600 170"
                    className="w-full h-auto select-none"
                    aria-label="Step 2 CK Score Bell Curve"
                  >
                    <defs>
                      <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Shaded Area Under Curve */}
                    <path d={areaPathD} fill="url(#curveGradient)" />

                    {/* Baseline Axis */}
                    <line
                      x1={plotLeft}
                      y1={baselineY}
                      x2={plotLeft + plotWidth}
                      y2={baselineY}
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                    />

                    {/* Clean Subtle Axis Scale Markers */}
                    {[200, 220, 240, 260, 280].map((tick) => {
                      const tx = scoreToX(tick);
                      return (
                        <g key={tick}>
                          <line x1={tx} y1={baselineY} x2={tx} y2={baselineY + 4} stroke="#cbd5e1" strokeWidth="1" />
                          <text x={tx} y={baselineY + 14} textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">
                            {tick}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bell Curve Stroke */}
                    <path
                      d={curvePathD}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Marker 1: Passing Score (218) */}
                    <g>
                      <line
                        x1={xPassing}
                        y1={50}
                        x2={xPassing}
                        y2={baselineY}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <circle cx={xPassing} cy={scoreToY(passingScore)} r="3.5" fill="#f43f5e" />
                      <rect
                        x={xPassing - 28}
                        y={32}
                        width="56"
                        height="18"
                        rx="4"
                        fill="#fff1f2"
                        stroke="#fecdd3"
                        strokeWidth="1"
                      />
                      <text x={xPassing} y={44} textAnchor="middle" className="text-[9px] font-bold fill-rose-700">
                        Pass 218
                      </text>
                    </g>

                    {/* Marker 2: National Median (250) */}
                    <g>
                      <line
                        x1={xNational}
                        y1={nationalBadgeY + 18}
                        x2={xNational}
                        y2={baselineY}
                        stroke="#64748b"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <circle cx={xNational} cy={scoreToY(nationalMedian)} r="3.5" fill="#64748b" />
                      <rect
                        x={xNational - 33}
                        y={nationalBadgeY}
                        width="66"
                        height="18"
                        rx="4"
                        fill="#f8fafc"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />
                      <text x={xNational} y={nationalBadgeY + 12} textAnchor="middle" className="text-[9px] font-bold fill-slate-700">
                        Median 250
                      </text>
                    </g>

                    {/* Marker 3: Specialty Matched Median (X) */}
                    {specialtyMedian !== nationalMedian && (
                      <g>
                        <line
                          x1={xSpecialty}
                          y1={specialtyBadgeY + 18}
                          x2={xSpecialty}
                          y2={baselineY}
                          stroke="#2563eb"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        <circle cx={xSpecialty} cy={scoreToY(specialtyMedian)} r="3.5" fill="#2563eb" />
                        <rect
                          x={xSpecialty - 35}
                          y={specialtyBadgeY}
                          width="70"
                          height="18"
                          rx="4"
                          fill="#eff6ff"
                          stroke="#bfdbfe"
                          strokeWidth="1"
                        />
                        <text x={xSpecialty} y={specialtyBadgeY + 12} textAnchor="middle" className="text-[9px] font-bold fill-blue-700">
                          Matched {specialtyMedian}
                        </text>
                      </g>
                    )}

                    {/* Marker 4: Student Score (Y) */}
                    <g>
                      <line
                        x1={xStudent}
                        y1={Math.min(studentBadgeY + 18, yStudent)}
                        x2={xStudent}
                        y2={baselineY}
                        stroke="#047857"
                        strokeWidth="2.5"
                      />
                      <circle cx={xStudent} cy={yStudent} r="4.5" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />
                      {(() => {
                        const badgeW = 66;
                        const badgeX = Math.max(8, Math.min(600 - badgeW - 8, xStudent - badgeW / 2));
                        return (
                          <>
                            <rect
                              x={badgeX}
                              y={studentBadgeY}
                              width={badgeW}
                              height="18"
                              rx="4"
                              fill="#047857"
                            />
                            <text
                              x={badgeX + badgeW / 2}
                              y={studentBadgeY + 12}
                              textAnchor="middle"
                              className="text-[10px] font-black fill-white"
                            >
                              You: {studentScore}
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  </svg>
                </div>

                {/* 4-Item Legend / Key Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-white rounded-lg border border-rose-200 p-2.5 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                      <span>Passing Score</span>
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono my-0.5">{passingScore}</div>
                    <div className="text-[10px] text-slate-400">Minimum Standard</div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block shrink-0" />
                      <span>Median</span>
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono my-0.5">{nationalMedian}</div>
                    <div className="text-[10px] text-slate-400">All Matched Seniors</div>
                  </div>

                  <div className="bg-white rounded-lg border border-blue-200 p-2.5 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0" />
                      <span>Specialty Median</span>
                    </div>
                    <div className="text-base font-black text-blue-900 font-mono my-0.5">{specialtyMedian}</div>
                    <div className="text-[10px] text-blue-600 font-semibold truncate" title={specialty}>
                      {specialty}
                    </div>
                  </div>

                  <div className="bg-emerald-50/80 rounded-lg border border-emerald-300 p-2.5 shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                      <span>Your Score</span>
                    </div>
                    <div className="text-base font-black text-emerald-800 font-mono my-0.5">{studentScore}</div>
                    <div className="text-[10px] font-bold text-emerald-700">
                      {studentScore >= specialtyMedian ? `+${studentScore - specialtyMedian} vs specialty` : `${studentScore - specialtyMedian} vs specialty`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Link to Edit Intake Packet */}
              <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600">
                <span className="text-[11px] text-slate-500">
                  Official records benchmarked against official NRMP data.
                </span>
                <button
                  type="button"
                  onClick={handleNavigateToIntake}
                  className="font-bold underline text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Edit Intake Packet</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Multimodal Analysis & 6-Dimension Comparison Table (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          {assessment && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Your Metrics vs National Cohort for {specialty}
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
          )}
        </div>
      </div>

      {/* Unified Dataset Provenance & Ethical Guardrail Disclaimer (Horizontal across bottom) */}
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
  );
}
