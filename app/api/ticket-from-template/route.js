import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildTicketNumber() {
  const now = new Date();
  return `T-${now.getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const { template_id, kundennummer, assigned_to } = body;

    const { data: template } = await supabase
      .from('ticket_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    const { data: templateTasks } = await supabase
      .from('ticket_template_tasks')
      .select('*')
      .eq('template_id', template_id)
      .order('sort_order', { ascending: true });

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([
        {
          ticket_number: buildTicketNumber(),
          kundennummer,
          title: template.name,
          description: template.description,
          category: template.category,
          internal_status: 'neu',
          customer_status: 'in_bearbeitung',
          assigned_to: assigned_to
        }
      ])
      .select()
      .single();

    if (error) throw error;

    for (const task of templateTasks || []) {
      await supabase.from('ticket_tasks').insert([
        {
          ticket_id: ticket.id,
          title: task.title,
          sort_order: task.sort_order,
          assigned_to: task.assigned_to
        }
      ]);
    }

    return Response.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

