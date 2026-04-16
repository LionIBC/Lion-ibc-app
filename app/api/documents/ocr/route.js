import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { file_path, document_id } = await req.json();

  const { data } = await supabase.storage.from('documents').download(file_path);
  const buffer = Buffer.from(await data.arrayBuffer());

  const { data: result } = await Tesseract.recognize(buffer, 'deu');

  await supabase.from('documents').update({
    ocr_text: result.text,
    ocr_processed: true
  }).eq('id', document_id);

  return NextResponse.json({ success: true });
}
