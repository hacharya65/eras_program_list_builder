'use client';

import React, { useState, useEffect } from 'react';
import {
  ExperienceJournalEntry,
  JournalCategory,
  JOURNAL_CATEGORIES,
  loadExperienceJournalEntries,
  addExperienceJournalEntry,
} from '@/domain/experience-journal-models';
import { JournalEntriesDrawer } from '@/components/JournalEntriesDrawer';
import {
  BookOpen,
  Calendar,
  Stethoscope,
  X,
  Plus,
  CheckCircle2,
  ChevronRight,
  Star,
  Sparkles,
} from 'lucide-react';

interface FloatingJournalWidgetProps {
  studentId: string;
  onNavigateToFullPage?: () => void;
}

export function FloatingJournalWidget({
  studentId,
  onNavigateToFullPage,
}: FloatingJournalWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [entries, setEntries] = useState<ExperienceJournalEntry[]>([]);

  // Form states
  const getTodayDateString = () => new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [rotation, setRotation] = useState('');
  const [category, setCategory] = useState<JournalCategory>('Clinical Encounter');
  const [notes, setNotes] = useState('');
  const [isKeyMemory, setIsKeyMemory] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync entries on mount and whenever custom event or studentId changes
  const reloadEntries = () => {
    setEntries(loadExperienceJournalEntries(studentId));
  };

  useEffect(() => {
    reloadEntries();
    const handleUpdate = () => reloadEntries();
    window.addEventListener('journal_entries_updated', handleUpdate);
    return () => window.removeEventListener('journal_entries_updated', handleUpdate);
  }, [studentId]);

  // Open modal resets date to today if empty
  const handleOpenModal = () => {
    if (!date) {
      setDate(getTodayDateString());
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSuccessToast(null);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;

    const newEntry: ExperienceJournalEntry = {
      id: `journal-${Date.now()}`,
      studentId,
      title: title.trim(),
      category,
      date: date || getTodayDateString(),
      setting: rotation.trim() ? `${rotation.trim()} Rotation` : 'Clinical Setting',
      rotation: rotation.trim() || undefined,
      notableObservation: notes.trim(),
      keyTakeaway: '',
      isKeyMemory,
      createdAt: new Date().toISOString(),
    };

    const updated = addExperienceJournalEntry(studentId, newEntry);
    setEntries(updated);

    // Reset fields for next entry
    setTitle('');
    setDate(getTodayDateString());
    setRotation('');
    setCategory('Clinical Encounter');
    setNotes('');
    setIsKeyMemory(false);

    setSuccessToast(`Saved "${newEntry.title}" to your Journal!`);
    window.dispatchEvent(new CustomEvent('journal_entries_updated'));

    setTimeout(() => {
      setSuccessToast(null);
      setIsOpen(false);
    }, 1200);
  };

  return (
    <>
      {/* Persistent Floating Action Trigger (Bottom-Right across the Entire Application) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handleOpenModal}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#1F3A30] hover:bg-[#142720] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer border border-[#7EAE9B]/40 hover:scale-105 active:scale-95"
          title="Open Clinical Journal & Reflection Scratchpad"
          aria-label="Open Reflective Journal"
        >
          <div className="relative">
            <BookOpen className="w-5 h-5 text-emerald-300 group-hover:rotate-6 transition-transform" />
            {entries.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-[#1F3A30]">
                {entries.length > 99 ? '99+' : entries.length}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide pr-0.5">Journal</span>
        </button>
      </div>

      {/* Quick Journal Entry Modal */}
      {isOpen && (
        <div
          data-modal="true"
          role="dialog"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 modal-backdrop"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#D6E5DF] animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF2EE] text-[#1F3A30] flex items-center justify-center font-bold shrink-0">
                  <BookOpen className="w-5 h-5 text-[#1F3A30]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Reflective Journal Entry</h3>
                  <p className="text-xs text-neutral-500">Capture encounters &amp; takeaways while fresh</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Browse saved entries"
                >
                  <span>Saved ({entries.length})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Success Toast */}
            {successToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successToast}</span>
              </div>
            )}

            {/* Entry Form */}
            <form onSubmit={handleSaveEntry} className="space-y-3.5 text-xs">
              {/* Title / Topic */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Topic / Case Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU Consult on Acute Sepsis, Difficult Code Discussion, Night Float..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] font-medium text-neutral-900"
                />
              </div>

              {/* Date & Rotation Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date (Auto-populated with current date, easily modifiable) */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1F3A30]" />
                    <span>Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] font-medium text-neutral-900 cursor-pointer"
                  />
                </div>

                {/* Rotation (Free text) */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-[#1F3A30]" />
                    <span>Rotation / Service</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MICU Sub-I, Inpatient Cardiology, Ambulatory..."
                    value={rotation}
                    onChange={(e) => setRotation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] text-neutral-900"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Experience Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as JournalCategory)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer"
                >
                  {JOURNAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes / Clinical Reflections */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Encounter Narrative &amp; Clinical Reflections *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Patient dynamics, key takeaways, clinical reflections, or ethical questions while fresh in memory..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] text-neutral-900 resize-none leading-relaxed"
                />
              </div>

              {/* Star as Pivotal / Key Memory */}
              <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer select-none bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <input
                  type="checkbox"
                  checked={isKeyMemory}
                  onChange={(e) => setIsKeyMemory(e.target.checked)}
                  className="rounded text-[#1F3A30] focus:ring-[#1F3A30]"
                />
                <span className="flex items-center gap-1.5 font-semibold">
                  <Star className={`w-3.5 h-3.5 ${isKeyMemory ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                  <span>Star as Pivotal Memory (high impact for personal statement &amp; ERAS experiences)</span>
                </span>
              </label>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-xs text-[#1F3A30] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Browse All ({entries.length})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1F3A30] hover:bg-[#142720] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Browsing Saved Entries */}
      <JournalEntriesDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          reloadEntries();
        }}
        studentId={studentId}
        onNavigateToFullPage={onNavigateToFullPage}
      />
    </>
  );
}
