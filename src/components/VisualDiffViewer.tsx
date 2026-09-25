'use client';

import React from 'react';
import { computeTextDiff, DiffChunk } from '@/domain/diff-engine';
import { GitCompare, ArrowRight, FileText, CheckCircle2, History } from 'lucide-react';

interface VisualDiffViewerProps {
  previousVersionTitle: string;
  previousContent: string;
  newVersionTitle: string;
  newContent: string;
  changelogNote?: string;
  studentName?: string;
}

export function VisualDiffViewer({
  previousVersionTitle,
  previousContent,
  newVersionTitle,
  newContent,
  changelogNote,
  studentName,
}: VisualDiffViewerProps) {
  const diffChunks = computeTextDiff(previousContent, newContent);

  const additionsCount = diffChunks.filter(c => c.type === 'added').length;
  const deletionsCount = diffChunks.filter(c => c.type === 'removed').length;

  return (
    <div className="space-y-4">
      {/* Student Changelog Header Card */}
      {changelogNote && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <History className="w-4 h-4 text-sky-700" />
            <h4 className="font-bold text-sky-950">
              Student Revision Changelog ({studentName || 'Alex Rivera'})
            </h4>
          </div>
          <p className="text-sky-900 bg-white/70 p-2.5 rounded-lg border border-sky-100 font-medium leading-relaxed">
            "{changelogNote}"
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-sky-800 font-semibold">
            <span className="text-emerald-700">+{additionsCount} word additions</span>
            <span className="text-red-700">-{deletionsCount} word deletions</span>
          </div>
        </div>
      )}

      {/* Side-by-Side Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Pane: Previous Version */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{previousVersionTitle}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Previous Target
            </span>
          </div>

          <div className="flex-1 p-3 bg-slate-50/60 rounded-lg border border-slate-100 font-mono text-xs leading-relaxed text-slate-600 whitespace-pre-wrap select-text">
            {previousContent}
          </div>
        </div>

        {/* Right Pane: New Version with Visual Diff Highlights */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <GitCompare className="w-4 h-4 text-sky-600" />
              <span>{newVersionTitle} (Visual Diff)</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
              Current Submission
            </span>
          </div>

          <div className="flex-1 p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap select-text">
            {diffChunks.map((chunk, index) => {
              if (chunk.type === 'added') {
                return (
                  <span
                    key={index}
                    className="bg-emerald-100 text-emerald-950 font-semibold px-0.5 rounded"
                  >
                    {chunk.text}
                  </span>
                );
              }
              if (chunk.type === 'removed') {
                return (
                  <span
                    key={index}
                    className="bg-red-100 text-red-950 line-through px-0.5 rounded opacity-75"
                  >
                    {chunk.text}
                  </span>
                );
              }
              return <span key={index}>{chunk.text}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
