'use client';

import React, { useState } from 'react';
import {
  AAMC_SCHOLARLY_TYPES,
  AamcScholarlyType,
  ScholarlyWork,
  ScholarlyCollection,
  formatAamcAuthor,
  validateScholarlyCollectionTitle,
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
  Sparkles
} from 'lucide-react';

interface ScholarlyWorksManagerProps {
  onBack: () => void;
}

export function ScholarlyWorksManager({ onBack }: ScholarlyWorksManagerProps) {
  const [works, setWorks] = useState<ScholarlyWork[]>([
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
  ]);

  const [collections, setCollections] = useState<ScholarlyCollection[]>([
    { id: 'col-1', studentId: 'student-1', title: 'Critical Care & Pulmonary Outcomes' },
    { id: 'col-2', studentId: 'student-1', title: 'Community Health Interventions' },
  ]);

  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [editingWork, setEditingWork] = useState<ScholarlyWork | null>(works[0] || null);

  const meaningfulCount = works.filter((w) => w.isMeaningful).length;

  const handleToggleMeaningful = (workId: string) => {
    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === workId) {
          if (!w.isMeaningful && meaningfulCount >= 3) {
            alert('AAMC Guideline: You can indicate up to 3 Most Meaningful Scholarly Works.');
            return w;
          }
          return { ...w, isMeaningful: !w.isMeaningful };
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
      id: `col-${Date.now()}`,
      studentId: 'student-1',
      title: newCollectionTitle.trim(),
    };
    setCollections((prev) => [...prev, newCol]);
    setNewCollectionTitle('');
    setShowAddCollection(false);
  };

  const handleCreateNewWork = () => {
    const newWork: ScholarlyWork = {
      id: `sw-${Date.now()}`,
      studentId: 'student-1',
      type: 'Journal Articles (peer reviewed)',
      title: 'New Scholarly Output',
      authors: 'Rivera A',
      isFirstAuthor: true,
      publicationStatus: 'Submitted',
      isMeaningful: false,
    };
    setWorks((prev) => [newWork, ...prev]);
    setEditingWork(newWork);
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
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  {c.title}
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
                      <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {work.type}
                      </span>
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
