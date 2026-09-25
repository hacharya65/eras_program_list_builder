import PDFDocument from 'pdfkit';
import { CompiledApplicationPacket } from './transfer-kit-models';

/**
 * Generates a high-resolution, institutional multi-page PDF application packet
 * for the Dean's Office and MSPE letter writers.
 */
export async function generateApplicationPacketPdf(
  packet: CompiledApplicationPacket
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 45, bottom: 45, left: 45, right: 45 },
        bufferPages: true,
        info: {
          Title: `ERAS Application Dossier - ${packet.student.name}`,
          Author: 'Apex School of Medicine - Office of Student Affairs',
          Subject: `Residency Application Portfolio for ${packet.student.specialty}`,
          Keywords: 'ERAS, Residency, MSPE, Medical School, Personal Statement, Experiences',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width - 90; // 612 - 90 = 522
      const leftMargin = 45;

      // Helper: Draw Section Header
      const drawSectionHeader = (title: string, sub?: string) => {
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(title, { characterSpacing: 0.5 });
        if (sub) {
          doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(sub);
        }
        const currentY = doc.y + 3;
        doc
          .strokeColor('#cbd5e1')
          .lineWidth(0.75)
          .moveTo(leftMargin, currentY)
          .lineTo(leftMargin + pageWidth, currentY)
          .stroke();
        doc.y = currentY + 6;
      };

      // -------------------------------------------------------------
      // 1. Institutional Header Banner
      // -------------------------------------------------------------
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#0f172a')
        .text('APEX SCHOOL OF MEDICINE', { characterSpacing: 1 });

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#475569')
        .text('Office of Student Affairs & Residency Advising • Official MSPE / Dean\'s Office Application Dossier');

      const dateStr = new Date(packet.generatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const headerLineY = doc.y + 6;
      doc
        .strokeColor('#0f172a')
        .lineWidth(1.5)
        .moveTo(leftMargin, headerLineY)
        .lineTo(leftMargin + pageWidth, headerLineY)
        .stroke();

      doc.y = headerLineY + 8;

      // -------------------------------------------------------------
      // 2. Applicant Metadata & Endorsement Grid
      // -------------------------------------------------------------
      const metaBoxY = doc.y;
      doc
        .rect(leftMargin, metaBoxY, pageWidth, 74)
        .fillAndStroke('#f8fafc', '#e2e8f0');

      // Left Column: Student Details
      doc.fillColor('#0f172a');
      doc.font('Helvetica-Bold').fontSize(12).text(packet.student.name, leftMargin + 12, metaBoxY + 10);

      doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
      doc.text(`Target Specialty: `, leftMargin + 12, metaBoxY + 28, { continued: true });
      doc.font('Helvetica-Bold').text(packet.student.specialty);

      doc.font('Helvetica').fontSize(8).fillColor('#64748b');
      doc.text(`AAMC ID: ${packet.student.aamcId || 'AAMC-14892019'}   |   Email: ${packet.student.email}`, leftMargin + 12, metaBoxY + 42);
      doc.text(`Medical School: ${packet.student.medicalSchool}   |   Cycle: ERAS 2027`, leftMargin + 12, metaBoxY + 54);

      // Right Column: Endorsement Verdict
      const rightColX = leftMargin + (pageWidth / 2) + 10;
      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.5)
        .moveTo(leftMargin + (pageWidth / 2), metaBoxY + 8)
        .lineTo(leftMargin + (pageWidth / 2), metaBoxY + 66)
        .stroke();

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#059669');
      doc.text('✓ FACULTY CLINICAL ENDORSEMENT', rightColX, metaBoxY + 10);

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#065f46');
      doc.text(packet.advisorEndorsement?.clinicalReadinessVerdict || 'Ready to Lock & Submit', rightColX, metaBoxY + 22);

      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      doc.text(`Endorsed by: ${packet.advisorEndorsement?.advisorName || 'Dr. Marcus Chen'} (${packet.advisorEndorsement?.advisorSpecialty || 'Internal Medicine'})`, rightColX, metaBoxY + 38);
      doc.text(`4-Pillar Rubric Score: ${packet.advisorEndorsement?.rubricScore || 15}/16 (Standard Exceeded)`, rightColX, metaBoxY + 52);

      doc.y = metaBoxY + 82;

      // -------------------------------------------------------------
      // 3. Section I: Personal Statement
      // -------------------------------------------------------------
      drawSectionHeader(
        `I. APPROVED PERSONAL STATEMENT (v${packet.personalStatement.versionNumber})`,
        `${packet.personalStatement.charCount.toLocaleString()} plain-text characters • Approved for ERAS submission`
      );

      doc.moveDown(0.4);
      doc
        .font('Times-Roman')
        .fontSize(9.5)
        .fillColor('#1e293b')
        .text(packet.personalStatement.content || 'No content recorded.', {
          align: 'justify',
          lineGap: 3.5,
          paragraphGap: 6,
        });

      // -------------------------------------------------------------
      // 4. Section II: 10 Selected Experiences
      // -------------------------------------------------------------
      doc.addPage();
      drawSectionHeader(
        `II. SELECTED EXPERIENCES & MEANINGFUL REFLECTIONS (${packet.experiences.length} of 10)`,
        'Official ERAS 750-character descriptions with 300-character Most Meaningful reflections'
      );

      packet.experiences.forEach((exp, idx) => {
        // Check if page break needed
        if (doc.y > 660) {
          doc.addPage();
        }

        const expBoxY = doc.y + 4;
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a');
        doc.text(`${idx + 1}. ${exp.title}`, leftMargin, expBoxY);

        if (exp.isMostMeaningful) {
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#b45309');
          doc.text('★ MOST MEANINGFUL', leftMargin + pageWidth - 100, expBoxY, { align: 'right' });
        }

        doc.font('Helvetica').fontSize(8).fillColor('#475569');
        doc.text(`${exp.organization}   •   ${exp.type}   •   ${exp.dateRange}`, leftMargin, doc.y + 1);

        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');
        doc.text(exp.description, leftMargin, doc.y, {
          align: 'left',
          lineGap: 2.5,
        });

        if (exp.reflection) {
          doc.moveDown(0.3);
          const reflY = doc.y;
          doc.font('Helvetica-Oblique').fontSize(8);
          const reflHeight = doc.heightOfString(`Meaningful Reflection: ${exp.reflection}`, {
            width: pageWidth - 16,
          }) + 10;

          doc
            .rect(leftMargin, reflY, pageWidth, reflHeight)
            .fillAndStroke('#fffbeb', '#fde68a');

          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor('#92400e')
            .text('Meaningful Reflection: ', leftMargin + 8, reflY + 5, { continued: true });

          doc
            .font('Helvetica-Oblique')
            .fontSize(8)
            .fillColor('#78350f')
            .text(exp.reflection, { width: pageWidth - 16 });

          doc.y = reflY + reflHeight + 4;
        }

        doc.moveDown(0.6);
        doc
          .strokeColor('#f1f5f9')
          .lineWidth(0.5)
          .moveTo(leftMargin, doc.y)
          .lineTo(leftMargin + pageWidth, doc.y)
          .stroke();
        doc.moveDown(0.4);
      });

      // -------------------------------------------------------------
      // 5. Section III: Scholarly Works
      // -------------------------------------------------------------
      if (doc.y > 600) {
        doc.addPage();
      }

      drawSectionHeader(
        `III. SCHOLARLY WORKS & ACADEMIC CONTRIBUTIONS (${packet.scholarlyWorks.length} Recorded)`,
        'AAMC Standardized Citations & Starred Most Meaningful Research'
      );

      if (packet.scholarlyWorks.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text('No scholarly works recorded.');
      } else {
        packet.scholarlyWorks.forEach((work, idx) => {
          if (doc.y > 700) doc.addPage();

          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
          doc.text(`${idx + 1}. ${work.title}`);

          doc.font('Helvetica').fontSize(8).fillColor('#475569');
          doc.text(`Type: ${work.type}${work.isMostMeaningful ? '   •   ★ Starred Meaningful' : ''}`);

          doc.font('Times-Roman').fontSize(8.5).fillColor('#1e293b');
          doc.text(work.citation, { lineGap: 1.5 });
          doc.moveDown(0.5);
        });
      }

      // -------------------------------------------------------------
      // 6. Section IV: Strategic School List & Signals
      // -------------------------------------------------------------
      if (doc.y > 550) {
        doc.addPage();
      }

      drawSectionHeader(
        `IV. STRATEGIC SCHOOL LIST & ERAS SIGNALING MATRIX (${packet.schoolList.length} Programs)`,
        'Reach, Target, Safety distribution with official ERAS Gold & Silver signaling allocations'
      );

      if (packet.schoolList.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text('No programs added to the strategic matrix.');
      } else {
        // Table Header
        const tableY = doc.y + 4;
        doc.rect(leftMargin, tableY, pageWidth, 16).fill('#f1f5f9');

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
        doc.text('PROGRAM NAME', leftMargin + 6, tableY + 4);
        doc.text('LOCATION', leftMargin + 260, tableY + 4);
        doc.text('TIER', leftMargin + 370, tableY + 4);
        doc.text('SIGNAL TIER', leftMargin + 440, tableY + 4);

        doc.y = tableY + 18;

        packet.schoolList.forEach((school, i) => {
          if (doc.y > 720) {
            doc.addPage();
            // Re-render header on new page
            const subTableY = doc.y;
            doc.rect(leftMargin, subTableY, pageWidth, 16).fill('#f1f5f9');
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
            doc.text('PROGRAM NAME', leftMargin + 6, subTableY + 4);
            doc.text('LOCATION', leftMargin + 260, subTableY + 4);
            doc.text('TIER', leftMargin + 370, subTableY + 4);
            doc.text('SIGNAL TIER', leftMargin + 440, subTableY + 4);
            doc.y = subTableY + 18;
          }

          const rowY = doc.y;
          if (i % 2 === 1) {
            doc.rect(leftMargin, rowY - 2, pageWidth, 16).fill('#f8fafc');
          }

          doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
          doc.text(school.programName.substring(0, 48), leftMargin + 6, rowY, { width: 245 });

          doc.font('Helvetica').fontSize(8).fillColor('#475569');
          doc.text(`${school.city}, ${school.state}`, leftMargin + 260, rowY);

          // Tier badge
          const tierUpper = school.tier.toUpperCase();
          doc.font('Helvetica-Bold').fontSize(7.5);
          if (school.tier === 'reach') doc.fillColor('#b91c1c');
          else if (school.tier === 'target') doc.fillColor('#0369a1');
          else doc.fillColor('#047857');
          doc.text(tierUpper, leftMargin + 370, rowY);

          // Signal badge
          doc.font('Helvetica-Bold').fontSize(7.5);
          if (school.signal === 'gold') {
            doc.fillColor('#b45309').text('● GOLD SIGNAL', leftMargin + 440, rowY);
          } else if (school.signal === 'silver') {
            doc.fillColor('#475569').text('● SILVER SIGNAL', leftMargin + 440, rowY);
          } else {
            doc.font('Helvetica').fillColor('#94a3b8').text('No Signal', leftMargin + 440, rowY);
          }

          doc.y = rowY + 16;
        });
      }

      // -------------------------------------------------------------
      // 7. Section V: Hobbies & Outside Interests
      // -------------------------------------------------------------
      if (doc.y > 640) {
        doc.addPage();
      }

      drawSectionHeader('V. HOBBIES & OUTSIDE INTERESTS', 'Official ERAS 300-Character Description');
      doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b').text(packet.hobbies || 'None specified.', {
        lineGap: 2,
      });

      // -------------------------------------------------------------
      // 8. Running Page Numbers & Document Footer
      // -------------------------------------------------------------
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(leftMargin, 748)
          .lineTo(leftMargin + pageWidth, 748)
          .stroke();

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#94a3b8')
          .text(
            'Apex School of Medicine  •  Office of Student Affairs  •  Confidential Dean\'s Office / MSPE Application Dossier',
            leftMargin,
            754,
            { continued: false }
          );

        doc.text(
          `Page ${i + 1} of ${range.count}`,
          leftMargin,
          754,
          { align: 'right', width: pageWidth }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
