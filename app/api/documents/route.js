import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sanitizeFileName(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_');
}

function categorySlug(category) {
  return String(category || 'sonstiges')
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^\w]+/g, '-');
}

async function attachSignedUrls(rows) {
  const result = [];

  for (const row of rows || []) {
    let signedUrl = null;
    let downloadUrl = null;

    if (row.file_path) {
      const { data: signedData } = await supabase.storage
        .from('documents')
        .createSignedUrl(row.file_path, 60 * 60);

      const { data: downloadData } = await supabase.storage
        .from('documents')
        .createSignedUrl(row.file_path, 60 * 60, {
          download: row.original_name || true
        });

      signedUrl = signedData?.signedUrl || null;
      downloadUrl = downloadData?.signedUrl || null;
    }

    result.push({
      ...row,
      signed_url: signedUrl,
      download_url: downloadUrl
    });
  }

  return result;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const kundennummer = searchParams.get('kundennummer');

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (kundennummer) {
      query = query.eq('kundennummer', kundennummer);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rowsWithUrls = await attachSignedUrls(data || []);

    return Response.json({
      success: true,
      data: rowsWithUrls
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Dokumente konnten nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const kundennummer = formData.get('kundennummer');
    const category = formData.get('category');
    const description = formData.get('description') || '';
    const uploadedBy = formData.get('uploadedBy') || 'portal';
    const files = formData.getAll('files');

    if (!kundennummer) {
      return Response.json(
        { success: false, message: 'Kundennummer fehlt.' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return Response.json(
        { success: false, message: 'Keine Dateien ausgewählt.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const insertedRows = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const cleanOriginalName = sanitizeFileName(file.name);
      const storedName = `${kundennummer}_${year}-${String(month).padStart(2, '0')}_${categorySlug(category)}_${Date.now()}_${cleanOriginalName}`;
      const filePath = `${kundennummer}/${storedName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: row, error: insertError } = await supabase
        .from('documents')
        .insert({
          kundennummer,
          original_name: file.name,
          stored_name: storedName,
          category,
          description,
          file_path: filePath,
          mime_type: file.type || '',
          file_size: file.size || 0,
          uploaded_by: uploadedBy,
          status: 'neu',
          year,
          month,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      insertedRows.push(row);
    }

    const rowsWithUrls = await attachSignedUrls(insertedRows);

    return Response.json({
      success: true,
      message: 'Dokument(e) erfolgreich gespeichert.',
      data: rowsWithUrls
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Dokumente konnten nicht gespeichert werden.'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, category, status, description } = body;

    if (!id) {
      return Response.json(
        { success: false, message: 'Dokument-ID fehlt.' },
        { status: 400 }
      );
    }

    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (category) updatePayload.category = category;
    if (status) updatePayload.status = status;
    if (typeof description === 'string') updatePayload.description = description;

    const { error } = await supabase
      .from('documents')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      message: 'Dokument aktualisiert.'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Dokument konnte nicht aktualisiert werden.'
      },
      { status: 500 }
    );
  }
}
