import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sanitizeFileName(name) {
  return String(name || 'datei')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildStoragePath(ticketId, fileName) {
  const safeName = sanitizeFileName(fileName);
  const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `tickets/${ticketId}/${uniquePart}-${safeName}`;
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const ticketId = String(formData.get('ticket_id') || '');
    const files = formData.getAll('files');

    // TODO später durch echten Login/Kundenabgleich ersetzen
    const kundennummer = 'TEST-KUNDE';

    if (!ticketId) {
      return Response.json(
        {
          success: false,
          message: 'Ticket-ID fehlt.'
        },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return Response.json(
        {
          success: false,
          message: 'Keine Dateien übergeben.'
        },
        { status: 400 }
      );
    }

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('kundennummer', kundennummer)
      .single();

    if (ticketError || !ticketRow) {
      return Response.json(
        {
          success: false,
          message: 'Ticket nicht gefunden.'
        },
        { status: 404 }
      );
    }

    const insertedFiles = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function' || !file.name) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const storagePath = buildStoragePath(ticketId, file.name);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: insertedRow, error: insertError } = await supabase
        .from('ticket_attachments')
        .insert([
          {
            ticket_id: ticketId,
            file_path: storagePath,
            original_name: file.name || 'Datei',
            mime_type: file.type || 'application/octet-stream',
            file_size: Number(file.size || 0),
            uploaded_by: 'Kunde',
            uploaded_by_type: 'customer',
            is_visible_to_customer: true
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        await supabase.storage.from('documents').remove([storagePath]);
        throw insertError;
      }

      insertedFiles.push(insertedRow);
    }

    await supabase
      .from('tickets')
      .update({
        customer_status: 'rueckfrage',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return Response.json({
      success: true,
      message: 'Datei(en) wurden hochgeladen.',
      data: insertedFiles
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Dateien konnten nicht hochgeladen werden.'
      },
      { status: 500 }
    );
  }
}

