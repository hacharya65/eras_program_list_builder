'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SPECIALTY_SIGNALING_RULES,
  validateSignalAllocation,
  SchoolListItem,
  ProgramTier,
  SignalType,
  ApplicationTrack,
} from '@/domain/school-list-models';
import {
  computeSignalingRecommendation,
  SignalingRecommendation,
} from '@/domain/signaling-recommendation';
import {
  searchResidencyPrograms,
  ResidencyProgramRecord,
} from '@/domain/residency-database';
import { getAlumniByProgram } from '@/domain/alumni-models';
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
  CheckCircle2,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Info,
  HelpCircle,
  X,
  MapPin,
  Mail,
  Phone,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface SchoolListMatrixProps {
  specialty?: string;
  onBack: () => void;
}

const DEFAULT_ITEMS: SchoolListItem[] = [
  {
    id: 'item-1',
    programId: '1402421162',
    programName: 'Massachusetts General Hospital',
    specialty: 'Internal Medicine',
    city: 'Boston',
    state: 'MA',
    region: 'Northeast',
    programDirector: 'J. Kevin Tucker, MD',
    tier: 'reach',
    signal: 'gold',
    track: 'categorical',
    yieldNoSignal: 4,
    yieldSilver: 18,
    yieldGold: 48,
    advisorNotes: 'Strong research emphasis; Gold signal essential for out-of-region consideration.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org',
    doximityUrl: 'https://www.doximity.com/residency/programs/1402421162',
  },
  {
    id: 'item-2',
    programId: '1402421160',
    programName: 'Brigham and Women’s Hospital',
    specialty: 'Internal Medicine',
    city: 'Boston',
    state: 'MA',
    region: 'Northeast',
    programDirector: 'Maria A. Yialamas, MD',
    tier: 'reach',
    signal: 'gold',
    track: 'categorical',
    yieldNoSignal: 5,
    yieldSilver: 20,
    yieldGold: 45,
    advisorNotes: 'Strong applicant pool; Gold token yields +25% jump over Silver.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org',
    doximityUrl: 'https://www.doximity.com/residency/programs/1402421160',
  },
  {
    id: 'item-3',
    programId: '1405421430',
    programName: 'University of Washington',
    specialty: 'Internal Medicine',
    city: 'Seattle',
    state: 'WA',
    region: 'West',
    programDirector: 'Ken Steinberg, MD',
    tier: 'target',
    signal: 'silver',
    track: 'categorical',
    yieldNoSignal: 8,
    yieldSilver: 38,
    yieldGold: 42,
    advisorNotes: 'Silver signal captures bulk of yield (+30%); reserve Gold for top reach.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org',
    doximityUrl: 'https://www.doximity.com/residency/programs/1405421430',
  },
  {
    id: 'item-4',
    programId: '1401221105',
    programName: 'Emory University School of Medicine',
    specialty: 'Internal Medicine',
    city: 'Atlanta',
    state: 'GA',
    region: 'South',
    programDirector: 'Wendy Armstrong, MD',
    tier: 'target',
    signal: 'silver',
    track: 'categorical',
    yieldNoSignal: 6,
    yieldSilver: 30,
    yieldGold: 35,
    advisorNotes: 'Solid clinical training; Silver optimal allocation.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org',
    doximityUrl: 'https://www.doximity.com/residency/programs/1401221105',
  },
  {
    id: 'item-5',
    programId: '1402421175',
    programName: 'Tufts Medical Center',
    specialty: 'Internal Medicine',
    city: 'Boston',
    state: 'MA',
    region: 'Northeast',
    programDirector: 'Laura K. Snydman, MD',
    tier: 'safety',
    signal: 'none',
    track: 'categorical',
    yieldNoSignal: 42,
    yieldSilver: 52,
    yieldGold: 56,
    advisorNotes: 'Excellent home-region anchor; high baseline interview yield.',
    residencyExplorerUrl: 'https://www.residencyexplorer.org',
    doximityUrl: 'https://www.doximity.com/residency/programs/1402421175',
  },
];

const STORAGE_KEY = 'eras_school_list_matrix';

