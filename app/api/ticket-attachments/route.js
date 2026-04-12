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

function mapAttachment(row) {
  return {
    id: row.id,
    ticket_id: row.ticket_id || '',
    file_path: row.file_path || '',
    original_name: row.original_name || '',
    mime_type: row.mime_type || '',
    file_size: row.file_size || 0,
    uploaded_by: row.uploaded_by || '',
    uploaded_by_type: row.uploaded_by_type || '',
    created_at: row.created_at || null
  };
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const ticketId = String(formData.get('ticket_id') || '');
    const uploadedBy = String(formData.get('uploaded_by') || '');
    const uploadedByType = String(formData.get('uploaded_by_type') || 'employee');
    const files = formData.getAll('files');

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
          message: 'Es wurden keine Dateien übergeben.'
        },
        { status: 400 }
      );
    }

    const uploadedRows = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;

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
            uploaded_by: uploadedBy,
            uploaded_by_type: uploadedByType
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        await supabase.storage.from('documents').remove([storagePath]);
        throw insertError;
      }

      uploadedRows.push(mapAttachment(insertedRow));
    }

    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return Response.json({
      success: true,
      message: 'Datei(en) wurden hochgeladen.',
      data: uploadedRows
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

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return Response.json(
        {
          success: false,
          message: 'Anhang-ID fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: existingAttachment, error: loadError } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (loadError || !existingAttachment) {
      return Response.json(
        {
          success: false,
          message: 'Anhang wurde nicht gefunden.'
        },
        { status: 404 }
      );
    }

    if (existingAttachment.file_path) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([existingAttachment.file_path]);

      if (storageError) {
        throw storageError;
      }
    }

    const { error: deleteError } = await supabase
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      throw deleteError;
    }

    if (existingAttachment.ticket_id) {
      await supabase
        .from('tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingAttachment.ticket_id);
    }

    return Response.json({
      success: true,
      message: 'Datei wurde gelöscht.'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Datei konnte nicht gelöscht werden.'
      },
      { status: 500 }
    );
  }
}

