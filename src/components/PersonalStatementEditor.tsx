'use client';

import React, { useState } from 'react';
import { PersonalStatementDraft, UserProfile } from '@/domain/types';
import { sanitizeErasText, validatePersonalStatementDraft } from '@/domain/sanitizer';
import {
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  History,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface PersonalStatementEditorProps {
  draft: PersonalStatementDraft;
  assignedAdvisor: UserProfile;
  onSave: (content: string) => void;
  onSubmitForReview: (changelog: string) => void;
  onBack: () => void;
}

export function PersonalStatementEditor({
  draft,
  assignedAdvisor,
  onSave,
  onSubmitForReview,
  onBack,
}: PersonalStatementEditorProps) {
  const [content, setContent] = useState(draft.content);
  const [changelog, setChangelog] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sanitizedNotice, setSanitizedNotice] = useState(false);

  const metrics = validatePersonalStatementDraft(content);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const rawPasted = e.clipboardData.getData('text');
    const cleaned = sanitizeErasText(rawPasted);
    if (cleaned !== rawPasted) {
      e.preventDefault();
      // Insert sanitized text at cursor
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextContent = content.substring(0, start) + cleaned + content.substring(end);
      setContent(nextContent);
      onSave(nextContent);
      setSanitizedNotice(true);
      setTimeout(() => setSanitizedNotice(false), 4000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setContent(newText);
    onSave(newText);
  };

  const handleManualSanitize = () => {
    const cleaned = sanitizeErasText(content);
    if (cleaned !== content) {
      setContent(cleaned);
      onSave(cleaned);
      setSanitizedNotice(true);
      setTimeout(() => setSanitizedNotice(false), 4000);
    }
  };

  const handleConfirmSubmit = () => {
    onSubmitForReview(changelog);
    setShowSubmitModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
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
              <h1 className="text-lg font-bold text-slate-900">Personal Statement Sandbox</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-100 text-sky-800">
                v{draft.currentVersionNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Specialty: <strong className="text-slate-700">{draft.specialty}</strong> &bull; Strict ERAS Plain-Text Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSanitize}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            title="Clean smart-quotes, em-dashes, and rich bullets"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Sanitize Formatting
          </button>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Submit to {assignedAdvisor.name}
          </button>
        </div>
      </div>

      {/* Sanitization Alert Banner */}
      {sanitizedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>ERAS Sanitizer Active:</strong> Smart quotes and illegal characters automatically converted to clean ASCII plain-text.
          </span>
        </div>
      )}

      {/* Page Overfill Warning */}
      {metrics.warning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>{metrics.warning}</div>
        </div>
      )}

      {/* Main Drafting Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs text-slate-500">
            <span className="font-medium text-slate-700">AAMC Plain-Text Drafting Canvas</span>
            <span>Autosaving locally</span>
          </div>

          <textarea
            value={content}
            onChange={handleChange}
            onPaste={handlePaste}
            rows={22}
            className="w-full flex-1 p-4 rounded-lg bg-slate-50/50 border border-slate-200 text-slate-800 font-mono text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 resize-none transition-all placeholder:text-slate-400"
            placeholder="Type or paste your personal statement here... Pasted smart-quotes and dashes will be automatically sanitized."
          />
        </div>

        {/* Sidebar Metrics & ERAS Rules (1 col) */}
        <div className="space-y-4">
          {/* Live Counter Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live ERAS Metrics</h2>
            
            <div>
              <div className="text-2xl font-black text-slate-900">{metrics.characterCount.toLocaleString()}</div>
              <div className="text-xs text-slate-500">Characters with spaces</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <div className="font-bold text-slate-800">{metrics.wordCount}</div>
                <div className="text-slate-500">Words (~750-800 ideal)</div>
              </div>
              <div>
                <div className="font-bold text-slate-800">{metrics.estimatedPages} pgs</div>
                <div className="text-slate-500">Estimated AAMC Pages</div>
              </div>
            </div>

            {/* Visual Progress Bar to 1 Page */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>ERAS 1-Page Benchmark</span>
                <span>{Math.round((metrics.characterCount / 5300) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    metrics.characterCount > 5800 ? 'bg-red-500' : metrics.characterCount > 4500 ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min((metrics.characterCount / 5300) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ERAS Rules Callout */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2 text-slate-600">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-sky-600" />
              ERAS Plain-Text Invariants
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-[11px]">
              <li>ERAS ignores bold, italics, underline, and color.</li>
              <li>Tabs and indented paragraphs are stripped.</li>
              <li>Separate paragraphs using a single blank line.</li>
              <li>Do not exceed ~5,300 characters to prevent spilling onto Page 2.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit for Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit v{draft.currentVersionNumber} to Advisor</h3>
                <p className="text-xs text-slate-500">Reviewer: {assignedAdvisor.name} ({assignedAdvisor.specialty})</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                <strong>Forked Snapshot:</strong> Submitting will freeze this exact text as <strong>v{draft.currentVersionNumber}</strong>. You can continue drafting locally for v{draft.currentVersionNumber + 1} without altering what Dr. Chen reviews.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Revision Changelog (Required)
              </label>
              <textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Briefly summarize what was revised (e.g., 'Shortened paragraph 2 by 150 characters and strengthened reflection on ICU patient case')."
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
                disabled={!changelog.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                Confirm Submission &amp; Freeze v{draft.currentVersionNumber}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
