'use client';

import React, { useState } from 'react';
import {
  Mail,
  ArrowLeft,
  Building,
  GraduationCap,
  Calendar,
  ExternalLink,
  Search,
  Check,
  Copy,
  Clock,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Phone,
  FileCheck2,
} from 'lucide-react';

interface ContactPerson {
  id: string;
  name: string;
  credentials: string;
  roleTitle: string;
  category: 'specialty' | 'deans' | 'operations' | 'regional';
  campus: string;
  email: string;
  officeHours: string;
  focusArea: string;
  bio: string;
  avatarBg: string;
  avatarText: string;
  initials: string;
}

interface AdvisingLeadershipViewProps {
  targetSpecialty?: string;
  onBack: () => void;
}

export function AdvisingLeadershipView({
  targetSpecialty = 'Internal Medicine',
  onBack,
}: AdvisingLeadershipViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEmail = (id: string, email: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const directory: ContactPerson[] = [
    {
      id: 'marcus-chen',
      name: 'Dr. Marcus Chen',
      credentials: 'MD, FACP',
      roleTitle: `Specialty Faculty Advisor (${targetSpecialty})`,
      category: 'specialty',
      campus: 'Danville Medical Center Campus',
      email: 'mchen@geisinger.edu',
      officeHours: 'Tuesdays 2:00 PM – 5:00 PM EST',
      focusArea: 'Sub-I performance evaluation, clinical LOR writer selection, and ERAS 2027 specialty signaling allocation.',
      bio: 'Professor of Clinical Medicine & Sub-Internship Director. Advises MS4 students applying to categorical and primary care residencies.',
      avatarBg: 'bg-[#1F3A30]',
      avatarText: 'text-white',
      initials: 'MC',
    },
    {
      id: 'eleanor-vance',
      name: 'Dr. Eleanor Vance',
      credentials: 'MD, FACS',
      roleTitle: 'Regional Associate Dean of Student Affairs',
      category: 'deans',
      campus: 'Scranton Regional Campus',
      email: 'evance@geisinger.edu',
      officeHours: 'Thursdays 1:00 PM – 4:00 PM EST',
      focusArea: 'MSPE narrative reviews, student affairs counseling, academic remediation notes, and holistic applicant advocacy.',
      bio: 'Oversees regional student affairs, professional identity formation, and Dean letter compilation for medical students.',
      avatarBg: 'bg-emerald-100',
      avatarText: 'text-emerald-800',
      initials: 'EV',
    },
    {
      id: 'gregory-sterling',
      name: 'Dr. Gregory Sterling',
      credentials: 'MD, FAAP',
      roleTitle: 'Assistant Dean of Career Advising & Match Operations',
      category: 'deans',
      campus: 'Danville / Central Health Sciences Campus',
      email: 'gsterling@geisinger.edu',
      officeHours: 'Wednesdays 3:00 PM – 6:00 PM EST',
      focusArea: 'School list risk balancing (Reach/Target/Safety), couples match strategies, and competitive specialty contingency planning.',
      bio: 'Directs institutional career advising workflows and leads residency explorer analytics across all Geisinger regional campuses.',
      avatarBg: 'bg-blue-100',
      avatarText: 'text-blue-800',
      initials: 'GS',
    },
    {
      id: 'evelyn-taylor',
      name: 'Dr. Evelyn Taylor',
      credentials: 'MD, EdM',
      roleTitle: 'Associate Dean of Student Affairs & Admissions',
      category: 'deans',
      campus: 'School of Medicine Executive Offices',
      email: 'etaylor@geisinger.edu',
      officeHours: 'By Appointment / Urgent Dean Referral',
      focusArea: 'Final MSPE sign-off, NRMP Match policy compliance, institutional endorsements, and academic standing certifications.',
      bio: 'Executive lead for student progression, graduation verification, and formal liaison to AAMC and NRMP regulatory committees.',
      avatarBg: 'bg-slate-800',
      avatarText: 'text-white',
      initials: 'ET',
    },
    {
      id: 'sarah-jenkins',
      name: 'Sarah Jenkins',
      credentials: 'MS',
      roleTitle: 'ERAS & Match Operations Coordinator',
      category: 'operations',
      campus: 'Office of Medical Education (Danville / Remote)',
      email: 'sjenkins@geisinger.edu',
      officeHours: 'Mon–Fri 9:00 AM – 4:00 PM EST',
      focusArea: 'ERAS token distribution, transcript uploads, MSPE release schedule, and LOR portal troubleshooting.',
      bio: 'Administers primary match platforms (MyERAS, NRMP R3, SF Match, AUA) and coordinates credential document transmissions.',
      avatarBg: 'bg-purple-100',
      avatarText: 'text-purple-800',
      initials: 'SJ',
    },
    {
      id: 'david-alvarez',
      name: 'David Alvarez',
      credentials: 'BS, C-TAGME',
      roleTitle: 'Clinical Registrar & VSLO Liaison',
      category: 'operations',
      campus: 'Scranton Campus & Registrar Hub',
      email: 'dalvarez@geisinger.edu',
      officeHours: 'Mon–Thu 8:30 AM – 3:30 PM EST',
      focusArea: 'Visiting student away rotation approvals, malpractice liability verification letters, and grade verifications.',
      bio: 'Manages clinical clerkship registration, Visiting Student Learning Opportunities (VSLO) submissions, and graduation auditing.',
      avatarBg: 'bg-amber-100',
      avatarText: 'text-amber-800',
      initials: 'DA',
    },
    {
      id: 'rachel-adams',
      name: 'Dr. Rachel Adams',
      credentials: 'MD',
      roleTitle: 'Regional Assistant Dean of Student Affairs',
      category: 'regional',
      campus: 'South Regional Campus (Wilkes-Barre)',
      email: 'radams@geisinger.edu',
      officeHours: 'Tuesdays 10:00 AM – 1:00 PM EST',
      focusArea: 'Wilkes-Barre regional student advocacy, away elective guidance, and local health system match mentoring.',
      bio: 'Clinical Associate Professor of Family Medicine supporting South Campus medical students through clerkship transitions and residency selection.',
      avatarBg: 'bg-teal-100',
      avatarText: 'text-teal-800',
      initials: 'RA',
    },
    {
      id: 'robert-lang',
      name: 'Dr. Robert Lang',
      credentials: 'MD, MBA',
      roleTitle: 'Regional Assistant Dean of Student Affairs',
      category: 'regional',
      campus: 'West Regional Campus (State College)',
      email: 'rlang@geisinger.edu',
      officeHours: 'Fridays 1:00 PM – 4:00 PM EST',
      focusArea: 'State College / West Campus advising, rural healthcare track matches, and community health residency pathways.',
      bio: 'Oversees West Campus cohort advising, community hospital elective placements, and regional career counseling.',
      avatarBg: 'bg-rose-100',
      avatarText: 'text-rose-800',
      initials: 'RL',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Leadership & Staff' },
    { id: 'specialty', label: 'Specialty Advising' },
    { id: 'deans', label: 'Deans & Student Affairs' },
    { id: 'operations', label: 'Match Operations & ERAS' },
    { id: 'regional', label: 'Regional Campuses' },
  ];

  const filteredContacts = directory.filter((c) => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.roleTitle.toLowerCase().includes(q) ||
      c.campus.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.focusArea.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#1F3A30] hover:text-[#142720] bg-white border border-[#D6E5DF] px-3.5 py-2 rounded-xl shadow-2xs hover:bg-[#F2F7F4] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applicant Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Official Directory Active &bull; Match 2027</span>
          </span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-[#1F3A30] to-[#162D25] rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-[#1F3A30]">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-medium border border-white/10">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Medical Centers &bull; Official Directory</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Specialty Advising Leadership &amp; Champions
          </h1>

          <p className="text-sm sm:text-base text-neutral-200/90 leading-relaxed">
            Official contact directory for MS4 match advising, regional student affairs, and administrative coordinators. Connect with faculty mentors and deans to optimize your ERAS strategy and MSPE preparation.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-emerald-200/80">
            <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Office Hours: Tue &amp; Thu 2:00 – 5:00 PM EST</span>
            </div>
            <a
              href="mailto:match-advising@geisinger.edu"
              className="inline-flex items-center gap-1.5 bg-white text-[#1F3A30] hover:bg-neutral-100 font-bold px-4 py-1.5 rounded-xl shadow-xs transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-[#1F3A30]" />
              <span>Book 1:1 Advising Check-in</span>
            </a>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, specialty, campus, or focus area..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3A30]/20 focus:border-[#1F3A30] transition-all"
            />
          </div>

          <div className="text-xs text-neutral-500 font-medium whitespace-nowrap self-center sm:self-auto">
            Showing <strong className="text-neutral-900">{filteredContacts.length}</strong> leaders &amp; coordinators
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1F3A30] text-white shadow-2xs'
                    : 'bg-neutral-100/80 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredContacts.map((person) => {
          const isCopied = copiedId === person.id;
          return (
            <div
              key={person.id}
              className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-neutral-300 hover:shadow-xs transition-all space-y-4"
            >
              <div>
                {/* Person Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl ${person.avatarBg} ${person.avatarText} flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ring-1 ring-black/5`}
                    >
                      {person.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                        <span>{person.name}</span>
                        <span className="text-xs font-normal text-neutral-500">{person.credentials}</span>
                      </h3>
                      <div className="text-xs font-semibold text-[#1F3A30] mt-0.5">
                        {person.roleTitle}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1">
                        <Building className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>{person.campus}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      person.category === 'specialty'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        : person.category === 'deans'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200/80'
                        : person.category === 'operations'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200/80'
                        : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                    }`}
                  >
                    {person.category === 'specialty'
                      ? 'Specialty Advisor'
                      : person.category === 'deans'
                      ? 'Dean Leadership'
                      : person.category === 'operations'
                      ? 'Match Operations'
                      : 'Regional Campus'}
                  </span>
                </div>

                {/* Focus Area / Advisory Scope */}
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Advisory Focus
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {person.focusArea}
                  </p>
                </div>

                {/* Office Hours Note */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200/60">
                  <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span>{person.officeHours}</span>
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
                {/* Email Address & Copy */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={`mailto:${person.email}`}
                    className="font-semibold text-[#1F3A30] hover:text-[#142720] hover:underline flex items-center gap-1 text-xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#1F3A30]" />
                    <span>{person.email}</span>
                  </a>
                  <button
                    onClick={() => handleCopyEmail(person.id, person.email)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Copy email address"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isCopied && (
                    <span className="text-[10px] text-emerald-700 font-semibold animate-fade-in">
                      Copied!
                    </span>
                  )}
                </div>

                {/* Direct Action */}
                <a
                  href={`mailto:${person.email}?subject=MS4%20Match%202027%20Advising%20Inquiry%20-%20GCSOM`}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-[#1F3A30] text-neutral-700 hover:text-white rounded-xl font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span>Send Email</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredContacts.length === 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-neutral-900 text-base">No advisors or coordinators found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters to see all Geisinger advising leadership.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveCategory('all');
            }}
            className="px-4 py-2 bg-[#1F3A30] text-white rounded-xl text-xs font-semibold hover:bg-[#162D25] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Advisory & FERPA Notice Box */}
      <div className="bg-[#F2F7F4] rounded-2xl border border-[#D6E5DF] p-5 text-xs text-neutral-700 space-y-2">
        <div className="font-bold text-[#1F3A30] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1F3A30]" />
          <span>Institutional Advising &amp; MSPE Guidance Policies</span>
        </div>
        <p className="text-neutral-600 leading-relaxed text-[11px]">
          All match advising discussions, MSPE unique characteristic reviews, and specialty competitiveness evaluations are governed by Family Educational Rights and Privacy Act (FERPA) regulations. For confidential questions regarding academic standing, adverse actions, or leave of absence documentation, please schedule directly with your Regional Associate Dean of Student Affairs.
        </p>
      </div>
    </div>
  );
}
