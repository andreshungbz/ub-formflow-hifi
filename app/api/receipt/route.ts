// app/api/receipt/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptDocument } from '@/lib/ReceiptDocument';

// Cookie parser — typed
function parseCookies(cookieHeader: string | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...v] = part.split('=');
    const key = k.trim();
    const val = v.join('=').trim();
    if (key) map[key] = decodeURIComponent(val);
  }
  return map;
}

// Convert stream → buffer — typed
function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const cookies = parseCookies(request.headers.get('cookie'));

    const studentId =
      cookies.studentId || url.searchParams.get('studentId') || 'N/A';

    const formName =
      url.searchParams.get('title') ||
      url.searchParams.get('formName') ||
      'Untitled';

    const filename = `receipt-${studentId}.pdf`;

    // ⭐ Fully typed React element, no `any`
    const element = ReceiptDocument({ studentId, formName });

    // ⭐ PDF stream (typed)
    const pdfStream = await renderToStream(element);

    // ⭐ Convert stream → buffer
    const buffer = await streamToBuffer(pdfStream as NodeJS.ReadableStream);
    const uint8 = new Uint8Array(buffer);

    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': String(uint8.byteLength),
    });

    return new NextResponse(uint8, { status: 200, headers });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
