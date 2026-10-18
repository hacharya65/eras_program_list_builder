'use client';

import React, { useState, useEffect } from 'react';
import {
  StudentAccount,
  loadStudentRegistry,
  createStudentAccount,
  setCurrentStudentId,
} from '@/domain/student-registry';
import {
  SpecialtyAdvisingIntake,
  saveStudentAdvisingIntake,
  INITIAL_MOCK_INTAKE,
  DEFAULT_CLERKSHIP_GRADES,
  CoreClerkshipGrades,
  ClerkshipGrade,
  CareerDirection,
  US_CENSUS_DIVISIONS,
} from '@/domain/advising-intake-models';
import {
  setStoredApplicantStep2Ck,
  setStoredTargetSpecialty,
  APPLICANT_PROFILE_STORAGE_KEY,
  CANONICAL_SPECIALTIES,
} from '@/domain/school-list-models';
import { MedicalSchoolCombobox } from './MedicalSchoolCombobox';
import { isValidMedicalSchool } from '@/domain/medical-schools-database';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  UserCheck,
  Plus,
  LogIn,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  School,
  X,
} from 'lucide-react';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthenticated: (studentAccount: StudentAccount) => void;
  initialMode?: 'login' | 'register';
}

export function StudentAuthModal({
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'register',
}: StudentAuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  const [registry, setRegistry] = useState<StudentAccount[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Form State for Combined Intake Registration
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pronouns, setPronouns] = useState('he/him/his');
  const [medicalSchool, setMedicalSchool] = useState('');
  const [gradYear, setGradYear] = useState<number>(2027);
  const [specialty, setSpecialty] = useState('Internal Medicine');

  // Academic & USMLE
  const [step1Result, setStep1Result] = useState<'Pass' | 'Fail'>('Pass');
  const [step2Status, setStep2Status] = useState<'score_available' | 'anticipated_date'>('score_available');
  const [step2Score, setStep2Score] = useState<number>(254);
  const [step2AnticipatedDate, setStep2AnticipatedDate] = useState('');
  const [hasStepFailures, setHasStepFailures] = useState(false);
  const [stepFailureDetails, setStepFailureDetails] = useState('');

  // 7 Core Clerkship Grades
  const [clerkshipGrades, setClerkshipGrades] = useState<CoreClerkshipGrades>({
    internalMedicine: 'Honors',
    surgery: 'High Pass',
    pediatrics: 'Honors',
    obGyn: 'High Pass',
    psychiatry: 'Honors',
    familyMedicine: 'High Pass',
    neurology: 'Honors',
  });

  // Portfolio Metrics
  const [medicalSchoolTier, setMedicalSchoolTier] = useState('State / Mid-Tier');
  const [publications, setPublications] = useState<number>(2);
  const [firstAuthorPubs, setFirstAuthorPubs] = useState<number>(1);
  const [presentations, setPresentations] = useState<number>(3);
  const [abstracts, setAbstracts] = useState<number>(2);
  const [researchExperiences, setResearchExperiences] = useState<number>(3);
  const [completedResearchYear, setCompletedResearchYear] = useState(false);
  const [researchYearLocation, setResearchYearLocation] = useState('');
  const [volunteerExperiences, setVolunteerExperiences] = useState<number>(4);
  const [leadershipHours, setLeadershipHours] = useState<number>(80);
  const [isAoaMember, setIsAoaMember] = useState(false);
  const [isGoldHumanism, setIsGoldHumanism] = useState(false);

  // Narrative & Goals
  const [specialtyInterestReason, setSpecialtyInterestReason] = useState('');
  const [residencyGoalsAndGeography, setResidencyGoalsAndGeography] = useState('');
  const [careerDirection, setCareerDirection] = useState<CareerDirection>('fellowship');
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(['Middle Atlantic', 'New England']);
  const [consideringParallelPlan, setConsideringParallelPlan] = useState(false);
  const [parallelPlanSpecialty, setParallelPlanSpecialty] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRegistry(loadStudentRegistry());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStudents = registry.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.medicalSchool.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.specialty.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleSelectExistingStudent = (student: StudentAccount) => {
    setCurrentStudentId(student.id);
    setStoredTargetSpecialty(student.specialty);
    onAuthenticated(student);
  };

  const handleClerkshipChange = (key: keyof CoreClerkshipGrades, grade: ClerkshipGrade) => {
    setClerkshipGrades((prev) => ({ ...prev, [key]: grade }));
  };

  const handleToggleDivision = (divName: string) => {
    if (selectedDivisions.includes(divName)) {
      setSelectedDivisions(selectedDivisions.filter((d) => d !== divName));
    } else {
      if (selectedDivisions.length >= 3) {
        alert('You may select up to 3 preferred Geographic Census Divisions.');
        return;
      }
      setSelectedDivisions([...selectedDivisions, divName]);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!medicalSchool.trim() || !isValidMedicalSchool(medicalSchool)) {
      setFormError('Please select your accredited medical school directly from the dropdown list.');
      return;
    }

    try {
      // 1. Create or update student account in registry
      const account = createStudentAccount({
        name: name.trim(),
        email: email.trim(),
        medicalSchool: medicalSchool.trim(),
        specialty,
        pronouns,
        gradYear: Number(gradYear) || 2027,
      });

      // 2. Build combined specialty intake dossier
      const intakeData: SpecialtyAdvisingIntake = {
        ...INITIAL_MOCK_INTAKE,
        studentId: account.id,
        studentName: account.name,
        pronouns,
        medicalSchool: account.medicalSchool,
        submissionDate: new Date().toLocaleDateString('en-US'),
        applyingSpecialty: specialty,
        specialtyInterestReason: specialtyInterestReason.trim() || `Dedicated interest in ${specialty} clinical practice.`,
        hasStepFailures,
        stepFailureDetails: hasStepFailures ? stepFailureDetails.trim() : undefined,
        step1Result,
        step2Status,
        step2Score: step2Status === 'score_available' ? Number(step2Score) : undefined,
        step2AnticipatedDate: step2Status === 'anticipated_date' ? step2AnticipatedDate : undefined,
        completedResearchYear,
        researchYearLocation: completedResearchYear ? researchYearLocation.trim() : undefined,
        clerkshipGrades,
        hasAcademicFailuresOrRepeats: false,
        hasCapsOrProfessionalismConcerns: false,
        hasLeaveOfAbsence: false,
        consideringParallelPlan,
        parallelPlanSpecialty: consideringParallelPlan ? parallelPlanSpecialty : undefined,
        futureRotationsTimeline: 'Standard MS4 Clinical Sub-Internship & Elective Schedule',
        externalAdvisors: 'None',
        residencyGoalsAndGeography: residencyGoalsAndGeography.trim() || 'Balanced academic & community program search.',
        careerDirection,
        myErasCensusDivisions: selectedDivisions,
        publications: Number(publications) || 0,
        firstAuthorPublications: Number(firstAuthorPubs) || 0,
        presentations: Number(presentations) || 0,
        abstracts: Number(abstracts) || 0,
        researchExperiences: Number(researchExperiences) || 0,
        volunteerExperiences: Number(volunteerExperiences) || 0,
        leadershipHours: Number(leadershipHours) || 0,
        isAoaMember,
        isGoldHumanism,
        medicalSchoolTier,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };

      // 3. Save intake
      saveStudentAdvisingIntake(intakeData);

      // 4. Update Step 2 CK & Target Specialty global helpers
      if (step2Status === 'score_available' && step2Score) {
        setStoredApplicantStep2Ck(Number(step2Score));
      }
      setStoredTargetSpecialty(specialty);

      // 5. Update Applicant Profile data in storage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const applicantProfile = {
          step2Ck: Number(step2Score) || 250,
          step1Result,
          clerkshipHonors: Object.values(clerkshipGrades).filter((g) => g === 'Honors').length,
          publications: Number(publications) || 0,
          researchExperiences: Number(researchExperiences) || 0,
          abstracts: Number(abstracts) || 0,
          presentations: Number(presentations) || 0,
          leadershipHours: Number(leadershipHours) || 0,
          volunteerExperiences: Number(volunteerExperiences) || 0,
          isAoaMember,
        };
        localStorage.setItem(APPLICANT_PROFILE_STORAGE_KEY, JSON.stringify(applicantProfile));
      }

      onAuthenticated(account);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving your intake profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-6 shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="bg-[#1F3A30] text-white p-6 sm:p-7 relative shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Ethmoid Match Strategy</h2>
              <p className="text-xs text-white/80">
                Evidence-Based Residency List Building &amp; Signaling Workspace
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4 bg-black/20 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-[#1F3A30] font-bold shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Student Intake</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-[#1F3A30] font-bold shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Switch / Existing Student ({registry.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* ===================== MODE 1: EXISTING STUDENT LOGIN ===================== */}
          {authMode === 'login' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Select or Search Student Account ({registry.length} registered)
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Choose a student profile to load their customized school list, signaling strategy, and reflective journal.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by student name, school, email, or specialty..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No student accounts matched your query.
                  </div>
                ) : (
                  filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectExistingStudent(s)}
                      className="w-full text-left p-4 rounded-2xl border border-neutral-200/90 hover:border-[#1F3A30] hover:bg-[#F4F8F6] transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1F3A30] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-neutral-900 group-hover:text-[#1F3A30]">
                            {s.name}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {s.medicalSchool} &bull; <strong className="text-neutral-700">{s.specialty}</strong>
                          </div>
                          <div className="text-[11px] text-neutral-400">{s.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-[#1F3A30] shrink-0">
                        <span>Launch &rarr;</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* ===================== MODE 2: COMBINED UNIFIED INTAKE REGISTRATION ===================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-7">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Applicant Demographics & Medical School */}
              <div className="bg-[#FAFBF9] rounded-2xl border border-neutral-200/80 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200/80">
                  <UserCheck className="w-4 h-4 text-[#1F3A30]" />
                  <span>1. Applicant Profile &amp; Medical School</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Hayes"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jhayes@som.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Medical School You Attend *
                    </label>
                    <MedicalSchoolCombobox
                      value={medicalSchool}
                      onChange={(sch) => setMedicalSchool(sch)}
                      placeholder="Search or select from 255 accredited medical schools..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Applying Specialty *
                    </label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-xl bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer"
                    >
                      {CANONICAL_SPECIALTIES.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Pronouns
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. she/her, he/him, they/them"
                      value={pronouns}
                      onChange={(e) => setPronouns(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Graduation Year
                    </label>
                    <select
                      value={gradYear}
                      onChange={(e) => setGradYear(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-xl bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B] cursor-pointer"
                    >
                      <option value={2026}>Class of 2026 (MS4)</option>
                      <option value={2027}>Class of 2027 (MS4 / Rising)</option>
                      <option value={2028}>Class of 2028 (MS3)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: USMLE & Core Academic Status */}
              <div className="bg-[#FAFBF9] rounded-2xl border border-neutral-200/80 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200/80">
                  <Award className="w-4 h-4 text-[#1F3A30]" />
                  <span>2. USMLE Exams &amp; Core Clerkship Transcript</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Step 1 Result
                    </label>
                    <select
                      value={step1Result}
                      onChange={(e) => setStep1Result(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-xl bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                    >
                      <option value="Pass">Pass (First Attempt)</option>
                      <option value="Fail">Prior Fail Attempt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Step 2 CK Status
                    </label>
                    <select
                      value={step2Status}
                      onChange={(e) => setStep2Status(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-xl bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                    >
                      <option value="score_available">Score Available</option>
                      <option value="anticipated_date">Anticipated Test Date</option>
                    </select>
                  </div>

                  {step2Status === 'score_available' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Step 2 CK Score *
                      </label>
                      <input
                        type="number"
                        min={194}
                        max={300}
                        required
                        value={step2Score}
                        onChange={(e) => setStep2Score(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-xs font-bold border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Anticipated Test Date
                      </label>
                      <input
                        type="date"
                        required
                        value={step2AnticipatedDate}
                        onChange={(e) => setStep2AnticipatedDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                      />
                    </div>
                  )}
                </div>

                {/* 7 Core Clerkship Transcript */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    7 Core Clerkship Grades
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'internalMedicine', label: 'Internal Medicine' },
                      { key: 'surgery', label: 'Surgery' },
                      { key: 'pediatrics', label: 'Pediatrics' },
                      { key: 'obgyn', label: 'OB/GYN' },
                      { key: 'psychiatry', label: 'Psychiatry' },
                      { key: 'familyMedicine', label: 'Family Medicine' },
                      { key: 'neurology', label: 'Neurology' },
                    ].map(({ key, label }) => (
                      <div key={key} className="bg-white p-2 rounded-xl border border-neutral-200">
                        <div className="text-[10px] font-bold text-neutral-600 truncate">{label}</div>
                        <select
                          value={clerkshipGrades[key as keyof CoreClerkshipGrades]}
                          onChange={(e) =>
                            handleClerkshipChange(key as keyof CoreClerkshipGrades, e.target.value as ClerkshipGrade)
                          }
                          className="mt-1 w-full text-[11px] font-semibold border-0 bg-neutral-100 rounded p-1 text-neutral-800"
                        >
                          <option value="Honors">Honors</option>
                          <option value="High Pass">High Pass</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Portfolio & Research Metrics */}
              <div className="bg-[#FAFBF9] rounded-2xl border border-neutral-200/80 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200/80">
                  <BookOpen className="w-4 h-4 text-[#1F3A30]" />
                  <span>3. Research, Publications &amp; Honor Societies</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Peer-Reviewed Pubs
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={publications}
                      onChange={(e) => setPublications(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      1st Author Pubs
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={firstAuthorPubs}
                      onChange={(e) => setFirstAuthorPubs(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Presentations
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={presentations}
                      onChange={(e) => setPresentations(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Abstracts
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={abstracts}
                      onChange={(e) => setAbstracts(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Research Experiences
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={researchExperiences}
                      onChange={(e) => setResearchExperiences(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      Volunteer Experiences
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={volunteerExperiences}
                      onChange={(e) => setVolunteerExperiences(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                      School Category / Tier
                    </label>
                    <select
                      value={medicalSchoolTier}
                      onChange={(e) => setMedicalSchoolTier(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="Top 25">Top 25 Research / NIH</option>
                      <option value="Top 50">Top 50</option>
                      <option value="State / Mid-Tier">State / Established Mid-Tier</option>
                      <option value="Community / Newer">Community-Focused / Newer</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap items-center gap-5 pt-1 text-xs font-medium text-neutral-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAoaMember}
                      onChange={(e) => setIsAoaMember(e.target.checked)}
                      className="rounded border-neutral-300 text-[#1F3A30] focus:ring-[#7EAE9B]"
                    />
                    <span>Alpha Omega Alpha (AOA) Member</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGoldHumanism}
                      onChange={(e) => setIsGoldHumanism(e.target.checked)}
                      className="rounded border-neutral-300 text-[#1F3A30] focus:ring-[#7EAE9B]"
                    />
                    <span>Gold Humanism Honor Society (GHHS)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={completedResearchYear}
                      onChange={(e) => setCompletedResearchYear(e.target.checked)}
                      className="rounded border-neutral-300 text-[#1F3A30] focus:ring-[#7EAE9B]"
                    />
                    <span>Completed Dedicated Research Year</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Specialty Narrative & Geographic Preferences */}
              <div className="bg-[#FAFBF9] rounded-2xl border border-neutral-200/80 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200/80">
                  <Sparkles className="w-4 h-4 text-[#1F3A30]" />
                  <span>4. Clinical Narrative &amp; Geographic Preferences</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Why {specialty}? (Narrative Reason)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly state what drives your interest in this field and your long-term clinical vision..."
                    value={specialtyInterestReason}
                    onChange={(e) => setSpecialtyInterestReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7EAE9B]"
                  />
                </div>

                {/* Census Divisions */}
                <div>
                  <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Preferred U.S. Census Divisions (Select up to 3 for MyERAS geographic alignment)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(US_CENSUS_DIVISIONS).map((divName) => {
                      const isSel = selectedDivisions.includes(divName);
                      return (
                        <button
                          key={divName}
                          type="button"
                          onClick={() => handleToggleDivision(divName)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#1F3A30] text-white border-[#1F3A30] font-bold'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          {divName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1F3A30] hover:bg-[#152B23] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Save Intake &amp; Enter Match Strategy Hub</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
