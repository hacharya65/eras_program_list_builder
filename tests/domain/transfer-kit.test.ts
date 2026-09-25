import { describe, it, expect } from 'vitest';
import {
  generateTransferFields,
  validateTransferPayloads,
  compileInstitutionalPacket,
  TransferField,
} from '@/domain/transfer-kit-models';
import { StudentDashboardContext } from '@/domain/types';

describe('Pre-Season ERAS Transfer Kit & Application Packet', () => {
  const mockContext: StudentDashboardContext = {
    institution: {
      id: 'inst-apex',
      name: 'Apex School of Medicine',
      domain: 'apex.edu',
      defaultSlaDays: 14,
    },
    activeReviewRequests: [],
    student: {
      id: 'student-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@apex.edu',
      role: 'student',
      institutionId: 'inst-apex',
      specialty: 'Internal Medicine',
    },
    personalStatement: {
      id: 'ps-1',
      studentId: 'student-1',
      specialty: 'Internal Medicine',
      currentVersionNumber: 2,
      stage: 'endorsed',
      content: 'Standing in the intensive care unit, I observed the team treat septic shock...',
      updatedAt: new Date().toISOString(),
    },
    experiences: [
      {
        id: 'exp-1',
        studentId: 'student-1',
        title: 'Sub-Intern in Inpatient Medicine',
        orgName: 'Apex University Hospital',
        roleName: 'Sub-Intern',
        experienceType: 'Education/training',
        frequency: 'Daily',
        startDate: '2025-06',
        endDate: '2025-08',
        isCurrent: false,
        descriptionText: 'Managed a team of four patients with complex heart failure and acute kidney injury.',
        isMostMeaningful: true,
        reflectionText: 'This rotation solidified my conviction that patient ownership requires total dedication.',
      },
      {
        id: 'exp-2',
        studentId: 'student-1',
        title: 'Community Health Volunteer',
        orgName: 'Apex Free Clinic',
        roleName: 'Volunteer',
        experienceType: 'Volunteering',
        frequency: 'Weekly',
        startDate: '2024-01',
        isCurrent: true,
        descriptionText: 'Coordinated intake and medication reconciliation for uninsured immigrant families.',
        isMostMeaningful: false,
      },
    ],
    assignedAdvisors: [
      {
        id: 'advisor-1',
        name: 'Dr. Marcus Chen',
        email: 'mchen@apexhealth.org',
        role: 'advisor',
        institutionId: 'inst-apex',
        specialty: 'Internal Medicine',
      },
    ],
  };

  it('generates all structured transfer fields with ERAS targets and character limits', () => {
    const fields = generateTransferFields(mockContext);

    expect(fields.length).toBeGreaterThanOrEqual(4); // PS, 2 Exps, 1 Reflection, Hobbies

    const psField = fields.find((f) => f.section === 'personal_statement');
    expect(psField).toBeDefined();
    expect(psField?.charLimit).toBe(5300);
    expect(psField?.fieldTarget).toContain('MyERAS -> Documents');

    const exp1Field = fields.find((f) => f.id === 'field-exp-exp-1');
    expect(exp1Field).toBeDefined();
    expect(exp1Field?.charLimit).toBe(750);

    const refl1Field = fields.find((f) => f.id === 'field-refl-exp-1');
    expect(refl1Field).toBeDefined();
    expect(refl1Field?.charLimit).toBe(300);

    const hobbiesField = fields.find((f) => f.section === 'hobbies');
    expect(hobbiesField).toBeDefined();
    expect(hobbiesField?.charLimit).toBe(300);
  });

  it('validates transfer payloads and flags character overflows', () => {
    const invalidFields: TransferField[] = [
      {
        id: 'f-1',
        section: 'experiences',
        label: 'Overlength Experience',
        fieldTarget: 'MyERAS',
        content: 'A'.repeat(800),
        charCount: 800,
        charLimit: 750,
        isOverLimit: true,
        isCopied: false,
      },
    ];

    const result = validateTransferPayloads(invalidFields);
    expect(result.valid).toBe(false);
    expect(result.violations[0].reason).toContain('exceeds limit of 750');
  });

  it('detects smart quotes and non-ASCII characters that corrupt ERAS fields', () => {
    const smartQuoteFields: TransferField[] = [
      {
        id: 'f-2',
        section: 'personal_statement',
        label: 'Smart Quote PS',
        fieldTarget: 'MyERAS',
        content: 'Here is a “quote” and an — em dash.',
        charCount: 36,
        charLimit: 5300,
        isOverLimit: false,
        isCopied: false,
      },
    ];

    const result = validateTransferPayloads(smartQuoteFields);
    expect(result.valid).toBe(false);
    expect(result.violations[0].reason).toContain('curly quotes or em-dashes');
  });

  it('compiles a complete institutional packet for the Dean and MSPE writers', () => {
    const packet = compileInstitutionalPacket(mockContext);

    expect(packet.student.name).toBe('Alex Rivera');
    expect(packet.student.medicalSchool).toBe('Apex School of Medicine');
    expect(packet.advisorEndorsement?.advisorName).toBe('Dr. Marcus Chen');
    expect(packet.advisorEndorsement?.clinicalReadinessVerdict).toBe('Ready to Lock & Submit');
    expect(packet.personalStatement.charCount).toBeGreaterThan(0);
    expect(packet.experiences.length).toBe(2);
    expect(packet.experiences[0].isMostMeaningful).toBe(true);
    expect(packet.experiences[0].reflection).toBeDefined();
  });
});
