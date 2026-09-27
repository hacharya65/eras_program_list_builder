export interface AlumniResident {
  id: string;
  name: string;
  graduationYear: number;
  currentPgy: string;
  medicalSchool: string;
  institutionName: string;
  specialty: string;
  programCity: string;
  programState: string;
  isAvailableForMentorship: boolean;
  contactPreference: 'email' | 'virtual_coffee' | 'text' | 'residency_chat';
  email: string;
  doximityProfileUrl?: string;
  adviceQuote?: string;
  acgmeProgramId?: string;
  pgyOverride?: string;
  verificationStatus?: 'verified' | 're_attestation_pending';
  lastVerifiedPeriod?: string;
  lastVerifiedAt?: string;
}

export const SPECIALTY_TRAINING_YEARS: Record<string, number> = {
  'Internal Medicine': 3,
  'Pediatrics': 3,
  'Family Medicine': 3,
  'Emergency Medicine': 3,
  'Psychiatry': 4,
  'Obstetrics and Gynecology': 4,
  'Anesthesiology': 4,
  'Pathology': 4,
  'Neurology': 4,
  'Diagnostic Radiology': 5,
  'General Surgery': 5,
  'Orthopedic Surgery': 5,
  'Otolaryngology': 5,
  'Urology': 5,
  'Plastic Surgery (Integrated)': 6,
  'Neurological Surgery': 7,
  'Thoracic Surgery (Integrated)': 6,
  'Vascular Surgery (Integrated)': 5,
};

/**
 * Perpetually calculates the training stage / PGY of an alumnus
 * based on graduation year, current date, and July 1st academic rollover.
 */
export function calculateCurrentPgy(
  graduationYear: number,
  currentDate: Date = new Date(),
  override?: string,
  specialty?: string
): string {
  if (override && override.trim()) {
    return override.trim();
  }

  const currentYear = currentDate.getFullYear();
  // July 1 of current year
  const julyFirstCurrentYear = new Date(currentYear, 6, 1);
  const isAfterJulyFirst = currentDate.getTime() >= julyFirstCurrentYear.getTime();

  // If student is graduating this year before July 1 or graduating in future years
  if (graduationYear > currentYear || (graduationYear === currentYear && !isAfterJulyFirst)) {
    return 'Incoming PGY-1';
  }

  // Calculate elapsed academic years starting from July 1 of graduation year
  let pgyNumber = currentYear - graduationYear;
  if (isAfterJulyFirst) {
    pgyNumber += 1;
  }

  if (pgyNumber <= 0) {
    return 'Incoming PGY-1';
  }

  const trainingLength = (specialty && SPECIALTY_TRAINING_YEARS[specialty]) || 3;
  if (pgyNumber > trainingLength) {
    return 'Fellow / Attending';
  }

  return `PGY-${pgyNumber}`;
}

export interface ProgramAlumniSummary {
  institutionName: string;
  specialty: string;
  totalAlumni: number;
  availableMentors: number;
  recentMatchYears: number[];
  doximityReviewUrl: string;
  residents: AlumniResident[];
}

export interface OutreachTemplate {
  subject: string;
  body: string;
  dos: string[];
  donts: string[];
}

