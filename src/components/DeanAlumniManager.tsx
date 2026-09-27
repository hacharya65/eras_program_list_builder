import React, { useState, useEffect } from 'react';
import {
  AlumniResident,
  SAMPLE_ALUMNI_ROSTER,
  calculateCurrentPgy,
} from '@/domain/alumni-models';
import { CANONICAL_SPECIALTIES } from '@/domain/school-list-models';
import {
  ResidencyProgramRecord,
  getAllResidencyPrograms,
  formatProgramDisplayName,
} from '@/domain/residency-database';
import {
  parseMatchDayRosterText,
  ParsedRosterEntry,
} from '@/domain/alumni-roster-parser';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Mail,
  MapPin,
  GraduationCap,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
} from 'lucide-react';

export interface DeanAlumniManagerProps {
  alumniResidents?: AlumniResident[];
  onAddAlumnus?: (resident: Omit<AlumniResident, 'id'>) => void;
  onUpdateAlumnus?: (id: string, updates: Partial<AlumniResident>) => void;
  onDeleteAlumnus?: (id: string) => void;
}

export function DeanAlumniManager({
  alumniResidents,
  onAddAlumnus,
  onUpdateAlumnus,
  onDeleteAlumnus,
}: DeanAlumniManagerProps) {
  const [alumniList, setAlumniList] = useState<AlumniResident[]>(
    () => alumniResidents || SAMPLE_ALUMNI_ROSTER
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlumnus, setEditingAlumnus] = useState<AlumniResident | null>(null);

  // All ACGME residency programs for autocomplete
  const allPrograms = React.useMemo(() => getAllResidencyPrograms(), []);

  // Program search query inside the modal
  const [programSearchText, setProgramSearchText] = useState('');
  const [showProgramSuggestions, setShowProgramSuggestions] = useState(false);

  // Import Modal & Staging State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rosterInputText, setRosterInputText] = useState('');
  const [stagedEntries, setStagedEntries] = useState<ParsedRosterEntry[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    graduationYear: 2026,
    pgyOverride: '' as string,
    medicalSchool: 'Apex School of Medicine',
    institutionName: '',
    specialty: 'Internal Medicine',
    programCity: '',
    programState: '',
    isAvailableForMentorship: true,
    contactPreference: 'email' as AlumniResident['contactPreference'],
    email: '',
    adviceQuote: '',
    acgmeProgramId: '',
  });

  useEffect(() => {
    if (alumniResidents) {
      setAlumniList(alumniResidents);
    }
  }, [alumniResidents]);

  // Autocomplete suggestions based on programSearchText
  const programSuggestions = React.useMemo(() => {
    if (!programSearchText || programSearchText.length < 2) return [];
    const q = programSearchText.toLowerCase();
    return allPrograms
      .filter((p) => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const cityMatch = p.city.toLowerCase().includes(q);
        const stateMatch = p.state.toLowerCase() === q;
        const codeMatch = (p.programNumber || '').includes(q);
        return nameMatch || cityMatch || stateMatch || codeMatch;
      })
      .slice(0, 8);
  }, [programSearchText, allPrograms]);

  const handleSelectProgram = (prog: ResidencyProgramRecord) => {
    const formattedName = formatProgramDisplayName(prog);
    setProgramSearchText(formattedName);
    setFormData((prev) => ({
      ...prev,
      institutionName: formattedName,
      specialty: prog.specialty,
      programCity: prog.city,
      programState: prog.state,
      acgmeProgramId: prog.programNumber || prog.id,
    }));
    setShowProgramSuggestions(false);
  };

  const handleOpenAddModal = () => {
    setEditingAlumnus(null);
    setProgramSearchText('');
    setFormData({
      name: '',
      graduationYear: 2026,
      pgyOverride: '',
      medicalSchool: 'Apex School of Medicine',
      institutionName: '',
      specialty: 'Internal Medicine',
      programCity: '',
      programState: '',
      isAvailableForMentorship: true,
      contactPreference: 'email',
      email: '',
      adviceQuote: '',
      acgmeProgramId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (alum: AlumniResident) => {
    setEditingAlumnus(alum);
    setProgramSearchText(alum.institutionName);
    setFormData({
      name: alum.name,
      graduationYear: alum.graduationYear,
      pgyOverride: alum.pgyOverride || '',
      medicalSchool: alum.medicalSchool,
      institutionName: alum.institutionName,
      specialty: alum.specialty,
      programCity: alum.programCity,
      programState: alum.programState,
      isAvailableForMentorship: alum.isAvailableForMentorship,
      contactPreference: alum.contactPreference,
      email: alum.email,
      adviceQuote: alum.adviceQuote || '',
      acgmeProgramId: alum.acgmeProgramId || '',
    });
    setIsModalOpen(true);
  };

  const computedPgy = calculateCurrentPgy(
    formData.graduationYear,
    new Date(),
    formData.pgyOverride || undefined,
    formData.specialty
  );

  const handleSaveAlumnus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.institutionName.trim() || !formData.email.trim()) {
      alert('Please fill out Name, Residency Program, and Email.');
      return;
    }

    const payload = {
      ...formData,
      currentPgy: computedPgy,
      verificationStatus: 'verified' as const,
      lastVerifiedPeriod: `${new Date().getFullYear()}–${new Date().getFullYear() + 1} Academic Year`,
      lastVerifiedAt: new Date().toISOString().split('T')[0],
    };

    if (editingAlumnus) {
      onUpdateAlumnus?.(editingAlumnus.id, payload);
      setAlumniList((prev) =>
        prev.map((a) => (a.id === editingAlumnus.id ? { ...a, ...payload } : a))
      );
    } else {
      const newEntry: AlumniResident = {
        ...payload,
        id: `alum-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      onAddAlumnus?.(payload);
      setAlumniList((prev) => [newEntry, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteAlumnus = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the alumni directory?`)) {
      onDeleteAlumnus?.(id);
      setAlumniList((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Staged roster parsing
  const handleParseRoster = () => {
    if (!rosterInputText.trim()) return;
    const parsed = parseMatchDayRosterText(rosterInputText, 2026, allPrograms);
    setStagedEntries(parsed);
  };

  const handleConfirmImportStaged = () => {
    stagedEntries.forEach((entry) => {
      const payload: Omit<AlumniResident, 'id'> = {
        name: entry.name,
        graduationYear: entry.graduationYear,
        currentPgy: entry.currentPgy,
        medicalSchool: entry.medicalSchool,
        institutionName: entry.institutionName,
        specialty: entry.specialty,
        programCity: entry.programCity,
        programState: entry.programState,
        email: entry.email,
        isAvailableForMentorship: entry.isAvailableForMentorship,
        contactPreference: entry.contactPreference,
        acgmeProgramId: entry.acgmeProgramId,
        verificationStatus: entry.verificationStatus,
        lastVerifiedPeriod: entry.lastVerifiedPeriod,
        lastVerifiedAt: entry.lastVerifiedAt,
      };
      onAddAlumnus?.(payload);
    });

    setAlumniList((prev) => [
      ...stagedEntries.map((e) => ({
        ...e,
        id: `alum-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
      ...prev,
    ]);

    setIsImportModalOpen(false);
    setStagedEntries([]);
    setRosterInputText('');
  };

  const filteredAlumni = alumniList.filter((alum) => {
    if (specialtyFilter !== 'ALL' && alum.specialty.toLowerCase() !== specialtyFilter.toLowerCase()) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      alum.name.toLowerCase().includes(q) ||
      alum.institutionName.toLowerCase().includes(q) ||
      alum.programCity.toLowerCase().includes(q) ||
      alum.specialty.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Annual Rollover Notice Banner */}
      <div className="p-3.5 bg-indigo-50/80 border-b border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Academic Year Rollover Active:</span>
            <span className="text-indigo-800 ml-1">
              Automated annual re-attestation invitations dispatched to alumni residents to verify fellowship pursuits or transition to attendinghood.
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-indigo-200/60 text-indigo-900 font-semibold text-[10px] whitespace-nowrap">
          July 1 Cycle Verified
        </span>
      </div>

      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Alumni Residency Network</h2>
            <p className="text-xs text-slate-500">
              Institutional Match Database &bull; Synchronized live with student directory &amp; school list
            </p>
          </div>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold ml-2">
            {alumniList.length} Residents
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import Match Day Roster</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Matched Alumnus</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by alumnus name, residency institution, city, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Specialties ({alumniList.length})</option>
          {CANONICAL_SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Alumnus Name</th>
              <th className="py-3 px-4">Residency Program</th>
              <th className="py-3 px-4">Specialty &amp; PGY</th>
              <th className="py-3 px-4">Mentorship &amp; Contact</th>
              <th className="py-3 px-4">Verification State</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAlumni.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No alumni found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredAlumni.map((alum) => (
                <tr key={alum.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{alum.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({alum.graduationYear})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div className="font-medium text-slate-800">{alum.institutionName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>
                        {alum.programCity}, {alum.programState}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {alum.specialty}
                    </span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {alum.currentPgy}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="font-mono text-slate-700">{alum.email}</span>
                    </div>
                    {alum.isAvailableForMentorship && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Open to Mentorship</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {alum.verificationStatus === 're_attestation_pending' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <span>⏳ Re-attestation Pending</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(alum)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit Alumnus Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlumnus(alum.id, alum.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Alumnus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Add/Edit Alumnus */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alumnus-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden my-8">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 id="alumnus-modal-title" className="text-sm font-bold text-slate-900">
                {editingAlumnus ? 'Edit Alumnus Record' : 'Add Matched Alumnus'}
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAlumnus} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Physician Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Jordan Lee"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Graduation Year *
                  </label>
                  <select
                    value={formData.graduationYear}
                    onChange={(e) =>
                      setFormData({ ...formData, graduationYear: parseInt(e.target.value) || 2026 })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    {[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((yr) => (
                      <option key={yr} value={yr}>
                        Class of {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Residency Program Autocomplete Input */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Residency Program (Type to search 2,500+ ACGME Programs) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={programSearchText}
                    onFocus={() => setShowProgramSuggestions(true)}
                    onChange={(e) => {
                      setProgramSearchText(e.target.value);
                      setFormData((prev) => ({ ...prev, institutionName: e.target.value }));
                      setShowProgramSuggestions(true);
                    }}
                    placeholder="Search hospital or university name (e.g. Stanford, Mayo Clinic, MGH)..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.acgmeProgramId && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                      ✓ ACGME Linked
                    </span>
                  )}
                </div>

                {showProgramSuggestions && programSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {programSuggestions.map((prog) => (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => handleSelectProgram(prog)}
                        className="w-full text-left p-2 hover:bg-indigo-50/70 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{formatProgramDisplayName(prog)}</div>
                          <div className="text-[10px] text-slate-500">
                            {prog.specialty} &bull; {prog.city}, {prog.state}
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prog.state}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Specialty *
                  </label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    {CANONICAL_SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    PGY Status (Perpetual Prediction)
                  </label>
                  <select
                    value={formData.pgyOverride}
                    onChange={(e) => setFormData({ ...formData, pgyOverride: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Auto-calculated ({computedPgy})</option>
                    <option value="Research Year">Research Year / Delay</option>
                    <option value="Chief Resident">Chief Resident</option>
                    <option value="Fellow">Fellowship</option>
                    <option value="Attending">Attending Physician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Program City
                  </label>
                  <input
                    type="text"
                    value={formData.programCity}
                    onChange={(e) => setFormData({ ...formData, programCity: e.target.value })}
                    placeholder="e.g. Baltimore"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Program State
                  </label>
                  <input
                    type="text"
                    value={formData.programState}
                    onChange={(e) => setFormData({ ...formData, programState: e.target.value })}
                    placeholder="e.g. MD"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@hospital.org"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Advice / Strategy Quote for Current Applicants
                </label>
                <textarea
                  rows={2}
                  value={formData.adviceQuote}
                  onChange={(e) => setFormData({ ...formData, adviceQuote: e.target.value })}
                  placeholder="Share high-yield tactical tips for interviewing at this program..."
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mentorship"
                  checked={formData.isAvailableForMentorship}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailableForMentorship: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <label htmlFor="mentorship" className="text-slate-700 font-medium">
                  Available for Student Mentorship &amp; Outreach
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  {editingAlumnus ? 'Save Changes' : 'Add Alumnus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Match Day PDF / Roster Ingestion */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="roster-import-title"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h3 id="roster-import-title" className="text-sm font-bold text-slate-900">
                  Import Match Day PDF / Roster
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Paste Match Day Roster Lines (or upload PDF / text export)
                </label>
                <p className="text-[10px] text-slate-500 mb-2">
                  Format: <code>Student Name - Specialty - Hospital / Program - City, State</code>
                </p>
                <textarea
                  rows={4}
                  value={rosterInputText}
                  onChange={(e) => setRosterInputText(e.target.value)}
                  placeholder={`Dr. Maya Patel - Internal Medicine - Stanford Health Care - Stanford, CA\nDr. Liam Connor - General Surgery - Brigham and Women's Hospital - Boston, MA`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleParseRoster}
                  className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Parse &amp; Auto-Cross-Reference with ACGME Database
                </button>
              </div>

              {/* Staging & Verification Table */}
              {stagedEntries.length > 0 && (
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Staged Candidates ({stagedEntries.length} Records)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Inspect &amp; verify ACGME matches before importing
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {stagedEntries.map((staged, idx) => (
                      <div key={staged.id} className="p-2.5 flex items-center justify-between gap-3 text-xs bg-white hover:bg-slate-50">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{staged.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-50 text-sky-700 font-bold">
                              {staged.specialty}
                            </span>
                            {staged.confidence === 'high' ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>ACGME Matched</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-800 font-semibold">
                                Unverified Match
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {staged.institutionName} &bull; {staged.programCity}, {staged.programState}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStagedEntries((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove from staging"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStagedEntries([])}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Clear Staging
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImportStaged}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Confirm &amp; Import All ({stagedEntries.length}) Matched Alumni
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
