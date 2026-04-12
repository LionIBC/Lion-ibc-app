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
    assigned_users: Array.isArray(row.assigned_users) ? row.assigned_users : [],
    due_date: row.due_date || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function buildTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `T-${year}-${timestamp}`;
}

function getDefaultInternalStatus() {
  return 'neu';
}

function getDefaultCustomerStatus(createdByType) {
  return createdByType === 'customer' ? 'neu' : 'in_bearbeitung'; }

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const kundennummer = searchParams.get('kundennummer');
    const internalStatus = searchParams.get('internal_status');
    const customerStatus = searchParams.get('customer_status');
    const assignedTo = searchParams.get('assigned_to');
    const category = searchParams.get('category');

    let query = supabase
      .from('tickets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (kundennummer) query = query.eq('kundennummer', kundennummer);
    if (internalStatus) query = query.eq('internal_status', internalStatus);
    if (customerStatus) query = query.eq('customer_status', customerStatus);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;

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
    const title = body.title || '';
    const description = body.description || '';
    const category = body.category || 'Allgemein';
    const priority = body.priority || 'normal';
    const createdByType = body.created_by_type || 'customer';
    const createdBy = body.created_by || '';
    const assignedTo = body.assigned_to || '';
    const assignedUsers = Array.isArray(body.assigned_users) ? body.assigned_users : [];
    const dueDate = body.due_date || null;

    if (!title.trim()) {
      return Response.json(
        { success: false, message: 'Überschrift fehlt.' },
        { status: 400 }
      );
    }

    const ticketNumber = buildTicketNumber();
    const internalStatus = getDefaultInternalStatus();
    const customerStatus = getDefaultCustomerStatus(createdByType);

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          ticket_number: ticketNumber,
          kundennummer,
          title,
          description,
          category,
          priority,
          internal_status: internalStatus,
          customer_status: customerStatus,
          created_by_type: createdByType,
          created_by: createdBy,
          assigned_to: assignedTo,
          assigned_users: assignedUsers,
          due_date: dueDate,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Ticket wurde erstellt.',
      data: mapTicket(data)
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
