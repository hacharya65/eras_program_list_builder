'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/domain/types';
import {
  ExperienceJournalEntry,
  JournalCategory,
  JOURNAL_CATEGORIES,
  loadExperienceJournalEntries,
  saveExperienceJournalEntries,
  addExperienceJournalEntry,
  deleteExperienceJournalEntry,
  INITIAL_MOCK_JOURNAL_ENTRIES,
} from '@/domain/experience-journal-models';
import {
  BookOpen,
  Plus,
  Search,
  Copy,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  FileText,
  Star,
  Clock,
  Briefcase,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface JournalRepositoryViewProps {
  student: UserProfile;
  onBack: () => void;
  onNavigateToExperiences?: () => void;
  onNavigateToPersonalStatement?: () => void;
}

export function JournalRepositoryView({
  student,
  onBack,
  onNavigateToExperiences,
  onNavigateToPersonalStatement,
}: JournalRepositoryViewProps) {
  // Deterministic SSR default initialized by student.id
  const [entries, setEntries] = useState<ExperienceJournalEntry[]>(() =>
    loadExperienceJournalEntries(student.id)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New entry form state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<JournalCategory>('Clinical Encounter');
  const [newNotes, setNewNotes] = useState('');
  const [isPivotal, setIsPivotal] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setEntries(loadExperienceJournalEntries(student.id));
  }, [student.id]);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newNotes.trim()) return;

    const entry: ExperienceJournalEntry = {
      id: `journal-${Date.now()}`,
      studentId: student.id,
      title: newTitle.trim(),
      category: newCategory,
      date: new Date().toISOString().slice(0, 10),
      setting: 'Clinical Setting',
      notableObservation: newNotes.trim(),
      keyTakeaway: '',
      isKeyMemory: isPivotal,
      createdAt: new Date().toISOString(),
    };

    const updated = addExperienceJournalEntry(student.id, entry);
    setEntries(updated);

    setNewTitle('');
    setNewNotes('');
    setIsPivotal(false);
    setIsComposerOpen(false);
    setSuccessMessage(`Saved "${entry.title}" to your Journal!`);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 3500);
  };

  const handleDelete = (id: string) => {
    const updated = deleteExperienceJournalEntry(student.id, id);
    setEntries(updated);
    setDeleteConfirmId(null);
    setSuccessMessage('Entry deleted from your Journal.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCopy = (entry: ExperienceJournalEntry) => {
    const textToCopy = `Topic: ${entry.title}\nCategory: ${entry.category}\nDate: ${entry.date}\nNotes: ${entry.notableObservation}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Filtered entries
  const filteredEntries = entries.filter((entry) => {
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notableObservation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryColor = (cat: JournalCategory) => {
    switch (cat) {
      case 'Clinical Encounter':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Patient Advocacy':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Teaching & Mentorship':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Research Breakthrough':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Leadership Moment':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Personal Reflection':
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3A30] hover:text-[#142720] bg-white border border-neutral-200/90 px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs text-neutral-500">
          Independent Clinical Moments Scratchpad &bull; Applicant Reflective Repository
        </span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2EE] border border-[#7EAE9B]/30 flex items-center justify-center text-[#1F3A30]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">Journal</h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                  suppressHydrationWarning
                >
                  {entries.length} Entries Stored
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                Your private bank for capturing remarkable patient encounters, clinical insights, and takeaways.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsComposerOpen(!isComposerOpen)}
          className="px-4 py-2.5 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-[#7EAE9B]" />
          <span>{isComposerOpen ? 'Close Composer' : 'New Journal Entry'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Composer Card (Visible when toggled or if list empty) */}
      {isComposerOpen && (
        <div className="bg-white rounded-2xl border border-[#7EAE9B]/40 shadow-xs p-6 space-y-4">
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1F3A30]" />
              <span>Capture a Remarkable Experience</span>
            </h2>
            <span className="text-[11px] text-neutral-400">
              Low-friction scratchpad &bull; private to you
            </span>
          </div>

          <form onSubmit={handleCreateEntry} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Topic or Encounter Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Night float chest pain consult, bedside pediatric sedation, difficult family meeting..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Reflection &amp; Clinical Notes *
              </label>
              <textarea
                rows={4}
                required
                placeholder="What happened? What patient dynamics, procedural takeaways, or clinical insights stood out to you? Jot them down while the memory is fresh..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] shadow-2xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-600">Category:</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="px-3 py-1.5 text-xs font-semibold border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer"
                  >
                    {JOURNAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={isPivotal}
                    onChange={(e) => setIsPivotal(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1F3A30] focus:ring-[#7EAE9B] cursor-pointer"
                  />
                  <span>Star as <strong>Pivotal Memory</strong></span>
                </label>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Entry</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search entries by topic, note keywords, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1F3A30] text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
            }`}
          >
            All ({entries.length})
          </button>
          {JOURNAL_CATEGORIES.map((cat) => {
            const count = entries.filter((e) => e.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1F3A30] text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3.5">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-10 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-800">No journal entries found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              {searchQuery
                ? 'Try broadening your search term or selecting a different category filter.'
                : 'Start capturing your remarkable patient encounters, clinical questions, and procedure takeaways.'}
            </p>
            {!isComposerOpen && (
              <button
                onClick={() => setIsComposerOpen(true)}
                className="mt-2 px-4 py-2 bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-xs rounded-xl shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write First Entry</span>
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs hover:border-neutral-300 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-neutral-900">{entry.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${categoryColor(
                        entry.category
                      )}`}
                    >
                      {entry.category}
                    </span>
                    {entry.isKeyMemory && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        <span>Pivotal</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{entry.date}</span>
                    </span>
                    {entry.setting && (
                      <>
                        <span>&bull;</span>
                        <span>{entry.setting}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => handleCopy(entry)}
                    className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Copy entry text to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{copiedId === entry.id ? 'Copied!' : 'Copy Notes'}</span>
                  </button>

                  {deleteConfirmId === entry.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-[#FBFBFA] border border-neutral-100 rounded-xl text-xs text-neutral-700 leading-relaxed font-sans whitespace-pre-line">
                {entry.notableObservation}
              </div>

              {entry.keyTakeaway && (
                <div className="text-xs text-neutral-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  <strong className="text-emerald-900">Key Takeaway:</strong> {entry.keyTakeaway}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Advising Guidance Callout: How to Leverage Your Journal */}
      <div className="bg-[#F2F4F2]/70 border border-neutral-200/80 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-white border border-[#7EAE9B]/30 flex items-center justify-center text-[#1F3A30] shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5 text-[#4E8773]" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Advising Tip: Using Your Journal for ERAS 2027 Applications
          </h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Your journal is an isolated clinical repository that preserves unedited, vivid patient interactions and procedural observations. When you're ready to draft your official application materials, draw upon these notes to track meaningful experiences and spark ideas as you craft personalized entries for your{' '}
            <button
              onClick={onNavigateToExperiences}
              className="text-[#1F3A30] font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              10 MyERAS Experiences
            </button>{' '}
            and{' '}
            <button
              onClick={onNavigateToPersonalStatement}
              className="text-[#1F3A30] font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              Personal Statement
            </button>{' '}
            section on ERAS.
          </p>
        </div>
      </div>
    </div>
  );
}
