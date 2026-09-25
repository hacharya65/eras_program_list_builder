'use client';

import React, { useState, useEffect } from 'react';
import { PersonalStatementDraft, UserProfile, DocumentSnapshot } from '@/domain/types';
import { sanitizeErasText, validatePersonalStatementDraft } from '@/domain/sanitizer';
import { computeTextDiff, DiffChunk } from '@/domain/diff-engine';
import {
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  History,
  ShieldAlert,
  ArrowLeft,
  GitCompare,
  Lock,
  Edit3,
  GitBranch,
  X
} from 'lucide-react';

interface PersonalStatementEditorProps {
  draft: PersonalStatementDraft;
  assignedAdvisor: UserProfile;
  snapshots?: DocumentSnapshot[];
  onSave: (content: string) => void;
  onSubmitForReview: (changelog: string) => void;
  onBack: () => void;
  onForkRevision?: () => void;
}

export function PersonalStatementEditor({
  draft,
  assignedAdvisor,
  snapshots = [],
  onSave,
  onSubmitForReview,
  onBack,
  onForkRevision,
}: PersonalStatementEditorProps) {
  // Build complete version list (all snapshots + active draft)
  const psSnapshots = snapshots
    .filter((s) => s.documentType === 'personal_statement' && s.documentId === draft.id)
    .sort((a, b) => a.versionNumber - b.versionNumber);

  // Selected version to view: 'active' or a snapshot version number
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(draft.currentVersionNumber);
  const [content, setContent] = useState(draft.content);
  const [changelog, setChangelog] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [sanitizedNotice, setSanitizedNotice] = useState(false);

  // Sync content when draft changes
  useEffect(() => {
    if (selectedVersionNum === draft.currentVersionNumber) {
      setContent(draft.content);
    }
  }, [draft.content, draft.currentVersionNumber, selectedVersionNum]);

  // Determine if viewing an immutable snapshot or active draft
  const selectedSnapshot = psSnapshots.find((s) => s.versionNumber === selectedVersionNum);
  const isViewingSnapshot = selectedVersionNum !== draft.currentVersionNumber && selectedSnapshot !== undefined;
  const displayedContent = isViewingSnapshot ? selectedSnapshot.content : content;

  // Diff comparison states
  const [diffVerA, setDiffVerA] = useState<number>(() => {
    if (psSnapshots.length > 0) return psSnapshots[psSnapshots.length - 1].versionNumber;
    return 1;
  });
  const [diffVerB, setDiffVerB] = useState<number>(draft.currentVersionNumber);

  const getVersionContent = (verNum: number): string => {
    if (verNum === draft.currentVersionNumber) return content;
    const snap = psSnapshots.find((s) => s.versionNumber === verNum);
    return snap ? snap.content : '';
  };

  const metrics = validatePersonalStatementDraft(displayedContent);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isViewingSnapshot) return;
    const rawPasted = e.clipboardData.getData('text');
    const cleaned = sanitizeErasText(rawPasted);
    if (cleaned !== rawPasted) {
      e.preventDefault();
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
    if (isViewingSnapshot) return;
    const newText = e.target.value;
    setContent(newText);
    onSave(newText);
  };

  const handleConfirmSubmit = () => {
    onSubmitForReview(changelog);
    setShowSubmitModal(false);
    setChangelog('');
  };

  const diffChunks: DiffChunk[] = computeTextDiff(
    getVersionContent(diffVerA),
    getVersionContent(diffVerB)
  );

  const addedWordsCount = diffChunks
    .filter((c) => c.type === 'added')
    .reduce((acc, c) => acc + (c.text.trim() ? c.text.trim().split(/\s+/).length : 0), 0);
  const removedWordsCount = diffChunks
    .filter((c) => c.type === 'removed')
    .reduce((acc, c) => acc + (c.text.trim() ? c.text.trim().split(/\s+/).length : 0), 0);

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
              
              {/* Version Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedVersionNum}
                  onChange={(e) => setSelectedVersionNum(Number(e.target.value))}
                  className="text-xs font-bold rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {psSnapshots.map((snap) => (
                    <option key={snap.id} value={snap.versionNumber}>
                      v{snap.versionNumber} (Locked Snapshot)
                    </option>
                  ))}
                  <option value={draft.currentVersionNumber}>
                    v{draft.currentVersionNumber} (Active Draft)
                  </option>
                </select>
              </div>

              {isViewingSnapshot ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Locked Snapshot
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Edit3 className="w-3 h-3 text-emerald-600" />
                  Active Draft
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Specialty: <strong className="text-slate-700">{draft.specialty}</strong> &bull; Strict ERAS Plain-Text Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compare Versions Diff Button */}
          <button
            onClick={() => {
              if (psSnapshots.length > 0) {
                setDiffVerA(psSnapshots[psSnapshots.length - 1].versionNumber);
                setDiffVerB(draft.currentVersionNumber);
              }
              setShowDiffModal(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
            title="Compare diff between versions"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-600" />
            Compare Versions
          </button>

          {isViewingSnapshot ? (
            <button
              onClick={() => setSelectedVersionNum(draft.currentVersionNumber)}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Return to Active Draft (v{draft.currentVersionNumber})
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Submit v{draft.currentVersionNumber} to {assignedAdvisor.name}
            </button>
          )}
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

      {/* Snapshot Viewing Notice Banner */}
      {isViewingSnapshot && selectedSnapshot && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Viewing Immutable Snapshot v{selectedSnapshot.versionNumber}</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Submitted on {new Date(selectedSnapshot.submittedAt).toLocaleDateString()} at {new Date(selectedSnapshot.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                {selectedSnapshot.changelogNote && ` Changelog: "${selectedSnapshot.changelogNote}"`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedVersionNum(draft.currentVersionNumber)}
            className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs transition-colors shrink-0"
          >
            Switch to Active Draft (v{draft.currentVersionNumber})
          </button>
        </div>
      )}

      {/* Main Drafting Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {isViewingSnapshot ? `Locked Snapshot (v${selectedVersionNum})` : 'AAMC Plain-Text Drafting Canvas (Active)'}
            </span>
            <span>{isViewingSnapshot ? 'Read-only snapshot' : 'Autosaving locally & auto-forks upon edit'}</span>
          </div>

          <textarea
            value={displayedContent}
            readOnly={isViewingSnapshot}
            onChange={handleChange}
            onPaste={handlePaste}
            rows={22}
            className={`w-full flex-1 p-4 rounded-lg font-mono text-sm leading-relaxed resize-none transition-all placeholder:text-slate-400 ${
              isViewingSnapshot
                ? 'bg-amber-50/20 border-amber-200 text-slate-700 cursor-not-allowed'
                : 'bg-slate-50/50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500'
            }`}
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

          {/* Versioning & Forking Invariant */}
          <div className="bg-sky-50/60 rounded-xl border border-sky-200 p-4 text-xs space-y-2 text-sky-900">
            <h3 className="font-bold flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-sky-600" />
              Dynamic Forking (v1 through vn)
            </h3>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              Every submission locks an immutable snapshot. Subsequent edits fork into the next active version (v{draft.currentVersionNumber + 1}) automatically, preserving advisor review integrity.
            </p>
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

      {/* Diff Comparison Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Visual Diff &amp; Version Comparison</h3>
                  <p className="text-xs text-slate-500">Track textual evolution and word additions/deletions</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Version Pickers Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">Base Version:</span>
                  <select
                    value={diffVerA}
                    onChange={(e) => setDiffVerA(Number(e.target.value))}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {psSnapshots.map((s) => (
                      <option key={s.id} value={s.versionNumber}>
                        v{s.versionNumber} (Snapshot)
                      </option>
                    ))}
                    <option value={draft.currentVersionNumber}>
                      v{draft.currentVersionNumber} (Active Draft)
                    </option>
                  </select>
                </div>

                <span className="text-slate-400 font-bold">&rarr;</span>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">Comparison Version:</span>
                  <select
                    value={diffVerB}
                    onChange={(e) => setDiffVerB(Number(e.target.value))}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {psSnapshots.map((s) => (
                      <option key={s.id} value={s.versionNumber}>
                        v{s.versionNumber} (Snapshot)
                      </option>
                    ))}
                    <option value={draft.currentVersionNumber}>
                      v{draft.currentVersionNumber} (Active Draft)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  +{addedWordsCount} words added
                </span>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[11px]">
                  -{removedWordsCount} words removed
                </span>
              </div>
            </div>

            {/* Diff View Box */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap min-h-[280px]">
              {diffChunks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-sans">
                  No textual differences found between Version {diffVerA} and Version {diffVerB}.
                </div>
              ) : (
                diffChunks.map((chunk, idx) => {
                  if (chunk.type === 'added') {
                    return (
                      <span
                        key={idx}
                        className="bg-emerald-200 text-emerald-950 font-semibold px-0.5 rounded underline decoration-emerald-600"
                      >
                        {chunk.text}
                      </span>
                    );
                  }
                  if (chunk.type === 'removed') {
                    return (
                      <span
                        key={idx}
                        className="bg-red-200 text-red-950 line-through px-0.5 rounded decoration-red-600 opacity-75"
                      >
                        {chunk.text}
                      </span>
                    );
                  }
                  return <span key={idx}>{chunk.text}</span>;
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

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
                <strong>Immutable Version Freeze:</strong> Submitting locks <strong>v{draft.currentVersionNumber}</strong> as an immutable snapshot in your version history. Any subsequent edit will automatically fork into active <strong>v{draft.currentVersionNumber + 1}</strong>.
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
                placeholder="Briefly summarize what was revised (e.g., 'Refined clinical reflection paragraph and strengthened conclusion')."
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

