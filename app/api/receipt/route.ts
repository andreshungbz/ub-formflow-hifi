// app/api/receipt/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { ReceiptDocument } from '@/lib/ReceiptDocument';

function parseCookies(cookieHeader: string | null) {
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

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer | Uint8Array) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const cookies = parseCookies(request.headers.get('cookie'));

    const studentId = cookies.studentId || url.searchParams.get('studentId') || 'N/A';
    const formName = url.searchParams.get('title') || url.searchParams.get('formName') || 'Untitled';

    const filename = `receipt-${studentId}.pdf`;

    const pdfStream = await renderToStream(
      React.createElement(ReceiptDocument as any, { studentId, formName } as any) as any
    );

    const buffer = await streamToBuffer(pdfStream as unknown as NodeJS.ReadableStream);
    const uint8 = new Uint8Array(buffer);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${filename}"`);
    headers.set('Content-Length', String(uint8.byteLength));

    return new NextResponse(uint8, { status: 200, headers });
  } catch (err) {
    console.error('PDF generation error:', err);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
