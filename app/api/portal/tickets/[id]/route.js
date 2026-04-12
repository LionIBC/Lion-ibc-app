import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapTicket(row) {
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    kundennummer: row.kundennummer || '',
    customer_status: row.customer_status || 'neu',
    appointment_date: row.appointment_date || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    ticket_id: row.ticket_id || '',
    message: row.message || '',
    author: row.author || 'Support',
    author_type: row.author_type || '',
    created_at: row.created_at || null
  };
}

function mapAttachment(row) {
  return {
    id: row.id,
    ticket_id: row.ticket_id || '',
    original_name: row.original_name || '',
    file_path: row.file_path || '',
    mime_type: row.mime_type || '',
    file_size: row.file_size || 0,
    created_at: row.created_at || null
  };
}

async function addSignedUrls(rows) {
  const items = [];

  for (const row of rows || []) {
    let signedUrl = null;
    let downloadUrl = null;

    if (row.file_path) {
      const { data: openData } = await supabase.storage
        .from('documents')
        .createSignedUrl(row.file_path, 60 * 60);

      const { data: downloadData } = await supabase.storage
        .from('documents')
        .createSignedUrl(row.file_path, 60 * 60, {
          download: row.original_name || true
        });

      signedUrl = openData?.signedUrl || null;
      downloadUrl = downloadData?.signedUrl || null;
    }

    items.push({
      ...mapAttachment(row),
      signed_url: signedUrl,
      download_url: downloadUrl
    });
  }

  return items;
}

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // ⚠️ später durch echten Login/Kundenabgleich ersetzen
    const kundennummer = 'TEST-KUNDE';

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
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

    const [messagesResult, attachmentsResult] = await Promise.all([
      supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .eq('is_internal', false)
        .order('created_at', { ascending: true }),

      supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', id)
        .eq('is_visible_to_customer', true)
        .order('created_at', { ascending: false })
    ]);

    if (messagesResult.error) throw messagesResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;

    const attachmentsWithUrls = await addSignedUrls(attachmentsResult.data || []);

    return Response.json({
      success: true,
      data: {
        ticket: mapTicket(ticketRow),
        messages: (messagesResult.data || []).map(mapMessage),
        attachments: attachmentsWithUrls
      }
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Ticket konnte nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

