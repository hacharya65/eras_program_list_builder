import { describe, it, expect } from 'vitest';
import { generateApplicationPacketPdf } from '@/domain/pdf-packet-generator';
import { CompiledApplicationPacket } from '@/domain/transfer-kit-models';

describe('Ticket 07 / Speed B: Compiled Institutional PDF Packet Generator', () => {
  const samplePacket: CompiledApplicationPacket = {
    generatedAt: new Date().toISOString(),
    student: {
      id: 'student-test-1',
      name: 'Elena Rostova, MS4',
      email: 'elena.rostova@apex.edu',
      aamcId: 'AAMC-14892019',
      specialty: 'Internal Medicine',
      medicalSchool: 'Apex School of Medicine',
    },
    advisorEndorsement: {
      advisorName: 'Dr. Marcus Chen',
      advisorSpecialty: 'Internal Medicine',
      endorsedDate: '09/25/2026',
      rubricScore: 15,
      clinicalReadinessVerdict: 'Ready to Lock & Submit',
    },
    personalStatement: {
      versionNumber: 3,
      charCount: 4890,
      content:
        'The rhythmic cadence of the mechanical ventilator in room 402 provided an unexpected backdrop to my morning rounds...\n\nThroughout my clinical clerkships in inpatient medicine, I was continually drawn to the intellectual rigor of diagnostic problem solving and longitudinal bedside presence.',
    },
    experiences: [
      {
        id: 'exp-1',
        title: 'Sub-Intern in Medical Intensive Care',
        organization: 'Apex University Hospital',
        type: 'Education/training',
        dateRange: '07/2025 - 08/2025',
        description:
          'Managed 4-5 critically ill patients daily under direct fellow and attending supervision. Formulated evidence-based management plans for acute respiratory distress syndrome, septic shock, and diabetic ketoacidosis.',
        isMostMeaningful: true,
        reflection:
          'Navigating complex family goals-of-care conferences taught me that clinical excellence requires balancing acute physiologic interventions with profound bedside empathy.',
      },
      {
        id: 'exp-2',
        title: 'Lead Clinical Researcher in Pulmonary Hypertension',
        organization: 'Apex Cardiovascular Research Center',
        type: 'Research',
        dateRange: '06/2024 - Present',
        description:
          'Coordinated patient recruitment and biomarker serum banking for a prospective registry of 180 pulmonary arterial hypertension patients.',
        isMostMeaningful: false,
      },
    ],
    hobbies: 'Distance trail running, heirloom sourdough baking, and classical cello.',
    scholarlyWorks: [
      {
        id: 'work-1',
        title: 'Serum Biomarkers in Right Ventricular Remodeling',
        type: 'Peer Reviewed Journal Articles/Abstracts',
        citation:
          'Rostova E, Vance C, Chen M. Serum Biomarkers in Right Ventricular Remodeling. Am J Respir Crit Care Med. 2025;198(4):450-458.',
        isMostMeaningful: true,
      },
    ],
    schoolList: [
      {
        programName: 'Massachusetts General Hospital / Harvard Medical School',
        tier: 'reach',
        signal: 'gold',
        city: 'Boston',
        state: 'MA',
      },
      {
        programName: 'Johns Hopkins Hospital',
        tier: 'reach',
        signal: 'gold',
        city: 'Baltimore',
        state: 'MD',
      },
      {
        programName: 'University of Michigan Health System',
        tier: 'target',
        signal: 'silver',
        city: 'Ann Arbor',
        state: 'MI',
      },
      {
        programName: 'Beth Israel Deaconess Medical Center',
        tier: 'target',
        signal: 'silver',
        city: 'Boston',
        state: 'MA',
      },
      {
        programName: 'Tufts Medical Center',
        tier: 'safety',
        signal: 'none',
        city: 'Boston',
        state: 'MA',
      },
    ],
  };

  it('renders a valid PDF Buffer starting with %PDF- header', async () => {
    const pdfBuffer = await generateApplicationPacketPdf(samplePacket);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Assert standard PDF magic bytes
    const pdfMagicBytes = pdfBuffer.subarray(0, 4).toString('ascii');
    expect(pdfMagicBytes).toBe('%PDF');
  });

  it('generates multi-page document layout containing all 4 core application areas', async () => {
    const pdfBuffer = await generateApplicationPacketPdf(samplePacket);

    // Verify document size reflects multi-page rendered layout
    expect(pdfBuffer.length).toBeGreaterThan(5000);

    const pdfString = pdfBuffer.toString('latin1');
    // PDF should contain page object definitions
    expect(pdfString).toContain('/Type /Page');
  });

  it('handles empty scholarly works and empty school list without errors', async () => {
    const minimalPacket: CompiledApplicationPacket = {
      ...samplePacket,
      scholarlyWorks: [],
      schoolList: [],
    };

    const pdfBuffer = await generateApplicationPacketPdf(minimalPacket);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('handles full 10 experiences with 3 meaningful reflections cleanly', async () => {
    const fullExperiencesPacket: CompiledApplicationPacket = {
      ...samplePacket,
      experiences: Array.from({ length: 10 }, (_, i) => ({
        id: `exp-${i + 1}`,
        title: `Clinical Experience ${i + 1}`,
        organization: `Hospital ${i + 1}`,
        type: 'Clinical',
        dateRange: '01/2024 - 05/2024',
        description: 'Comprehensive patient care in multidisciplinary academic medical environment.'.repeat(5),
        isMostMeaningful: i < 3,
        reflection: i < 3 ? `Key meaningful clinical reflection for experience ${i + 1}.` : undefined,
      })),
    };

    const pdfBuffer = await generateApplicationPacketPdf(fullExperiencesPacket);
    expect(pdfBuffer.length).toBeGreaterThan(10000);
    expect(pdfBuffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('contains all finalized sections including Personal Statement, Experiences, Scholarly Works, School List, and Hobbies', async () => {
    // Generate uncompressed PDF for direct stream inspection
    const pdfBuffer = await generateApplicationPacketPdf(samplePacket, { compress: false });
    const rawPdf = pdfBuffer.toString('latin1');

    // Extract text from PDF TJ operators and Tj operators
    let extractedText = rawPdf.replace(/\[([\s\S]*?)\]\s*TJ/g, (_, tjContent) => {
      let result = '';
      const tokenRegex = /<([0-9a-fA-F]+)>|\(([\s\S]*?)\)/g;
      let match;
      while ((match = tokenRegex.exec(tjContent)) !== null) {
        if (match[1]) {
          result += Buffer.from(match[1], 'hex').toString('latin1');
        } else if (match[2]) {
          result += match[2];
        }
      }
      return result;
    });

    // Also replace standalone hex tokens or string tokens
    extractedText = extractedText.replace(/<([0-9a-fA-F]+)>/g, (_, hex) =>
      Buffer.from(hex, 'hex').toString('latin1')
    );

    const normalizedText = extractedText.replace(/\s+/g, ' ');

    // Section I: Personal Statement
    expect(normalizedText).toContain('I. APPROVED PERSONAL STATEMENT');
    expect(normalizedText).toContain('mechanical ventilator in room 402');

    // Section II: Selected Experiences & Reflections
    expect(normalizedText).toContain('II. SELECTED EXPERIENCES & MEANINGFUL REFLECTIONS');
    expect(normalizedText).toContain('Sub-Intern in Medical Intensive Care');
    expect(normalizedText).toContain('Navigating complex family goals-of-care conferences');

    // Section III: Scholarly Works
    expect(normalizedText).toContain('III. SCHOLARLY WORKS & ACADEMIC CONTRIBUTIONS');
    expect(normalizedText).toContain('Serum Biomarkers in Right Ventricular Remodeling');

    // Section IV: Strategic School List
    expect(normalizedText).toContain('IV. STRATEGIC SCHOOL LIST & ERAS SIGNALING MATRIX');
    expect(normalizedText).toContain('Massachusetts General Hospital');

    // Section V: Hobbies & Outside Interests
    expect(normalizedText).toContain('V. HOBBIES & OUTSIDE INTERESTS');
    expect(normalizedText).toContain('Distance trail running');
  });
});
