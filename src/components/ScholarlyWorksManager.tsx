'use client';

import React, { useState, useEffect } from 'react';
import {
  AAMC_SCHOLARLY_TYPES,
  AamcScholarlyType,
  ScholarlyWork,
  ScholarlyCollection,
  formatAamcAuthor,
  validateScholarlyCollectionTitle,
  createDefaultScholarlyWork,
  upsertScholarlyWork,
  deleteScholarlyWork,
  upsertScholarlyCollection,
  deleteScholarlyCollection,
  serializeScholarlyPortfolio,
  deserializeScholarlyPortfolio,
} from '@/domain/scholarly-models';
import {
  BookOpen,
  Star,
  Plus,
  ArrowLeft,
  ExternalLink,
  Tag,
  CheckCircle2,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Save,
  Check
} from 'lucide-react';

interface ScholarlyWorksManagerProps {
  onBack: () => void;
}

const DEFAULT_WORKS: ScholarlyWork[] = [
  {
    id: 'sw-1',
    studentId: 'student-1',
    type: 'Journal Articles (peer reviewed)',
    title: 'Longitudinal Pulmonary Function Trends Following ARDS in ICU Survivors',
    authors: 'Rivera A, Chen M, Vance S',
    isFirstAuthor: true,
    publicationStatus: 'Published',
    statusDate: '2024-05-12',
    journalName: 'American Journal of Respiratory and Critical Care Medicine',
    volume: '198',
    pages: '412-420',
    pmid: '38721904',
    collectionId: 'col-1',
    isMeaningful: true,
  },
  {
    id: 'sw-2',
    studentId: 'student-1',
    type: 'Poster Presentation',
    title: 'Community Health Worker Intervention for Uncontrolled Type 2 Diabetes',
    authors: 'Patel P, Rivera A, Hayes R',
    isFirstAuthor: false,
    publicationStatus: 'Accepted/In-Press',
    statusDate: '2023-11-18',
    collectionId: 'col-2',
    isMeaningful: true,
    events: [
      {
        eventName: 'Society of General Internal Medicine Annual Meeting',
        presentationDate: '2024-04-15',
        city: 'Boston',
        country: 'United States',
        stateProvince: 'MA',
      },
    ],
  },
];

const DEFAULT_COLLECTIONS: ScholarlyCollection[] = [
  { id: 'col-1', studentId: 'student-1', title: 'Critical Care & Pulmonary Outcomes' },
  { id: 'col-2', studentId: 'student-1', title: 'Community Health Interventions' },
];

const STORAGE_KEY = 'eras_scholarly_portfolio';

