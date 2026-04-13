import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [];
}

function buildTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const stamp = Date.now().toString().slice(-6);
  return `T-${year}-${stamp}`;
}

function normalizeStatus(value, fallback = 'neu') {
  return String(value || fallback).trim() || fallback; }

function mapTicket(row) {
  if (!row) return null;

  return {
    id: row.id,
    ticket_number: row.ticket_number || '',
    customer_id: row.customer_id || null,
    kundennummer: row.kundennummer || '',
    kundenname: row.kundenname || '',
    title: row.title || '',
    description: row.description || '',
    category: row.category || '',
    priority: row.priority || 'normal',
    customer_status: row.customer_status || 'neu',
    internal_status: row.internal_status || 'neu',
    assigned_users: normalizeArray(row.assigned_users),
    participants: normalizeArray(row.participants),
    due_date: row.due_date || null,
    appointment_date: row.appointment_date || null,
    created_by: row.created_by || '',
    created_by_type: row.created_by_type || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

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

    const customerId = String(body.customer_id || '').trim();
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const category = String(body.category || '').trim();
    const priority = String(body.priority || 'normal').trim() || 'normal';
    const dueDate = body.due_date || null;
    const appointmentDate = body.appointment_date || null;
    const assignedUsers = normalizeArray(body.assigned_users);
    const participants = normalizeArray(body.participants);
    const customerStatus = normalizeStatus(body.customer_status, 'neu');
    const internalStatus = normalizeStatus(body.internal_status, 'neu');
    const createdBy = String(body.created_by || 'Intern').trim() || 'Intern';
    const createdByType = String(body.created_by_type || 'internal').trim() || 'internal';

    if (!customerId) {
      return Response.json(
        {
          success: false,
          message: 'customer_id fehlt.'
        },
        { status: 400 }
      );
    }

    if (!title) {
      return Response.json(
        {
          success: false,
          message: 'Titel fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: customerRow, error: customerError } = await supabase
      .from('customers')
      .select('id, kundennummer, firmenname')
      .eq('id', customerId)
      .single();

    if (customerError || !customerRow) {
      return Response.json(
        {
          success: false,
          message: 'Mandant wurde nicht gefunden.'
        },
        { status: 404 }
      );
    }

    const insertPayload = {
      ticket_number: buildTicketNumber(),
      customer_id: customerRow.id,
      kundennummer: String(customerRow.kundennummer || ''),
      kundenname: String(customerRow.firmenname || ''),
      title,
      description,
      category,
      priority,
      customer_status: customerStatus,
      internal_status: internalStatus,
      assigned_users: assignedUsers,
      participants,
      due_date: dueDate,
      appointment_date: appointmentDate,
      created_by: createdBy,
      created_by_type: createdByType,
      updated_at: new Date().toISOString()
    };

    const { data: insertedRow, error: insertError } = await supabase
      .from('tickets')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return Response.json({
      success: true,
      data: mapTicket(insertedRow)
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
