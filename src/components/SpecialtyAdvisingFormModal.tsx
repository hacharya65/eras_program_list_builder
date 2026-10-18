'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  Building2,
  Stethoscope,
  GraduationCap,
  Calendar,
  Compass,
  MapPin,
  Save,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Download,
  Copy,
  Award,
  FileCheck,
} from 'lucide-react';
import {
  SpecialtyAdvisingIntake,
  CoreClerkshipGrades,
  ClerkshipGrade,
  calculateClerkshipHonorsCount,
  saveStudentAdvisingIntake,
  loadStudentAdvisingIntake,
  getDefaultAdvisorForSpecialty,
  US_CENSUS_DIVISIONS,
  checkStateDivisionsMismatch,
  DEFAULT_CLERKSHIP_GRADES,
} from '@/domain/advising-intake-models';
import { CANONICAL_SPECIALTIES } from '@/domain/school-list-models';

interface SpecialtyAdvisingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  isAdvisorReviewMode?: boolean;
  onSaved?: (updated: SpecialtyAdvisingIntake) => void;
  isEmbedded?: boolean;
}

export function SpecialtyAdvisingFormModal({
  isOpen,
  onClose,
  studentId = 'usr-student-1',
  isAdvisorReviewMode = false,
  onSaved,
  isEmbedded = false,
}: SpecialtyAdvisingFormModalProps) {
  const [formData, setFormData] = useState<SpecialtyAdvisingIntake>(() => loadStudentAdvisingIntake(studentId));
  const [activeTab, setActiveTab] = useState<'editor' | 'printable_preview'>('editor');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Re-read storage on open or when studentId changes
  useEffect(() => {
    if (isOpen || isEmbedded) {
      const data = loadStudentAdvisingIntake(studentId);
      setFormData(data);
    }
  }, [isOpen, isEmbedded, studentId]);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${(formData.studentName || 'Student').replace(/\s+/g, '_')}_Advising_Intake_${(formData.applyingSpecialty || 'Specialty').replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySummary = () => {
    const honors = calculateClerkshipHonorsCount(formData.clerkshipGrades);
    const summary = `STUDENT SPECIALTY ADVISING INTAKE DOSSIER
================================================
Applicant: ${formData.studentName} (${formData.pronouns || 'N/A'})
Medical School: ${formData.medicalSchool || 'Not specified'}
Regional Campus: ${formData.regionalCampus}
Specialty Applying: ${formData.applyingSpecialty}
Specialty Advisor: ${formData.specialtyAdvisorName}
Date: ${formData.submissionDate}

USMLE & ACADEMIC PERFORMANCE:
- Step 1: ${formData.step1Result || 'Pass'}
- Step 2 CK: ${formData.step2Status === 'score_available' ? formData.step2Score : `Anticipated ${formData.step2AnticipatedDate}`}
- Step Failures: ${formData.hasStepFailures ? formData.stepFailureDetails : 'None'}
- Clerkship Honors: ${honors} of 7 core rotations
- Core Grades: ${Object.entries(formData.clerkshipGrades).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Dedicated Research Year: ${formData.completedResearchYear ? `Yes (${formData.researchYearLocation})` : 'No'}
- Academic Disclosures: ${formData.hasAcademicFailuresOrRepeats ? formData.academicFailuresDetails : 'None'}
- MSPE Disclosures: ${formData.hasCapsOrProfessionalismConcerns ? formData.capsConcernsDetails : 'None'}

PORTFOLIO & RESEARCH METRICS:
- Medical School Tier: ${formData.medicalSchoolTier || 'State / Mid-Tier'}
- Peer-Reviewed Publications: ${formData.publications ?? 0} (First-author: ${formData.firstAuthorPublications ?? 0})
- Regional / National Presentations: ${formData.presentations ?? 0}
- Scientific Abstracts: ${formData.abstracts ?? 0}
- Research Experiences: ${formData.researchExperiences ?? 0}
- Volunteer Experiences: ${formData.volunteerExperiences ?? 0}
- Leadership / Service Hours: ${formData.leadershipHours ?? 0} hrs
- Alpha Omega Alpha (AOA): ${formData.isAoaMember ? 'Yes' : 'No'}
- Gold Humanism Honor Society (GHHS): ${formData.isGoldHumanism ? 'Yes' : 'No'}

CLINICAL STATEMENT & GOALS:
- Motivation & Fit: ${formData.specialtyInterestReason}
- Parallel Plan: ${formData.consideringParallelPlan ? formData.parallelPlanSpecialty : 'None'}
- Rotations & Sub-Is: ${formData.futureRotationsTimeline}
- Geographic & Program Preferences: ${formData.residencyGoalsAndGeography}
- 2027 MyERAS Census Divisions: ${(formData.myErasCensusDivisions || []).join(', ') || 'None selected'}`;

    navigator.clipboard.writeText(summary);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  if (!isOpen && !isEmbedded) return null;

  const honorsCount = calculateClerkshipHonorsCount(formData.clerkshipGrades);
  const geoMismatch = checkStateDivisionsMismatch(
    formData.preferredStates || [],
    formData.myErasCensusDivisions || []
  );

  const handleClerkshipChange = (subject: keyof CoreClerkshipGrades, grade: ClerkshipGrade) => {
    setFormData((prev) => ({
      ...prev,
      clerkshipGrades: {
        ...prev.clerkshipGrades,
        [subject]: grade,
      },
    }));
  };

  const handleSpecialtyChange = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      applyingSpecialty: specialty,
      specialtyAdvisorName: getDefaultAdvisorForSpecialty(specialty),
    }));
  };

  const handleToggleCensusDivision = (division: string) => {
    const current = formData.myErasCensusDivisions || [];
    if (current.includes(division)) {
      setFormData((prev) => ({
        ...prev,
        myErasCensusDivisions: current.filter((d) => d !== division),
      }));
    } else {
      if (current.length >= 3) {
        alert('Per 2027 MyERAS Season Rules, you may select a maximum of 3 Geographic Census Divisions.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        myErasCensusDivisions: [...current, division],
      }));
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: SpecialtyAdvisingIntake = {
      ...formData,
      isCompleted: true,
      completedAt: formData.completedAt || new Date().toISOString(),
    };
    saveStudentAdvisingIntake(updated);
    setFormData(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onSaved?.(updated);
  };

  const handleAdvisorEndorse = () => {
    const updated: SpecialtyAdvisingIntake = {
      ...formData,
      advisorReviewedAt: new Date().toISOString(),
      advisorReviewerName: formData.specialtyAdvisorName || 'Dr. Marcus Chen',
    };
    saveStudentAdvisingIntake(updated);
    setFormData(updated);
    alert('Advising intake reviewed and endorsement recorded.');
    onSaved?.(updated);
  };

  const modalContent = (
    <div className={`bg-white ${isEmbedded ? 'w-full shadow-xs' : 'rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh]'} flex flex-col border border-neutral-200/90 overflow-hidden`}>
      {/* Modal Header */}
      <div className="bg-white text-neutral-900 px-6 py-4 flex items-center justify-between shrink-0 border-b border-neutral-200/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2EE] border border-[#7EAE9B]/30 flex items-center justify-center text-[#1F3A30] shrink-0">
            <FileCheck className="w-5 h-5 text-[#1F3A30]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#EAF2EE] text-[#1F3A30] border border-[#7EAE9B]/30">
                {formData.medicalSchool ? `${formData.medicalSchool} Packet` : 'Specialty Advising Packet'}
              </span>
            </div>
            <h2 id="intake-modal-title" className="text-lg font-bold text-neutral-900 tracking-tight mt-0.5">
              Specialty Advising Intake &amp; Packet
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Export Action Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-50 hover:bg-[#EAF2EE] text-neutral-700 hover:text-[#1F3A30] flex items-center gap-1.5 transition-all border border-neutral-200/80 cursor-pointer shadow-2xs"
              title="Copy text summary formatted for advisor meetings or emails"
            >
              <Copy className="w-3.5 h-3.5 text-[#4E8773]" />
              <span>{copiedSuccess ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-50 hover:bg-[#EAF2EE] text-neutral-700 hover:text-[#1F3A30] flex items-center gap-1.5 transition-all border border-neutral-200/80 cursor-pointer shadow-2xs"
              title="Download intake profile as JSON file"
            >
              <Download className="w-3.5 h-3.5 text-[#4E8773]" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="bg-neutral-100 p-1 rounded-xl flex items-center gap-1 border border-neutral-200/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200/60'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Interactive Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('printable_preview')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'printable_preview'
                  ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200/60'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Official Printable View
            </button>
          </div>

          {!isEmbedded && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors ml-1 cursor-pointer"
              title="Close modal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F4F8F6]/60">
          {activeTab === 'editor' ? (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Advisor Mode Notice */}
              {isAdvisorReviewMode && (
                <div className="bg-[#EAF2EE] border border-[#7EAE9B] rounded-xl p-4 text-xs text-[#1F3A30] flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-[#4E8773] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#1F3A30] text-sm">Faculty Advisor Review Mode</h4>
                    <p className="mt-0.5 text-slate-700">
                      You are inspecting {formData.studentName}'s complete specialty advising intake, including
                      disclosures and rotation timelines. Your private notes and endorsement are recorded below.
                    </p>
                  </div>
                </div>
              )}

              {/* Header Biographical Box */}
              <div className="bg-white rounded-xl border border-[#D6E5DF] p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#7EAE9B]" />
                    Applicant & Institutional Metadata
                  </h3>
                  <span className="text-xs text-slate-500">Date: {formData.submissionDate}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Student Name</label>
                    <input
                      type="text"
                      disabled
                      value={formData.studentName}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Medical School Attended</label>
                    <input
                      type="text"
                      value={formData.medicalSchool || ''}
                      onChange={(e) => setFormData({ ...formData, medicalSchool: e.target.value })}
                      placeholder="e.g. Johns Hopkins, Penn State, UCLA"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-[#7EAE9B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pronouns</label>
                    <input
                      type="text"
                      value={formData.pronouns}
                      onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                      placeholder="e.g. He/Him/His, She/Her/Hers"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-[#7EAE9B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Regional Campus</label>
                    <select
                      value={formData.regionalCampus}
                      onChange={(e) => setFormData({ ...formData, regionalCampus: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-[#7EAE9B] focus:outline-none"
                    >
                      <option value="Northeast">Northeast</option>
                      <option value="Central">Central</option>
                      <option value="South">South</option>
                      <option value="West">West</option>
                      <option value="Guthrie">Guthrie</option>
                      <option value="AtlantiCare">AtlantiCare</option>
                      <option value="Main Campus">Main Campus</option>
                      <option value="Other">Other Campus</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Specialty Advisor</label>
                    <input
                      type="text"
                      disabled
                      value={formData.specialtyAdvisorName}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-bold cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Questions 1 & 2: Specialty Choice & Statement */}
              <div className="bg-white rounded-xl border border-[#D6E5DF] p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#7EAE9B]" />
                  1 & 2. Specialty Applying & Clinical Motivations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-1">
                    <label className="font-bold text-slate-800 block mb-1">1. Declared Specialty</label>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>{formData.applyingSpecialty}</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">Declared</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Declared during onboarding. Syncs across School List Matrix and signaling budgets.
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-800 block mb-1">
                      2. Why are you interested in this specialty?
                    </label>
                    <textarea
                      rows={3}
                      value={formData.specialtyInterestReason}
                      onChange={(e) => setFormData({ ...formData, specialtyInterestReason: e.target.value })}
                      placeholder="Discuss inpatient vs. outpatient balance, clinical breadth, procedural vs. cognitive focus, teaching, and fellowship interests..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-[#7EAE9B] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Questions 3, 4, 5: Step Examinations & Research Year */}
              <div className="bg-white rounded-xl border border-[#D6E5DF] p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7EAE9B]" />
                  3, 4 & 5. Examination Performance & Dedicated Research
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Step 1 Result */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="font-bold text-slate-800 block mb-2">USMLE Step 1</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, step1Result: 'Pass' })}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                          formData.step1Result !== 'Fail'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border text-slate-600'
                        }`}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, step1Result: 'Fail' })}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                          formData.step1Result === 'Fail'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-white border text-slate-600'
                        }`}
                      >
                        Fail
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 block">Official first-attempt outcome</span>
                  </div>

                  {/* Q4: Step 2 CK Status */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="font-bold text-slate-800 block mb-2">
                      4. Step 2 CK Status / Score
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, step2Status: 'score_available' })}
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          formData.step2Status === 'score_available'
                            ? 'bg-[#1F3A30] text-white'
                            : 'bg-white border text-slate-600'
                        }`}
                      >
                        Score Available
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, step2Status: 'anticipated_date' })}
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          formData.step2Status === 'anticipated_date'
                            ? 'bg-[#1F3A30] text-white'
                            : 'bg-white border text-slate-600'
                        }`}
                      >
                        Pending Date
                      </button>
                    </div>

                    {formData.step2Status === 'score_available' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={150}
                          max={300}
                          value={formData.step2Score || 260}
                          onChange={(e) => setFormData({ ...formData, step2Score: parseInt(e.target.value) || 0 })}
                          className="w-24 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900"
                        />
                        <span className="text-[11px] text-slate-500">Auto-tiers matrix</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.step2AnticipatedDate || ''}
                        onChange={(e) => setFormData({ ...formData, step2AnticipatedDate: e.target.value })}
                        placeholder="e.g. July 2026"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900"
                      />
                    )}
                  </div>

                  {/* Q3: Step Failures */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-slate-800">3. Any step failures?</label>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="step_failures"
                            checked={!formData.hasStepFailures}
                            onChange={() => setFormData({ ...formData, hasStepFailures: false, stepFailureDetails: '' })}
                          />
                          <span>No</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-rose-700">
                          <input
                            type="radio"
                            name="step_failures"
                            checked={formData.hasStepFailures}
                            onChange={() => setFormData({ ...formData, hasStepFailures: true })}
                          />
                          <span>Yes</span>
                        </label>
                      </div>
                    </div>
                    {formData.hasStepFailures ? (
                      <textarea
                        rows={2}
                        value={formData.stepFailureDetails || ''}
                        onChange={(e) => setFormData({ ...formData, stepFailureDetails: e.target.value })}
                        placeholder="Specify Step 1 or Step 2 CK, date, and context..."
                        className="w-full bg-white border border-rose-300 rounded p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500 mt-1"
                        required
                      />
                    ) : (
                      <span className="text-[11px] text-slate-500 block">Clean testing record</span>
                    )}
                  </div>

                  {/* Q5: Research Year */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-slate-800">5. Research Year?</label>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="research_year"
                            checked={!formData.completedResearchYear}
                            onChange={() => setFormData({ ...formData, completedResearchYear: false, researchYearLocation: '' })}
                          />
                          <span>No</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-emerald-800">
                          <input
                            type="radio"
                            name="research_year"
                            checked={formData.completedResearchYear}
                            onChange={() => setFormData({ ...formData, completedResearchYear: true })}
                          />
                          <span>Yes</span>
                        </label>
                      </div>
                    </div>
                    {formData.completedResearchYear ? (
                      <input
                        type="text"
                        value={formData.researchYearLocation || ''}
                        onChange={(e) => setFormData({ ...formData, researchYearLocation: e.target.value })}
                        placeholder="Lab / Institution (e.g. NIH, Harvard)"
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#7EAE9B] mt-1"
                        required
                      />
                    ) : (
                      <span className="text-[11px] text-slate-500 block">Standard 4-year track</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Your Academic & Portfolio Metrics */}
              <div className="bg-white rounded-xl border border-[#D6E5DF] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#7EAE9B]" />
                    Academic &amp; Portfolio Metrics
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Used for Program List Competitiveness &amp; Signaling Strategy
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Medical School Tier</label>
                    <select
                      value={formData.medicalSchoolTier || 'State / Mid-Tier'}
                      onChange={(e) => setFormData({ ...formData, medicalSchoolTier: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="Top 25 Research-Intensive">Top 25 Research</option>
                      <option value="State / Mid-Tier">State / Mid-Tier</option>
                      <option value="Newer Community-Based">Community-Based</option>
                      <option value="International / Caribbean">International</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Publications</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.publications ?? 0}
                      onChange={(e) => setFormData({ ...formData, publications: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">First-Author Pubs</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.firstAuthorPublications ?? 0}
                      onChange={(e) => setFormData({ ...formData, firstAuthorPublications: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Presentations / Posters</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.presentations ?? 0}
                      onChange={(e) => setFormData({ ...formData, presentations: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Abstracts</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.abstracts ?? 0}
                      onChange={(e) => setFormData({ ...formData, abstracts: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Research Experiences</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.researchExperiences ?? 0}
                      onChange={(e) => setFormData({ ...formData, researchExperiences: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Volunteer Experiences</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.volunteerExperiences ?? 0}
                      onChange={(e) => setFormData({ ...formData, volunteerExperiences: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Leadership Hours</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.leadershipHours ?? 0}
                      onChange={(e) => setFormData({ ...formData, leadershipHours: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isAoaMember)}
                        onChange={(e) => setFormData({ ...formData, isAoaMember: e.target.checked })}
                        className="rounded border-slate-300 text-[#1F3A30] focus:ring-[#7EAE9B]"
                      />
                      <span>Alpha Omega Alpha (AOA)</span>
                    </label>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isGoldHumanism)}
                        onChange={(e) => setFormData({ ...formData, isGoldHumanism: e.target.checked })}
                        className="rounded border-slate-300 text-[#1F3A30] focus:ring-[#7EAE9B]"
                      />
                      <span>Gold Humanism (GHHS)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Question 6: 7 Core Clerkship Grades & Live Honors Counter */}
              <div className="bg-white rounded-xl border border-[#D6E5DF] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#7EAE9B]" />
                      6. Core Clinical Clerkship Grades Available
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Standardized grading for all 7 core disciplines across your clinical rotations
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-[#EAF2EE] border border-[#7EAE9B] text-[#1F3A30] font-bold rounded-lg text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4E8773]" />
                    <span>{honorsCount} of 7 Core Honors</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    { key: 'familyMedicine', label: 'Family Medicine' },
                    { key: 'internalMedicine', label: 'Internal Medicine' },
                    { key: 'surgery', label: 'General Surgery' },
                    { key: 'pediatrics', label: 'Pediatrics' },
                    { key: 'obGyn', label: 'Obstetrics & Gynecology' },
                    { key: 'neurology', label: 'Neurology' },
                    { key: 'psychiatry', label: 'Psychiatry' },
                  ].map(({ key, label }) => {
                    const gradeVal = formData.clerkshipGrades[key as keyof CoreClerkshipGrades];
                    return (
                      <div key={key} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                        <label className="font-bold text-slate-700 block mb-1">{label}</label>
                        <select
                          value={gradeVal}
                          onChange={(e) =>
                            handleClerkshipChange(key as keyof CoreClerkshipGrades, e.target.value as ClerkshipGrade)
                          }
                          className={`w-full rounded px-2 py-1 text-xs font-semibold border ${
                            gradeVal === 'Honors'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : gradeVal === 'High Pass'
                              ? 'bg-sky-50 border-sky-300 text-sky-900'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="Honors">Honors</option>
                          <option value="High Pass">High Pass</option>
                          <option value="Pass">Pass</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Fail">Fail</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Questions 7, 8, 9: Academic Disclosures & Red-Flag Screening */}
              <div className="bg-white rounded-xl border border-rose-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    7, 8 & 9. Academic Screening & Institutional Disclosures
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Q7: Course failures */}
                  <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-900 leading-tight">
                        7. Course/clerkship failures or repeat of year?
                      </label>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="course_fail"
                            checked={!formData.hasAcademicFailuresOrRepeats}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                hasAcademicFailuresOrRepeats: false,
                                academicFailuresDetails: '',
                              })
                            }
                          />
                          <span className="ml-1">No</span>
                        </label>
                        <label className="cursor-pointer font-bold text-rose-700">
                          <input
                            type="radio"
                            name="course_fail"
                            checked={formData.hasAcademicFailuresOrRepeats}
                            onChange={() => setFormData({ ...formData, hasAcademicFailuresOrRepeats: true })}
                          />
                          <span className="ml-1">Yes</span>
                        </label>
                      </div>
                    </div>
                    {formData.hasAcademicFailuresOrRepeats && (
                      <textarea
                        rows={2}
                        value={formData.academicFailuresDetails || ''}
                        onChange={(e) => setFormData({ ...formData, academicFailuresDetails: e.target.value })}
                        placeholder="Please specify courses, remediations, or repeat dates..."
                        className="w-full bg-white border border-rose-300 rounded p-1.5 text-xs text-slate-900 mt-1"
                        required
                      />
                    )}
                  </div>

                  {/* Q8: CAPS Actions */}
                  <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-900 leading-tight">
                        8. CAPS actions (probation) or MSPE professionalism concerns?
                      </label>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="caps_concerns"
                            checked={!formData.hasCapsOrProfessionalismConcerns}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                hasCapsOrProfessionalismConcerns: false,
                                capsConcernsDetails: '',
                              })
                            }
                          />
                          <span className="ml-1">No</span>
                        </label>
                        <label className="cursor-pointer font-bold text-rose-700">
                          <input
                            type="radio"
                            name="caps_concerns"
                            checked={formData.hasCapsOrProfessionalismConcerns}
                            onChange={() => setFormData({ ...formData, hasCapsOrProfessionalismConcerns: true })}
                          />
                          <span className="ml-1">Yes</span>
                        </label>
                      </div>
                    </div>
                    {formData.hasCapsOrProfessionalismConcerns && (
                      <textarea
                        rows={2}
                        value={formData.capsConcernsDetails || ''}
                        onChange={(e) => setFormData({ ...formData, capsConcernsDetails: e.target.value })}
                        placeholder="Please specify committee decisions, dates, and resolutions..."
                        className="w-full bg-white border border-rose-300 rounded p-1.5 text-xs text-slate-900 mt-1"
                        required
                      />
                    )}
                  </div>

                  {/* Q9: Leave of Absence */}
                  <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-900 leading-tight">
                        9. Have you taken a leave of absence?
                      </label>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="leave_absence"
                            checked={!formData.hasLeaveOfAbsence}
                            onChange={() =>
                              setFormData({ ...formData, hasLeaveOfAbsence: false, leaveOfAbsenceType: '' })
                            }
                          />
                          <span className="ml-1">No</span>
                        </label>
                        <label className="cursor-pointer font-bold text-rose-700">
                          <input
                            type="radio"
                            name="leave_absence"
                            checked={formData.hasLeaveOfAbsence}
                            onChange={() => setFormData({ ...formData, hasLeaveOfAbsence: true })}
                          />
                          <span className="ml-1">Yes</span>
                        </label>
                      </div>
                    </div>
                    {formData.hasLeaveOfAbsence && (
                      <input
                        type="text"
                        value={formData.leaveOfAbsenceType || ''}
                        onChange={(e) => setFormData({ ...formData, leaveOfAbsenceType: e.target.value })}
                        placeholder="Specify type of leave (medical, personal, research, dual degree)..."
                        className="w-full bg-white border border-rose-300 rounded p-1.5 text-xs text-slate-900 mt-1"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Questions 10, 11, 12, 13: Rotations, Parallel Plan & Geography */}
              <div className="bg-white rounded-xl border border-[#D6E5DF] p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#1F3A30] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#7EAE9B]" />
                  10, 11, 12 & 13. Strategy, Rotations, Mentors & Geography
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Q10: Parallel Plan */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-slate-800">
                        10. Are you considering a parallel plan?
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="parallel_plan"
                            checked={!formData.consideringParallelPlan}
                            onChange={() =>
                              setFormData({ ...formData, consideringParallelPlan: false, parallelPlanSpecialty: '' })
                            }
                          />
                          <span>No</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-emerald-800">
                          <input
                            type="radio"
                            name="parallel_plan"
                            checked={formData.consideringParallelPlan}
                            onChange={() => setFormData({ ...formData, consideringParallelPlan: true })}
                          />
                          <span>Yes</span>
                        </label>
                      </div>
                    </div>
                    {formData.consideringParallelPlan && (
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1">Backup / Parallel Specialty:</label>
                        <select
                          value={formData.parallelPlanSpecialty || ''}
                          onChange={(e) => setFormData({ ...formData, parallelPlanSpecialty: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold text-slate-900"
                        >
                          <option value="">Select backup specialty...</option>
                          {CANONICAL_SPECIALTIES.filter((s) => s !== formData.applyingSpecialty).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Q12: External Advisors */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="font-bold text-slate-800 block mb-1">
                      12. Other specialty advisors outside primary home institution network:
                    </label>
                    <input
                      type="text"
                      value={formData.externalAdvisors}
                      onChange={(e) => setFormData({ ...formData, externalAdvisors: e.target.value })}
                      placeholder="e.g. Dr. Jane Smith (Mt. Sinai NYC), or 'n/a'"
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-900"
                    />
                  </div>

                  {/* Q11: Future specialty rotations */}
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-800 block mb-1">
                      11. Future specialty rotations, dates, and campus locations:
                    </label>
                    <textarea
                      rows={2}
                      value={formData.futureRotationsTimeline}
                      onChange={(e) => setFormData({ ...formData, futureRotationsTimeline: e.target.value })}
                      placeholder="e.g. Block 3 - EM @ GMC // Block 4 - SSHM (PM&R) // Block 6 - Med Sub-I @ GMC // Block 7 - Away Sub-I at Mt. Sinai NYC..."
                      className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs text-slate-900"
                    />
                  </div>

                  {/* Q13: Residency goals & geographic preferences */}
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-800 block mb-1">
                      13. Goals for a residency program & geographic preferences:
                    </label>
                    <textarea
                      rows={2}
                      value={formData.residencyGoalsAndGeography}
                      onChange={(e) => setFormData({ ...formData, residencyGoalsAndGeography: e.target.value })}
                      placeholder="e.g. Academic (clinician educator), fellowship plans. Geographic ranks: #1 NYC, #2 NJ/PA, #3 New England, #4 South Atlantic..."
                      className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* 2027 MyERAS Census Divisions Selector & Mismatch Warning */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800 text-xs">
                      2027 MyERAS Official Geographic Divisions (Select up to 3):
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {(formData.myErasCensusDivisions || []).length} of 3 Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.keys(US_CENSUS_DIVISIONS).map((div) => {
                      const isChecked = (formData.myErasCensusDivisions || []).includes(div);
                      return (
                        <label
                          key={div}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[#EAF2EE] border-[#7EAE9B] text-[#1F3A30] font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCensusDivision(div)}
                            className="rounded text-[#7EAE9B] focus:ring-[#7EAE9B]"
                          />
                          <span className="text-[11px]">{div}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Geographic Mismatch Warning */}
                  {geoMismatch.warningMessage && (
                    <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{geoMismatch.warningMessage}</span>
                    </div>
                  )}
                </div>
              </div>





              {/* Action Toolbar */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Intake Saved & Synchronized!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1F3A30] hover:bg-[#142720] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4 text-[#7EAE9B]" />
                    Save & Update Advising Packet
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Printable Preview matching official advising paper form */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-600">
                  Comprehensive Official Specialty Advising Packet &amp; Diagnostic Record.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold flex items-center gap-1.5 border border-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>{copiedSuccess ? 'Copied!' : 'Copy Summary'}</span>
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold flex items-center gap-1.5 border border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-[#1F3A30] hover:bg-[#142720] text-white rounded font-bold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#7EAE9B]" />
                    Print / Save as PDF
                  </button>
                </div>
              </div>

              {/* Form Sheet Preview */}
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-300 max-w-2xl mx-auto text-slate-900 font-serif text-[12px] leading-relaxed space-y-4">
                <div className="border-b-2 border-slate-900 pb-3 text-center">
                  <h1 className="text-base font-bold uppercase tracking-wide">Specialty Advising Packet</h1>
                  <span className="text-[10px] text-slate-600 font-sans">{formData.medicalSchool || 'Medical Student Advising Network'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans border-b border-slate-300 pb-3">
                  <div><strong>NAME:</strong> {formData.studentName}</div>
                  <div><strong>MEDICAL SCHOOL:</strong> {formData.medicalSchool || '—'}</div>
                  <div><strong>PRONOUNS:</strong> {formData.pronouns || '—'}</div>
                  <div><strong>DATE:</strong> {formData.submissionDate}</div>
                  <div><strong>REGIONAL CAMPUS:</strong> {formData.regionalCampus}</div>
                  <div><strong>SPECIALTY ADVISOR:</strong> {formData.specialtyAdvisorName}</div>
                </div>

                <div className="space-y-3 font-sans text-[11px]">
                  <div>
                    <strong>1. Specialty Applying:</strong> {formData.applyingSpecialty}
                  </div>
                  <div>
                    <strong>2. Why are you interested in this specialty?</strong>
                    <p className="mt-1 pl-3 text-slate-800 font-serif italic text-xs">
                      {formData.specialtyInterestReason || 'No response recorded.'}
                    </p>
                  </div>
                  <div>
                    <strong>3. USMLE Performance &amp; Disclosures:</strong>
                    <div className="mt-1 pl-3 text-slate-800">
                      Step 1: <strong>{formData.step1Result || 'Pass'}</strong> &bull; Step 2 CK:{' '}
                      <strong>
                        {formData.step2Status === 'score_available'
                          ? formData.step2Score
                          : `Anticipated ${formData.step2AnticipatedDate || 'Pending'}`}
                      </strong>
                      {formData.hasStepFailures ? (
                        <span className="text-rose-700 ml-2">(Disclosures: {formData.stepFailureDetails})</span>
                      ) : (
                        <span className="text-emerald-700 ml-2">(No exam failures)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>4. Academic &amp; Portfolio Metrics:</strong>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 pl-3 text-slate-800 font-mono text-[11px]">
                      <div>School Tier: {formData.medicalSchoolTier || 'State / Mid-Tier'}</div>
                      <div>Publications: {formData.publications ?? 0} (1st author: {formData.firstAuthorPublications ?? 0})</div>
                      <div>Presentations: {formData.presentations ?? 0}</div>
                      <div>Scientific Abstracts: {formData.abstracts ?? 0}</div>
                      <div>Research Experiences: {formData.researchExperiences ?? 0}</div>
                      <div>Volunteer Experiences: {formData.volunteerExperiences ?? 0}</div>
                      <div>Leadership Hours: {formData.leadershipHours ?? 0} hrs</div>
                      <div>AOA: {formData.isAoaMember ? 'Yes' : 'No'} | GHHS: {formData.isGoldHumanism ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  <div>
                    <strong>5. Completion of Research Year:</strong> {formData.completedResearchYear ? `Yes (${formData.researchYearLocation})` : 'No'}
                  </div>
                  <div>
                    <strong>6. Clerkship grades available ({honorsCount} of 7 Honors):</strong>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 pl-3 text-slate-800 font-mono text-[11px]">
                      <div>Family Medicine: {formData.clerkshipGrades.familyMedicine}</div>
                      <div>Pediatrics: {formData.clerkshipGrades.pediatrics}</div>
                      <div>Internal Medicine: {formData.clerkshipGrades.internalMedicine}</div>
                      <div>Ob/Gyn: {formData.clerkshipGrades.obGyn}</div>
                      <div>Surgery: {formData.clerkshipGrades.surgery}</div>
                      <div>Neurology: {formData.clerkshipGrades.neurology}</div>
                      <div>Psychiatry: {formData.clerkshipGrades.psychiatry}</div>
                    </div>
                  </div>
                  <div>
                    <strong>7. Any course failures, clerkship failures, or repeat of year:</strong>{' '}
                    {formData.hasAcademicFailuresOrRepeats ? `Yes — ${formData.academicFailuresDetails}` : 'No'}
                  </div>
                  <div>
                    <strong>8. Any CAPS actions (probation) or professionalism concerns in MSPE:</strong>{' '}
                    {formData.hasCapsOrProfessionalismConcerns ? `Yes — ${formData.capsConcernsDetails}` : 'No'}
                  </div>
                  <div>
                    <strong>9. Have you taken a leave of absence:</strong>{' '}
                    {formData.hasLeaveOfAbsence ? `Yes — ${formData.leaveOfAbsenceType}` : 'No'}
                  </div>
                  <div>
                    <strong>10. Are you considering a parallel plan:</strong>{' '}
                    {formData.consideringParallelPlan ? `Yes — ${formData.parallelPlanSpecialty}` : 'No'}
                  </div>
                  <div>
                    <strong>11. Future specialty rotations, dates, and campus locations:</strong>
                    <p className="mt-0.5 pl-3 text-slate-800 italic">{formData.futureRotationsTimeline || 'None'}</p>
                  </div>
                  <div>
                    <strong>12. Other specialty advisors outside primary home institution:</strong>{' '}
                    {formData.externalAdvisors || 'n/a'}
                  </div>
                  <div>
                    <strong>13. Goals for residency & geographic preferences:</strong>
                    <p className="mt-0.5 pl-3 text-slate-800 italic">{formData.residencyGoalsAndGeography || 'None'}</p>
                    <p className="mt-0.5 pl-3 text-slate-600 text-[10px]">
                      Selected 2027 Census Divisions: {(formData.myErasCensusDivisions || []).join(', ') || 'None selected'}
                    </p>
                  </div>
                </div>


              </div>
            </div>
          )}
        </div>
    </div>
  );

  if (isEmbedded) {
    return modalContent;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
    >
      {modalContent}
    </div>
  );
}
