import { NextRequest, NextResponse } from 'next/server';
import { generateApplicationPacketPdf } from '@/domain/pdf-packet-generator';
import { CompiledApplicationPacket } from '@/domain/transfer-kit-models';

export async function POST(req: NextRequest) {
  try {
    const packet: CompiledApplicationPacket = await req.json();

    if (!packet || !packet.student || !packet.personalStatement) {
      return NextResponse.json(
        { error: 'Invalid packet payload: student and personalStatement are required.' },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateApplicationPacketPdf(packet);
    const sanitizedStudentName = (packet.student.name || 'Applicant')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const filename = `Apex_ERAS_Dossier_${sanitizedStudentName}_2027.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating application packet PDF:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to render application packet PDF' },
      { status: 500 }
    );
  }
}
