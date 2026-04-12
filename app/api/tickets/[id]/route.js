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

// GET EINZELNES TICKET
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: mapTicket(data)
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

// UPDATE TICKET
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
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

    // 🔥 NEU (dein Wunsch)
    if (body.appointment_date !== undefined) {
      updatePayload.appointment_date = body.appointment_date || null;
    }

    if (body.custom_status !== undefined) {
      updatePayload.custom_status = body.custom_status || '';
    }

    if (body.internal_notes !== undefined) {
      updatePayload.internal_notes = body.internal_notes || '';
    }

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

// DELETE TICKET
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // zuerst abhängige Daten löschen
    await supabase.from('ticket_messages').delete().eq('ticket_id', id);
    await supabase.from('ticket_tasks').delete().eq('ticket_id', id);
    await supabase.from('ticket_attachments').delete().eq('ticket_id', id);

    // dann ticket selbst
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
