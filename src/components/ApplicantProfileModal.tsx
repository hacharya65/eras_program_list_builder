'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Save,
  BarChart3,
} from 'lucide-react';
import {
  getStoredApplicantStep2Ck,
  setStoredApplicantStep2Ck,
  APPLICANT_PROFILE_STORAGE_KEY,
} from '@/domain/school-list-models';

export interface ApplicantProfileData {
  step2Ck: number;
  step1Result?: 'Pass' | 'Fail' | string;
  clerkshipHonors?: number;
  publications: number;
  researchExperiences: number;
  abstracts?: number;
  presentations: number;
  leadershipHours?: number;
  volunteerExperiences: number;
  isAoaMember: boolean;
}

const DEFAULT_PROFILE: ApplicantProfileData = {
  step2Ck: 267,
  step1Result: 'Pass',
  clerkshipHonors: 4,
  publications: 2,
  researchExperiences: 4,
  abstracts: 2,
  presentations: 4,
  leadershipHours: 120,
  volunteerExperiences: 5,
  isAoaMember: false,
};

interface ApplicantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  specialty?: string;
  onSaved?: (updated: ApplicantProfileData) => void;
  onOpenCompetitivenessEngine?: () => void;
}

export function ApplicantProfileModal({
  isOpen,
  onClose,
  onSaved,
  onOpenCompetitivenessEngine,
}: ApplicantProfileModalProps) {
  const [profile, setProfile] = useState<ApplicantProfileData>(() => {
    const initialStep2 = getStoredApplicantStep2Ck();
    return {
      ...DEFAULT_PROFILE,
      step2Ck: initialStep2 || DEFAULT_PROFILE.step2Ck,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Rehydrate on open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(APPLICANT_PROFILE_STORAGE_KEY);
        const currentStep2 = getStoredApplicantStep2Ck();
        if (cached) {
          const parsed = JSON.parse(cached);
          setProfile({
            ...DEFAULT_PROFILE,
            ...parsed,
            step2Ck: currentStep2 || parsed.step2Ck || DEFAULT_PROFILE.step2Ck,
          });
        } else {
          setProfile((prev) => ({ ...prev, step2Ck: currentStep2 || DEFAULT_PROFILE.step2Ck }));
        }
      } catch {
        // Fallback to default
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update step 2 CK in dedicated persistent helper (triggers sync event)
    setStoredApplicantStep2Ck(profile.step2Ck);

    // 2. Persist full profile
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(APPLICANT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
        window.dispatchEvent(new CustomEvent('applicant_profile_updated', { detail: profile }));
      } catch (err) {
        console.error('Failed to save applicant profile', err);
      }
    }

    setSavedSuccess(true);
    onSaved?.(profile);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const minScore = 214;
  const maxScore = 285;
  const clampedScore = Math.max(minScore, Math.min(maxScore, profile.step2Ck));
  const scorePercent = ((clampedScore - minScore) / (maxScore - minScore)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header matching exact screenshot */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Your Academic &amp; Portfolio Metrics
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Metrics entered here are benchmarked against official matched cohort medians.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors -mr-1 -mt-1"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 pt-2 space-y-5">
          {/* USMLE Step 2 CK Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">
                USMLE Step 2 CK Score
              </label>
              <span className="px-3 py-0.5 rounded-md text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 font-mono">
                {profile.step2Ck}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={minScore}
                max={maxScore}
                step="1"
                value={clampedScore}
                onChange={(e) => setProfile({ ...profile, step2Ck: Number(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                style={{
                  background: `linear-gradient(to right, #059669 0%, #059669 ${scorePercent}%, #e2e8f0 ${scorePercent}%, #e2e8f0 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Passing (214)</span>
                <span>Specialty Matched Median: 254</span>
                <span>Max (285)</span>
              </div>
            </div>
          </div>

          {/* Research Experiences & Publications */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Research Experiences
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.researchExperiences}
                onChange={(e) => setProfile({ ...profile, researchExperiences: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Publications
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.publications}
                onChange={(e) => setProfile({ ...profile, publications: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Abstracts & Presentations / Posters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Abstracts
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.abstracts ?? 2}
                onChange={(e) => setProfile({ ...profile, abstracts: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                Presentations / Posters
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={profile.presentations}
                onChange={(e) => setProfile({ ...profile, presentations: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Volunteer Experiences */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1.5">
              Volunteer Experiences
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={profile.volunteerExperiences}
              onChange={(e) => setProfile({ ...profile, volunteerExperiences: Number(e.target.value) })}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          {/* AOA Honor Society Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.isAoaMember}
                onChange={(e) => setProfile({ ...profile, isAoaMember: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Inducted into Alpha Omega Alpha (AOA) Honor Society
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  16.1% of matched seniors hold AOA in this specialty
                </span>
              </div>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {/* Small button incorporating Detailed Competitiveness Engine */}
            <button
              type="button"
              id="modal-competitiveness-engine-btn"
              onClick={() => {
                onClose();
                onOpenCompetitivenessEngine?.();
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Open Detailed Competitiveness Engine"
            >
              <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
              Detailed Competitiveness Engine
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile Metrics
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
