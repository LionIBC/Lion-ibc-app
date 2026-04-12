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

function buildTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const stamp = Date.now().toString().slice(-6);
  return `T-${year}-${stamp}`;
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const files = formData.getAll('files');

    // TODO später durch echten eingeloggten Kunden ersetzen
    const kundennummer = 'TEST-KUNDE';

    if (!title) {
      return Response.json(
        {
          success: false,
          message: 'Titel fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          ticket_number: buildTicketNumber(),
          kundennummer,
          title,
          description,
          category: 'Kundenanfrage',
          priority: 'normal',
          customer_status: 'neu',
          internal_status: 'neu',
          created_by_type: 'customer',
          created_by: 'Kunde',
          assigned_users: [],
          updated_at: new Date().toISOString()
        }
      ])
      .select('*')
      .single();

    if (ticketError) {
      throw ticketError;
    }

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function' || !file.name) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const storagePath = buildStoragePath(ticketRow.id, file.name);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: attachmentError } = await supabase
        .from('ticket_attachments')
        .insert([
          {
            ticket_id: ticketRow.id,
            file_path: storagePath,
            original_name: file.name || 'Datei',
            mime_type: file.type || 'application/octet-stream',
            file_size: Number(file.size || 0),
            uploaded_by: 'Kunde',
            uploaded_by_type: 'customer',
            is_visible_to_customer: true
          }
        ]);

      if (attachmentError) {
        throw attachmentError;
      }
    }

    return Response.json({
      success: true,
      data: {
        id: ticketRow.id
      }
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Ticket konnte nicht erstellt werden.'
      },
      { status: 500 }
    );
  }
}
