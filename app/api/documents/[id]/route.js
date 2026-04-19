import { NextResponse } from 'next/server';
import { runDocumentOCRById } from './core';

export async function POST(req) {
  try {
    const { document_id } = await req.json();

    if (!document_id) {
      return NextResponse.json(
        { success: false, message: 'document_id fehlt.' },
        { status: 400 }
      );
    }

    const result = await runDocumentOCRById(document_id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'OCR fehlgeschlagen.'
      },
      { status: 500 }
    );
  }
}
