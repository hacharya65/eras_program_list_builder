import { StudentDashboardContext, ExperienceDraft } from './types';
import { ScholarlyWork } from './scholarly-models';
import { SchoolListItem } from './school-list-models';

export interface TransferField {
  id: string;
  section: 'personal_statement' | 'experiences' | 'reflections' | 'hobbies' | 'scholarly_works' | 'signals';
  label: string;
  fieldTarget: string; // e.g., "ERAS -> MyERAS Documents -> Personal Statement"
  content: string;
  charCount: number;
  charLimit: number;
  isOverLimit: boolean;
  isCopied: boolean;
  helperText?: string;
}

export interface CompiledApplicationPacket {
  generatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    aamcId: string;
    specialty: string;
    medicalSchool: string;
  };
  advisorEndorsement?: {
    advisorName: string;
    advisorSpecialty: string;
    endorsedDate: string;
    rubricScore: number;
    clinicalReadinessVerdict: string;
  };
  personalStatement: {
    versionNumber: number;
    charCount: number;
    content: string;
  };
  experiences: Array<{
    id: string;
    title: string;
    organization: string;
    type: string;
    dateRange: string;
    description: string;
    isMostMeaningful: boolean;
    reflection?: string;
  }>;
  hobbies: string;
  scholarlyWorks: Array<{
    id: string;
    title: string;
    type: string;
    citation: string;
    isMostMeaningful: boolean;
  }>;
  schoolList: Array<{
    programName: string;
    tier: string;
    signal: string;
    city: string;
    state: string;
  }>;
}

export function generateTransferFields(
  context: StudentDashboardContext,
  scholarlyWorks: ScholarlyWork[] = [],
  schoolList: SchoolListItem[] = [],
  hobbiesContent: string = 'Distance running (ran Boston Marathon 2025), sourdough bread baking with heirloom wild yeasts, playing classical cello in the community medical orchestra.'
): TransferField[] {
  const fields: TransferField[] = [];

  // 1. Personal Statement
  const ps = context.personalStatement;
  fields.push({
    id: 'field-ps',
    section: 'personal_statement',
    label: 'Personal Statement (Final Approved)',
    fieldTarget: 'MyERAS -> Documents -> Personal Statements -> Create Personal Statement',
    content: ps.content,
    charCount: ps.content.length,
    charLimit: 5300,
    isOverLimit: ps.content.length > 5300,
    isCopied: false,
    helperText: 'AAMC recommended length is under 1 page (~750–850 words / ~5,300 plain text characters).',
  });

  // 2. Experiences & Reflections
  context.experiences.forEach((exp, idx) => {
    fields.push({
      id: `field-exp-${exp.id}`,
      section: 'experiences',
      label: `Experience ${idx + 1}: ${exp.title} (${exp.orgName})`,
      fieldTarget: `MyERAS -> Experiences -> Experience #${idx + 1} -> Description`,
      content: exp.descriptionText,
      charCount: exp.descriptionText.length,
      charLimit: 750,
      isOverLimit: exp.descriptionText.length > 750,
      isCopied: false,
      helperText: 'AAMC ERAS 2027 description limit is strictly 750 characters.',
    });

    if (exp.isMostMeaningful && exp.reflectionText) {
      fields.push({
        id: `field-refl-${exp.id}`,
        section: 'reflections',
        label: `Most Meaningful Reflection: ${exp.title}`,
        fieldTarget: `MyERAS -> Experiences -> Experience #${idx + 1} -> Most Meaningful Summary`,
        content: exp.reflectionText,
        charCount: exp.reflectionText.length,
        charLimit: 300,
        isOverLimit: exp.reflectionText.length > 300,
        isCopied: false,
        helperText: 'Strict 300-character reflection limit for up to 3 Most Meaningful experiences.',
      });
    }
  });

  // 3. Hobbies
  fields.push({
    id: 'field-hobbies',
    section: 'hobbies',
    label: 'Hobbies & Interests',
    fieldTarget: 'MyERAS -> Additional Information -> Hobbies & Interests',
    content: hobbiesContent,
    charCount: hobbiesContent.length,
    charLimit: 300,
    isOverLimit: hobbiesContent.length > 300,
    isCopied: false,
    helperText: 'Official 300-character limit for hobbies and outside interests.',
  });

  // 4. Scholarly Works
  scholarlyWorks.forEach((work, idx) => {
    const venue = work.journalName || (work.events && work.events[0]?.eventName) || 'Scholarly Work';
    fields.push({
      id: `field-work-${work.id}`,
      section: 'scholarly_works',
      label: `Scholarly Work ${idx + 1}: ${work.title.substring(0, 40)}...`,
      fieldTarget: `MyERAS -> Publications -> Entry #${idx + 1}`,
      content: `${work.authors}. ${work.title}. ${venue}.`,
      charCount: work.title.length,
      charLimit: 1000,
      isOverLimit: false,
      isCopied: false,
      helperText: `AAMC Publication Type: ${work.type}`,
    });
  });

  return fields;
}