export function ScholarlyWorksManager({ onBack }: ScholarlyWorksManagerProps) {
  // Rehydrate initial state safely from localStorage
  const [works, setWorks] = useState<ScholarlyWork[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY);
      const restored = deserializeScholarlyPortfolio(cached);
      if (restored && restored.works.length > 0) {
        return restored.works;
      }
    }
    return DEFAULT_WORKS;
  });

  const [collections, setCollections] = useState<ScholarlyCollection[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY);
      const restored = deserializeScholarlyPortfolio(cached);
      if (restored && restored.collections.length > 0) {
        return restored.collections;
      }
    }
    return DEFAULT_COLLECTIONS;
  });

  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [editingWork, setEditingWork] = useState<ScholarlyWork | null>(() => works[0] || null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Saved');

  // Keep localStorage continuously synchronized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, serializeScholarlyPortfolio(works, collections));
      setLastSavedTime('Saved');
    }
  }, [works, collections]);

  const meaningfulCount = works.filter((w) => w.isMeaningful).length;

  const handleToggleMeaningful = (workId: string) => {
    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === workId) {
          if (!w.isMeaningful && meaningfulCount >= 3) {
            alert('AAMC Guideline: You can indicate up to 3 Most Meaningful Scholarly Works.');
            return w;
          }
          const updated = { ...w, isMeaningful: !w.isMeaningful };
          if (editingWork?.id === workId) {
            setEditingWork(updated);
          }
          return updated;
        }
        return w;
      })
    );
  };

  const handleAddCollection = () => {
    const val = validateScholarlyCollectionTitle(newCollectionTitle);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    const newCol: ScholarlyCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: 'student-1',
      title: newCollectionTitle.trim(),
    };
    setCollections((prev) => upsertScholarlyCollection(prev, newCol));
    setNewCollectionTitle('');
    setShowAddCollection(false);
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCollections((prev) => deleteScholarlyCollection(prev, collectionId));
    setWorks((prev) =>
      prev.map((w) => (w.collectionId === collectionId ? { ...w, collectionId: undefined } : w))
    );
  };

  const handleCreateNewWork = () => {
    const newWork = createDefaultScholarlyWork('student-1');
    setWorks((prev) => upsertScholarlyWork(prev, newWork));
    setEditingWork(newWork);
  };

  const handleDeleteWork = (workId: string) => {
    const updated = deleteScholarlyWork(works, workId);
    setWorks(updated);
    if (editingWork?.id === workId) {
      setEditingWork(updated[0] || null);
    }
  };

  const handleUpdateCurrentWork = (field: keyof ScholarlyWork, value: any) => {
    if (!editingWork) return;
    const updated = { ...editingWork, [field]: value };
    setEditingWork(updated);
    setWorks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };


  return (
    <div className="space-y-6">
      {/* Header Bar */}
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
              <h1 className="text-lg font-bold text-slate-900">Scholarly Works &amp; Research Portfolio</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-100 text-sky-800">
                {works.length} Total Entries
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                {meaningfulCount} / 3 Starred
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Auto-saved
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded in official 2026/2027 AAMC ERAS Guidelines (5 Standard Types, Starred Meaningful Works, Collections)
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateNewWork}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Scholarly Work
        </button>
      </div>

      {/* Main Grid: Works List + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Works List */}
        <div className="space-y-4">
          {/* Collections Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                Scholarly Collections
              </h3>
              <button
                onClick={() => setShowAddCollection(!showAddCollection)}
                className="text-[11px] text-sky-600 font-semibold hover:underline"
              >
                + New Collection
              </button>
            </div>

            {showAddCollection && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <input
                  type="text"
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  placeholder="Collection narrative title (max 100 chars)..."
                  className="w-full p-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>{newCollectionTitle.length}/100 chars</span>
                  <button
                    onClick={handleAddCollection}
                    className="px-2.5 py-1 bg-sky-600 text-white rounded font-bold hover:bg-sky-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {collections.map((c) => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 group"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{c.title}</span>
                  <button
                    onClick={() => handleDeleteCollection(c.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                    title={`Remove collection "${c.title}"`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* List of Works */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Entered Works
            </div>

            {works.map((work) => {
              const isSelected = work.id === editingWork?.id;
              return (
                <div
                  key={work.id}
                  onClick={() => setEditingWork(work)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {work.type}
                        </span>
                        {(() => {
                          const col = collections.find((c) => c.id === work.collectionId);
                          if (!col) return null;
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              <Tag className="w-2.5 h-2.5 text-indigo-500" />
                              {col.title}
                            </span>
                          );
                        })()}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-2">
                        {work.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {work.authors}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMeaningful(work.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        work.isMeaningful
                          ? 'bg-amber-100 text-amber-700'
                          : 'text-slate-300 hover:text-amber-500'
                      }`}
                      title={work.isMeaningful ? 'Meaningful Work' : 'Star as Meaningful (Max 3)'}
                    >
                      <Star className={`w-4 h-4 ${work.isMeaningful ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{work.publicationStatus}</span>
                    {work.pmid && <span>PMID: {work.pmid}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Work Editor (2 cols) */}
        {editingWork && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Edit Scholarly Work Details</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleMeaningful(editingWork.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    editingWork.isMeaningful
                      ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Star className={`w-4 h-4 ${editingWork.isMeaningful ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                  {editingWork.isMeaningful ? 'Starred as Most Meaningful' : 'Star as Most Meaningful (Max 3)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteWork(editingWork.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                  title="Delete this scholarly work entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Type & Title */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">AAMC Scholarly Work Type</label>
                <select
                  value={editingWork.type}
                  onChange={(e) => handleUpdateCurrentWork('type', e.target.value as AamcScholarlyType)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {AAMC_SCHOLARLY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title of Work / Presentation</label>
                <input
                  type="text"
                  value={editingWork.title}
                  onChange={(e) => handleUpdateCurrentWork('title', e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Full title as published or presented..."
                />
              </div>
            </div>

            {/* Authors & First Author */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authors List (AAMC Format: Smith CB, Rivera A, Vance S)
                </label>
                <input
                  type="text"
                  value={editingWork.authors}
                  onChange={(e) => handleUpdateCurrentWork('authors', e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Lastname FirstInitial, Lastname FirstInitial..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">First Author?</label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="isFirstAuthor"
                      checked={editingWork.isFirstAuthor}
                      onChange={() => handleUpdateCurrentWork('isFirstAuthor', true)}
                      className="text-sky-600"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="isFirstAuthor"
                      checked={!editingWork.isFirstAuthor}
                      onChange={() => handleUpdateCurrentWork('isFirstAuthor', false)}
                      className="text-sky-600"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            {/* Publication Status & Journal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Publication Status</label>
                <select
                  value={editingWork.publicationStatus || 'Submitted'}
                  onChange={(e) => handleUpdateCurrentWork('publicationStatus', e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Accepted/In-Press">Accepted/In-Press</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Journal / Conference Name</label>
                <input
                  type="text"
                  value={editingWork.journalName || ''}
                  onChange={(e) => handleUpdateCurrentWork('journalName', e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="e.g. Annals of Internal Medicine"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PMID (if published)</label>
                <input
                  type="text"
                  value={editingWork.pmid || ''}
                  onChange={(e) => handleUpdateCurrentWork('pmid', e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="e.g. 38721904"
                />
              </div>
            </div>

            {/* Assign to Collection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Scholarly Collection</label>
              <select
                value={editingWork.collectionId || ''}
                onChange={(e) => handleUpdateCurrentWork('collectionId', e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">None / Standalone Entry</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
