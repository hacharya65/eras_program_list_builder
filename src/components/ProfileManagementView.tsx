'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, PersonalStatementDraft, ExperienceDraft } from '@/domain/types';
import { SpecialtyAdvisingIntake, calculateClerkshipHonorsCount } from '@/domain/advising-intake-models';
import {
  CANONICAL_SPECIALTIES,
  SPECIALTY_SIGNALING_RULES,
  getStoredApplicantStep2Ck,
  setStoredApplicantStep2Ck,
  getStoredTargetSpecialty,
  setStoredTargetSpecialty,
  loadItemsForSpecialty,
} from '@/domain/school-list-models';
import {
  User,
  GraduationCap,
  Sparkles,
  ClipboardCopy,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Building,
  Award,
  BookOpen,
  Calendar,
  FileCheck,
  Download,
  ExternalLink,
} from 'lucide-react';

interface ProfileManagementViewProps {
  student: UserProfile;
  targetSpecialty: string;
  onSpecialtyChange: (specialty: string) => void;
  advisingIntake: SpecialtyAdvisingIntake;
  onOpenIntake: () => void;
  onBack: () => void;
  assignedAdvisor?: UserProfile;
}

export function ProfileManagementView({
  student,
  targetSpecialty,
  onSpecialtyChange,
  advisingIntake,
  onOpenIntake,
  onBack,
  assignedAdvisor,
}: ProfileManagementViewProps) {
  // Academic metrics state
  const [step2CkScore, setStep2CkScore] = useState<number>(() => {
    return getStoredApplicantStep2Ck() || 254;
  });
  const [step1Status, setStep1Status] = useState<'pass' | 'fail'>('pass');
  const [classRank, setClassRank] = useState<'Top 10%' | 'Top Quartile' | 'Second Quartile' | 'Not Ranked'>(
    'Top Quartile'
  );
  const [hasAoa, setHasAoa] = useState(false);
  const [hasGhh, setHasGhh] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const honorsCount = advisingIntake?.clerkshipGrades
    ? calculateClerkshipHonorsCount(advisingIntake.clerkshipGrades)
    : 6;

  const specialtyRule =
    SPECIALTY_SIGNALING_RULES[targetSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  const handleSaveAcademicMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApplicantStep2Ck(step2CkScore);
    setSaveSuccessMsg('Academic profile & Step 2 CK score updated successfully!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return Banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3A30] hover:text-[#142720] bg-white border border-neutral-200/90 px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs text-neutral-500">
          Profile &amp; Governance Center &bull; {advisingIntake.medicalSchool || 'Match Strategy & Advising Center'}
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          {/* User Photo Avatar in Circle */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1F3A30] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm ring-4 ring-[#EAF2EE] shrink-0">
            {student.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{student.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2EE] text-[#1F3A30] border border-[#7EAE9B]/30">
                MS4 Applicant
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              {student.email} &bull; Class of 2027 &bull; {advisingIntake.regionalCampus || 'Campus'}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
              <span>Medical School:</span>
              <strong className="text-neutral-800">{advisingIntake.medicalSchool || 'School of Medicine'}</strong>
            </div>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 shrink-0">
          <button
            onClick={onOpenIntake}
            className="px-4 py-2 bg-[#EAF2EE] hover:bg-[#D6E5DF] text-[#1F3A30] border border-[#7EAE9B] rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#4E8773]" />
            <span>Advising Intake Form</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Grid: 3 Dedicated Profile Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module 1: Target Specialty & Signaling Strategy (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-6 space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1F3A30]" />
                <span>Target Applying Specialty Strategy</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Regulates signaling allocations, alumni network matching, and faculty advisor assignments.
              </p>
            </div>

            <div>
              <label htmlFor="profile-specialty-select" className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Current Primary Applying Specialty
              </label>
              <select
                id="profile-specialty-select"
                value={targetSpecialty}
                onChange={(e) => onSpecialtyChange(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer shadow-2xs"
              >
                {CANONICAL_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialty Signaling Breakdown */}
            <div className="p-4 bg-[#FBFBFA] border border-neutral-200/80 rounded-xl space-y-3">
              <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Official 2027 AAMC Signaling Rules ({targetSpecialty})
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs text-amber-800 font-semibold">Gold Tokens</div>
                  <div className="text-lg font-black text-amber-950 mt-0.5">
                    {specialtyRule.goldSignals}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-700 font-semibold">Silver Tokens</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {specialtyRule.silverSignals}
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs text-emerald-800 font-semibold">Total Signals</div>
                  <div className="text-lg font-black text-emerald-950 mt-0.5">
                    {specialtyRule.totalSignals}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed pt-1">
                {specialtyRule.explanationRequired
                  ? 'Note: This specialty requires program-specific 300-character signal rationale statements.'
                  : 'Program-specific signal explanations are optional or not utilized in this specialty.'}
              </p>
            </div>

            {/* Assigned Faculty Advisor snippet */}
            <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1F3A30] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  MC
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                    Assigned Specialty Faculty Advisor
                  </div>
                  <div className="font-bold text-neutral-900">
                    {assignedAdvisor?.name || 'Dr. Marcus Chen, MD'}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Geisinger Medical Center &bull; mchen@geisinger.edu
                  </div>
                </div>
              </div>
              <a
                href="mailto:mchen@geisinger.edu"
                className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-neutral-400 text-xs font-semibold rounded-lg text-neutral-700 shadow-2xs"
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* Module 3: Academic Profile & USMLE Score Editor (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handleSaveAcademicMetrics}
            className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-6 space-y-5"
          >
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#1F3A30]" />
                <span>Academic Record &amp; Competitiveness Metrics</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Powers your reach/target/safety matrix and national NRMP medians comparison.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  USMLE Step 2 CK Score *
                </label>
                <input
                  type="number"
                  min={194}
                  max={300}
                  required
                  value={step2CkScore}
                  onChange={(e) => setStep2CkScore(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 text-sm font-bold text-neutral-900 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  National mean: ~248 &bull; Step 1: Pass
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  USMLE Step 1 Status
                </label>
                <select
                  value={step1Status}
                  onChange={(e) => setStep1Status(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm font-semibold text-neutral-900 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs cursor-pointer"
                >
                  <option value="pass">Pass (First Attempt)</option>
                  <option value="fail">Fail (Retake Pending)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Class Rank / Quartile
                </label>
                <select
                  value={classRank}
                  onChange={(e) => setClassRank(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm font-semibold text-neutral-900 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs cursor-pointer"
                >
                  <option value="Top 10%">Top 10% (First Decile)</option>
                  <option value="Top Quartile">Top Quartile (Quartile 1)</option>
                  <option value="Second Quartile">Second Quartile (Quartile 2)</option>
                  <option value="Not Ranked">Non-Ranked</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Core Clerkship Honors Count
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${honorsCount} of 7 Honors`}
                    className="w-full px-3.5 py-2 text-sm font-bold text-neutral-900 border border-neutral-200 rounded-xl bg-neutral-50 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={onOpenIntake}
                    className="text-xs text-[#1F3A30] font-semibold hover:underline shrink-0"
                  >
                    Edit in Form &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Honor Society Toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAoa}
                  onChange={(e) => setHasAoa(e.target.checked)}
                  className="w-4 h-4 text-[#1F3A30] rounded focus:ring-[#7EAE9B] cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-neutral-900">Alpha Omega Alpha (AOA) Honor Society</div>
                  <div className="text-neutral-500">Elected based on high scholastic achievement &amp; leadership</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200/70 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGhh}
                  onChange={(e) => setHasGhh(e.target.checked)}
                  className="w-4 h-4 text-[#1F3A30] rounded focus:ring-[#7EAE9B] cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-neutral-900">Gold Humanism Honor Society (GHHS)</div>
                  <div className="text-neutral-500">Recognized for compassionate, patient-centered clinical care</div>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Save Academic Metrics
              </button>
            </div>
          </form>

          {/* Module 4: Specialty Advising Intake Form Status Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#1F3A30]" />
                  <span>Specialty Advising Intake Form</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Official clinical rotation &amp; faculty advising questionnaire.
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  advisingIntake.isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {advisingIntake.isCompleted ? 'Completed & Verified' : 'In Progress'}
              </span>
            </div>

            <div className="text-xs text-neutral-600 leading-relaxed">
              Discloses your 7 core clerkship grades, future MS4 rotation timeline (Blocks 3–7),
              sub-internship placements, and geographic preference divisions.
            </div>

            <button
              onClick={onOpenIntake}
              className="w-full py-2.5 px-4 bg-[#EAF2EE] hover:bg-[#D6E5DF] text-[#1F3A30] border border-[#7EAE9B] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#4E8773]" />
              <span>Open &amp; Edit Full Specialty Advising Form</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
