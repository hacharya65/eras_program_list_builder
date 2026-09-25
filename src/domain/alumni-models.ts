export interface AlumniResident {
  id: string;
  name: string;
  graduationYear: number;
  currentPgy: 'PGY-1' | 'PGY-2' | 'PGY-3' | 'PGY-4' | 'PGY-5' | 'Chief';
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
  signalStrategyUsed?: 'Gold' | 'Silver' | 'No Signal';
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
    adviceQuote: 'MGH values distinct scholarly curiosity. If you send a Gold signal, reach out early to the APD in your subspecialty of interest.',
    signalStrategyUsed: 'Gold',
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
    email: 'dokafor@partners.org',
    doximityProfileUrl: 'https://www.doximity.com/pub/david-okafor-md',
    adviceQuote: 'The culture is surprisingly collegial. Make sure your Most Meaningful experiences highlight genuine bedside humility.',
    signalStrategyUsed: 'Gold',
  },
  {
    id: 'alum-3',
    name: 'Dr. Elena Rostova',
    graduationYear: 2025,
    currentPgy: 'PGY-1',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Brigham and Women’s Hospital',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: true,
    contactPreference: 'residency_chat',
    email: 'erostova@bwh.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/elena-rostova-md',
    adviceQuote: 'Firm system here creates amazing camaraderie among interns. Do not hesitate to send your Silver signal if you have geographic ties.',
    signalStrategyUsed: 'Silver',
  },
  {
    id: 'alum-4',
    name: 'Dr. Marcus Vance',
    graduationYear: 2024,
    currentPgy: 'PGY-2',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Johns Hopkins Hospital',
    specialty: 'Internal Medicine',
    programCity: 'Baltimore',
    programState: 'MD',
    isAvailableForMentorship: true,
    contactPreference: 'email',
    email: 'mvance@jhmi.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/marcus-vance-md',
    adviceQuote: 'Osler medical service is rigorous but transformative. Focus your personal statement on concrete patient ownership.',
    signalStrategyUsed: 'Gold',
  },
  {
    id: 'alum-5',
    name: 'Dr. Priya Patel',
    graduationYear: 2023,
    currentPgy: 'PGY-3',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'University of Washington',
    specialty: 'Internal Medicine',
    programCity: 'Seattle',
    programState: 'WA',
    isAvailableForMentorship: false,
    contactPreference: 'email',
    email: 'ppatel@uw.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/priya-patel-md',
    adviceQuote: 'WWAMI region focus is real. Highlighting rural or primary care experiences is huge.',
    signalStrategyUsed: 'Silver',
  },
  {
    id: 'alum-6',
    name: 'Dr. Jason Miller',
    graduationYear: 2024,
    currentPgy: 'PGY-2',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Beth Israel Deaconess Medical Center',
    specialty: 'Internal Medicine',
    programCity: 'Boston',
    programState: 'MA',
    isAvailableForMentorship: true,
    contactPreference: 'virtual_coffee',
    email: 'jmiller@bidmc.harvard.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/jason-miller-md',
    adviceQuote: 'Outstanding teaching climate. Silver signals are treated with great respect here.',
    signalStrategyUsed: 'Silver',
  },
  {
    id: 'alum-7',
    name: 'Dr. Rachel Chang',
    graduationYear: 2022,
    currentPgy: 'Chief',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Hospital of the University of Pennsylvania',
    specialty: 'Internal Medicine',
    programCity: 'Philadelphia',
    programState: 'PA',
    isAvailableForMentorship: true,
    contactPreference: 'email',
    email: 'rchang@pennmedicine.upenn.edu',
    doximityProfileUrl: 'https://www.doximity.com/pub/rachel-chang-md',
    adviceQuote: 'As chief resident, I review files. What stands out is authenticity and clear reasons why Penn aligns with your 5-year vision.',
    signalStrategyUsed: 'Gold',
  },
  {
    id: 'alum-8',
    name: 'Dr. Kevin Thorne',
    graduationYear: 2023,
    currentPgy: 'PGY-3',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'Northwestern University McGaw Medical Center',
    specialty: 'Orthopaedic Surgery',
    programCity: 'Chicago',
    programState: 'IL',
    isAvailableForMentorship: true,
    contactPreference: 'virtual_coffee',
    email: 'kthorne@nm.org',
    doximityProfileUrl: 'https://www.doximity.com/pub/kevin-thorne-md',
    adviceQuote: 'Sub-I performance and department champion backing are 90% of the game. Always signal programs where you rotated.',
    signalStrategyUsed: 'Gold',
  },
  {
    id: 'alum-9',
    name: 'Dr. Maya Lin',
    graduationYear: 2024,
    currentPgy: 'PGY-2',
    medicalSchool: 'Apex School of Medicine',
    institutionName: 'NYU Grossman School of Medicine',
    specialty: 'Dermatology',
    programCity: 'New York',
    programState: 'NY',
    isAvailableForMentorship: true,
    contactPreference: 'email',
    email: 'mlin@nyulangone.org',
    doximityProfileUrl: 'https://www.doximity.com/pub/maya-lin-md',
    adviceQuote: 'Research fellowship connection and mentorship letters carry immense weight. Be prepared to talk deeply about your first-author papers.',
    signalStrategyUsed: 'Gold',
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

If you have 10–15 minutes sometime in the coming weeks, I would love to hear a little about your transition from Apex to ${programName} and how you navigated the signaling and match process. Absolutely no worries if your clinical schedule is too packed right now!

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
