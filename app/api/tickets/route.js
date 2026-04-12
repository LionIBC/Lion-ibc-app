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
    created_by_type: row.created_by_type || 'customer',
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

function buildTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const stamp = Date.now().toString().slice(-6);
  return `T-${year}-${stamp}`;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return Response.json({
      success: true,
      data: (data || []).map(mapTicket)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Tickets konnten nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const kundennummer = body.kundennummer || '';
    const customerName = body.customer_name || '';
    const mandantName = body.mandant_name || '';
    const title = body.title || '';
    const description = body.description || '';
    const category = body.category || '';
    const priority = body.priority || 'normal';
    const createdByType = body.created_by_type || 'employee';
    const createdBy = body.created_by || 'Mitarbeiter';
    const assignedTo = body.assigned_to || '';
    const assignedUsers = Array.isArray(body.assigned_users) ? body.assigned_users : [];
    const dueDate = body.due_date || null;
    const appointmentDate = body.appointment_date || null;
    const customStatus = body.custom_status || '';
    const templateId = body.template_id || '';

    if (!title.trim()) {
      return Response.json(
        {
          success: false,
          message: 'Überschrift fehlt.'
        },
        { status: 400 }
      );
    }

    const ticketNumber = buildTicketNumber();

    const insertPayload = {
      ticket_number: ticketNumber,
      kundennummer: kundennummer,
      customer_name: customerName,
      mandant_name: mandantName,
      title: title,
      description: description,
      category: category,
      priority: priority,
      internal_status: 'neu',
      customer_status: createdByType === 'customer' ? 'neu' : 'in_bearbeitung',
      created_by_type: createdByType,
      created_by: createdBy,
      assigned_to: assignedTo,
      assigned_users: assignedUsers,
      due_date: dueDate,
      appointment_date: appointmentDate,
      custom_status: customStatus,
      updated_at: new Date().toISOString()
    };

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .insert([insertPayload])
      .select('*')
      .single();

    if (ticketError) throw ticketError;

    if (templateId) {
      const { data: templateTasks, error: templateTasksError } = await supabase
        .from('ticket_template_tasks')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true });

      if (templateTasksError) throw templateTasksError;

      if (templateTasks && templateTasks.length > 0) {
        const taskRows = templateTasks.map((task, index) => ({
          ticket_id: ticketRow.id,
          title: task.title || '',
          assigned_to: task.assigned_to || '',
          due_date: null,
          sort_order: typeof task.sort_order === 'number' ? task.sort_order : index + 1,
          is_done: false
        }));

        const { error: insertTaskError } = await supabase
          .from('ticket_tasks')
          .insert(taskRows);

        if (insertTaskError) throw insertTaskError;
      }
    }

    return Response.json({
      success: true,
      message: 'Ticket wurde erstellt.',
      data: mapTicket(ticketRow)
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