export function validateTransferPayloads(fields: TransferField[]): {
  valid: boolean;
  violations: { fieldId: string; reason: string }[];
} {
  const violations: { fieldId: string; reason: string }[] = [];

  for (const f of fields) {
    if (f.charCount > f.charLimit) {
      violations.push({
        fieldId: f.id,
        reason: `Field '${f.label}' exceeds limit of ${f.charLimit} characters (currently ${f.charCount} chars).`,
      });
    }

    // Verify plain text ASCII characters
    if (/[\u2018\u2019\u201C\u201D\u2014]/.test(f.content)) {
      violations.push({
        fieldId: f.id,
        reason: `Field '${f.label}' contains non-ASCII curly quotes or em-dashes that could cause corrupt encoding on ERAS.`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function compileInstitutionalPacket(
  context: StudentDashboardContext,
  scholarlyWorks: ScholarlyWork[] = [],
  schoolList: SchoolListItem[] = [],
  hobbies: string = 'Distance running, sourdough baking, classical cello.'
): CompiledApplicationPacket {
  return {
    generatedAt: new Date().toISOString(),
    student: {
      id: context.student.id,
      name: context.student.name,
      email: context.student.email,
      aamcId: 'AAMC-14892019',
      specialty: context.student.specialty || 'Internal Medicine',
      medicalSchool: 'Apex School of Medicine',
    },
    advisorEndorsement: {
      advisorName: context.assignedAdvisors[0]?.name || 'Dr. Marcus Chen',
      advisorSpecialty: context.assignedAdvisors[0]?.specialty || 'Internal Medicine',
      endorsedDate: new Date().toLocaleDateString(),
      rubricScore: 15, // out of 16
      clinicalReadinessVerdict: 'Ready to Lock & Submit',
    },
    personalStatement: {
      versionNumber: context.personalStatement.currentVersionNumber,
      charCount: context.personalStatement.content.length,
      content: context.personalStatement.content,
    },
    experiences: context.experiences.map((exp) => ({
      id: exp.id,
      title: exp.title,
      organization: exp.orgName,
      type: exp.experienceType,
      dateRange: `${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || 'Completed'}`,
      description: exp.descriptionText,
      isMostMeaningful: exp.isMostMeaningful,
      reflection: exp.reflectionText,
    })),
    hobbies,
    scholarlyWorks: scholarlyWorks.map((w) => ({
      id: w.id,
      title: w.title,
      type: w.type,
      citation: `${w.authors}. ${w.title}. ${w.journalName || 'Scholarly Work'}.`,
      isMostMeaningful: w.isMeaningful,
    })),
    schoolList: schoolList.map((s) => ({
      programName: s.programName,
      tier: s.tier,
      signal: s.signal,
      city: s.city || 'Boston',
      state: s.state || 'MA',
    })),
  };
}
