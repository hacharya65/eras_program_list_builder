'use client';

import React, { useState, useEffect } from 'react';
import {
  ExperienceJournalEntry,
  JournalCategory,
  JOURNAL_CATEGORIES,
  loadExperienceJournalEntries,
  deleteExperienceJournalEntry,
  INITIAL_MOCK_JOURNAL_ENTRIES,
} from '@/domain/experience-journal-models';
import {
  BookOpen,
  Search,
  Copy,
  Trash2,
  X,
  ExternalLink,
  Star,
  Clock,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface JournalEntriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onNavigateToFullPage?: () => void;
}

export function JournalEntriesDrawer({
  isOpen,
  onClose,
  studentId,
  onNavigateToFullPage,
}: JournalEntriesDrawerProps) {
  const [entries, setEntries] = useState<ExperienceJournalEntry[]>(INITIAL_MOCK_JOURNAL_ENTRIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadExperienceJournalEntries(studentId));
    }
  }, [isOpen, studentId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    const updated = deleteExperienceJournalEntry(studentId, id);
    setEntries(updated);
  };

  const handleCopy = (entry: ExperienceJournalEntry) => {
    const textToCopy = `Topic: ${entry.title}\nCategory: ${entry.category}\nDate: ${entry.date}\nNotes: ${entry.notableObservation}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notableObservation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryBadgeClass = (cat: JournalCategory) => {
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
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-neutral-200">
          {/* Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between gap-3 bg-[#FBFBFA]">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#1F3A30]" />
                <h2 className="text-base font-bold text-neutral-900">Journal Entries</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {entries.length} saved
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Browse, search, and copy your clinical reflections.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-200/70 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-neutral-100 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by topic or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#1F3A30] text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/60'
                }`}
              >
                All
              </button>
              {JOURNAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#1F3A30] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Entries Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-500 font-medium">No matching entries found.</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-[#FBFBFA] border border-neutral-200/80 rounded-2xl text-xs space-y-2.5 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                          {entry.title}
                        </span>
                        {entry.isKeyMemory && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                            <Star className="w-2 h-2 fill-amber-500 text-amber-500" />
                            <span>Pivotal</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${categoryBadgeClass(entry.category)}`}>
                          {entry.category}
                        </span>
                        <span>&bull;</span>
                        <span>{entry.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(entry)}
                        className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[11px] font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Copy text to clipboard"
                      >
                        <Copy className="w-3 h-3 text-neutral-500" />
                        <span>{copiedId === entry.id ? 'Copied!' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-neutral-700 text-xs leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-neutral-100">
                    {entry.notableObservation}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-neutral-100 bg-[#FBFBFA] flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-500">
              {filteredEntries.length} of {entries.length} shown
            </span>

            {onNavigateToFullPage && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToFullPage();
                }}
                className="px-3.5 py-2 bg-[#1F3A30] hover:bg-[#162D25] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Full Journal Page</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#7EAE9B]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
