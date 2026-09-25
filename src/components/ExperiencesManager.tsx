'use client';

import React, { useState } from 'react';
import { ExperienceDraft } from '@/domain/types';
import { AAMC_TAXONOMY } from '@/domain/aamc-taxonomy';
import { sanitizeErasText, validateExperienceDraft } from '@/domain/sanitizer';
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
  Heart,
  HelpCircle
} from 'lucide-react';

interface ExperiencesManagerProps {
  experiences: ExperienceDraft[];
  onSaveExperience: (id: string, updates: Partial<ExperienceDraft>) => void;
  onDeleteExperience: (id: string) => void;
  onBack: () => void;
}

export function ExperiencesManager({
  experiences,
  onSaveExperience,
  onDeleteExperience,
  onBack,
}: ExperiencesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(experiences[0]?.id || null);
  const [hobbiesText, setHobbiesText] = useState('Distance running, classical cello performance, specialty coffee roasting.');
  const [impactfulText, setImpactfulText] = useState('');

  const currentExp = experiences.find((e) => e.id === editingId) || experiences[0];
  const meaningfulCount = experiences.filter((e) => e.isMostMeaningful).length;

  const handleUpdate = (field: keyof ExperienceDraft, value: any) => {
    if (!currentExp) return;
    onSaveExperience(currentExp.id, { [field]: value });
  };

  const handleToggleMeaningful = () => {
    if (!currentExp) return;
    if (!currentExp.isMostMeaningful && meaningfulCount >= 3) {
      alert('Official AAMC ERAS Limit: You can designate up to 3 experiences as Most Meaningful.');
      return;
    }
    handleUpdate('isMostMeaningful', !currentExp.isMostMeaningful);
  };

  const handleCreateNew = () => {
    if (experiences.length >= 10) {
      alert('Official AAMC ERAS Limit: You may only select up to 10 experiences.');
      return;
    }
    const newId = `exp-${Date.now()}`;
    const newExp: Partial<ExperienceDraft> = {
      title: 'New Clinical Experience',
      orgName: 'Hospital / Organization',
      roleName: 'Student Trainee',
      experienceType: 'Education/training',
      frequency: 'Weekly (recurring)',
      startDate: '2024-01-01',
      isCurrent: true,
      descriptionText: '',
      isMostMeaningful: false,
    };
    onSaveExperience(newId, newExp);
    setEditingId(newId);
  };

  const descLength = currentExp?.descriptionText?.length || 0;
  const reflLength = currentExp?.reflectionText?.length || 0;

  return (
    <div className="space-y-6">
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
              <h1 className="text-lg font-bold text-slate-900">10 Selected Experiences Portfolio</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                {experiences.length} / 10 Added
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

        <button
          onClick={handleCreateNew}
          disabled={experiences.length >= 10}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Experience ({10 - experiences.length} remaining)
        </button>
      </div>

      {/* Main Grid: Experience List (Left) + Active Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Experience Selector */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Your 10 Experiences
          </div>

          {experiences.map((exp, index) => {
            const isSelected = exp.id === currentExp?.id;
            return (
              <div
                key={exp.id}
                onClick={() => setEditingId(exp.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {exp.title || 'Untitled Experience'}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {exp.orgName || 'Organization not set'}
                    </p>
                  </div>

                  {exp.isMostMeaningful && (
                    <span className="p-1 rounded-md bg-amber-100 text-amber-700 shrink-0" title="Most Meaningful Experience">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    </span>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[140px]">{exp.experienceType}</span>
                  <span className={exp.descriptionText?.length > 750 ? 'text-red-600 font-bold' : ''}>
                    {exp.descriptionText?.length || 0} / 750
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Experience Editor (2 cols) */}
        {currentExp && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              {/* Header with Meaningful Star Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Experience Details</h2>
                  <p className="text-xs text-slate-500">Configure role, setting, and AAMC tags</p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMeaningful}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    currentExp.isMostMeaningful
                      ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Star className={`w-4 h-4 ${currentExp.isMostMeaningful ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                  {currentExp.isMostMeaningful ? 'Designated as Most Meaningful' : 'Mark as Most Meaningful (Max 3)'}
                </button>
              </div>

              {/* Title & Organization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Position / Experience Title</label>
                  <input
                    type="text"
                    value={currentExp.title}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. Free Clinic Triage Coordinator"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={currentExp.orgName}
                    onChange={(e) => handleUpdate('orgName', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="e.g. Hope Community Health"
                  />
                </div>
              </div>

              {/* AAMC Taxonomy Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">AAMC Experience Type (Required)</label>
                  <select
                    value={currentExp.experienceType}
                    onChange={(e) => handleUpdate('experienceType', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {AAMC_TAXONOMY.experienceTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frequency of Participation</label>
                  <select
                    value={currentExp.frequency}
                    onChange={(e) => handleUpdate('frequency', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {AAMC_TAXONOMY.frequencyTypes.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Focus Area (Optional)</label>
                  <select
                    value={currentExp.primaryFocusArea || ''}
                    onChange={(e) => handleUpdate('primaryFocusArea', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">None / Leave Blank</option>
                    {AAMC_TAXONOMY.primaryFocusAreas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Key Characteristic Demonstrated</label>
                  <select
                    value={currentExp.keyCharacteristic || ''}
                    onChange={(e) => handleUpdate('keyCharacteristic', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">None / Leave Blank</option>
                    {AAMC_TAXONOMY.keyCharacteristics.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 750-Character Description */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Activities &amp; Responsibilities Description
                  </label>
                  <span className={`text-xs font-bold ${descLength > 750 ? 'text-red-600' : 'text-slate-500'}`}>
                    {descLength} / 750 characters
                  </span>
                </div>
                <textarea
                  value={currentExp.descriptionText}
                  onChange={(e) => handleUpdate('descriptionText', sanitizeErasText(e.target.value))}
                  rows={4}
                  className={`w-full p-3 rounded-lg border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 ${
                    descLength > 750
                      ? 'border-red-400 bg-red-50/30 focus:ring-red-400'
                      : 'border-slate-200 focus:ring-sky-500'
                  }`}
                  placeholder="Describe your major activities, responsibilities, and clinical or project context (750 characters max)..."
                />
                {descLength > 750 && (
                  <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exceeds official ERAS limit by {descLength - 750} characters. Text will be cut off upon ERAS import!
                  </p>
                )}
              </div>

              {/* 300-Character Most Meaningful Reflection (if starred) */}
              {currentExp.isMostMeaningful && (
                <div className="pt-3 border-t border-amber-100 bg-amber-50/50 p-4 rounded-xl border">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Most Meaningful Reflection (Why it was meaningful &amp; how it influenced you)
                    </label>
                    <span className={`text-xs font-bold ${reflLength > 300 ? 'text-red-600' : 'text-amber-800'}`}>
                      {reflLength} / 300 characters
                    </span>
                  </div>
                  <textarea
                    value={currentExp.reflectionText || ''}
                    onChange={(e) => handleUpdate('reflectionText', sanitizeErasText(e.target.value))}
                    rows={3}
                    className={`w-full p-3 rounded-lg border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 ${
                      reflLength > 300
                        ? 'border-red-400 bg-red-50 focus:ring-red-400'
                        : 'border-amber-200 bg-white focus:ring-amber-500'
                    }`}
                    placeholder="Explain why this experience was meaningful, how it shaped your values, or how it influenced your specialty choice (300 characters max)..."
                  />
                  {reflLength > 300 && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Exceeds reflection limit by {reflLength - 300} characters.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Hobbies & Impactful Experiences Supplemental Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Additional ERAS Experiences Sections
              </h3>

              {/* Hobbies (300 chars) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Hobbies &amp; Interests (Max 300 chars)
                  </label>
                  <span className={`text-xs ${hobbiesText.length > 300 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                    {hobbiesText.length} / 300
                  </span>
                </div>
                <textarea
                  value={hobbiesText}
                  onChange={(e) => setHobbiesText(sanitizeErasText(e.target.value))}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Share details regarding personal hobbies, sports, arts, or passions outside medicine..."
                />
              </div>

              {/* Impactful Experiences */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Impactful Experiences (Optional narrative for major obstacles overcome)
                </label>
                <textarea
                  value={impactfulText}
                  onChange={(e) => setImpactfulText(sanitizeErasText(e.target.value))}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Applicants who have overcome significant family, financial, health, or socio-economic hardships may share them here for holistic review..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
