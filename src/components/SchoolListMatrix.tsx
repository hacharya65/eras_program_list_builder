'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SPECIALTY_SIGNALING_RULES,
  validateSignalAllocation,
  SchoolListItem,
  ProgramTier,
  SignalType,
  ApplicationTrack,
  evaluateProgramTier,
  parseScoreRange,
  getStoredApplicantStep2Ck,
  CANONICAL_SPECIALTIES,
  setStoredTargetSpecialty,
  loadItemsForSpecialty,
  getStorageKeyForSpecialty,
  DEFAULT_INTERNAL_MEDICINE_SAMPLE_ITEMS,
} from '@/domain/school-list-models';
import {
  computeSignalingRecommendation,
  SignalingRecommendation,
} from '@/domain/signaling-recommendation';
import {
  searchResidencyPrograms,
  ResidencyProgramRecord,
  CENSUS_DIVISIONS,
  formatProgramDisplayName,
} from '@/domain/residency-database';
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
import {
  loadProgramLetterRequirements,
  saveProgramLetterRequirements,
  loadLetterWriterRequests,
  analyzeProgramLetterGaps,
  ProgramLetterRequirement,
  LetterWriterRequest,
} from '@/domain/lor-models';

interface SchoolListMatrixProps {
  specialty?: string;
  studentId?: string;
  onBack: () => void;
  onNavigateToLetters?: () => void;
}

const DEFAULT_ITEMS: SchoolListItem[] = DEFAULT_INTERNAL_MEDICINE_SAMPLE_ITEMS;

const STORAGE_KEY = 'eras_school_list_matrix';

