// app/api/receipt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReceiptDocument } from '@/lib/ReceiptDocument';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const studentId = searchParams.get('studentId') || 'N/A';
    const title = searchParams.get('title') || 'Untitled';

    const pdfBuffer = await renderToBuffer(
      ReceiptDocument({
        studentId,
        formName: title,
      })
    );

    const uint8 = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${studentId}.pdf"`,
        'Content-Length': uint8.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
