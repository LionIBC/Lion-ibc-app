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
    title: row.title || '',
    description: row.description || '',
    category: row.category || '',
    priority: row.priority || 'normal',
    internal_status: row.internal_status || 'neu',
    customer_status: row.customer_status || 'neu',
    created_by_type: row.created_by_type || 'customer',
    created_by: row.created_by || '',
    assigned_to: row.assigned_to || '',
    due_date: row.due_date || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    ticket_id: row.ticket_id,
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
    ticket_id: row.ticket_id,
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
    ticket_id: row.ticket_id,
    file_path: row.file_path || '',
    original_name: row.original_name || '',
    mime_type: row.mime_type || '',
    file_size: row.file_size || 0,
    uploaded_by: row.uploaded_by || '',
    uploaded_by_type: row.uploaded_by_type || '',
    created_at: row.created_at || null
  };
}

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError) {
      throw ticketError;
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

    return Response.json({
      success: true,
      data: {
        ticket: mapTicket(ticketRow),
        messages: (messagesResult.data || []).map(mapMessage),
        tasks: (tasksResult.data || []).map(mapTask),
        attachments: (attachmentsResult.data || []).map(mapAttachment)
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

    if (typeof body.title === 'string') updatePayload.title = body.title;
    if (typeof body.description === 'string') updatePayload.description = body.description;
    if (typeof body.category === 'string') updatePayload.category = body.category;
    if (typeof body.priority === 'string') updatePayload.priority = body.priority;
    if (typeof body.internal_status === 'string') updatePayload.internal_status = body.internal_status;
    if (typeof body.customer_status === 'string') updatePayload.customer_status = body.customer_status;
    if (typeof body.assigned_to === 'string') updatePayload.assigned_to = body.assigned_to;
    if (body.due_date !== undefined) updatePayload.due_date = body.due_date || null;

    const { data, error } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      message: 'Ticket wurde aktualisiert.',
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

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      message: 'Ticket wurde gelöscht.'
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

