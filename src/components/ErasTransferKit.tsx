'use client';

import React, { useState, useEffect } from 'react';
import { StudentDashboardContext } from '@/domain/types';
import {
  generateTransferFields,
  validateTransferPayloads,
  compileInstitutionalPacket,
  TransferField,
  CompiledApplicationPacket,
} from '@/domain/transfer-kit-models';
import { deserializeScholarlyPortfolio, ScholarlyWork } from '@/domain/scholarly-models';
import { SchoolListItem } from '@/domain/school-list-models';
import {
  ClipboardCopy,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Printer,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Award,
  AlertCircle,
  Building,
  GraduationCap,
  Download,
  Loader2,
  Eye,
} from 'lucide-react';

interface ErasTransferKitProps {
  context: StudentDashboardContext;
  onBack: () => void;
}

export function ErasTransferKit({ context, onBack }: ErasTransferKitProps) {
  // Rehydrate full portfolio state for comprehensive export
  const [scholarlyWorks] = useState<ScholarlyWork[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('eras_scholarly_portfolio');
      const restored = deserializeScholarlyPortfolio(cached);
      if (restored) return restored.works;
    }
    return [];
  });

  const [schoolList] = useState<SchoolListItem[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('eras_school_list_matrix');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });

  const [fields, setFields] = useState<TransferField[]>(() =>
    generateTransferFields(context, scholarlyWorks, schoolList)
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'personal_statement' | 'experiences' | 'reflections' | 'hobbies' | 'scholarly_works'>('all');
  const [showPacketModal, setShowPacketModal] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfPreviewBlobUrl, setPdfPreviewBlobUrl] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'dossier' | 'pdf'>('dossier');

  useEffect(() => {
    return () => {
      if (pdfPreviewBlobUrl) {
        window.URL.revokeObjectURL(pdfPreviewBlobUrl);
      }
    };
  }, [pdfPreviewBlobUrl]);

  const validation = validateTransferPayloads(fields);
  const totalCount = fields.length;
  const copiedCount = fields.filter((f) => f.isCopied).length;
  const progressPercent = Math.round((copiedCount / totalCount) * 100);

  const packet: CompiledApplicationPacket = compileInstitutionalPacket(
    context,
    scholarlyWorks,
    schoolList
  );

  const generatePdfBlob = async (): Promise<string> => {
    if (pdfPreviewBlobUrl) return pdfPreviewBlobUrl;
    setIsGeneratingPdf(true);
    try {
      const res = await fetch('/api/export-packet-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewBlobUrl(url);
      return url;
    } catch (err) {
      console.error('PDF export failed:', err);
      throw err;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const url = await generatePdfBlob();
      // Present preview immediately
      setPreviewTab('pdf');

      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = (packet.student.name || 'Applicant').replace(/\s+/g, '_');
      link.download = `Geisinger_ERAS_Dossier_${sanitizedName}_2027.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Unable to generate high-resolution PDF dossier. Opening print fallback view.');
      window.print();
    }
  };

  const handleOpenPdfPreview = async () => {
    setShowPacketModal(true);
    setPreviewTab('pdf');
    if (!pdfPreviewBlobUrl) {
      try {
        await generatePdfBlob();
      } catch {
        setPreviewTab('dossier');
      }
    }
  };

  const handleCopy = (field: TransferField) => {
    navigator.clipboard.writeText(field.content);
    setCopiedId(field.id);
    setFields((prev) =>
      prev.map((f) => (f.id === field.id ? { ...f, isCopied: true } : f))
    );
    setTimeout(() => {
      setCopiedId((curr) => (curr === field.id ? null : curr));
    }, 2500);
  };

  const handleToggleCopied = (id: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isCopied: !f.isCopied } : f))
    );
  };

  const filteredFields = fields.filter((f) => {
    if (activeFilter === 'all') return true;
    return f.section === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Character Safe & Pre-Sanitized
              </span>
              <span className="text-xs text-slate-500">ERAS 2027 Transfer Protocol</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <ClipboardCopy className="w-6 h-6 text-emerald-600" />
              1-Click ERAS Transfer Kit & Packet Export
            </h1>
          </div>
        </div>

        {/* Export Institutional PDF Packet Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowPacketModal(true);
              setPreviewTab('dossier');
            }}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-sm transition-all"
            title="Preview formatted dossier layout"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            Dossier Preview
          </button>
          <button
            onClick={handleOpenPdfPreview}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            title="Preview and download official PDF dossier"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Preview &amp; Download PDF
          </button>
        </div>
      </div>

      {/* Progress & Validation Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Transfer Completion Progress
            </span>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">
              {copiedCount} of {totalCount} fields transferred into MyERAS ({progressPercent}%)
            </div>
          </div>

          <div className="flex items-center gap-2">
            {validation.valid ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 0 Character Overflow Violations
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" /> {validation.violations.length} Formatting Violations
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'all', label: `All Fields (${fields.length})` },
          { key: 'personal_statement', label: 'Personal Statement' },
          { key: 'experiences', label: '10 Experiences' },
          { key: 'reflections', label: 'Most Meaningful Reflections' },
          { key: 'hobbies', label: 'Hobbies (300 chars)' },
          { key: 'scholarly_works', label: 'Scholarly Works' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transfer Fields List */}
      <div className="space-y-4">
        {filteredFields.map((field) => (
          <div
            key={field.id}
            className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
              field.isCopied ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{field.label}</h3>
                  {field.isCopied && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Destination: <strong className="text-slate-700">{field.fieldTarget}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Character Count Meter */}
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      field.isOverLimit
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {field.charCount} / {field.charLimit} chars
                  </span>
                </div>

                {/* 1-Click Copy Button */}
                <button
                  onClick={() => handleCopy(field)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    copiedId === field.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {copiedId === field.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Payload
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Field Payload Preview Box */}
            <div className="mt-3">
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-800 font-mono whitespace-pre-wrap border border-slate-200 leading-relaxed max-h-36 overflow-y-auto">
                {field.content}
              </div>
            </div>

            {/* Manual Checkbox */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{field.helperText}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.isCopied}
                  onChange={() => handleToggleCopied(field.id)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-700">Pasted in MyERAS</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional Application Packet Modal */}
      {showPacketModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-8 space-y-6">
            {/* Modal Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-slate-800" />
                <div>
                  <span id="dossier-modal-title" className="text-sm font-bold text-slate-900 block">
                    Geisinger Commonwealth School of Medicine &bull; Dean's Office / MSPE Application Dossier
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Official ERAS 2027 institutional application portfolio preview
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {/* View Mode Toggle: Interactive Dossier vs Live PDF */}
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setPreviewTab('dossier')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                      previewTab === 'dossier'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Dossier Layout
                  </button>
                  <button
                    onClick={() => {
                      setPreviewTab('pdf');
                      if (!pdfPreviewBlobUrl) generatePdfBlob();
                    }}
                    className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                      previewTab === 'pdf'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Live PDF Preview
                  </button>
                </div>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  title="Generate high-resolution backend-rendered PDF document"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-200"
                  title="Quick browser print view"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" /> Print
                </button>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => setShowPacketModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  &times;
                </button>
              </div>
            </div>

            {previewTab === 'pdf' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-slate-800">
                      Official PDF Document Preview (Strict Left-Aligned, All Sections Included)
                    </span>
                    <span className="text-slate-500">
                      &bull; {packet.student.name} ({packet.student.specialty})
                    </span>
                  </div>
                  {pdfPreviewBlobUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadPdf}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> Save PDF File
                      </button>
                      <a
                        href={pdfPreviewBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Fullscreen
                      </a>
                    </div>
                  )}
                </div>

                {isGeneratingPdf ? (
                  <div className="h-[65vh] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-600">
                      Rendering high-resolution multi-page PDF dossier...
                    </p>
                  </div>
                ) : pdfPreviewBlobUrl ? (
                  <iframe
                    src={pdfPreviewBlobUrl}
                    className="w-full h-[68vh] rounded-xl border border-slate-300 shadow-inner bg-slate-100"
                    title="Official PDF Dossier Preview"
                  />
                ) : (
                  <div className="h-[60vh] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <p className="text-xs text-slate-500">Click below to generate and display the official PDF document preview.</p>
                    <button
                      onClick={generatePdfBlob}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Generate PDF Preview
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Printable Application Packet Content */
              <div className="space-y-6 text-slate-900">
                {/* Institution Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    GEISINGER COMMONWEALTH SCHOOL OF MEDICINE
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Office of Student Affairs &bull; Residency Match Advising Portfolio &bull; ERAS 2027
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Date Compiled: {new Date().toLocaleDateString()}</div>
                  <div className="font-mono font-semibold text-slate-700">Dossier ID: {packet.student.aamcId}</div>
                </div>
              </div>

              {/* Student Identification & Faculty Endorsement Badge */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    Applicant Information
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-1">{packet.student.name}</div>
                  <div className="text-slate-700 mt-0.5">Target Specialty: <strong className="text-slate-900">{packet.student.specialty}</strong></div>
                  <div className="text-slate-500 mt-0.5">Email: {packet.student.email}</div>
                </div>

                <div className="border-l border-slate-200 pl-4">
                  <div className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    Faculty Review Endorsement
                  </div>
                  <div className="text-emerald-700 font-bold text-sm mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {packet.advisorEndorsement?.clinicalReadinessVerdict}
                  </div>
                  <div className="text-slate-700 mt-0.5">
                    Endorsed by: <strong className="text-slate-900">{packet.advisorEndorsement?.advisorName}</strong> ({packet.advisorEndorsement?.advisorSpecialty})
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    4-Pillar Rubric Score: <strong className="text-slate-800">{packet.advisorEndorsement?.rubricScore}/16</strong> (Target Quality Standard Exceeded)
                  </div>
                </div>
              </div>

              {/* Personal Statement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    I. Approved Personal Statement (v{packet.personalStatement.versionNumber})
                  </h3>
                  <span className="text-xs text-slate-500">
                    {packet.personalStatement.charCount} characters
                  </span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed font-serif whitespace-pre-wrap bg-slate-50/50 p-4 rounded border border-slate-100">
                  {packet.personalStatement.content}
                </div>
              </div>

              {/* Selected Experiences */}
              <div className="space-y-3">
                <div className="border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    II. Selected Experiences ({packet.experiences.length} of 10)
                  </h3>
                </div>
                <div className="space-y-3">
                  {packet.experiences.map((exp, i) => (
                    <div key={i} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-slate-900 font-semibold">{exp.title}</strong> &bull; {exp.organization}
                          <span className="text-slate-500 block text-[11px]">{exp.type} &bull; {exp.dateRange}</span>
                        </div>
                        {exp.isMostMeaningful && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ★ Most Meaningful
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed">{exp.description}</p>
                      {exp.reflection && (
                        <div className="bg-amber-50/80 p-2 rounded border border-amber-200 text-amber-900 italic text-[11px]">
                          <strong>Meaningful Reflection:</strong> {exp.reflection}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scholarly Works */}
              <div className="space-y-2">
                <div className="border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    III. Scholarly Works & Publications ({packet.scholarlyWorks.length} Recorded)
                  </h3>
                </div>
                {packet.scholarlyWorks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No scholarly works recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {packet.scholarlyWorks.map((work, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                        <div className="font-semibold text-slate-900 flex items-center justify-between">
                          <span>{idx + 1}. {work.title}</span>
                          {work.isMostMeaningful && (
                            <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                              ★ Meaningful
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Type: {work.type}</div>
                        <p className="text-slate-700 font-serif text-[11px] mt-1">{work.citation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strategic School List & Signals */}
              <div className="space-y-2">
                <div className="border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    IV. Strategic School List & Signals ({packet.schoolList.length} Programs)
                  </h3>
                </div>
                {packet.schoolList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No programs added to the strategic matrix.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        <tr>
                          <th className="p-2">Program</th>
                          <th className="p-2">Location</th>
                          <th className="p-2">Tier</th>
                          <th className="p-2">Signal Allocation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {packet.schoolList.map((school, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-900">{school.programName}</td>
                            <td className="p-2 text-slate-600">{school.city}, {school.state}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                school.tier === 'reach'
                                  ? 'bg-rose-50 text-rose-700'
                                  : school.tier === 'target'
                                  ? 'bg-sky-50 text-sky-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {school.tier}
                              </span>
                            </td>
                            <td className="p-2">
                              {school.signal === 'gold' && (
                                <span className="font-bold text-amber-700 text-[11px]">● Gold Signal</span>
                              )}
                              {school.signal === 'silver' && (
                                <span className="font-semibold text-slate-600 text-[11px]">● Silver Signal</span>
                              )}
                              {school.signal !== 'gold' && school.signal !== 'silver' && (
                                <span className="text-slate-400 text-[11px]">No Signal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Hobbies & Interests */}
              <div className="space-y-1.5">
                <div className="border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    V. Hobbies & Outside Interests
                  </h3>
                </div>
                <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded border border-slate-200">
                  {packet.hobbies}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
  );
}
