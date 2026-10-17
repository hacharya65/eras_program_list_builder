'use client';

import React, { useState } from 'react';
import {
  StudentAccount,
  DEMO_STUDENT_ACCOUNT,
  loadStudentRegistry,
  createStudentAccount,
  getStudentAccountByEmail,
  setCurrentStudentId,
  setAuthenticatedSession,
} from '@/domain/student-registry';
import {
  SpecialtyAdvisingIntake,
  saveStudentAdvisingIntake,
  CoreClerkshipGrades,
  ClerkshipGrade,
  ClerkshipEntry,
  calculateClerkshipHonorsCount,
  DEFAULT_INITIAL_CLERKSHIPS,
  US_CENSUS_DIVISIONS,
  INITIAL_MOCK_INTAKE,
} from '@/domain/advising-intake-models';
import { CANONICAL_SPECIALTIES } from '@/domain/school-list-models';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  GraduationCap,
  Award,
  BookOpen,
  Compass,
  AlertCircle,
  X,
  User,
  ShieldCheck,
  Check,
  ChevronRight,
  Stethoscope,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface ThalamusAuthExperienceProps {
  onAuthenticated: (studentAccount: StudentAccount) => void;
  initialMode?: 'signin' | 'guided_intake';
  initialStep?: number;
}

const TOTAL_STEPS = 12;

const POPULAR_SCHOOLS = [
  'Geisinger Commonwealth School of Medicine',
  'Penn State College of Medicine',
  'Johns Hopkins University SOM',
  'Perelman School of Medicine (Penn)',
  'Temple University Lewis Katz SOM',
  'Tufts University School of Medicine',
  'UCLA David Geffen School of Medicine',
  'University of Michigan Medical School',
];

