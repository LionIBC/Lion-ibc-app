import { NextResponse } from 'next/server'; import { runDocumentOCRById } from './core.js';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json(
        { success: false, message: 'document_id fehlt.' },
        { status: 400 }
      );
    }

    const result = await runDocumentOCRById(document_id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/documents/ocr failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'OCR fehlgeschlagen.'
      },
      { status: 500 }
    );
  }
}