export function SchoolListMatrix({
  specialty = 'Internal Medicine',
  onBack,
}: SchoolListMatrixProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialty);

  // Rehydrate state safely from local storage
  const [items, setItems] = useState<SchoolListItem[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return DEFAULT_ITEMS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'tier' | 'region' | 'signal'>('tier');
  const [sortAsc, setSortAsc] = useState(true);

  // Database Ingestion / Browse Modal
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbRegionFilter, setDbRegionFilter] = useState('All');

  // Selected Program Details Modal
  const [detailItem, setDetailItem] = useState<SchoolListItem | null>(null);

  // Edit Yield Inline State
  const [editingYieldId, setEditingYieldId] = useState<string | null>(null);

  const signalStatus = validateSignalAllocation(selectedSpecialty, items);
  const rule = SPECIALTY_SIGNALING_RULES[selectedSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  const handleUpdateItem = (id: string, updates: Partial<SchoolListItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddFromDatabase = (prog: ResidencyProgramRecord) => {
    // Check if already in list
    if (items.some((i) => i.programName.toLowerCase() === prog.name.toLowerCase())) {
      alert(`"${prog.name}" is already in your School List.`);
      return;
    }

    const newItem: SchoolListItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      programId: prog.id,
      programName: prog.name,
      specialty: prog.specialty,
      city: prog.city,
      state: prog.state,
      region: prog.region,
      programDirector: prog.programDirector,
      tier: 'target',
      signal: 'none',
      track: 'categorical',
      yieldNoSignal: 8,
      yieldSilver: 25,
      yieldGold: 40,
      residencyExplorerUrl: prog.residencyExplorerUrl || 'https://www.residencyexplorer.org',
      doximityUrl: prog.doximityUrl || 'https://www.doximity.com/residency',
    };

    setItems((prev) => [newItem, ...prev]);
    setShowBrowseModal(false);
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (regionFilter !== 'All' && item.region !== regionFilter) return false;
        if (tierFilter !== 'All' && item.tier !== tierFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.programName.toLowerCase().includes(q);
          const matchCity = item.city?.toLowerCase().includes(q);
          const matchState = item.state?.toLowerCase().includes(q);
          const matchDir = item.programDirector?.toLowerCase().includes(q);
          if (!matchName && !matchCity && !matchState && !matchDir) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = '';
        let valB = '';
        if (sortField === 'name') {
          valA = a.programName;
          valB = b.programName;
        } else if (sortField === 'tier') {
          const tierWeight: Record<ProgramTier, number> = { reach: 1, target: 2, safety: 3 };
          return sortAsc ? tierWeight[a.tier] - tierWeight[b.tier] : tierWeight[b.tier] - tierWeight[a.tier];
        } else if (sortField === 'region') {
          valA = a.region || '';
          valB = b.region || '';
        } else if (sortField === 'signal') {
          const signalWeight: Record<SignalType, number> = { gold: 1, silver: 2, none: 3 };
          return sortAsc ? signalWeight[a.signal] - signalWeight[b.signal] : signalWeight[b.signal] - signalWeight[a.signal];
        }
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
  }, [items, regionFilter, tierFilter, searchQuery, sortField, sortAsc]);

  // Database search results for modal
  const dbResults = useMemo(() => {
    if (!showBrowseModal) return [];
    return searchResidencyPrograms({
      specialty: selectedSpecialty,
      region: dbRegionFilter !== 'All' ? dbRegionFilter : undefined,
      search: dbSearchQuery,
      limit: 30,
    });
  }, [showBrowseModal, selectedSpecialty, dbRegionFilter, dbSearchQuery]);

  // Tier counts
  const reachCount = items.filter((i) => i.tier === 'reach').length;
  const targetCount = items.filter((i) => i.tier === 'target').length;
  const safetyCount = items.filter((i) => i.tier === 'safety').length;

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
                {items.length} Programs Tracked
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Universal ACGME Database &bull; Dynamic Signaling Optimization &bull; Reach / Target / Safety Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Specialty Selector Dropdown */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          >
            {Object.keys(SPECIALTY_SIGNALING_RULES).map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          {/* Add Program from Universal Database */}
          <button
            onClick={() => setShowBrowseModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Browse &amp; Add Programs</span>
          </button>
        </div>
      </div>

      {/* Specialty Signaling Quotas & Balance Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gold Signals Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-500" />
              Gold Signals
            </span>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {signalStatus.goldUsed} / {rule.goldSignals} Used
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {signalStatus.goldRemaining} Remaining
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                signalStatus.goldUsed > rule.goldSignals ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min((signalStatus.goldUsed / (rule.goldSignals || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Silver Signals Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-4 h-4 text-slate-400" />
              Silver Signals
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {signalStatus.silverUsed} / {rule.silverSignals} Used
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {signalStatus.silverRemaining} Remaining
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                signalStatus.silverUsed > rule.silverSignals ? 'bg-red-500' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.min((signalStatus.silverUsed / (rule.silverSignals || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Tier Distribution Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              Tier Balance
            </span>
            <span className="text-xs text-slate-500">{items.length} Total</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
              {reachCount} Reach
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-100 text-sky-800">
              {targetCount} Target
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
              {safetyCount} Safety
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Recommended ratio: ~25% Reach, ~50% Target, ~25% Safety
          </p>
        </div>

        {/* Quota Compliance Alert Card */}
        <div
          className={`p-4 rounded-xl border shadow-sm flex items-center gap-3 ${
            signalStatus.valid
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {signalStatus.valid ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold">Signaling Quota Compliant</div>
                <div className="text-[11px] text-emerald-700">
                  {signalStatus.totalRemaining} tokens unassigned in {selectedSpecialty}.
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <div className="text-xs font-bold">Quota Limit Exceeded!</div>
                <div className="text-[11px] text-red-700">
                  {signalStatus.errors[0]}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by program name, city, state, or director..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Region:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Regions</option>
              <option value="Northeast">Northeast</option>
              <option value="Midwest">Midwest</option>
              <option value="South">South</option>
              <option value="West">West</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Tiers</option>
              <option value="reach">Reach</option>
              <option value="target">Target</option>
              <option value="safety">Safety</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-semibold">Sort:</span>
          <button
            onClick={() => {
              if (sortField === 'tier') setSortAsc(!sortAsc);
              else {
                setSortField('tier');
                setSortAsc(true);
              }
            }}
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${
              sortField === 'tier' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            Tier {sortField === 'tier' ? (sortAsc ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => {
              if (sortField === 'name') setSortAsc(!sortAsc);
              else {
                setSortField('name');
                setSortAsc(true);
              }
            }}
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${
              sortField === 'name' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            Name {sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => {
              if (sortField === 'region') setSortAsc(!sortAsc);
              else {
                setSortField('region');
                setSortAsc(true);
              }
            }}
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${
              sortField === 'region' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            Region {sortField === 'region' ? (sortAsc ? '↑' : '↓') : ''}
          </button>
          <button
            onClick={() => {
              if (sortField === 'signal') setSortAsc(!sortAsc);
              else {
                setSortField('signal');
                setSortAsc(true);
              }
            }}
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${
              sortField === 'signal' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            Signal {sortField === 'signal' ? (sortAsc ? '↑' : '↓') : ''}
          </button>
        </div>
      </div>

      {/* Row-Based Table Matrix View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">Program &amp; Location</th>
                <th className="py-3 px-3 w-32">Tier</th>
                <th className="py-3 px-3 w-40">ERAS Signal</th>
                <th className="py-3 px-4">Signaling Strategy Recommendation (Ticket 15)</th>
                <th className="py-3 px-3 w-28">Track</th>
                <th className="py-3 px-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No residency programs match your search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const recommendation = computeSignalingRecommendation(
                    item.yieldNoSignal,
                    item.yieldSilver,
                    item.yieldGold
                  );

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* # Number */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-xs">
                        {index + 1}
                      </td>

                      {/* Program Name & Location */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                          {item.programName}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.city}, {item.state}
                          </span>
                          {item.region && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                              {item.region}
                            </span>
                          )}
                          {item.programDirector && (
                            <span className="truncate max-w-[180px]">
                              PD: {item.programDirector.replace('\n', ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tier Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={item.tier}
                          onChange={(e) => handleUpdateItem(item.id, { tier: e.target.value as ProgramTier })}
                          className={`w-full p-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                            item.tier === 'reach'
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : item.tier === 'target'
                              ? 'bg-sky-50 text-sky-900 border-sky-200'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          }`}
                        >
                          <option value="reach">Reach</option>
                          <option value="target">Target</option>
                          <option value="safety">Safety</option>
                        </select>
                      </td>

                      {/* Signal Button Toggles */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { signal: item.signal === 'gold' ? 'none' : 'gold' })}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all border ${
                              item.signal === 'gold'
                                ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Assign Gold Signal"
                          >
                            Gold
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { signal: item.signal === 'silver' ? 'none' : 'silver' })}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all border ${
                              item.signal === 'silver'
                                ? 'bg-slate-300 text-slate-900 border-slate-400 shadow-xs'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Assign Silver Signal"
                          >
                            Silver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { signal: 'none' })}
                            className={`px-2 py-1 rounded text-xs transition-all border ${
                              item.signal === 'none'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                            }`}
                            title="No Signal"
                          >
                            None
                          </button>
                        </div>
                      </td>

                      {/* Signaling Strategy Recommendation (Ticket 15) */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] border ${recommendation.badgeClass}`}>
                              {recommendation.label}
                            </span>

                            {item.yieldNoSignal !== undefined && (
                              <span className="text-[11px] font-mono text-slate-500">
                                Yield: {item.yieldNoSignal}% ➔ {item.yieldSilver}% ➔ {item.yieldGold}%
                              </span>
                            )}

                            <button
                              onClick={() => setEditingYieldId(editingYieldId === item.id ? null : item.id)}
                              className="text-[10px] text-sky-600 hover:underline font-semibold"
                            >
                              {editingYieldId === item.id ? 'Done' : 'Edit Yield'}
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-snug">
                            {recommendation.explanation}
                          </p>

                          {/* Inline Yield Input Box */}
                          {editingYieldId === item.id && (
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3 text-xs mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500">No Signal:</span>
                                <input
                                  type="number"
                                  value={item.yieldNoSignal ?? ''}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, {
                                      yieldNoSignal: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                  }
                                  className="w-14 p-1 rounded border font-mono text-xs"
                                  placeholder="%"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500">Silver:</span>
                                <input
                                  type="number"
                                  value={item.yieldSilver ?? ''}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, {
                                      yieldSilver: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                  }
                                  className="w-14 p-1 rounded border font-mono text-xs"
                                  placeholder="%"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500">Gold:</span>
                                <input
                                  type="number"
                                  value={item.yieldGold ?? ''}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, {
                                      yieldGold: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                  }
                                  className="w-14 p-1 rounded border font-mono text-xs"
                                  placeholder="%"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Track Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={item.track}
                          onChange={(e) => handleUpdateItem(item.id, { track: e.target.value as ApplicationTrack })}
                          className="w-full p-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                        >
                          <option value="categorical">Categorical</option>
                          <option value="preliminary">Preliminary</option>
                          <option value="pstp">PSTP / Research</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Program Details &amp; Alumni"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from School List"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Database Ingestion / Browse Modal (Ticket 14) */}
      {showBrowseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Universal Residency Database (4,039 ACGME Programs)
                </h3>
                <p className="text-xs text-slate-500">
                  Search across verified accredited programs to add directly to your school list.
                </p>
              </div>
              <button
                onClick={() => setShowBrowseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  placeholder="Search programs by name, hospital, city, or director..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={dbRegionFilter}
                onChange={(e) => setDbRegionFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="All">All Regions</option>
                <option value="Northeast">Northeast</option>
                <option value="Midwest">Midwest</option>
                <option value="South">South</option>
                <option value="West">West</option>
              </select>
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 min-h-[300px]">
              {dbResults.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No programs found matching "{dbSearchQuery}". Try another keyword or change region.
                </div>
              ) : (
                dbResults.map((prog) => {
                  const isAdded = items.some((i) => i.programName.toLowerCase() === prog.name.toLowerCase());
                  return (
                    <div
                      key={prog.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:border-sky-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{prog.name}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                            {prog.region}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                          <span>{prog.city}, {prog.state}</span>
                          {prog.programDirector && (
                            <span className="truncate">PD: {prog.programDirector.replace('\n', ' ')}</span>
                          )}
                          {prog.offersPreliminary && (
                            <span className="text-emerald-700 font-semibold">&bull; Offers Prelim</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddFromDatabase(prog)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                          isAdded
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                        }`}
                      >
                        {isAdded ? 'Added' : '+ Add to List'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>Showing up to 30 matching programs</span>
              <button
                onClick={() => setShowBrowseModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program Details Drawer / Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {detailItem.specialty} &bull; {detailItem.region || 'US'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{detailItem.programName}</h3>
                <p className="text-xs text-slate-500">{detailItem.city}, {detailItem.state}</p>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div>
                  <strong className="text-slate-700">Program Director:</strong>{' '}
                  <span className="text-slate-900">{detailItem.programDirector || 'Department Leadership'}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Current Tier:</strong>{' '}
                  <span className="capitalize font-bold text-slate-900">{detailItem.tier}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Current Assigned Signal:</strong>{' '}
                  <span className="capitalize font-bold text-slate-900">{detailItem.signal}</span>
                </div>
              </div>

              {/* Verified School Alumni */}
              {(() => {
                const alumni = getAlumniByProgram(detailItem.programName);
                return (
                  <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 space-y-1.5">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      Apex Medical School Alumni Network ({alumni.length} Matches)
                    </div>
                    {alumni.length > 0 ? (
                      <ul className="text-[11px] text-indigo-800 space-y-1">
                        {alumni.map((a) => (
                          <li key={a.id}>
                            &bull; <strong>{a.name}</strong> (Class of {a.graduationYear}) - {a.specialty} ({a.currentPgy})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-indigo-700">
                        No recent historical matches on file for this specific program.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* External Links */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={detailItem.residencyExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Residency Explorer
                </a>
                <a
                  href={detailItem.doximityUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Doximity Page
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
