import React, { useState, useEffect } from 'react';
import {
  AlumniResident,
  SAMPLE_ALUMNI_ROSTER,
} from '@/domain/alumni-models';
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

  const [formData, setFormData] = useState({
    name: '',
    graduationYear: 2025,
    currentPgy: 'PGY-1' as AlumniResident['currentPgy'],
    medicalSchool: 'Apex School of Medicine',
    institutionName: '',
    specialty: 'Internal Medicine',
    programCity: '',
    programState: '',
    isAvailableForMentorship: true,
    contactPreference: 'email' as AlumniResident['contactPreference'],
    email: '',
    adviceQuote: '',
    signalStrategyUsed: 'Gold' as AlumniResident['signalStrategyUsed'],
  });

  useEffect(() => {
    if (alumniResidents) {
      setAlumniList(alumniResidents);
    }
  }, [alumniResidents]);

  const handleOpenAddModal = () => {
    setEditingAlumnus(null);
    setFormData({
      name: '',
      graduationYear: 2025,
      currentPgy: 'PGY-1',
      medicalSchool: 'Apex School of Medicine',
      institutionName: '',
      specialty: 'Internal Medicine',
      programCity: '',
      programState: '',
      isAvailableForMentorship: true,
      contactPreference: 'email',
      email: '',
      adviceQuote: '',
      signalStrategyUsed: 'Gold',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (alum: AlumniResident) => {
    setEditingAlumnus(alum);
    setFormData({
      name: alum.name,
      graduationYear: alum.graduationYear,
      currentPgy: alum.currentPgy,
      medicalSchool: alum.medicalSchool,
      institutionName: alum.institutionName,
      specialty: alum.specialty,
      programCity: alum.programCity,
      programState: alum.programState,
      isAvailableForMentorship: alum.isAvailableForMentorship,
      contactPreference: alum.contactPreference,
      email: alum.email,
      adviceQuote: alum.adviceQuote || '',
      signalStrategyUsed: alum.signalStrategyUsed || 'Gold',
    });
    setIsModalOpen(true);
  };

  const handleSaveAlumnus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.institutionName.trim() || !formData.email.trim()) {
      alert('Please fill out Name, Residency Program, and Email.');
      return;
    }

    if (editingAlumnus) {
      onUpdateAlumnus?.(editingAlumnus.id, formData);
      setAlumniList((prev) =>
        prev.map((a) => (a.id === editingAlumnus.id ? { ...a, ...formData } : a))
      );
    } else {
      const newEntry: AlumniResident = {
        ...formData,
        id: `alum-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      onAddAlumnus?.(formData);
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

  const allSpecialties = Array.from(new Set(alumniList.map((a) => a.specialty))).sort();

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Alumni Residency Network</h2>
            <p className="text-xs text-slate-500">
              Institutional Match Database &bull; Synchronized live with student directory &amp; signals
            </p>
          </div>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold ml-2">
            {alumniList.length} Residents
          </span>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Matched Alumnus</span>
        </button>
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
          {allSpecialties.map((s) => (
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
              <th className="py-3 px-4">Signal Strategy</th>
              <th className="py-3 px-4">Mentorship &amp; Contact</th>
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
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        alum.signalStrategyUsed === 'Gold'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : alum.signalStrategyUsed === 'Silver'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{alum.signalStrategyUsed} Signal</span>
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

      {/* Modal Dialog for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden my-8">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingAlumnus ? 'Edit Alumnus Record' : 'Add Matched Alumnus'}
              </h3>
              <button
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
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    value={formData.graduationYear}
                    onChange={(e) =>
                      setFormData({ ...formData, graduationYear: parseInt(e.target.value) || 2025 })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Specialty *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Current PGY Status
                  </label>
                  <select
                    value={formData.currentPgy}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPgy: e.target.value as any })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="PGY-1">PGY-1 (Intern)</option>
                    <option value="PGY-2">PGY-2 (Junior)</option>
                    <option value="PGY-3">PGY-3 (Senior)</option>
                    <option value="Fellow">Fellow</option>
                    <option value="Attending">Attending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Residency Institution *
                </label>
                <input
                  type="text"
                  required
                  value={formData.institutionName}
                  onChange={(e) =>
                    setFormData({ ...formData, institutionName: e.target.value })
                  }
                  placeholder="e.g. Johns Hopkins Hospital"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
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

              <div className="grid grid-cols-2 gap-3">
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
                    Signal Strategy Used
                  </label>
                  <select
                    value={formData.signalStrategyUsed}
                    onChange={(e) =>
                      setFormData({ ...formData, signalStrategyUsed: e.target.value as any })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Gold">Gold Signal</option>
                    <option value="Silver">Silver Signal</option>
                    <option value="None">None (Unsignaled Match)</option>
                  </select>
                </div>
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
                  Available for Student Mentorship &amp; Signaling Consultations
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
    </div>
  );
}
