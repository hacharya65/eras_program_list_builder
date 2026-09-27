'use client';

import React, { useState, useEffect } from 'react';
import {
  SAMPLE_ALUMNI_ROSTER,
  AlumniResident,
  getNonRoboticOutreachGuide,
} from '@/domain/alumni-models';
import { CANONICAL_SPECIALTIES } from '@/domain/school-list-models';
import {
  Users,
  Search,
  ChevronLeft,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Building2,
  MapPin,
  Check,
  ShieldCheck,
  Award,
  Stethoscope
} from 'lucide-react';

interface AlumniResidentDirectoryProps {
  studentName?: string;
  initialSpecialty?: string;
  studentSpecialty?: string;
  alumniResidents?: AlumniResident[];
  onBack?: () => void;
}

export function AlumniResidentDirectory({
  studentName = 'Alex Rivera',
  initialSpecialty,
  studentSpecialty,
  alumniResidents = SAMPLE_ALUMNI_ROSTER,
  onBack,
}: AlumniResidentDirectoryProps) {
  const defaultSpecialty = initialSpecialty || studentSpecialty || 'Internal Medicine';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(defaultSpecialty);
  const [mentorsOnly, setMentorsOnly] = useState<boolean>(false);
  const [selectedResident, setSelectedResident] = useState<AlumniResident | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Sync state whenever initialSpecialty updates from parent
  useEffect(() => {
    const spec = initialSpecialty || studentSpecialty;
    if (spec) {
      setSelectedSpecialty(spec);
    }
  }, [initialSpecialty, studentSpecialty]);

  // Filter alumni
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

  const filteredAlumni = (alumniResidents || SAMPLE_ALUMNI_ROSTER).filter((alum) => {
    if (selectedSpecialty !== 'ALL') {
      const targetNorm = normalize(selectedSpecialty);
      const alumNorm = normalize(alum.specialty);
      const matchesSpecialty =
        alumNorm === targetNorm ||
        alumNorm.includes(targetNorm) ||
        targetNorm.includes(alumNorm);
      if (!matchesSpecialty) {
        return false;
      }
    }
    if (mentorsOnly && !alum.isAvailableForMentorship) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      alum.name.toLowerCase().includes(q) ||
      alum.institutionName.toLowerCase().includes(q) ||
      alum.programCity.toLowerCase().includes(q) ||
      alum.programState.toLowerCase().includes(q) ||
      alum.currentPgy.toLowerCase().includes(q)
    );
  });

  const outreachGuide = selectedResident
    ? getNonRoboticOutreachGuide(
        studentName,
        selectedResident.name,
        selectedResident.institutionName,
        selectedResident.specialty
      )
    : null;

  const handleCopyDraft = () => {
    if (!outreachGuide) return;
    const fullText = `Subject: ${outreachGuide.subject}\n\n${outreachGuide.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Apex Alumni Network
              </span>
              <span className="text-xs text-slate-500">Classes of 2022–2025</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-600" />
              Alumni Resident Match Roster &amp; Mentorship
            </h1>
          </div>
        </div>

        {/* Filter Badges & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search resident, hospital, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 w-48 md:w-60"
            />
          </div>

          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="ALL">All Specialties</option>
            {CANONICAL_SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={mentorsOnly}
              onChange={(e) => setMentorsOnly(e.target.checked)}
              className="rounded text-violet-600 focus:ring-violet-500 h-3.5 w-3.5"
            />
            <span>Active Mentors Only</span>
          </label>
        </div>
      </div>

      {/* Institutional Match Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">100%</div>
            <div className="text-xs text-slate-500">Verified Apex Alumni</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">88%</div>
            <div className="text-xs text-slate-500">Available for Mentorship</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">9 Programs</div>
            <div className="text-xs text-slate-500">Direct Network Anchors</div>
          </div>
        </div>
      </div>

      {/* Compact Row-Based Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Internal Alumni Residency Match Roster</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredAlumni.length} verified graduates currently training across residency programs.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Contact preferences &amp; advice quotes verified internally
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Resident &amp; Class</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Residency Program / Hospital</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Mentorship</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlumni.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">No alumni residents found for {selectedSpecialty}.</p>
                    <p className="mt-1">Try switching to &quot;All Specialties&quot; or clearing your search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredAlumni.map((alum) => (
                  <tr key={alum.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Resident Name & Class */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{alum.name}</div>
                    <div className="text-[11px] text-slate-500">Class of {alum.graduationYear}</div>
                  </td>

                  {/* PGY Level */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 text-slate-700">
                      {alum.currentPgy}
                    </span>
                  </td>

                  {/* Specialty */}
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {alum.specialty}
                  </td>

                  {/* Hospital */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span className="truncate max-w-[220px]">{alum.institutionName}</span>
                    </div>
                    {alum.adviceQuote && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1 max-w-[260px]">
                        &ldquo;{alum.adviceQuote}&rdquo;
                      </div>
                    )}
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {alum.programCity}, {alum.programState}
                    </div>
                  </td>

                  {/* Mentorship Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {alum.isAvailableForMentorship ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Opt-In
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        On Service
                      </span>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {alum.isAvailableForMentorship ? (
                      <button
                        onClick={() => setSelectedResident(alum)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        Outreach
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Unavailable</span>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-Robotic Outreach Guide Modal */}
      {selectedResident && outreachGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                  Internal Alumni Mentorship Outreach
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Connect with {selectedResident.name} ({selectedResident.institutionName})
                </h3>
              </div>
              <button
                onClick={() => setSelectedResident(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Golden Rules: Dos and Don'ts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Best Practices (High Response Rate)
                </div>
                <ul className="space-y-1 text-emerald-800 text-[11px] list-disc list-inside">
                  {outreachGuide.dos.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200 space-y-1.5">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Red Flags to Avoid
                </div>
                <ul className="space-y-1 text-rose-800 text-[11px] list-disc list-inside">
                  {outreachGuide.donts.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tailored Email Draft */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Customized Outreach Draft:
                </label>
                <button
                  onClick={handleCopyDraft}
                  className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border border-violet-200"
                >
                  {copiedDraft ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Email Template
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 space-y-3 whitespace-pre-line leading-relaxed">
                <div>
                  <span className="text-slate-400 font-sans font-bold">To:</span> {selectedResident.email}
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-bold">Subject:</span> {outreachGuide.subject}
                </div>
                <div className="border-t border-slate-200 pt-2 text-slate-700 font-sans text-xs">
                  {outreachGuide.body}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedResident(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                onClick={handleCopyDraft}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy and Launch Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
