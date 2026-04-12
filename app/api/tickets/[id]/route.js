import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapTicket(row) {
  if (!row) return null;

  return {
    id: row.id,
    ticket_number: row.ticket_number || '',
    kundennummer: row.kundennummer || '',
    customer_name: row.customer_name || '',
    mandant_name: row.mandant_name || '',
    title: row.title || '',
    description: row.description || '',
    category: row.category || '',
    priority: row.priority || 'normal',
    internal_status: row.internal_status || 'neu',
    customer_status: row.customer_status || 'neu',
    created_by_type: row.created_by_type || 'employee',
    created_by: row.created_by || '',
    assigned_to: row.assigned_to || '',
    assigned_users: Array.isArray(row.assigned_users) ? row.assigned_users : [],
    due_date: row.due_date || null,
    appointment_date: row.appointment_date || null,
    custom_status: row.custom_status || '',
    internal_notes: row.internal_notes || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    ticket_id: row.ticket_id || '',
    message: row.message || '',
    author: row.author || '',
    author_type: row.author_type || '',
    is_internal: Boolean(row.is_internal),
    created_at: row.created_at || null
  };
}

function mapTask(row) {
  return {
    id: row.id,
    ticket_id: row.ticket_id || '',
    title: row.title || '',
    is_done: Boolean(row.is_done),
    assigned_to: row.assigned_to || '',
    due_date: row.due_date || null,
    sort_order: row.sort_order || 0,
    created_at: row.created_at || null
  };
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

async function addSignedUrlsToAttachments(rows) {
  const result = [];

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

    result.push({
      ...mapAttachment(row),
      signed_url: signedUrl,
      download_url: downloadUrl
    });
  }

  return result;
}

export async function GET(req, { params }) {
  try {
    const id = params.id;

    if (!id) {
      return Response.json(
        {
          success: false,
          message: 'Ticket-ID fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
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

    const [messagesResult, tasksResult, attachmentsResult] = await Promise.all([
      supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true }),

      supabase
        .from('ticket_tasks')
        .select('*')
        .eq('ticket_id', id)
        .order('sort_order', { ascending: true }),

      supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: false })
    ]);

    if (messagesResult.error) throw messagesResult.error;
    if (tasksResult.error) throw tasksResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;

    const attachmentsWithUrls = await addSignedUrlsToAttachments(
      attachmentsResult.data || []
    );

    return Response.json({
      success: true,
      data: {
        ticket: mapTicket(ticketRow),
        messages: (messagesResult.data || []).map(mapMessage),
        tasks: (tasksResult.data || []).map(mapTask),
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

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.priority !== undefined) updatePayload.priority = body.priority;
    if (body.internal_status !== undefined) updatePayload.internal_status = body.internal_status;
    if (body.customer_status !== undefined) updatePayload.customer_status = body.customer_status;
    if (body.assigned_to !== undefined) updatePayload.assigned_to = body.assigned_to;
    if (body.assigned_users !== undefined) updatePayload.assigned_users = body.assigned_users;
    if (body.due_date !== undefined) updatePayload.due_date = body.due_date || null;
    if (body.appointment_date !== undefined) updatePayload.appointment_date = body.appointment_date || null;
    if (body.custom_status !== undefined) updatePayload.custom_status = body.custom_status || '';
    if (body.internal_notes !== undefined) updatePayload.internal_notes = body.internal_notes || '';

    const { data, error } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Ticket aktualisiert',
      data: mapTicket(data)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Ticket konnte nicht aktualisiert werden.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = params.id;

    const { data: attachments } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', id);

    const filePaths = (attachments || [])
      .map((item) => item.file_path)
      .filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from('documents').remove(filePaths);
    }

    await supabase.from('ticket_messages').delete().eq('ticket_id', id);
    await supabase.from('ticket_tasks').delete().eq('ticket_id', id);
    await supabase.from('ticket_attachments').delete().eq('ticket_id', id);

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Ticket gelöscht'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Ticket konnte nicht gelöscht werden.'
      },
      { status: 500 }
    );
  }
}
