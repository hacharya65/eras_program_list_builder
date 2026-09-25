'use client';

import React, { useState } from 'react';
import {
  SPECIALTY_SIGNALING_RULES,
  validateSignalAllocation,
  SchoolListItem,
  ProgramTier,
  SignalType,
  ApplicationTrack,
} from '@/domain/school-list-models';
import {
  Sparkles,
  Plus,
  ArrowLeft,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Award,
  Shield,
  Target,
  Compass,
  Building,
  CheckCircle2
} from 'lucide-react';

interface SchoolListMatrixProps {
  specialty?: string;
  onBack: () => void;
}

export function SchoolListMatrix({
  specialty = 'Internal Medicine',
  onBack,
}: SchoolListMatrixProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialty);
  const [items, setItems] = useState<SchoolListItem[]>([
    {
      id: 'item-1',
      programId: 'prog-1',
      programName: 'Massachusetts General Hospital',
      specialty: 'Internal Medicine',
      city: 'Boston',
      state: 'MA',
      tier: 'reach',
      signal: 'gold',
      track: 'categorical',
      advisorNotes: 'Strong research emphasis; Gold signal essential for out-of-region interview consideration.',
      residencyExplorerUrl: 'https://www.residencyexplorer.org',
      doximityUrl: 'https://www.doximity.com/residency',
    },
    {
      id: 'item-2',
      programId: 'prog-2',
      programName: 'Brigham and Women’s Hospital',
      specialty: 'Internal Medicine',
      city: 'Boston',
      state: 'MA',
      tier: 'reach',
      signal: 'gold',
      track: 'categorical',
      residencyExplorerUrl: 'https://www.residencyexplorer.org',
      doximityUrl: 'https://www.doximity.com/residency',
    },
    {
      id: 'item-3',
      programId: 'prog-3',
      programName: 'University of Washington',
      specialty: 'Internal Medicine',
      city: 'Seattle',
      state: 'WA',
      tier: 'target',
      signal: 'silver',
      track: 'categorical',
      advisorNotes: 'Great clinical culture; Silver signal shows genuine interest outside WWAMI region.',
      residencyExplorerUrl: 'https://www.residencyexplorer.org',
      doximityUrl: 'https://www.doximity.com/residency',
    },
    {
      id: 'item-4',
      programId: 'prog-4',
      programName: 'Emory University School of Medicine',
      specialty: 'Internal Medicine',
      city: 'Atlanta',
      state: 'GA',
      tier: 'target',
      signal: 'silver',
      track: 'categorical',
      residencyExplorerUrl: 'https://www.residencyexplorer.org',
      doximityUrl: 'https://www.doximity.com/residency',
    },
    {
      id: 'item-5',
      programId: 'prog-5',
      programName: 'Tufts Medical Center',
      specialty: 'Internal Medicine',
      city: 'Boston',
      state: 'MA',
      tier: 'safety',
      signal: 'none',
      track: 'categorical',
      advisorNotes: 'Excellent home-region anchor program.',
      residencyExplorerUrl: 'https://www.residencyexplorer.org',
      doximityUrl: 'https://www.doximity.com/residency',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProgName, setNewProgName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newTier, setNewTier] = useState<ProgramTier>('target');
  const [newSignal, setNewSignal] = useState<SignalType>('none');
  const [newTrack, setNewTrack] = useState<ApplicationTrack>('categorical');

  const signalStatus = validateSignalAllocation(selectedSpecialty, items);
  const rule = SPECIALTY_SIGNALING_RULES[selectedSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  const handleUpdateItem = (id: string, updates: Partial<SchoolListItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName.trim()) return;

    const newItem: SchoolListItem = {
      id: `item-${Date.now()}`,
      programId: `prog-${Date.now()}`,
      programName: newProgName.trim(),
      specialty: selectedSpecialty,
      city: newCity.trim() || 'City',
      state: newState.trim().toUpperCase() || 'ST',
      tier: newTier,
      signal: newSignal,
      track: newTrack,
      residencyExplorerUrl: 'https://www.residencyexplorer.org',
      doximityUrl: 'https://www.doximity.com/residency',
    };

    setItems((prev) => [...prev, newItem]);
    setNewProgName('');
    setNewCity('');
    setNewState('');
    setShowAddModal(false);
  };

  const tiers: { key: ProgramTier; title: string; desc: string; icon: React.ReactNode; colorClass: string }[] = [
    {
      key: 'reach',
      title: 'Reach Programs',
      desc: 'Top-tier academic programs or reach metrics',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      colorClass: 'border-t-4 border-t-purple-500 bg-purple-50/20',
    },
    {
      key: 'target',
      title: 'Target Programs',
      desc: 'Balanced fit with your credentials & Step 2',
      icon: <Target className="w-4 h-4 text-sky-600" />,
      colorClass: 'border-t-4 border-t-sky-500 bg-sky-50/20',
    },
    {
      key: 'safety',
      title: 'Safety / Anchor Programs',
      desc: 'Comfortable likelihood & home-region anchors',
      icon: <Shield className="w-4 h-4 text-emerald-600" />,
      colorClass: 'border-t-4 border-t-emerald-500 bg-emerald-50/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
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
              <h1 className="text-lg font-bold text-slate-900">Strategic School List Matrix</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-100 text-sky-800">
                {items.length} Programs
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live ERAS Signaling Budget &bull; Reach / Target / Safety Balance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Specialty Selector */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="p-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {Object.keys(SPECIALTY_SIGNALING_RULES).map((spec) => (
              <option key={spec} value={spec}>
                {spec} ({SPECIALTY_SIGNALING_RULES[spec].totalSignals} signals)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Program
          </button>
        </div>
      </div>

      {/* Live Signal Budget Tracker Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Official ERAS Signaling Quota ({selectedSpecialty})
            </h2>
            <p className="text-xs text-slate-500">
              Signaling dramatically improves interview yield. Ensure all tokens are placed strategically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Total Tokens:</span>
            <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-slate-100 text-slate-800">
              {signalStatus.goldUsed + signalStatus.silverUsed} / {rule.totalSignals} Spent
            </span>
          </div>
        </div>

        {/* Gold & Silver Signal Meters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gold Signals */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Gold Signals (Highest Preference)
              </span>
              <span className="font-bold text-amber-900">
                {signalStatus.goldUsed} of {rule.goldSignals} Used ({signalStatus.goldRemaining} Remaining)
              </span>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  signalStatus.goldUsed > rule.goldSignals ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min((signalStatus.goldUsed / (rule.goldSignals || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Silver Signals */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-300 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                Silver Signals (High Preference)
              </span>
              <span className="font-bold text-slate-700">
                {signalStatus.silverUsed} of {rule.silverSignals} Used ({signalStatus.silverRemaining} Remaining)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  signalStatus.silverUsed > rule.silverSignals ? 'bg-red-500' : 'bg-slate-600'
                }`}
                style={{ width: `${Math.min((signalStatus.silverUsed / (rule.silverSignals || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Validation Errors if Over-allocated */}
        {!signalStatus.valid && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{signalStatus.errors.join('. ')}</span>
          </div>
        )}
      </div>

      {/* 3-Tier Board Columns (Reach, Target, Safety) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((t) => {
          const tierItems = items.filter((i) => i.tier === t.key);
          return (
            <div
              key={t.key}
              className={`rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between ${t.colorClass}`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    {t.icon}
                    <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white border border-slate-200 text-slate-700">
                    {tierItems.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">{t.desc}</p>

                {/* Program Cards in this Tier */}
                <div className="space-y-3">
                  {tierItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No programs in this tier yet.
                    </div>
                  ) : (
                    tierItems.map((prog) => (
                      <div
                        key={prog.id}
                        className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-2.5 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {prog.programName}
                            </h4>
                            <span className="text-[11px] text-slate-500">
                              {prog.city}, {prog.state} &bull; <strong className="text-slate-700 capitalize">{prog.track}</strong>
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(prog.id)}
                            className="text-slate-300 hover:text-red-500 p-1"
                            title="Remove Program"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Signaling Dropdown & External Links */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-medium">Signal:</span>
                            <select
                              value={prog.signal}
                              onChange={(e) => handleUpdateItem(prog.id, { signal: e.target.value as SignalType })}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border focus:outline-none ${
                                prog.signal === 'gold'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : prog.signal === 'silver'
                                  ? 'bg-slate-200 text-slate-900 border-slate-400'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                            >
                              <option value="none">No Signal</option>
                              <option value="silver">Silver Signal</option>
                              <option value="gold">Gold Signal</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={prog.residencyExplorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-sky-600 hover:underline flex items-center gap-0.5"
                              title="Compare Step 2 & IV yield on Residency Explorer"
                            >
                              Explorer <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <a
                              href={prog.doximityUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                              title="Verified Resident Reviews on Doximity"
                            >
                              Doximity <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        {/* Advisor Strategic Notes */}
                        {prog.advisorNotes && (
                          <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 italic">
                            <strong className="text-slate-800 not-italic">Advisor:</strong> {prog.advisorNotes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Program Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddProgram}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Target Residency Program</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Residency Program Name</label>
              <input
                type="text"
                value={newProgName}
                onChange={(e) => setNewProgName(e.target.value)}
                placeholder="e.g. Johns Hopkins Hospital"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Baltimore"
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State (2-Letter)</label>
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="e.g. MD"
                  maxLength={2}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 uppercase font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as ProgramTier)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="reach">Reach</option>
                  <option value="target">Target</option>
                  <option value="safety">Safety</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Signal</label>
                <select
                  value={newSignal}
                  onChange={(e) => setNewSignal(e.target.value as SignalType)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="none">None</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Track</label>
                <select
                  value={newTrack}
                  onChange={(e) => setNewTrack(e.target.value as ApplicationTrack)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="categorical">Categorical</option>
                  <option value="preliminary">Preliminary</option>
                  <option value="pstp">PSTP</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
              >
                Save Program
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
