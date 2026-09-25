'use client';

import React, { useState } from 'react';
import { ExperienceDraft, UserProfile, ReviewRequest } from '@/domain/types';
import { AAMC_TAXONOMY } from '@/domain/aamc-taxonomy';
import { sanitizeErasText } from '@/domain/sanitizer';
import { validateExperiencesSubmission } from '@/domain/experience-validation';
import {
  Briefcase,
  Star,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Eye,
  Clock
} from 'lucide-react';

interface ExperiencesManagerProps {
  experiences: ExperienceDraft[];
  onSaveExperience: (id: string, updates: Partial<ExperienceDraft>) => void;
  onDeleteExperience: (id: string) => void;
  onBack: () => void;
  assignedAdvisor?: UserProfile;
  activeReviewRequest?: ReviewRequest;
  onSubmitForReview?: (changelog: string) => void;
}

export function ExperiencesManager({
  experiences,
  onSaveExperience,
  onDeleteExperience,
  onBack,
  assignedAdvisor,
  activeReviewRequest,
  onSubmitForReview,
}: ExperiencesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hobbiesText, setHobbiesText] = useState('');
  const [impactfulText, setImpactfulText] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitChangelog, setSubmitChangelog] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const meaningfulCount = experiences.filter((e) => e.isMostMeaningful).length;
  const validation = validateExperiencesSubmission(experiences);

  const handleUpdate = (expId: string, field: keyof ExperienceDraft, value: any) => {
    onSaveExperience(expId, { [field]: value });
  };

  const handleToggleMeaningful = (exp: ExperienceDraft) => {
    if (!exp.isMostMeaningful && meaningfulCount >= 3) {
      alert('Official AAMC ERAS Limit: You can designate up to 3 experiences as Most Meaningful.');
      return;
    }
    handleUpdate(exp.id, 'isMostMeaningful', !exp.isMostMeaningful);
  };

  const handleClickSubmitReview = () => {
    if (!validation.canSubmit) {
      setValidationErrors(validation.errors);
      setShowValidationModal(true);
      return;
    }
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    onSubmitForReview?.(submitChangelog);
    setShowSubmitModal(false);
    setSubmitChangelog('');
  };

  const handleCreateNew = () => {
    if (experiences.length >= 10) {
      alert('Official AAMC ERAS Limit: You may only select up to 10 experiences.');
      return;
    }
    const newId = `exp-${Date.now()}`;
    const newExp: Partial<ExperienceDraft> = {
      title: '',
      orgName: '',
      roleName: '',
      experienceType: '',
      frequency: '',
      primaryFocusArea: '',
      keyCharacteristic: '',
      startDate: '',
      isCurrent: true,
      descriptionText: '',
      isMostMeaningful: false,
      reflectionText: '',
    };
    onSaveExperience(newId, newExp);
    setEditingId(newId);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Experiences &amp; Portfolio</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                {experiences.length} / 10 Selected
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                {meaningfulCount} / 3 Meaningful
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded in official 2026/2027 AAMC ERAS Specifications (750 max description, 300 reflection)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSubmitForReview && (
            <button
              onClick={handleClickSubmitReview}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors ${
                validation.canSubmit
                  ? 'bg-sky-600 hover:bg-sky-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review ({validation.filledCount}/10 ready)</span>
            </button>
          )}

          <button
            onClick={handleCreateNew}
            disabled={experiences.length >= 10}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Experience ({10 - experiences.length} remaining)
          </button>
        </div>
      </div>

      {/* Active Review Tracker Banner */}
      {activeReviewRequest && (
        <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Faculty Review Status: <span className="capitalize text-sky-700">{activeReviewRequest.stage.replace('_', ' ')}</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800">
                  Dr. Chen (Assigned Advisor)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {new Date(activeReviewRequest.submittedAt).toLocaleDateString()} &bull; Target SLA: 14 Days
              </p>
            </div>
          </div>

          {activeReviewRequest.currentViewingEntryIndex ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold">
                Live Review Tracker: Dr. Chen is currently reviewing Entry #{activeReviewRequest.currentViewingEntryIndex}/10
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Queued in advisor inbox</span>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: Selected Experiences (Up to 10) in Structured Row Table View */}
      <div className="space-y-4">
        {/* Word-for-Word AAMC Guidance Banner */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <div className="font-bold text-slate-900 text-sm mb-0.5">Selected Experiences (Up to 10)</div>
            &ldquo;Please identify and describe up to 10 experiences that communicate who you are, what you are passionate about, and what is most important to you.&rdquo;
          </div>
        </div>

        {/* Structured Row List / Table View */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your 10 Selected Experiences</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize your top clinical, research, leadership, and volunteer roles.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {experiences.length} of 10 slots filled
            </span>
          </div>

          {experiences.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No experiences entered yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Begin building your ERAS application by adding your first experience row.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Experience
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {experiences.map((exp, index) => {
                const isEditing = editingId === exp.id;
                const descLen = exp.descriptionText?.length || 0;
                const reflLen = exp.reflectionText?.length || 0;

                return (
                  <div key={exp.id} className="transition-colors">
                    {/* Summary Row */}
                    <div
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isEditing ? 'bg-emerald-50/40 border-l-4 border-emerald-600' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Left: Number, Title, Org */}
                      <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {exp.title || <span className="text-slate-400 italic">Untitled Experience (Click Edit to enter)</span>}
                            </h3>
                            {exp.isMostMeaningful && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                Most Meaningful
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {exp.orgName ? exp.orgName : 'Organization not set'} &bull;{' '}
                            {exp.experienceType ? exp.experienceType : 'Type not selected'}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Frequency & Character Progress */}
                      <div className="flex items-center gap-6 text-xs text-slate-600 shrink-0">
                        <div className="hidden sm:block">
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Frequency</span>
                          <span className="font-medium text-slate-700">{exp.frequency || 'Not set'}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Description</span>
                          <span
                            className={`font-mono font-bold ${
                              descLen > 750 ? 'text-red-600' : descLen > 0 ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {descLen} / 750 chars
                          </span>
                        </div>
                      </div>

                      {/* Right: Dedicated Edit and Delete Buttons */}
                      <div className="flex items-center gap-2 shrink-0 justify-end">
                        <button
                          onClick={() => setEditingId(isEditing ? null : exp.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            isEditing
                              ? 'bg-slate-800 hover:bg-slate-900 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {isEditing ? 'Close Editor' : 'Edit'}
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this experience?')) {
                              onDeleteExperience(exp.id);
                              if (editingId === exp.id) setEditingId(null);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Experience"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable "Experience Details" Input Panel */}
                    {isEditing && (
                      <div className="bg-slate-50/70 p-6 border-t border-slate-200 space-y-5 animate-fade-in">
                        {/* Header with Meaningful Star Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Experience Details &bull; Entry #{index + 1}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Configure role title, setting, AAMC taxonomy dropdowns, and description.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleMeaningful(exp)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                              exp.isMostMeaningful
                                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${exp.isMostMeaningful ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            {exp.isMostMeaningful ? 'Designated as Most Meaningful' : 'Mark as Most Meaningful (Max 3)'}
                          </button>
                        </div>

                        {/* Title & Organization */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Position / Experience Title *
                            </label>
                            <input
                              type="text"
                              value={exp.title || ''}
                              onChange={(e) => handleUpdate(exp.id, 'title', e.target.value)}
                              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              placeholder="e.g. Sub-Intern in Inpatient Medicine"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Organization Name *
                            </label>
                            <input
                              type="text"
                              value={exp.orgName || ''}
                              onChange={(e) => handleUpdate(exp.id, 'orgName', e.target.value)}
                              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              placeholder="e.g. Apex University Hospital"
                            />
                          </div>
                        </div>

                        {/* AAMC Taxonomy Dropdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              AAMC Experience Type (Required) *
                            </label>
                            <select
                              value={exp.experienceType || ''}
                              onChange={(e) => handleUpdate(exp.id, 'experienceType', e.target.value)}
                              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                              <option value="">Select Experience Type...</option>
                              {AAMC_TAXONOMY.experienceTypes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Participation Frequency *
                            </label>
                            <select
                              value={exp.frequency || ''}
                              onChange={(e) => handleUpdate(exp.id, 'frequency', e.target.value)}
                              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                              <option value="">Select Frequency...</option>
                              {AAMC_TAXONOMY.frequencyTypes.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Primary Focus Area (Optional)
                            </label>
                            <select
                              value={exp.primaryFocusArea || ''}
                              onChange={(e) => handleUpdate(exp.id, 'primaryFocusArea', e.target.value)}
                              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                              <option value="">None / Leave Blank</option>
                              {AAMC_TAXONOMY.primaryFocusAreas.map((fa) => (
                                <option key={fa} value={fa}>{fa}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Key Characteristic (Optional)
                            </label>
                            <select
                              value={exp.keyCharacteristic || ''}
                              onChange={(e) => handleUpdate(exp.id, 'keyCharacteristic', e.target.value)}
                              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                              <option value="">None / Leave Blank</option>
                              {AAMC_TAXONOMY.keyCharacteristics.map((kc) => (
                                <option key={kc} value={kc}>{kc}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 750-Character Description */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Context, Roles, and Responsibilities: 750-character limit
                            </label>
                            <span className={`text-xs font-mono font-bold ${descLen > 750 ? 'text-red-600' : 'text-slate-500'}`}>
                              {descLen} / 750 characters
                            </span>
                          </div>
                          <textarea
                            value={exp.descriptionText || ''}
                            onChange={(e) => handleUpdate(exp.id, 'descriptionText', sanitizeErasText(e.target.value))}
                            rows={5}
                            className={`w-full p-3 rounded-lg border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 ${
                              descLen > 750
                                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                                : 'border-slate-300 bg-white focus:ring-emerald-500'
                            }`}
                            placeholder="Describe your context, roles, and responsibilities (750-character limit)..."
                          />
                          {descLen > 750 && (
                            <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Exceeds official ERAS limit by {descLen - 750} characters. Text will be cut off upon ERAS import!
                            </p>
                          )}
                        </div>

                        {/* 300-Character Most Meaningful Reflection (if starred) */}
                        {exp.isMostMeaningful && (
                          <div className="pt-3 border-t border-amber-200 bg-amber-50/60 p-4 rounded-xl border space-y-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                Selected Experiences | What made this experience meaningful?
                              </label>
                              <span className={`text-xs font-mono font-bold ${reflLen > 300 ? 'text-red-600' : 'text-amber-800'}`}>
                                {reflLen} / 300 characters
                              </span>
                            </div>

                            {/* Word-for-Word AAMC Prompt Guidance */}
                            <div className="text-[11px] text-amber-900 leading-relaxed bg-white/80 p-3 rounded border border-amber-200">
                              <p className="font-semibold mb-1">
                                Identify and describe up to 3 of the 10 experiences that you found the most meaningful.
                              </p>
                              <p>
                                Reflect on the experience, why it was meaningful, and how it influenced you. Weave in the focus area or key characteristic you tagged. This should not describe what you did in the experience or list a set of skills that you developed or demonstrated during the experience.
                              </p>
                            </div>

                            <textarea
                              value={exp.reflectionText || ''}
                              onChange={(e) => handleUpdate(exp.id, 'reflectionText', sanitizeErasText(e.target.value))}
                              rows={3}
                              className={`w-full p-3 rounded-lg border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 ${
                                reflLen > 300
                                  ? 'border-red-400 bg-red-50 focus:ring-red-400'
                                  : 'border-amber-200 bg-white focus:ring-amber-500'
                              }`}
                              placeholder="Reflect on why this experience was meaningful and how it influenced you (300-character limit)..."
                            />
                            {reflLen > 300 && (
                              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Exceeds reflection limit by {reflLen - 300} characters.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                          >
                            Done Editing Entry #{index + 1}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Additional ERAS Experiences (Anchored at Bottom Beneath 10 Selected Experiences) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Additional ERAS Experiences
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official AAMC supplementary sections to communicate background challenges and personal interests.
            </p>
          </div>
        </div>

        {/* Impactful Experiences (750-character limit) */}
        <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Impactful Experiences</h3>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                impactfulText.length > 750
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {impactfulText.length} / 750 characters
            </span>
          </div>

          {/* Word-for-Word AAMC Prompt Guidance */}
          <div className="text-xs text-slate-600 leading-relaxed space-y-2 bg-white p-3.5 rounded-lg border border-slate-200">
            <p>
              Program directors are interested in learning more about other impactful experiences applicants may have encountered or overcome on their journey to residency. This section is designed to give applicants the opportunity to provide additional information about their background or life experiences that is not captured elsewhere in the application (e.g., information written in this section should not be the same as what is included in the personal statement).
            </p>
            <p>
              Please describe any challenges or hardships that influenced your journey to residency. This could include experiences related to family background, financial background, community setting, educational experiences, and/or general life experiences.
            </p>
            <p>
              Please consider whether this section applies to you. Programs do not expect all applicants to complete this section. This section is intended for applicants who have overcome major challenges or obstacles. Some applicants may not have experiences that are relevant to this section. Other applicants may not feel comfortable sharing personal information in their application.
            </p>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Appropriate examples include:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Family background (e.g., first generation to graduate college).</li>
                <li>Financial background (e.g., low-income family, worked to support family growing up, work-study program to pay for college).</li>
                <li>Community setting (e.g., food scarcity, poverty or crime rate, lack of access to medical care).</li>
                <li>Educational experiences (e.g., limited educational opportunities, limited access to advisors or mentors).</li>
                <li>Other general life circumstances (e.g., loss of a family member, serving as a caregiver while working or in school).</li>
              </ul>
            </div>
          </div>

          <textarea
            value={impactfulText}
            onChange={(e) => setImpactfulText(sanitizeErasText(e.target.value))}
            rows={4}
            className={`w-full p-3 rounded-lg border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 ${
              impactfulText.length > 750
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : 'border-slate-300 bg-white focus:ring-emerald-500'
            }`}
            placeholder="Type your Impactful Experiences response here (750-character limit)..."
          />
          {impactfulText.length > 750 && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Exceeds official ERAS limit by {impactfulText.length - 750} characters.
            </p>
          )}
        </div>

        {/* Hobbies & Interests (300-character limit) */}
        <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Hobbies &amp; Interests</h3>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                hobbiesText.length > 300
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {hobbiesText.length} / 300 characters
            </span>
          </div>

          {/* Word-for-Word AAMC Prompt Guidance */}
          <p className="text-xs text-slate-600 italic">
            &ldquo;Please provide details regarding your hobbies and interests.&rdquo;
          </p>

          <textarea
            value={hobbiesText}
            onChange={(e) => setHobbiesText(sanitizeErasText(e.target.value))}
            rows={2}
            className={`w-full p-3 rounded-lg border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 ${
              hobbiesText.length > 300
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : 'border-slate-300 bg-white focus:ring-emerald-500'
            }`}
            placeholder="Please provide details regarding your hobbies and interests (300-character limit)..."
          />
          {hobbiesText.length > 300 && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Exceeds hobbies limit by {hobbiesText.length - 300} characters.
            </p>
          )}
        </div>
      </div>

      {/* Validation Gate Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Submission Requirements Incomplete</h3>
                <p className="text-xs text-slate-500">
                  {validation.filledCount} of 10 selected experiences completed
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-semibold">Please resolve the following before submitting to your faculty advisor:</p>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] text-amber-800">
                {validationErrors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
              >
                Back to Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit for Review Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit 10 Experiences for Faculty Review</h3>
                <p className="text-xs text-slate-500">
                  Assigned Reviewer: {assignedAdvisor?.name || 'Faculty Advisor'} ({assignedAdvisor?.specialty || 'Internal Medicine'})
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                <strong>Portfolio Snapshot:</strong> All 10 experiences, focus areas, and most meaningful reflections will be frozen into an archival portfolio snapshot for faculty evaluation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Revision Changelog / Submission Notes (Optional)
              </label>
              <textarea
                value={submitChangelog}
                onChange={(e) => setSubmitChangelog(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Add notes for your advisor (e.g. 'Focused on longitudinal ICU research and clinical volunteer leadership roles')."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
              >
                Confirm &amp; Send to Advisor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

