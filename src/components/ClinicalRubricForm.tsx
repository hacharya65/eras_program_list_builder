'use client';

import React, { useState } from 'react';
import { RubricEvaluation } from '@/domain/types';
import {
  CheckCircle2,
  RotateCcw,
  Star,
  Sparkles,
  Send,
  Stethoscope,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface ClinicalRubricFormProps {
  studentName: string;
  versionNumber: number;
  onSubmit: (evaluation: RubricEvaluation) => void;
}

export function ClinicalRubricForm({
  studentName,
  versionNumber,
  onSubmit,
}: ClinicalRubricFormProps) {
  const [narrativeMotivation, setNarrativeMotivation] = useState(4);
  const [clinicalReflection, setClinicalReflection] = useState(4);
  const [toneAndFit, setToneAndFit] = useState(5);
  const [structureAndMechanics, setStructureAndMechanics] = useState(4);
  const [overallVerdict, setOverallVerdict] = useState<'ready_to_lock' | 'revisions_requested'>('revisions_requested');
  const [generalNotes, setGeneralNotes] = useState('');

  const pillars = [
    {
      key: 'narrativeMotivation',
      title: '1. Narrative & Specialty Motivation',
      desc: 'Is the career progression clear, authentic, and compelling for this specialty?',
      value: narrativeMotivation,
      setter: setNarrativeMotivation,
    },
    {
      key: 'clinicalReflection',
      title: '2. Clinical Reflection & Depth',
      desc: 'Does it show patient empathy, insight, and self-reflection rather than just listing resume cases?',
      value: clinicalReflection,
      setter: setClinicalReflection,
    },
    {
      key: 'toneAndFit',
      title: '3. Tone, Humility & Professional Fit',
      desc: 'Are there any red flags, perceived arrogance, or inappropriate personal disclosures?',
      value: toneAndFit,
      setter: setToneAndFit,
    },
    {
      key: 'structureAndMechanics',
      title: '4. Structure, Flow & Mechanics',
      desc: 'Are paragraph transitions logical, pacing effective, with zero spelling or grammatical errors?',
      value: structureAndMechanics,
      setter: setStructureAndMechanics,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      narrativeMotivation,
      clinicalReflection,
      toneAndFit,
      structureAndMechanics,
      overallVerdict,
      generalNotes: generalNotes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            Standardized Rubric Evaluation
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating {studentName}'s Personal Statement v{versionNumber}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          Institutional Standard
        </span>
      </div>

      {/* 4 Pillars Rating */}
      <div className="space-y-4">
        {pillars.map((pillar) => (
          <div key={pillar.key} className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{pillar.title}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => pillar.setter(star)}
                    className="p-0.5 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= pillar.value
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-1 text-xs font-bold text-slate-700">{pillar.value}/5</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">{pillar.desc}</p>
          </div>
        ))}
      </div>

      {/* Overall Verdict Selection */}
      <div className="space-y-2 pt-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Actionable Review Verdict
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOverallVerdict('revisions_requested')}
            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
              overallVerdict === 'revisions_requested'
                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20 text-purple-950 font-semibold shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold">Revisions Requested</div>
              <div className="text-[11px] opacity-75 mt-0.5 leading-snug">
                Student will address your rubric notes in a v{versionNumber + 1} draft.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setOverallVerdict('ready_to_lock')}
            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
              overallVerdict === 'ready_to_lock'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold">Ready to Lock (ERAS Ready)</div>
              <div className="text-[11px] opacity-75 mt-0.5 leading-snug">
                Endorsed for official submission; unlocks ERAS clipboard assistant.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Summary Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1">
          Faculty Advisor Clinical Guidance &amp; Section Notes (Optional)
        </label>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          rows={4}
          className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Detail specific suggestions for narrative clarity, patient case emphasis, or paragraph restructuring (optional)..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
      >
        <Send className="w-4 h-4" />
        Submit Evaluation &amp; Return Feedback to {studentName}
      </button>
    </form>
  );
}
