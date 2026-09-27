'use client';

import React, { useState, useEffect } from 'react';
import { AdminCohortContext } from '@/domain/types';
import { AlumniResident, SAMPLE_ALUMNI_ROSTER } from '@/domain/alumni-models';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Building,
  Lock,
  Users,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  Search,
  Building2,
  X,
  Check,
  Mail,
  MapPin
} from 'lucide-react';

interface AdminPortalProps {
  context: AdminCohortContext;
  onAddAlumnus?: (resident: Omit<AlumniResident, 'id'>) => void;
  onUpdateAlumnus?: (id: string, updates: Partial<AlumniResident>) => void;
  onDeleteAlumnus?: (id: string) => void;
}

export function AdminPortal({
  context,
  onAddAlumnus,
  onUpdateAlumnus,
  onDeleteAlumnus,
}: AdminPortalProps) {
  const { admin, institution, cohortSummary, overdueReviews } = context;

  const [alumniList, setAlumniList] = useState<AlumniResident[]>(() => context.alumniResidents || SAMPLE_ALUMNI_ROSTER);
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
    if (context.alumniResidents) {
      setAlumniList(context.alumniResidents);
    }
  }, [context.alumniResidents]);

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
    if (!formData.name || !formData.institutionName || !formData.email) {
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
    onDeleteAlumnus?.(id);
    setAlumniList((prev) => prev.filter((a) => a.id !== id));
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

  const funnelSteps = [
    { label: 'Drafting Started', count: cohortSummary.draftingCount, pct: Math.round((cohortSummary.draftingCount / cohortSummary.totalStudents) * 100), color: 'bg-slate-400' },
    { label: 'Submitted for Review', count: cohortSummary.submittedCount, pct: Math.round((cohortSummary.submittedCount / cohortSummary.totalStudents) * 100), color: 'bg-amber-500' },
    { label: 'In Faculty Review', count: cohortSummary.inReviewCount, pct: Math.round((cohortSummary.inReviewCount / cohortSummary.totalStudents) * 100), color: 'bg-sky-500' },
    { label: 'Revisions Active', count: cohortSummary.revisionsRequestedCount, pct: Math.round((cohortSummary.revisionsRequestedCount / cohortSummary.totalStudents) * 100), color: 'bg-purple-500' },
    { label: 'Endorsed & Ready', count: cohortSummary.endorsedCount, pct: Math.round((cohortSummary.endorsedCount / cohortSummary.totalStudents) * 100), color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Welcome Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Student Affairs & Deans Office
            </span>
            <span className="text-xs text-slate-500">{institution.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Institutional Oversight: {admin.name}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            MS4 Cohort Size: <strong className="text-slate-900">{cohortSummary.totalStudents} Students</strong> | SLA Target: <strong className="text-slate-900">{institution.defaultSlaDays} Days</strong>
          </p>
        </div>

        {/* FERPA / Privacy Badge & MSPE Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => alert("Opening Dean's Office MSPE Student Dossier Archive. Compiled application packets ready for Dean's letter compilation.")}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            MSPE Application Packets
          </button>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center gap-3">
            <Lock className="w-5 h-5 text-slate-600" />
            <div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">FERPA Privacy Guard Active</div>
              <div className="font-semibold text-slate-800">Metadata & Turnaround Only</div>
              <div className="text-slate-500 text-[11px]">Confidential essay text is restricted to assigned mentors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Funnel Analytics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">Class of 2027 Advising Pipeline Funnel</h2>
          </div>
          <span className="text-xs text-slate-500">Live Aggregated Metrics</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {funnelSteps.map((step) => (
            <div key={step.label} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">{step.label}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{step.count}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${step.color}`}></span>
                {step.pct}% of cohort
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Breach Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">SLA Breach Escalation Queue (&gt;14 Days)</h3>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
              {cohortSummary.slaBreachedCount} Flagged Reviews
            </span>
          </div>
          <span className="text-xs text-slate-500">Auto-routes to Dean for Advisor Support</span>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Institutional Turnaround Policy (14-Day SLA Active):</strong>
              <p className="mt-0.5 text-amber-800">
                To protect students from pre-season anxiety and review delays, Student Affairs monitors turnaround times. Confidential essay text is never exposed to administrative viewers.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student Advisee</th>
                  <th className="px-4 py-3 font-semibold">Assigned Faculty Reviewer</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Elapsed Days</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">Alex Rivera</td>
                  <td className="px-4 py-3 text-slate-700">Dr. Marcus Chen</td>
                  <td className="px-4 py-3 text-slate-500">Internal Medicine</td>
                  <td className="px-4 py-3 font-bold text-red-600">16 days in queue</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                      +2d Breached
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert('Administrative Nudge dispatched to Dr. Marcus Chen (Internal Medicine).')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors"
                    >
                      Send Nudge
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">Jordan Lee</td>
                  <td className="px-4 py-3 text-slate-700">Dr. Sarah Vance</td>
                  <td className="px-4 py-3 text-slate-500">General Surgery</td>
                  <td className="px-4 py-3 font-bold text-red-600">19 days in queue</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                      +5d Breached
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert('Administrative Nudge dispatched to Dr. Sarah Vance (General Surgery).')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors"
                    >
                      Send Nudge
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">Priya Patel</td>
                  <td className="px-4 py-3 text-slate-700">Dr. Robert Hayes</td>
                  <td className="px-4 py-3 text-slate-500">Pediatrics</td>
                  <td className="px-4 py-3 font-bold text-amber-600">12 days in queue</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Day 10 Auto-Nudged
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert('Administrative Courtesy Follow-up logged for Pediatrics.')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Follow-up
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alumni Residency Network Management Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
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
          <div className="w-full sm:w-auto">
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Specialties ({alumniList.length})</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="General Surgery">General Surgery</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="Anesthesiology">Anesthesiology</option>
              <option value="Orthopedic Surgery">Orthopedic Surgery</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Psychiatry">Psychiatry</option>
            </select>
          </div>
        </div>

        {/* Table of Alumni */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Alumnus</th>
                <th className="px-4 py-3">Specialty &amp; PGY</th>
                <th className="px-4 py-3">Residency Institution</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Mentorship</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlumni.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                    No alumni residents found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredAlumni.map((alum) => (
                  <tr key={alum.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{alum.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{alum.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{alum.specialty}</div>
                      <div className="text-[10px] text-slate-500">{alum.currentPgy} &bull; Class of {alum.graduationYear}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{alum.institutionName}</div>
                      {alum.signalStrategyUsed && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {alum.signalStrategyUsed} Signal Matched
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {alum.programCity}, {alum.programState}
                    </td>
                    <td className="px-4 py-3">
                      {alum.isAvailableForMentorship ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Mentor
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          Directory Only
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(alum)}
                          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Alumnus"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAlumnus(alum.id, alum.name)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
      </div>

      {/* Add / Edit Alumnus Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingAlumnus ? 'Edit Matched Alumnus' : 'Add Matched Alumnus'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAlumnus} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Physician Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. Jane Doe"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jdoe@hospital.edu"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    placeholder="Internal Medicine"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    PGY Level
                  </label>
                  <select
                    value={formData.currentPgy}
                    onChange={(e) => setFormData({ ...formData, currentPgy: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PGY-1">PGY-1 (Intern)</option>
                    <option value="PGY-2">PGY-2</option>
                    <option value="PGY-3">PGY-3</option>
                    <option value="PGY-4">PGY-4</option>
                    <option value="PGY-5">PGY-5</option>
                    <option value="Chief">Chief Resident</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Residency Program / Hospital *
                </label>
                <input
                  type="text"
                  required
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="e.g. Stanford Health Care"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.programCity}
                    onChange={(e) => setFormData({ ...formData, programCity: e.target.value })}
                    placeholder="Stanford"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    State (2 letters)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.programState}
                    onChange={(e) => setFormData({ ...formData, programState: e.target.value.toUpperCase() })}
                    placeholder="CA"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Signal Used
                  </label>
                  <select
                    value={formData.signalStrategyUsed}
                    onChange={(e) => setFormData({ ...formData, signalStrategyUsed: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Gold">Gold Signal</option>
                    <option value="Silver">Silver Signal</option>
                    <option value="No Signal">No Signal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Advice Quote for Applicants
                </label>
                <textarea
                  rows={2}
                  value={formData.adviceQuote}
                  onChange={(e) => setFormData({ ...formData, adviceQuote: e.target.value })}
                  placeholder="Share a key strategy tip that helped you match here..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mentorshipCheck"
                  checked={formData.isAvailableForMentorship}
                  onChange={(e) => setFormData({ ...formData, isAvailableForMentorship: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="mentorshipCheck" className="text-xs text-slate-700 font-medium">
                  Available for Student Mentorship &amp; Outreach
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
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