export function ThalamusAuthExperience({
  onAuthenticated,
  initialMode = 'signin',
  initialStep = 1,
}: ThalamusAuthExperienceProps) {
  const [viewMode, setViewMode] = useState<'signin' | 'guided_intake'>(initialMode);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Sign In / Log In Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Guided Intake Wizard State (1 Question at a time)
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');

  // Step 1: Medical School
  const [medicalSchool, setMedicalSchool] = useState('');
  const [medicalSchoolError, setMedicalSchoolError] = useState<string | null>(null);

  // Step 2: Target Specialty
  const [specialty, setSpecialty] = useState('');

  // Step 3: Clinical Motivations
  const [specialtyInterestReason, setSpecialtyInterestReason] = useState('');

  // Step 4: USMLE Step 1
  const [step1Result, setStep1Result] = useState<'Pass' | 'Fail' | null>(null);

  // Step 5: USMLE Step 2 CK
  const [step2Status, setStep2Status] = useState<'score_available' | 'anticipated_date' | null>(null);
  const [step2Score, setStep2Score] = useState<string>('');
  const [step2AnticipatedDate, setStep2AnticipatedDate] = useState('');

  // Step 6: Step Failures / Disclosures
  const [hasStepFailures, setHasStepFailures] = useState<boolean | null>(null);
  const [stepFailureDetails, setStepFailureDetails] = useState('');

  // Step 7: Core Clinical Clerkships (starts with standard 7 core clerkships, student can add or remove)
  const [clerkships, setClerkships] = useState<ClerkshipEntry[]>(DEFAULT_INITIAL_CLERKSHIPS);
  const [customClerkshipInput, setCustomClerkshipInput] = useState('');

  // Step 8: Dedicated Research Year
  const [completedResearchYear, setCompletedResearchYear] = useState<boolean | null>(null);
  const [researchYearLocation, setResearchYearLocation] = useState('');

  // Step 9: Publications & Scholarship
  const [publications, setPublications] = useState<string>('');
  const [firstAuthorPubs, setFirstAuthorPubs] = useState<string>('');
  const [presentations, setPresentations] = useState<string>('');
  const [abstracts, setAbstracts] = useState<string>('');
  const [researchExperiences, setResearchExperiences] = useState<string>('');

  // Step 10: Work, Volunteer & Honor Societies
  const [volunteerExperiences, setVolunteerExperiences] = useState<string>('');
  const [workExperiences, setWorkExperiences] = useState<string>('');
  const [isAoaMember, setIsAoaMember] = useState(false);
  const [isGoldHumanism, setIsGoldHumanism] = useState(false);

  // Step 11: Geography & Census Divisions
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [residencyGoalsAndGeography, setResidencyGoalsAndGeography] = useState('');

  // Step 12: Account Creation
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [pronouns, setPronouns] = useState('');
  const [gradYear, setGradYear] = useState<string>('2027');
  const [accountError, setAccountError] = useState<string | null>(null);

  // Handle Log In submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setPasswordError(null);

    const clean = emailInput.trim().toLowerCase();
    let hasError = false;

    if (!clean) {
      setSignInError('This field cannot be left blank');
      hasError = true;
    }

    if (!passwordInput.trim()) {
      setPasswordError('This field cannot be left blank');
      hasError = true;
    }

    if (hasError) return;

    // Check if matching demo
    if (clean === DEMO_STUDENT_ACCOUNT.email.toLowerCase() || clean === 'alex.rivera@demo.edu' || clean === 'arivera@som.edu') {
      setCurrentStudentId(DEMO_STUDENT_ACCOUNT.id);
      setAuthenticatedSession(true);
      onAuthenticated(DEMO_STUDENT_ACCOUNT);
      return;
    }

    const account = getStudentAccountByEmail(clean);
    if (account) {
      if (account.password && account.password !== passwordInput.trim()) {
        setPasswordError('Incorrect password. Please try again.');
        return;
      }
      setCurrentStudentId(account.id);
      setAuthenticatedSession(true);
      onAuthenticated(account);
      return;
    }

    setSignInError('No account found for this email. Check your spelling or complete the guided intake below.');
  };

  // Quick Demo Login Action
  const handleQuickDemoLogin = () => {
    setCurrentStudentId(DEMO_STUDENT_ACCOUNT.id);
    setAuthenticatedSession(true);
    onAuthenticated(DEMO_STUDENT_ACCOUNT);
  };

  // Step Navigation in Guided Intake
  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!medicalSchool.trim()) {
        setMedicalSchoolError('Please enter or select the medical school you attend.');
        return;
      }
      setMedicalSchoolError(null);
    }

    if (currentStep < TOTAL_STEPS) {
      setStepDirection('forward');
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setStepDirection('backward');
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClerkshipGradeChange = (id: string, grade: ClerkshipGrade) => {
    setClerkships((prev) =>
      prev.map((c) => (c.id === id ? { ...c, grade: c.grade === grade ? null : grade } : c))
    );
  };

  const handleAddClerkship = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (clerkships.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCustomClerkshipInput('');
      return;
    }
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    const id = slug || `clerkship-${Date.now().toString(36)}`;
    setClerkships((prev) => [...prev, { id, name: trimmed, grade: null }]);
    setCustomClerkshipInput('');
  };

  const handleRemoveClerkship = (id: string) => {
    setClerkships((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResetClerkships = () => {
    setClerkships(DEFAULT_INITIAL_CLERKSHIPS.map((c) => ({ ...c, grade: null })));
  };

  const handleToggleDivision = (divName: string) => {
    if (selectedDivisions.includes(divName)) {
      setSelectedDivisions(selectedDivisions.filter((d) => d !== divName));
    } else {
      if (selectedDivisions.length >= 3) {
        alert('You may select a maximum of 3 Geographic Census Divisions per 2027 MyERAS Season Rules.');
        return;
      }
      setSelectedDivisions([...selectedDivisions, divName]);
    }
  };

  const resetIntakeForm = () => {
    setCurrentStep(1);
    setMedicalSchool('');
    setMedicalSchoolError(null);
    setSpecialty('');
    setSpecialtyInterestReason('');
    setStep1Result(null);
    setStep2Status(null);
    setStep2Score('');
    setStep2AnticipatedDate('');
    setHasStepFailures(null);
    setStepFailureDetails('');
    setClerkships(DEFAULT_INITIAL_CLERKSHIPS.map((c) => ({ ...c, grade: null })));
    setCustomClerkshipInput('');
    setCompletedResearchYear(null);
    setResearchYearLocation('');
    setPublications('');
    setFirstAuthorPubs('');
    setPresentations('');
    setAbstracts('');
    setResearchExperiences('');
    setVolunteerExperiences('');
    setWorkExperiences('');
    setIsAoaMember(false);
    setIsGoldHumanism(false);
    setSelectedDivisions([]);
    setResidencyGoalsAndGeography('');
    setAccountName('');
    setAccountEmail('');
    setAccountPassword('');
    setShowAccountPassword(false);
    setPronouns('');
    setGradYear('2027');
    setAccountError(null);
  };

  // Final Account Creation & Intake Dossier Persistence
  const handleFinalAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);

    if (!accountName.trim()) {
      setAccountError('Please enter your full name.');
      return;
    }
    if (!accountEmail.trim() || !accountEmail.includes('@')) {
      setAccountError('Please enter a valid institutional or personal email address.');
      return;
    }
    if (!accountPassword.trim()) {
      setAccountError('Please enter a password for your account.');
      return;
    }

    // 1. Create account
    const newAccount = createStudentAccount({
      name: accountName.trim(),
      email: accountEmail.trim(),
      password: accountPassword.trim(),
      medicalSchool: medicalSchool.trim(),
      specialty: specialty.trim() || 'Internal Medicine',
      pronouns: pronouns.trim() || 'they/them',
      gradYear: Number(gradYear) || 2027,
    });

    // 2. Compile full intake dossier
    const finalClerkshipGrades: CoreClerkshipGrades = {};
    clerkships.forEach((c) => {
      finalClerkshipGrades[c.id] = c.grade || 'Pass';
    });

    const fullIntake: SpecialtyAdvisingIntake = {
      ...INITIAL_MOCK_INTAKE,
      studentId: newAccount.id,
      studentName: newAccount.name,
      pronouns: pronouns.trim() || 'they/them',
      medicalSchool: medicalSchool.trim(),
      applyingSpecialty: specialty.trim() || 'Internal Medicine',
      specialtyInterestReason: specialtyInterestReason.trim(),
      submissionDate: new Date().toLocaleDateString('en-US'),
      regionalCampus: 'Main Campus',
      specialtyAdvisorName: 'Faculty Specialty Advisor',
      step1Result: step1Result || 'Pass',
      step2Status: step2Status || 'score_available',
      step2Score: step2Status === 'score_available' && step2Score ? Number(step2Score) : undefined,
      step2AnticipatedDate: step2Status === 'anticipated_date' ? step2AnticipatedDate.trim() : undefined,
      hasStepFailures: hasStepFailures === true,
      stepFailureDetails: hasStepFailures ? stepFailureDetails.trim() : undefined,
      completedResearchYear: completedResearchYear === true,
      researchYearLocation: completedResearchYear ? researchYearLocation.trim() : undefined,
      clerkshipGrades: finalClerkshipGrades,
      clerkshipEntries: clerkships.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade || 'Pass',
      })),
      hasAcademicFailuresOrRepeats: false,
      hasCapsOrProfessionalismConcerns: false,
      hasLeaveOfAbsence: false,
      consideringParallelPlan: false,
      futureRotationsTimeline: 'Standard MS4 Clinical Sub-Internship & Elective Schedule',
      externalAdvisors: 'None',
      residencyGoalsAndGeography: residencyGoalsAndGeography.trim(),
      myErasCensusDivisions: selectedDivisions,
      publications: Number(publications) || 0,
      firstAuthorPublications: Number(firstAuthorPubs) || 0,
      presentations: Number(presentations) || 0,
      abstracts: Number(abstracts) || 0,
      researchExperiences: Number(researchExperiences) || 0,
      volunteerExperiences: Number(volunteerExperiences) || 0,
      workExperiences: Number(workExperiences) || 0,
      isAoaMember,
      isGoldHumanism,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    };

    saveStudentAdvisingIntake(fullIntake);
    setAuthenticatedSession(true);
    onAuthenticated(newAccount);
  };

  const honorsCount = clerkships.filter((c) => c.grade === 'Honors').length;

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 1 of 12 &bull; Institution
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                What medical school do you currently attend?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Your medical school attended customizes your diagnostic advising profile and school list tiering.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Medical School Name
              </label>
              <input
                type="text"
                autoFocus
                value={medicalSchool}
                onChange={(e) => {
                  setMedicalSchool(e.target.value);
                  setMedicalSchoolError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    goToNextStep();
                  }
                }}
                placeholder="e.g. Penn State College of Medicine, Johns Hopkins, UCLA..."
                className={`w-full px-4 py-3 text-sm border rounded-xl bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3A30] transition-all ${
                  medicalSchoolError ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-300'
                }`}
              />
              {medicalSchoolError && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {medicalSchoolError}
                </p>
              )}
            </div>

            <div>
              <span className="text-[11px] font-medium text-neutral-500 block mb-2">
                Or select from common schools:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SCHOOLS.map((sch) => (
                  <button
                    key={sch}
                    type="button"
                    onClick={() => {
                      setMedicalSchool(sch);
                      setMedicalSchoolError(null);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                      medicalSchool === sch
                        ? 'bg-[#1F3A30] text-white border-[#1F3A30] font-semibold'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {sch}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 2 of 12 &bull; Applying Specialty
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                What specialty are you applying into for the 2027 Match?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Calibrates signaling rules (Gold vs. Silver budgets) and specialty-specific competitiveness thresholds.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Target Specialty
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border border-neutral-300 rounded-xl bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
              >
                <option value="" disabled>-- Select Target Applying Specialty --</option>
                {CANONICAL_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-medium text-neutral-500 block mb-2">
                Popular specialties:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Internal Medicine',
                  'Anesthesiology',
                  'General Surgery',
                  'Emergency Medicine',
                  'Pediatrics',
                  'Orthopaedic Surgery',
                  'Psychiatry',
                  'Obstetrics and Gynecology',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpecialty(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      specialty === s
                        ? 'bg-[#1F3A30] text-white border-[#1F3A30] font-semibold'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 3 of 12 &bull; Clinical Motivation
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                Why are you interested in {specialty || 'your chosen specialty'}?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Provide a brief statement of your clinical motivations, procedural vs cognitive balance, and fellowship aspirations.
              </p>
            </div>

            <div>
              <textarea
                rows={4}
                value={specialtyInterestReason}
                onChange={(e) => setSpecialtyInterestReason(e.target.value)}
                placeholder="Discuss what drew you to this discipline during clinical rotations, long-term career vision, or subspecialty goals..."
                className="w-full px-4 py-3 text-xs border border-neutral-300 rounded-xl bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 4 of 12 &bull; Examination Performance
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                What is your USMLE Step 1 examination result?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Standardized Pass/Fail outcome from your first administration.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep1Result('Pass')}
                className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                  step1Result === 'Pass'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500 font-bold'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold">
                  ✓
                </div>
                <div className="text-base font-bold">Pass</div>
                <span className="text-xs text-emerald-700 font-medium">Standard pass outcome</span>
              </button>

              <button
                type="button"
                onClick={() => setStep1Result('Fail')}
                className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                  step1Result === 'Fail'
                    ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-500 font-bold'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-2 font-bold">
                  !
                </div>
                <div className="text-base font-bold">Fail</div>
                <span className="text-xs text-rose-700 font-medium">Recorded with remediation</span>
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 5 of 12 &bull; Step 2 CK
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                What is your USMLE Step 2 CK status and score?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Your 3-digit score automatically benchmarks all 2,500+ ACGME residency programs into Reach, Target, and Safety tiers.
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setStep2Status('score_available')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  step2Status === 'score_available'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Score Available
              </button>
              <button
                type="button"
                onClick={() => setStep2Status('anticipated_date')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  step2Status === 'anticipated_date'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Pending Test Date
              </button>
            </div>

            {step2Status === 'score_available' && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950">
                    Step 2 CK Three-Digit Score (150 – 300)
                  </label>
                  <input
                    type="number"
                    min={150}
                    max={300}
                    value={step2Score}
                    onChange={(e) => setStep2Score(e.target.value)}
                    placeholder="Enter score"
                    className="w-28 text-right px-3 py-1.5 text-base font-bold text-emerald-900 font-mono bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                  />
                </div>
                <input
                  type="range"
                  min={180}
                  max={285}
                  value={step2Score ? Number(step2Score) : 240}
                  onChange={(e) => setStep2Score(e.target.value)}
                  className="w-full accent-[#1F3A30] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-emerald-800">
                  <span>180</span>
                  <span>220 (Passing)</span>
                  <span>240</span>
                  <span>260+</span>
                  <span>285</span>
                </div>
              </div>
            )}
            {step2Status === 'anticipated_date' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700">
                  Anticipated Step 2 CK Exam Date
                </label>
                <input
                  type="text"
                  value={step2AnticipatedDate}
                  onChange={(e) => setStep2AnticipatedDate(e.target.value)}
                  placeholder="e.g. July 2026, August 2026"
                  className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                />
              </div>
            )}
            {step2Status === null && (
              <p className="text-xs text-neutral-500 italic pt-1">
                Please select whether you currently have a 3-digit score or a pending test date.
              </p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 6 of 12 &bull; Academic Disclosures
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                Do you have any USMLE exam failures or repeats to disclose?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Transparent disclosure enables your advising team to formulate safety net and signaling strategy.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setHasStepFailures(false);
                  setStepFailureDetails('');
                }}
                className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  hasStepFailures === false
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                No exam failures
              </button>
              <button
                type="button"
                onClick={() => setHasStepFailures(true)}
                className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  hasStepFailures === true
                    ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Yes, disclosure required
              </button>
            </div>

            {hasStepFailures && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-rose-900 mb-1">
                  Specify details (exam, date, passing re-attempt)
                </label>
                <textarea
                  rows={2}
                  value={stepFailureDetails}
                  onChange={(e) => setStepFailureDetails(e.target.value)}
                  placeholder="e.g. Step 1 first attempt Fail (Jan 2025), passed second attempt (April 2025)..."
                  className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Question 7 of 12 &bull; Clinical Clerkships
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                  What are your Core Clinical Clerkship grades?
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Clerkship honors heavily influence specialty competitiveness. Add or remove rotations to match your medical school curriculum.
                </p>
              </div>
              <div className="bg-[#EAF2EE] border border-[#7EAE9B] px-3.5 py-1.5 rounded-xl text-center shrink-0">
                <span className="text-lg font-bold text-[#1F3A30] font-mono block leading-none">
                  {honorsCount} / {clerkships.length}
                </span>
                <span className="text-[10px] text-emerald-800 font-medium">Core Honors</span>
              </div>
            </div>

            {/* Clerkship List */}
            <div className="space-y-2 pt-1 max-h-[290px] overflow-y-auto pr-1">
              {clerkships.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveClerkship(c.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title={`Remove ${c.name}`}
                      aria-label={`Remove ${c.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold text-neutral-800 truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(['Honors', 'High Pass', 'Pass'] as ClerkshipGrade[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleClerkshipGradeChange(c.id, g)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          c.grade === g
                            ? g === 'Honors'
                              ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                              : 'bg-[#1F3A30] text-white shadow-2xs font-bold'
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {clerkships.length === 0 && (
                <div className="p-4 text-center border border-dashed border-neutral-300 rounded-xl text-neutral-500 text-xs space-y-2">
                  <p>No clerkships currently listed.</p>
                  <button
                    type="button"
                    onClick={handleResetClerkships}
                    className="px-3 py-1.5 bg-[#EAF2EE] text-[#1F3A30] font-bold rounded-lg text-xs hover:bg-[#D6E5DF] cursor-pointer"
                  >
                    Restore Standard 7 Core Clerkships
                  </button>
                </div>
              )}
            </div>

            {/* Add Custom Clerkship Field */}
            <div className="pt-2 border-t border-neutral-100 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customClerkshipInput}
                  onChange={(e) => setCustomClerkshipInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddClerkship(customClerkshipInput);
                    }
                  }}
                  placeholder="Add another clerkship (e.g. Emergency Medicine, Sub-I, Radiology...)"
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                />
                <button
                  type="button"
                  onClick={() => handleAddClerkship(customClerkshipInput)}
                  disabled={!customClerkshipInput.trim()}
                  className="px-3.5 py-2 bg-[#1F3A30] hover:bg-[#162D25] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Quick Add Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-neutral-500 font-medium">Quick add:</span>
                {[
                  'Emergency Medicine',
                  'Anesthesiology',
                  'Dermatology',
                  'Radiology',
                  'Sub-Internship (Sub-I)',
                  'Critical Care / ICU',
                  'Orthopaedic Surgery',
                ]
                  .filter((name) => !clerkships.some((c) => c.name.toLowerCase() === name.toLowerCase()))
                  .slice(0, 5)
                  .map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleAddClerkship(name)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5 text-neutral-500" />
                      <span>{name}</span>
                    </button>
                  ))}
              </div>

              {/* Reset link if list is modified */}
              {(clerkships.length !== 7 || !clerkships.every((c, i) => c.id === DEFAULT_INITIAL_CLERKSHIPS[i]?.id)) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleResetClerkships}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to standard 7 core clerkships</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 8 of 12 &bull; Research Year
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                Did you complete a dedicated research fellowship year?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Formal 1-year research tracks or post-baccalaureate fellowships (e.g. NIH, Sarnoff, Howard Hughes).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompletedResearchYear(false);
                  setResearchYearLocation('');
                }}
                className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                  completedResearchYear === false
                    ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                No dedicated research year
              </button>
              <button
                type="button"
                onClick={() => setCompletedResearchYear(true)}
                className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                  completedResearchYear === true
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500 font-bold'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Yes, completed research year
              </button>
            </div>

            {completedResearchYear && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Institution or Laboratory Location
                </label>
                <input
                  type="text"
                  value={researchYearLocation}
                  onChange={(e) => setResearchYearLocation(e.target.value)}
                  placeholder="e.g. National Institutes of Health (NIH), Harvard Medical School"
                  className="w-full px-4 py-3 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                />
              </div>
            )}
          </div>
        );

      case 9:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 9 of 12 &bull; Scholarship & Research
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                Quantify your academic &amp; scholarly accomplishments
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Enter your current totals as reported on your CV and pre-season ERAS worksheet.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Peer-Reviewed Pubs',
                  val: publications,
                  set: setPublications,
                },
                {
                  label: 'First-Author Pubs',
                  val: firstAuthorPubs,
                  set: setFirstAuthorPubs,
                },
                {
                  label: 'Presentations & Posters',
                  val: presentations,
                  set: setPresentations,
                },
                {
                  label: 'Scientific Abstracts',
                  val: abstracts,
                  set: setAbstracts,
                },
                {
                  label: 'Research Experiences',
                  val: researchExperiences,
                  set: setResearchExperiences,
                },
              ].map(({ label, val, set }) => (
                <div key={label} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1.5">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => set(String(Math.max(0, (parseInt(val) || 0) - 1)))}
                      className="w-7 h-7 rounded-lg bg-white border border-neutral-300 font-bold text-xs hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder="0"
                      className="w-14 text-center text-sm font-bold bg-white border border-neutral-300 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#1F3A30]"
                    />
                    <button
                      type="button"
                      onClick={() => set(String((parseInt(val) || 0) + 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-neutral-300 font-bold text-xs hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 10 of 12 &bull; Experiences &amp; Honors
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                Work, Volunteer &amp; Honor Societies
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Quantify your work experiences and community volunteerism evaluated in NRMP Charting Outcomes benchmarking.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Volunteer Experiences Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={volunteerExperiences}
                  onChange={(e) => setVolunteerExperiences(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1F3A30]"
                />
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Work Experiences Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={workExperiences}
                  onChange={(e) => setWorkExperiences(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1F3A30]"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-neutral-800">
                <input
                  type="checkbox"
                  checked={isAoaMember}
                  onChange={(e) => setIsAoaMember(e.target.checked)}
                  className="rounded border-neutral-300 text-[#1F3A30] focus:ring-[#7EAE9B]"
                />
                <span>Alpha Omega Alpha (AOA)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-neutral-800">
                <input
                  type="checkbox"
                  checked={isGoldHumanism}
                  onChange={(e) => setIsGoldHumanism(e.target.checked)}
                  className="rounded border-neutral-300 text-[#1F3A30] focus:ring-[#7EAE9B]"
                />
                <span>Gold Humanism Honor Society (GHHS)</span>
              </label>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Question 11 of 12 &bull; Geographic Preferences
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                Which 2027 U.S. Census Divisions align with your strategy?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Per 2027 MyERAS Season Rules, applicants can select up to 3 official geographic census divisions.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
              <span>Select up to 3 regions:</span>
              <span className="font-mono text-[#1F3A30] font-bold">
                {selectedDivisions.length} / 3 selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.keys(US_CENSUS_DIVISIONS).map((divName) => {
                const isSelected = selectedDivisions.includes(divName);
                return (
                  <button
                    key={divName}
                    type="button"
                    onClick={() => handleToggleDivision(divName)}
                    className={`text-xs px-3.5 py-2 rounded-xl font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1F3A30] text-white border-[#1F3A30] font-bold shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    {divName}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Residency Goals (Academic vs Community, fellowship paths)
              </label>
              <textarea
                rows={2}
                value={residencyGoalsAndGeography}
                onChange={(e) => setResidencyGoalsAndGeography(e.target.value)}
                placeholder="e.g. Clinician-educator track, cardiology fellowship ambitions, East Coast urban academic centers..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
              />
            </div>
          </div>
        );

      case 12:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Final Step 12 of 12 &bull; Create Your Account
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-2">
                Create Your Account &amp; Launch Strategy Portal
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                All your intake metrics, clerkship honors, and scores will be configured directly in your personal workspace.
              </p>
            </div>

            {accountError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{accountError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="w-full px-4 py-2.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="e.g. jsmith@som.edu"
                    className="w-full px-4 py-2.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAccountPassword ? 'text' : 'password'}
                      required
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder="Create account password"
                      className="w-full px-4 py-2.5 pr-10 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountPassword(!showAccountPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      title={showAccountPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAccountPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Pronouns
                  </label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g. she/her, he/him, they/them"
                    className="w-full px-4 py-2.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min="2024"
                    max="2032"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    placeholder="2027"
                    className="w-full px-4 py-2.5 text-xs border border-neutral-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A30]"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-1">
                <div><strong>Attending School:</strong> {medicalSchool || 'Medical School'}</div>
                <div><strong>Target Specialty:</strong> {specialty}</div>
                <div><strong>Step 2 CK Benchmark:</strong> {step2Status === 'score_available' ? step2Score : 'Pending'}</div>
                <div><strong>Core Clerkship Honors:</strong> {honorsCount} of {clerkships.length}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-4 sm:p-6 relative text-neutral-900">
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#1F3A30]" />
                <h3 className="font-bold text-neutral-900 text-sm">Ethmoid Match Strategy Support</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-neutral-600 space-y-2 leading-relaxed">
              <p>
                <strong>Ethmoid</strong> is an applicant decision-support platform designed to help medical students gauge their competitiveness, build balanced reach/target/safety school lists, and optimize signal allocation for the 2027 AAMC Match.
              </p>
              <p>
                You can log in with your institutional email, use the <strong>Alex Rivera Demo Account</strong> to explore immediately, or complete the 12-step guided intake to set up a new profile.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#1F3A30] text-white rounded-xl text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full max-w-xl">
        {viewMode === 'signin' ? (
          /* Thalamus-Style Minimal Sign-In Card */
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-lg p-8 sm:p-10 space-y-6 animate-fade-in">
            {/* Logo & Brand Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs mx-auto flex items-center justify-center p-2">
                <img
                  src="/ethmoid-square.jpeg"
                  alt="Ethmoid logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Ethmoid
                </h1>
              </div>
            </div>

            {/* Log In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 text-left">
                  Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setSignInError(null);
                  }}
                  placeholder="applicant@som.edu"
                  className={`w-full px-4 py-3 text-sm rounded-xl border bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3A30] transition-all ${
                    signInError ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-300'
                  }`}
                />
                {signInError && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium text-left">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{signInError}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-700 text-left">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Enter password"
                    className={`w-full px-4 py-3 pr-11 text-sm rounded-xl border bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1F3A30] transition-all ${
                      passwordError ? 'border-rose-400 ring-1 ring-rose-300' : 'border-neutral-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium text-left">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Primary Log In Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#1F3A30] hover:bg-[#162D25] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Log In</span>
              </button>

              {/* Quick Demo Login Button */}
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#EAF2EE] hover:bg-[#D6E5DF] text-[#1F3A30] font-bold text-xs border border-[#7EAE9B]/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1F3A30]" />
                <span>Quick Demo: Log In as Alex Rivera (MS4)</span>
              </button>
            </form>

            {/* Guided Intake Link */}
            <div className="pt-4 border-t border-neutral-100 text-center space-y-2">
              <span className="text-xs text-neutral-500 block">
                First time here or applying in a new cohort?
              </span>
              <button
                type="button"
                onClick={() => {
                  resetIntakeForm();
                  setViewMode('guided_intake');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#1F3A30]/40 text-[#1F3A30] hover:bg-[#EAF2EE] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Complete 1-Question Intake Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* 1-Question-at-a-Time Guided Intake Experience */
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xl overflow-hidden animate-fade-in flex flex-col">
            {/* Top Progress Bar */}
            <div className="w-full bg-neutral-100 h-1.5">
              <div
                className="bg-[#1F3A30] h-1.5 transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {/* Header Controls */}
            <div className="p-6 pb-2 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/ethmoid-square.jpeg"
                  alt="Ethmoid logo"
                  className="w-6 h-6 object-contain rounded-md"
                />
                <span className="font-bold text-xs text-neutral-800">
                  Ethmoid Onboarding Intake
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('signin')}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
              >
                Exit to Log In
              </button>
            </div>

            {/* Question Body */}
            <div className="p-6 sm:p-8 flex-1 min-h-[380px] flex flex-col justify-between">
              <div>{renderStepContent()}</div>

              {/* Bottom Buttons */}
              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between gap-3 mt-6">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1F3A30] hover:bg-[#162D25] shadow-xs transition-all cursor-pointer ml-auto"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalAccountSubmit}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all cursor-pointer ml-auto"
                  >
                    <span>Launch Strategy Portal</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Demonstration Tagline */}
        <div className="mt-6 text-center text-xs text-neutral-400">
          <span>Ethmoid &bull; 2026/2027 Residency Match Strategy &amp; Decision Support</span>
        </div>
      </div>

      {/* Floating Bottom-Right Help Button (Thalamus Style) */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#1F3A30] hover:bg-[#162D25] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer z-40"
        title="Help & Strategy Guidance"
        aria-label="Help"
      >
        <span className="font-bold text-base">?</span>
      </button>
    </div>
  );
}
