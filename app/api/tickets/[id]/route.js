import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapTicket(row) {
  return {
    id: row.id,
    ticket_number: row.ticket_number,
    kundennummer: row.kundennummer,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    internal_status: row.internal_status,
    customer_status: row.customer_status,
    assigned_to: row.assigned_to,
    assigned_users: row.assigned_users || [],
    due_date: row.due_date,
    internal_notes: row.internal_notes,
    created_at: row.created_at
  };
}

// 🔹 GET (Ticket laden)
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at');

    const { data: tasks } = await supabase
      .from('ticket_tasks')
      .select('*')
      .eq('ticket_id', id)
      .order('sort_order');

    const { data: attachments } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', id);

    return Response.json({
      success: true,
      data: {
        ticket: mapTicket(ticket),
        messages,
        tasks,
        attachments
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 🔹 PATCH (Ticket bearbeiten)
export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const { data, error } = await supabase
      .from('tickets')
      .update({
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        internal_status: body.internal_status,
        customer_status: body.customer_status,
        assigned_to: body.assigned_to,
        assigned_users: body.assigned_users,
        due_date: body.due_date,
        internal_notes: body.internal_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data: mapTicket(data)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// 🔹 DELETE (Ticket löschen)
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await supabase.from('ticket_tasks').delete().eq('ticket_id', id);
    await supabase.from('ticket_messages').delete().eq('ticket_id', id);
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
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