export const SAMPLE_ALUMNI_ROSTER: AlumniResident[] = [
  {
    id: 'alum-1',
    name: 'Dr. Sarah Jenkins',
    graduationYear: 2024,
    currentPgy: 'PGY-2',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Massachusetts General Hospital',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: true,
    contactPreference: 'virtual_coffee',
    email: 'sjenkins@mgh.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/sarah-jenkins-md',
    adviceQuote: 'MGH values distinct scholarly curiosity. If you are reaching out, connect early with the APD in your subspecialty of interest.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  },
  {
    id: 'alum-2',
    name: 'Dr. David Okafor',
    graduationYear: 2023,
    currentPgy: 'PGY-3',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Massachusetts General Hospital',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: true,
    contactPreference: 'email',
    email: 'dokafor@mgh.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/david-okafor-md',
    adviceQuote: 'The clinical autonomy here is incredible. Make sure your personal statement highlights specific clinical scenarios where you took ownership.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  },
  {
    id: 'alum-3',
    name: 'Dr. Emily Chen',
    graduationYear: 2025,
    currentPgy: 'PGY-1',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Brigham and Women’s Hospital',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: true,
    contactPreference: 'email',
    email: 'echen@bwh.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/emily-chen-md',
    adviceQuote: 'BWH has a warm, supportive resident culture. Focus on describing team collaboration and health equity passions in your experiences.',
    verificationStatus: 're_attestation_pending',
    lastVerifiedPeriod: '2024–2025 Academic Year',
    lastVerifiedAt: '2024-07-01',
  },
  {
    id: 'alum-4',
    name: 'Dr. Marcus Vance',
    graduationYear: 2024,
    currentPgy: 'PGY-2',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Brigham and Women’s Hospital',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: false,
    contactPreference: 'email',
    email: 'mvance@bwh.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/marcus-vance-md',
    adviceQuote: 'Prepare well for clinical reasoning questions during social dinners and virtual interviews.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  },
  {
    id: 'alum-5',
    name: 'Dr. Jessica Taylor',
    graduationYear: 2023,
    currentPgy: 'PGY-3',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Beth Israel Deaconess Medical Center',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: true,
    contactPreference: 'virtual_coffee',
    email: 'jtaylor@bidmc.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/jessica-taylor-md',
    adviceQuote: 'BIDMC has phenomenal teaching attendings. Mention enthusiasm for bedside clinical ultrasound and cardiology research.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  },
  {
    id: 'alum-6',
    name: 'Dr. Anthony Ramos',
    graduationYear: 2025,
    currentPgy: 'PGY-1',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Beth Israel Deaconess Medical Center',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: true,
    contactPreference: 'text',
    email: 'aramos@bidmc.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/anthony-ramos-md',
    adviceQuote: 'Happy to answer questions via text! Interview format was very conversational and values authentic advocacy work.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  },
  {
    id: 'alum-7',
    name: 'Dr. Rachel Kim',
    graduationYear: 2024,
    currentPgy: 'PGY-2',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'NewYork-Presbyterian / Columbia University',
    specialty: 'Internal Medicine',
    programCity: 'New York',
    programState: 'NY',
    isAvailableForMentorship: true,
    contactPreference: 'virtual_coffee',
    email: 'rkim@nyp.org',
    doximityProfileUrl: 'https://www.doximity.com/pub/rachel-kim-md',
    adviceQuote: 'High acuity, fast-paced pathology. Show your resilience and dedication to urban underserved populations.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  },
  {
    id: 'alum-8',
    name: 'Dr. Samuel Brooks',
    graduationYear: 2022,
    currentPgy: 'Chief',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'NewYork-Presbyterian / Weill Cornell',
    specialty: 'Internal Medicine',
    programCity: 'New York',
    programState: 'NY',
    isAvailableForMentorship: true,
    contactPreference: 'email',
    email: 'sbrooks@nyp.org',
    doximityProfileUrl: 'https://www.doximity.com/pub/samuel-brooks-md',
    adviceQuote: 'Serving as Chief Medical Resident this year. Reach out early if you have an interest in our clinician-educator pathway.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  },
  {
    id: 'alum-9',
    name: 'Dr. Olivia Martinez',
    graduationYear: 2025,
    currentPgy: 'PGY-1',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'UPMC Medical Education',
    specialty: 'Internal Medicine',
    programCity: 'Pittsburgh',
    programState: 'PA',
    isAvailableForMentorship: true,
    contactPreference: 'virtual_coffee',
    email: 'omartinez@upmc.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/olivia-martinez-md',
    adviceQuote: 'Pittsburgh is affordable with an outstanding biomedical research campus. UPMC loves applicants passionate about translational science.',
    verificationStatus: 'verified',
    lastVerifiedPeriod: '2025–2026 Academic Year',
    lastVerifiedAt: '2025-07-01',
  }
];

export function generateDoximityProgramUrl(institutionName: string, specialty: string): string {
  const query = encodeURIComponent(`${institutionName} ${specialty} residency reviews`);
  return `https://www.doximity.com/residency/search?keywords=${query}`;
}

export function getAlumniByProgram(
  institutionName: string,
  specialty?: string,
  roster: AlumniResident[] = SAMPLE_ALUMNI_ROSTER
): AlumniResident[] {
  const normInst = institutionName.trim().toLowerCase();
  return roster.filter((alum) => {
    const instMatch = alum.institutionName.toLowerCase().includes(normInst) ||
      normInst.includes(alum.institutionName.toLowerCase());
    if (!instMatch) return false;
    if (specialty) {
      return alum.specialty.toLowerCase() === specialty.toLowerCase();
    }
    return true;
  });
}

export function getProgramAlumniSummary(
  institutionName: string,
  specialty: string = 'Internal Medicine',
  roster: AlumniResident[] = SAMPLE_ALUMNI_ROSTER
): ProgramAlumniSummary {
  const residents = getAlumniByProgram(institutionName, specialty, roster);
  const years = Array.from(new Set(residents.map((r) => r.graduationYear))).sort((a, b) => b - a);

  return {
    institutionName,
    specialty,
    totalAlumni: residents.length,
    availableMentors: residents.filter((r) => r.isAvailableForMentorship).length,
    recentMatchYears: years,
    doximityReviewUrl: generateDoximityProgramUrl(institutionName, specialty),
    residents,
  };
}

export function getMatchHistoryBySpecialty(
  specialty?: string,
  minYear: number = 2022,
  roster: AlumniResident[] = SAMPLE_ALUMNI_ROSTER
): AlumniResident[] {
  return roster
    .filter((a) => a.graduationYear >= minYear)
    .filter((a) => !specialty || a.specialty.toLowerCase() === specialty.toLowerCase())
    .sort((a, b) => b.graduationYear - a.graduationYear);
}

export function getNonRoboticOutreachGuide(
  studentName: string,
  mentorName: string,
  programName: string,
  specialty: string
): OutreachTemplate {
  const mentorFirstName = mentorName.replace(/^Dr\.\s*/, '').split(' ')[0];
  const studentFirstName = studentName.split(' ')[0];

  return {
    subject: `Apex Med MS4 & aspiring ${specialty} applicant - hello from ${studentFirstName}!`,
    body: `Hi Dr. ${mentorFirstName},

Hope you are having a wonderful week and that residency at ${programName} is treating you well!

My name is ${studentName}, and I am a current MS4 at Apex School of Medicine applying into ${specialty} this cycle. I saw through our alumni directory that you matched at ${programName}, and I’ve been admiring the program’s clinical training and strong culture.

If you have 10–15 minutes sometime in the coming weeks, I would love to hear a little about your transition from Apex to ${programName} and how you navigated the match process. Absolutely no worries if your clinical schedule is too packed right now!

Thank you so much for your time and for paving the way for Apex grads.

Warmly,
${studentName}
Apex School of Medicine, Class of 2027`,
    dos: [
      'Keep it under 150 words: residents are on 80-hour work weeks and read emails on call between patients.',
      'Mention a specific shared touchpoint (e.g. Apex med school class, shared clinical rotation, or research interest).',
      'Give them an easy out ("no worries at all if clinical demands are tight right now").',
      'Focus questions on resident culture, day-to-day life, and city transition rather than "will you get me an interview".'
    ],
    donts: [
      'DO NOT ask the resident to speak with the Program Director on your behalf in your first email.',
      'DO NOT send a copy-pasted wall of text detailing your entire CV.',
      'DO NOT follow up aggressively within 48 hours; give them at least 7 to 10 days before a polite bump.'
    ]
  };
}