export function SchoolListMatrix({
  specialty = 'Internal Medicine',
  studentId,
  onBack,
  onNavigateToLetters,
}: SchoolListMatrixProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialty);

  // Applicant baseline Step 2 CK score (Ticket Candidate 8)
  const [applicantStep2Ck, setApplicantStep2Ck] = useState<number>(() => getStoredApplicantStep2Ck());

  // Rehydrate state safely from local storage or auto-populate consistent sample programs
  const [items, setItems] = useState<SchoolListItem[]>(() => {
    return loadItemsForSpecialty(specialty, getStoredApplicantStep2Ck(), studentId);
  });

  // Sync if parent prop changes
  useEffect(() => {
    if (specialty && specialty !== selectedSpecialty) {
      setSelectedSpecialty(specialty);
      setDbSpecialtyFilter(specialty);
      setItems(loadItemsForSpecialty(specialty, applicantStep2Ck, studentId));
    }
  }, [specialty, applicantStep2Ck, studentId]);

  // Sync if global target specialty updates
  useEffect(() => {
    const handleSpecialtyUpdated = (e: any) => {
      if (e.detail && typeof e.detail === 'string' && e.detail !== selectedSpecialty) {
        setSelectedSpecialty(e.detail);
        setDbSpecialtyFilter(e.detail);
        setItems(loadItemsForSpecialty(e.detail, applicantStep2Ck, studentId));
      }
    };
    window.addEventListener('applicant_specialty_updated', handleSpecialtyUpdated);
    return () => window.removeEventListener('applicant_specialty_updated', handleSpecialtyUpdated);
  }, [selectedSpecialty, applicantStep2Ck, studentId]);

  useEffect(() => {
    const handleScoreUpdate = (e: any) => {
      if (e.detail && !isNaN(Number(e.detail))) {
        setApplicantStep2Ck(Number(e.detail));
      }
    };
    window.addEventListener('applicant_step2_ck_updated', handleScoreUpdate);
    return () => window.removeEventListener('applicant_step2_ck_updated', handleScoreUpdate);
  }, []);

  // Re-evaluate tier dynamically whenever applicant Step 2 CK score changes (Ticket Candidate 8)
  useEffect(() => {
    setItems((prevItems) => {
      let changed = false;
      const updated = prevItems.map((item) => {
        let min = item.step2Min;
        let max = item.step2Max;
        if ((min === undefined || max === undefined) && item.step2ScoreRange) {
          const p = parseScoreRange(item.step2ScoreRange);
          if (p.min !== undefined && p.max !== undefined) {
            min = p.min;
            max = p.max;
          }
        }
        const dynamicTier = evaluateProgramTier(applicantStep2Ck, min, max);
        if (dynamicTier && dynamicTier !== item.tier) {
          changed = true;
          return { ...item, step2Min: min, step2Max: max, tier: dynamicTier };
        }
        if (min !== item.step2Min || max !== item.step2Max) {
          changed = true;
          return { ...item, step2Min: min, step2Max: max };
        }
        return item;
      });
      return changed ? updated : prevItems;
    });
  }, [applicantStep2Ck]);

  useEffect(() => {
    if (typeof window !== 'undefined' && items && items.length > 0) {
      const storageKey = getStorageKeyForSpecialty(selectedSpecialty, studentId);
      localStorage.setItem(storageKey, JSON.stringify(items));
      if (selectedSpecialty === 'Internal Medicine') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    }
  }, [items, selectedSpecialty, studentId]);

  const handleSpecialtyChange = (newSpecialty: string) => {
    setSelectedSpecialty(newSpecialty);
    setStoredTargetSpecialty(newSpecialty);
    setDbSpecialtyFilter(newSpecialty);
    const loaded = loadItemsForSpecialty(newSpecialty, applicantStep2Ck, studentId);
    setItems(loaded);
  };

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
  const [dbSpecialtyFilter, setDbSpecialtyFilter] = useState(selectedSpecialty);

  useEffect(() => {
    setDbSpecialtyFilter(selectedSpecialty);
  }, [selectedSpecialty, showBrowseModal]);

  // Selected Program Details Modal
  const [detailItem, setDetailItem] = useState<SchoolListItem | null>(null);

  // Edit Yield Inline State
  const [editingYieldId, setEditingYieldId] = useState<string | null>(null);

  // Automated Tiering Information Modal State
  const [showTieringInfoModal, setShowTieringInfoModal] = useState(false);

  // Yield Rates & Strategy Information Modal State
  const [showStrategyInfoModal, setShowStrategyInfoModal] = useState(false);

  // LOR Requirements Educational Modal State
  const [showLorInfoModal, setShowLorInfoModal] = useState(false);

  // LOR Requirements & Letter Writers State
  const [lorRequirements, setLorRequirements] = useState<Record<string, ProgramLetterRequirement>>(() =>
    loadProgramLetterRequirements()
  );
  const [letterWriters, setLetterWriters] = useState<LetterWriterRequest[]>(() =>
    loadLetterWriterRequests(studentId)
  );

  useEffect(() => {
    setLorRequirements(loadProgramLetterRequirements());
    setLetterWriters(loadLetterWriterRequests(studentId));
  }, [studentId]);

  useEffect(() => {
    const handleSync = () => {
      setLorRequirements(loadProgramLetterRequirements());
      setLetterWriters(loadLetterWriterRequests(studentId));
    };
    window.addEventListener('program_lor_requirements_updated', handleSync);
    window.addEventListener('letter_writers_updated', handleSync);
    return () => {
      window.removeEventListener('program_lor_requirements_updated', handleSync);
      window.removeEventListener('letter_writers_updated', handleSync);
    };
  }, [studentId]);

  const handleUpdateLorRequired = (programId: string, count: number) => {
    const updatedCount = Math.max(1, count);
    const updated = {
      ...lorRequirements,
      [programId]: {
        programId,
        requiredLettersCount: updatedCount,
        checkedDate: new Date().toLocaleDateString(),
      },
    };
    setLorRequirements(updated);
    saveProgramLetterRequirements(updated);
  };

  const handleGoToLetters = () => {
    if (onNavigateToLetters) {
      onNavigateToLetters();
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'letters');
      window.history.pushState({ view: 'letters' }, '', url.toString());
      window.dispatchEvent(new CustomEvent('navigate_to_letters'));
    }
  };

  const signalStatus = validateSignalAllocation(selectedSpecialty, items);
  const rule = SPECIALTY_SIGNALING_RULES[selectedSpecialty] || SPECIALTY_SIGNALING_RULES['Internal Medicine'];

  const handleUpdateItem = (id: string, updates: Partial<SchoolListItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleStep2RangeChange = (id: string, newMin?: number, newMax?: number) => {
    const autoTier = evaluateProgramTier(applicantStep2Ck, newMin, newMax);
    const rangeStr = newMin !== undefined && newMax !== undefined
      ? `${newMin} - ${newMax}`
      : newMin !== undefined
        ? `${newMin}+`
        : newMax !== undefined
          ? `< ${newMax}`
          : '';

    handleUpdateItem(id, {
      step2Min: newMin,
      step2Max: newMax,
      step2ScoreRange: rangeStr,
      ...(autoTier ? { tier: autoTier } : {}),
    });
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddFromDatabase = (prog: ResidencyProgramRecord) => {
    const displayName = formatProgramDisplayName(prog);

    // Check if already in list by ACGME ID or unique display name + location
    const isAlreadyAdded = items.some(
      (i) =>
        (i.programId && (i.programId === prog.id || i.programId === prog.programNumber)) ||
        (i.programNumber && (i.programNumber === prog.id || i.programNumber === prog.programNumber)) ||
        (i.programName.toLowerCase() === displayName.toLowerCase() &&
          i.city?.toLowerCase() === prog.city?.toLowerCase() &&
          i.state?.toLowerCase() === prog.state?.toLowerCase())
    );

    if (isAlreadyAdded) {
      alert(`"${displayName}" is already in your School List.`);
      return;
    }

    const minScore = prog.step2CkLow !== undefined ? prog.step2CkLow : 240;
    const maxScore = prog.step2CkHigh !== undefined ? prog.step2CkHigh : 260;
    const scoreRangeStr = prog.step2ScoreRange || `${minScore} - ${maxScore}`;
    const initialTier = evaluateProgramTier(applicantStep2Ck, minScore, maxScore) || 'target';

    const newItem: SchoolListItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      programId: prog.id,
      programNumber: prog.programNumber || prog.id,
      programName: displayName,
      specialty: prog.specialty,
      city: prog.city,
      state: prog.state,
      region: prog.region,
      address: prog.address,
      programDirector: prog.programDirector,
      step2ScoreRange: scoreRangeStr,
      step2Min: minScore,
      step2Max: maxScore,
      tier: initialTier,
      signal: 'none',
      yieldNoSignal: prog.noSignal,
      yieldSilver: prog.silverSignal,
      yieldGold: prog.goldSignal,
      level2CeRange: prog.level2CeRange,
      mdApplicantYield: prog.mdApplicantYield,
      residencyExplorerUrl: prog.residencyExplorerUrl || 'https://www.residencyexplorer.org/?utm_source=gemini',
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
          const displayName = formatProgramDisplayName(item);
          const matchName = item.programName.toLowerCase().includes(q) || displayName.toLowerCase().includes(q);
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
      specialty: dbSpecialtyFilter !== 'All' ? dbSpecialtyFilter : undefined,
      region: dbRegionFilter !== 'All' ? dbRegionFilter : undefined,
      search: dbSearchQuery,
      limit: 40,
    });
  }, [showBrowseModal, dbSpecialtyFilter, dbRegionFilter, dbSearchQuery]);

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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Declared Specialty Badge (Locked) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-xs">
            <span className="text-slate-600 font-bold whitespace-nowrap">Specialty:</span>
            <span className="font-bold text-slate-900">{selectedSpecialty}</span>
            {rule.explanationRequired && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 ml-1 whitespace-nowrap">
                Explanation Req (300 chars)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Specialty Signaling Quotas & Balance Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {rule.signalType === 'single_tier' ? (
          <>
            {/* Single-Tier Program Signals Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-4 h-4 text-sky-600" />
                  Program Signals
                </span>
                <span className="text-xs font-mono font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {signalStatus.silverUsed} / {rule.totalSignals} Used
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {signalStatus.silverRemaining} Remaining
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${signalStatus.silverUsed > rule.totalSignals ? 'bg-red-500' : 'bg-sky-600'
                    }`}
                  style={{ width: `${Math.min((signalStatus.silverUsed / (rule.totalSignals || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Explanation Requirement Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-4 h-4 text-slate-500" />
                  Signal Explanation
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rule.explanationRequired
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                  {rule.explanationRequired ? 'Required (300 chars)' : 'Not Required'}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {rule.explanationRequired ? '300-Char Narrative Required' : 'Standard Submission'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {rule.explanationRequired
                  ? `Each signal requires a brief rationale (${rule.explanationMaxChars || 300} chars max).`
                  : 'Tokens submitted directly without essay justifications.'}
              </p>
            </div>
          </>
        ) : (
          <>
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
                  className={`h-full rounded-full ${signalStatus.goldUsed > rule.goldSignals ? 'bg-red-500' : 'bg-amber-500'
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
                  className={`h-full rounded-full ${signalStatus.silverUsed > rule.silverSignals ? 'bg-red-500' : 'bg-slate-400'
                    }`}
                  style={{ width: `${Math.min((signalStatus.silverUsed / (rule.silverSignals || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}

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
          className={`p-4 rounded-xl border shadow-sm flex items-center gap-3 ${signalStatus.valid
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
                  {rule.explanationRequired && ' (300-char explanation required)'}
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

          {/* Browse & Add Programs Button positioned directly beside search bar */}
          <button
            onClick={() => setShowBrowseModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Browse &amp; Add Programs</span>
          </button>

          {/* Region Filter (9 US Census Divisions) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Census Division:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All 9 Census Divisions</option>
              {CENSUS_DIVISIONS.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
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
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${sortField === 'tier' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
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
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${sortField === 'name' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
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
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${sortField === 'region' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
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
            className={`px-2.5 py-1 rounded border text-xs font-semibold ${sortField === 'signal' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
          >
            Signal {sortField === 'signal' ? (sortAsc ? '↑' : '↓') : ''}
          </button>
        </div>
      </div>

      {/* Pinned Visual Key & Real-Time Tier Balance Summary Bar (Item 14) */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            Tier Balance Key:
          </span>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
              <Compass className="w-3.5 h-3.5 text-purple-600" />
              <span>Reach: <strong className="font-mono text-purple-900">{reachCount}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
              <Target className="w-3.5 h-3.5 text-sky-600" />
              <span>Target: <strong className="font-mono text-sky-900">{targetCount}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safety: <strong className="font-mono text-emerald-900">{safetyCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Real-time Applicant Baseline Score and Dynamic Tiering Indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
            <span className="text-slate-500 font-medium">Applicant Step 2 CK:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{applicantStep2Ck}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">(Baseline)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTieringInfoModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Click to learn how the Automated Tiering System works"
          >
            <span>Automated Tiering System</span>
            <Info className="w-3.5 h-3.5 text-sky-600" />
          </button>
        </div>
      </div>

      {/* Row-Based Table Matrix View (No Horizontal Scroll Layout) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3 w-[22%]">Program &amp; Metadata</th>
                <th className="py-2.5 px-3 w-[19%]">
                  <div className="flex items-center justify-between">
                    <span>ERAS Signal</span>
                    {rule.explanationRequired && (
                      <span className="text-[10px] lowercase font-normal text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {rule.explanationMaxChars || 300} char rationale
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3 w-[14%]">
                  <div className="flex items-center gap-1.5">
                    <a
                      href="https://www.residencyexplorer.org/?utm_source=gemini"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-sky-700 font-bold hover:underline"
                      title="Lookup Middle 80% Range on Residency Explorer"
                    >
                      <span>Step 2 CK &amp; Tier</span>
                      <ExternalLink className="w-3 h-3 text-sky-600" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowTieringInfoModal(true)}
                      className="text-slate-400 hover:text-sky-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="How 80% Range Decides Target, Safety, & Reach Tiering"
                      aria-label="How 80% Range Decides Target, Safety, & Reach Tiering"
                    >
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-[14%]">
                  <div className="flex items-center gap-1.5">
                    <span>Letters of Rec</span>
                    <button
                      type="button"
                      onClick={() => setShowLorInfoModal(true)}
                      className="text-slate-400 hover:text-sky-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="Program LOR Requirements Guidance"
                      aria-label="Program LOR Requirements Guidance"
                    >
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-[25%]">
                  <div className="flex items-center gap-1.5">
                    <a
                      href="https://www.residencyexplorer.org/?utm_source=gemini"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-sky-700 font-bold hover:underline"
                      title="Lookup Interview Yield Rates on Residency Explorer"
                    >
                      <span>Yield Rates &amp; Strategy</span>
                      <ExternalLink className="w-3 h-3 text-sky-600" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowStrategyInfoModal(true)}
                      className="text-slate-400 hover:text-sky-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="How Signaling Recommendations are Calculated"
                      aria-label="How Signaling Recommendations are Calculated"
                    >
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-2 text-right w-[6%]">Actions</th>
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
                    item.yieldGold,
                    rule.signalType
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

                      {/* Program Name & Metadata */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors leading-tight">
                            {formatProgramDisplayName(item) || item.programName}
                          </div>
                          <span className="font-mono text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            #{item.programNumber || item.programId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                          <div
                            className="flex items-center gap-1.5 text-slate-600 truncate max-w-[300px]"
                            title={item.city && item.state ? `${item.city}, ${item.state}` : (item.city || item.state || 'Location Unknown')}
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {item.city && item.state ? `${item.city}, ${item.state}` : (item.city || item.state || 'Location Unknown')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {item.region && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 font-bold text-[9px] border border-sky-200">
                                {item.region}
                              </span>
                            )}
                            {item.programDirector && (
                              <span className="truncate max-w-[180px] text-[10px] text-slate-500">
                                PD: {item.programDirector.replace('\n', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Signal Button Toggles + Integrated Explanation */}
                      <td className="py-2.5 px-3 align-top">
                        {rule.signalType === 'single_tier' ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(item.id, { signal: item.signal === 'silver' ? 'none' : 'silver' })}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-all border ${item.signal === 'silver'
                                  ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                }`}
                              title={item.signal === 'silver' ? 'Remove Program Signal' : 'Assign Program Signal'}
                            >
                              {item.signal === 'silver' ? '✓ Signaled' : '+ Signal'}
                            </button>
                            {item.signal !== 'none' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.id, { signal: 'none' })}
                                className="px-1.5 py-1 rounded text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Clear Signal"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(item.id, { signal: item.signal === 'gold' ? 'none' : 'gold' })}
                              className={`px-2 py-1 rounded text-xs font-bold transition-all border ${item.signal === 'gold'
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
                              className={`px-2 py-1 rounded text-xs font-bold transition-all border ${item.signal === 'silver'
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
                              className={`px-2 py-1 rounded text-xs transition-all border ${item.signal === 'none'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                }`}
                              title="No Signal"
                            >
                              None
                            </button>
                          </div>
                        )}

                        {/* Integrated Signal Explanation (Embedded without extra column width) */}
                        {rule.explanationRequired && (
                          <div className="mt-2 space-y-1">
                            <textarea
                              rows={2}
                              maxLength={rule.explanationMaxChars || 300}
                              value={item.signalExplanation || ''}
                              onChange={(e) => {
                                const val = e.target.value.slice(0, rule.explanationMaxChars || 300);
                                handleUpdateItem(item.id, { signalExplanation: val });
                              }}
                              placeholder={
                                item.signal !== 'none'
                                  ? `Signal rationale (${rule.explanationMaxChars || 300} chars max)...`
                                  : 'Add rationale (if signaled)...'
                              }
                              className={`w-full p-1.5 text-[11px] rounded border transition-all focus:outline-none focus:ring-1 ${item.signal !== 'none' && !item.signalExplanation?.trim()
                                  ? 'border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'
                                  : 'border-slate-200 bg-white focus:border-sky-500 focus:ring-sky-500'
                                }`}
                            />
                            <div className="flex items-center justify-between text-[10px]">
                              {item.signal !== 'none' && !item.signalExplanation?.trim() ? (
                                <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                  Rationale required
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  {item.signal !== 'none' ? 'Saved' : 'Applies with signal'}
                                </span>
                              )}
                              <span
                                className={`font-mono ${(item.signalExplanation?.length || 0) >= (rule.explanationMaxChars || 300)
                                    ? 'text-amber-700 font-bold'
                                    : 'text-slate-400'
                                  }`}
                              >
                                {item.signalExplanation?.length || 0}/{rule.explanationMaxChars || 300}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Step 2 CK Dual Input, Automated Tier Icon */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs w-fit">
                            <input
                              type="number"
                              min={180}
                              max={300}
                              placeholder="Low"
                              value={item.step2Min !== undefined ? item.step2Min : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                const newMin = isNaN(val as number) ? undefined : val;
                                handleStep2RangeChange(item.id, newMin, item.step2Max);
                              }}
                              className="w-12 px-1 py-0.5 text-xs text-center font-mono font-bold rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                              title="Middle 80% LOW Step 2 CK Score (Residency Explorer)"
                            />
                            <span className="text-slate-400 font-mono text-xs">–</span>
                            <input
                              type="number"
                              min={180}
                              max={300}
                              placeholder="High"
                              value={item.step2Max !== undefined ? item.step2Max : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                const newMax = isNaN(val as number) ? undefined : val;
                                handleStep2RangeChange(item.id, item.step2Min, newMax);
                              }}
                              className="w-12 px-1 py-0.5 text-xs text-center font-mono font-bold rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                              title="Middle 80% HIGH Step 2 CK Score (Residency Explorer)"
                            />
                          </div>

                          {/* Dynamic Compact Tier Icon */}
                          <div>
                            {item.step2Min !== undefined && item.step2Max !== undefined ? (
                              item.tier === 'safety' ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                                  title={`Safety: Applicant score (${applicantStep2Ck}) > Middle 80% High (${item.step2Max})`}
                                >
                                  <Shield className="w-3 h-3 text-emerald-600" />
                                  <span>Safety</span>
                                </span>
                              ) : item.tier === 'target' ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs"
                                  title={`Target: Applicant score (${applicantStep2Ck}) is within Middle 80% range (${item.step2Min}–${item.step2Max})`}
                                >
                                  <Target className="w-3 h-3 text-sky-600" />
                                  <span>Target</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs"
                                  title={`Reach: Applicant score (${applicantStep2Ck}) < Middle 80% Low (${item.step2Min})`}
                                >
                                  <Compass className="w-3 h-3 text-purple-600" />
                                  <span>Reach</span>
                                </span>
                              )
                            ) : (
                              <a
                                href="https://www.residencyexplorer.org/?utm_source=gemini"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-sky-600 hover:text-sky-800 italic hover:underline inline-flex items-center gap-0.5"
                                title="Enter Middle 80% Low & High from Residency Explorer"
                              >
                                <span>Lookup Range</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Letters of Recommendation Column */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1.5">
                          {/* Input for Required Letters */}
                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs w-fit">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-0.5">
                              Req:
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={lorRequirements[item.id]?.requiredLettersCount ?? 3}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  handleUpdateLorRequired(item.id, val);
                                }
                              }}
                              className="w-10 px-1 py-0.5 text-xs text-center font-mono font-bold rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                              title="Enter required letters count based on program website (default: 3)"
                            />
                            <span className="text-[10px] text-slate-400 pr-1">letters</span>
                          </div>

                          {/* Gap Status Badge */}
                          <div>
                            {(() => {
                              const lorGap = analyzeProgramLetterGaps(item.id, letterWriters, lorRequirements);
                              if (lorGap.isSatisfied) {
                                return (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                                    title={`${lorGap.assignedCount} of ${lorGap.requiredCount} letters assigned (${lorGap.submittedCount} submitted)`}
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{lorGap.assignedCount}/{lorGap.requiredCount} Assigned</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs"
                                    title={`Shortage: Need ${lorGap.gapCount} more letter writer assigned (${lorGap.assignedCount}/${lorGap.requiredCount})`}
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>{lorGap.gapCount} Needed ({lorGap.assignedCount}/{lorGap.requiredCount})</span>
                                  </span>
                                );
                              }
                            })()}
                          </div>

                          {/* Link to LOR Tracking page */}
                          <div>
                            <button
                              type="button"
                              onClick={handleGoToLetters}
                              className="text-[10px] text-sky-700 hover:text-sky-900 font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              title="Assign writers and view gaps in Letter of Recommendation Tracker"
                            >
                              <span>LOR Tracker</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Yield Rates & Strategy (Consolidated to prevent horizontal scrolling) */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1.5">
                          {/* If not entered yet */}
                          {item.yieldNoSignal === undefined &&
                            item.yieldSilver === undefined &&
                            (rule.signalType === 'single_tier' || item.yieldGold === undefined) ? (
                            <button
                              onClick={() => setEditingYieldId(editingYieldId === item.id ? null : item.id)}
                              className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-md border border-sky-200 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-sky-600" />
                              + Enter Yield Rates (Residency Explorer)
                            </button>
                          ) : (
                            <div className="space-y-1">
                              {/* Multiplier Badges + Strategy Label */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {rule.signalType === 'single_tier' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-sky-900 text-white shadow-2xs">
                                    <Award className="w-3 h-3 text-sky-200" />
                                    <span>{recommendation.signalMultiplier || recommendation.silverMultiplier || '1.0x'}</span>
                                    <span className="text-sky-200 text-[10px] font-bold">Signal</span>
                                  </span>
                                ) : (
                                  <>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-black bg-slate-900 text-white shadow-2xs">
                                      <Award className="w-3 h-3 text-slate-300" />
                                      <span>{recommendation.silverMultiplier || '1.0x'}</span>
                                      <span className="text-slate-300 text-[10px] font-bold">Silv</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-black bg-amber-600 text-white shadow-2xs">
                                      <Award className="w-3 h-3 text-amber-200" />
                                      <span>{recommendation.goldMultiplier || '1.0x'}</span>
                                      <span className="text-amber-200 text-[10px] font-bold">Gold</span>
                                    </span>
                                  </>
                                )}

                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${recommendation.badgeClass}`}>
                                  {recommendation.label}
                                </span>

                                <button
                                  onClick={() => setEditingYieldId(editingYieldId === item.id ? null : item.id)}
                                  className="text-[10px] text-sky-700 hover:text-sky-900 font-bold hover:underline ml-auto"
                                >
                                  {editingYieldId === item.id ? 'Close' : 'Edit'}
                                </button>
                              </div>

                              {/* Rates summary */}
                              {rule.signalType === 'single_tier' ? (
                                <div className="flex items-center gap-2 text-[10px] text-slate-600">
                                  <span>No Signal: <strong className="font-mono text-slate-900">{item.yieldNoSignal ?? 0}%</strong></span>
                                  <span className="text-slate-300">&bull;</span>
                                  <span>Signaled: <strong className="font-mono text-slate-900">{item.yieldSilver ?? 0}%</strong></span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                  <span>No: <strong className="font-mono text-slate-900">{item.yieldNoSignal ?? 0}%</strong></span>
                                  <span className="text-slate-300">&bull;</span>
                                  <span>Silv: <strong className="font-mono text-slate-900">{item.yieldSilver ?? 0}%</strong></span>
                                  <span className="text-slate-300">&bull;</span>
                                  <span>Gold: <strong className="font-mono text-slate-900">{item.yieldGold ?? 0}%</strong></span>
                                </div>
                              )}

                              <p className="text-[10px] text-slate-500 leading-tight">
                                {recommendation.explanation}
                              </p>
                            </div>
                          )}

                          {/* Inline Yield Input Box (Adaptive: Single-tier free text box vs two-tier) */}
                          {editingYieldId === item.id && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2 text-xs mt-1 shadow-2xs animate-fade-in">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-600 text-[11px] font-medium">No Signal %:</span>
                                <input
                                  type="number"
                                  value={item.yieldNoSignal ?? ''}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, {
                                      yieldNoSignal: e.target.value !== '' ? Number(e.target.value) : undefined,
                                    })
                                  }
                                  className="w-12 p-1 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-sky-500"
                                  placeholder="%"
                                />
                              </div>

                              {rule.signalType === 'single_tier' ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-600 text-[11px] font-medium">Signaled %:</span>
                                  <input
                                    type="number"
                                    value={item.yieldSilver ?? ''}
                                    onChange={(e) =>
                                      handleUpdateItem(item.id, {
                                        yieldSilver: e.target.value !== '' ? Number(e.target.value) : undefined,
                                      })
                                    }
                                    className="w-12 p-1 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-sky-500"
                                    placeholder="%"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-600 text-[11px] font-medium">Silver %:</span>
                                    <input
                                      type="number"
                                      value={item.yieldSilver ?? ''}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, {
                                          yieldSilver: e.target.value !== '' ? Number(e.target.value) : undefined,
                                        })
                                      }
                                      className="w-12 p-1 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-sky-500"
                                      placeholder="%"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-600 text-[11px] font-medium">Gold %:</span>
                                    <input
                                      type="number"
                                      value={item.yieldGold ?? ''}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, {
                                          yieldGold: e.target.value !== '' ? Number(e.target.value) : undefined,
                                        })
                                      }
                                      className="w-12 p-1 rounded border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-sky-500"
                                      placeholder="%"
                                    />
                                  </div>
                                </>
                              )}

                              <button
                                onClick={() => setEditingYieldId(null)}
                                className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-semibold shadow-2xs ml-auto"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </div>
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
                  Universal Residency Database (5,996 ACGME Programs)
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

              {/* Specialty Filter for Browse Modal */}
              <select
                value={dbSpecialtyFilter}
                onChange={(e) => setDbSpecialtyFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="All">All Specialties</option>
                {CANONICAL_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>

              <select
                value={dbRegionFilter}
                onChange={(e) => setDbRegionFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="All">All 9 Census Divisions</option>
                {CENSUS_DIVISIONS.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
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
                  const displayName = formatProgramDisplayName(prog);
                  const isAdded = items.some(
                    (i) =>
                      (i.programId && (i.programId === prog.id || i.programId === prog.programNumber)) ||
                      (i.programNumber && (i.programNumber === prog.id || i.programNumber === prog.programNumber)) ||
                      (i.programName.toLowerCase() === displayName.toLowerCase() &&
                        i.city?.toLowerCase() === prog.city?.toLowerCase() &&
                        i.state?.toLowerCase() === prog.state?.toLowerCase())
                  );
                  return (
                    <div
                      key={prog.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:border-sky-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{displayName}</h4>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            #{prog.programNumber || prog.id}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                            {prog.region}
                          </span>
                          {prog.step2ScoreRange && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200" title="Residency Explorer Middle 80% Step 2 CK Range">
                              Middle 80%: {prog.step2ScoreRange}
                            </span>
                          )}
                          {prog.silverSignal !== undefined && prog.goldSignal !== undefined && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200" title="Interview yield rates with Silver and Gold signals">
                              Yield: {prog.silverSignal}% Silver / {prog.goldSignal}% Gold
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-600 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{prog.address || `${prog.city}, ${prog.state}`}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            {prog.programDirector && (
                              <span className="truncate">PD: {prog.programDirector.replace('\n', ' ')}</span>
                            )}
                            {prog.offersPreliminary && (
                              <span className="text-emerald-700 font-semibold">&bull; Offers Prelim</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddFromDatabase(prog)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${isAdded
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

      {/* Program Details Drawer / Modal (Item 11) */}
      {detailItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {detailItem.specialty} &bull; {detailItem.region || 'US'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    ACGME #{detailItem.programNumber || detailItem.programId}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{detailItem.programName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {detailItem.address || `${detailItem.city}, ${detailItem.state}`}
                </p>
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
                  <strong className="text-slate-700">Official Program Number:</strong>{' '}
                  <span className="font-mono font-semibold text-slate-900">{detailItem.programNumber || detailItem.programId}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Complete Address:</strong>{' '}
                  <span className="text-slate-900">{detailItem.address || `${detailItem.city}, ${detailItem.state}`}</span>
                </div>
                <div>
                  <strong className="text-slate-700">US Census Division:</strong>{' '}
                  <span className="text-slate-900">{detailItem.region}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Step 2 CK Middle 80% Range:</strong>{' '}
                  <span className="font-semibold text-slate-900">
                    {detailItem.step2ScoreRange ||
                      (detailItem.step2Ck25th && detailItem.step2Ck75th
                        ? `${detailItem.step2Ck25th} - ${detailItem.step2Ck75th}`
                        : 'Not Recorded')}
                  </span>
                </div>
                {(detailItem.noSignal !== undefined || detailItem.silverSignal !== undefined || detailItem.goldSignal !== undefined) && (
                  <div>
                    <strong className="text-slate-700">Interview Yield Rates (Residency Explorer):</strong>{' '}
                    <span className="font-semibold text-slate-900">
                      {[
                        detailItem.noSignal !== undefined ? `No Signal: ${detailItem.noSignal}%` : null,
                        detailItem.silverSignal !== undefined ? `Silver: ${detailItem.silverSignal}%` : null,
                        detailItem.goldSignal !== undefined ? `Gold: ${detailItem.goldSignal}%` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </div>
                )}
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
                {(detailItem.signalExplanation || rule.explanationRequired) && (
                  <div className="col-span-full pt-1">
                    <strong className="text-slate-700 block mb-1">Signal Explanation:</strong>
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-slate-800 font-mono whitespace-pre-wrap">
                      {detailItem.signalExplanation || <em className="text-slate-400">No explanation entered yet.</em>}
                    </div>
                  </div>
                )}
              </div>

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

      {/* Automated Tiering System Educational Modal */}
      {showTieringInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Automated Tiering System</h3>
                  <p className="text-xs text-slate-500">Based on Residency Explorer Middle 80% Range</p>
                </div>
              </div>
              <button
                onClick={() => setShowTieringInfoModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed space-y-3">
              <p>
                Residency Explorer reports the <strong>Middle 80% range</strong> (10th percentile Low to 90th percentile High) of Step 2 CK scores among all applicants invited to interview.
              </p>
              <p>
                Inputting or loading the <strong>Middle 80% range (Low to High)</strong> allows the system to automatically evaluate where your <strong>Step 2 CK score</strong> stands with respect to that institution:
              </p>

              <div className="space-y-2 pt-1">
                <div className="p-3 rounded-lg bg-sky-50/80 border border-sky-200 flex items-start gap-2.5">
                  <Target className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sky-900 block font-bold">Target</strong>
                    <span className="text-sky-950 text-[11px]">
                      Falling within the <strong>Middle 80% range (between Low and High)</strong> makes the school a <strong>Target</strong>.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-200 flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-900 block font-bold">Reach</strong>
                    <span className="text-purple-950 text-[11px]">
                      If your score puts you <strong>below the Middle 80% Low cutoff</strong> for that school, it is categorized as a <strong>Reach</strong>.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 block font-bold">Safety</strong>
                    <span className="text-emerald-950 text-[11px]">
                      If your score puts you <strong>above the Middle 80% High cutoff</strong> for that school, this makes the school a <strong>Safety</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTieringInfoModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOR Requirements Educational Modal */}
      {showLorInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Program Letter of Recommendation Requirements</h3>
                  <p className="text-xs text-slate-500">Program-Specific Verification Guide</p>
                </div>
              </div>
              <button
                onClick={() => setShowLorInfoModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed space-y-3">
              <p>
                Each residency program independently determines the composition and quantity of <strong>Letters of Recommendation (LOR)</strong> needed for their application review.
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Visit Program Specific Pages for the Coming Cycle</span>
                </div>
                <p className="text-amber-950 text-[11px] leading-relaxed">
                  Always visit each program's official residency website or departmental admissions portal to confirm their current requirements (e.g., standard 3 vs 4 letters, mandatory Specialty Chair SLOE, or sub-internship attending letters) for the 2026–2027 application cycle.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-Time LOR Synchronization</span>
                </div>
                <p className="text-emerald-950 text-[11px] leading-relaxed">
                  The requirement you input here is automatically synchronized with your <strong>Letter of Recommendation (LOR) Tracking &amp; Gaps</strong> workspace (now located in <strong>Programs &amp; Strategy</strong>). If you have fewer letters assigned than required, the system will highlight the shortage in amber.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setShowLorInfoModal(false);
                  handleGoToLetters();
                }}
                className="text-xs text-sky-700 hover:text-sky-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open LOR Tracker</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setShowLorInfoModal(false)}
                className="px-4 py-2 bg-[#1F3A30] hover:bg-[#142720] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yield Rates & Strategy Educational Modal */}
      {showStrategyInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Signaling Recommendation Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Algorithmic strategy breakdown based on Residency Explorer interview yield %
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStrategyInfoModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed space-y-4">
              <p>
                When you input interview yield percentages reported on <strong>Residency Explorer</strong>, our engine recommends the highest-efficiency signaling strategy.
              </p>

              {/* Two-Tiered Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Two-Tiered Specialties (Gold vs. Silver vs. No Signal)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Internal Medicine, Anesthesia, Derm, Rad, OB/GYN, EM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-amber-800 font-bold block">⭐ Gold High Yield</strong>
                    <p className="text-slate-600">
                      Triggered when Gold produces a <strong>&ge; 15% interview surge</strong> over Silver. Prime target for your limited Gold tokens.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-slate-800 font-bold block">🥈 Silver Optimal</strong>
                    <p className="text-slate-600">
                      Triggered when Silver captures most of the signal gain (<strong>+12%+</strong>) and Gold adds only marginal return (&lt; 10%). Conserves Gold.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-emerald-800 font-bold block">🛡️ No Signal Needed</strong>
                    <p className="text-slate-600">
                      Baseline yield without signal is already <strong>&ge; 35%</strong> (e.g., strong home/regional pipeline). Save tokens for reach programs.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-red-700 font-bold block">⚠️ Signal Inefficient</strong>
                    <p className="text-slate-600">
                      Signals produce minimal gain (<strong>&lt; 5%</strong> with low overall yield). Tokens yield little interview leverage here.
                    </p>
                  </div>
                </div>
              </div>

              {/* Single-Tier Section */}
              <div className="p-3.5 bg-sky-50/70 rounded-xl border border-sky-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                    Single-Tier Specialties (Signaled vs. No Signal)
                  </h4>
                  <span className="text-[10px] font-mono text-sky-800">
                    General Surgery, Ortho, ENT, Peds, PM&amp;R, Psych, TY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-lg border border-sky-200 space-y-1">
                    <strong className="text-sky-900 font-bold block">🎯 High Yield Signal</strong>
                    <p className="text-slate-600">
                      Signaling creates a <strong>&ge; 10% jump</strong> in interview rate over no signal. High-priority program for your signal budget.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-sky-200 space-y-1">
                    <strong className="text-emerald-800 font-bold block">🛡️ No Signal Needed</strong>
                    <p className="text-slate-600">
                      High organic interview yield (<strong>&ge; 35%</strong> without a signal). Conserve signals for target or reach programs.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-sky-200 space-y-1">
                    <strong className="text-slate-800 font-bold block">✓ Recommended Signal</strong>
                    <p className="text-slate-600">
                      Provides steady positive interview enhancement (<strong>+5% to +9%</strong>). Solid target for signal assignment.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-sky-200 space-y-1">
                    <strong className="text-red-700 font-bold block">⚠️ Signal Inefficient</strong>
                    <p className="text-slate-600">
                      Signal produces marginal change (<strong>&lt; 5%</strong> with overall yield &lt; 15%). Signal has minimal impact.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowStrategyInfoModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
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
