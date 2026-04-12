import { NextResponse } from 'next/server'; import { createClient } from '@supabase/supabase-js';

// Supabase Verbindung
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();

    const files = formData.getAll('files');
    const source = formData.get('source') || 'unknown';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'Keine Dateien erhalten' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const fileName = `${Date.now()}-${file.name}`;

      // 📦 Upload in Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, buffer, {
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // 📄 Public URL erzeugen
      const { data: publicUrl } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // 🗄️ In Datenbank speichern
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          file_name: file.name,
          file_path: fileName,
          file_url: publicUrl.publicUrl,
          file_size: file.size,
          source: source,
          category: 'sonstiges',
          created_at: new Date()
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      uploadedFiles.push({
        name: file.name,
        url: publicUrl.publicUrl
      });
    }

    return NextResponse.json({
      message: 'Upload erfolgreich',
      files: uploadedFiles
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: error.message || 'Upload fehlgeschlagen' },
      { status: 500 }
    );
  }
}
