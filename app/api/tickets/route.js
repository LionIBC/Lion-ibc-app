import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      template_id,
      created_by
    } = body;

    if (!title) {
      return Response.json(
        { success: false, message: 'Titel fehlt.' },
        { status: 400 }
      );
    }

    // 🧾 1. Ticket erstellen
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          title,
          description,
          template_id,
          created_by,
          status: 'neu'
        }
      ])
      .select()
      .single();

    if (ticketError) throw ticketError;

    // 📦 2. Wenn Vorlage vorhanden → Aufgaben laden
    if (template_id) {
      const { data: templateTasks, error: templateError } = await supabase
        .from('ticket_template_tasks')
        .select('*')
        .eq('template_id', template_id)
        .order('sort_order', { ascending: true });

      if (templateError) throw templateError;

      // 🧠 3. Aufgaben ins Ticket kopieren
      if (templateTasks && templateTasks.length > 0) {
        const tasksToInsert = templateTasks.map((task) => ({
          ticket_id: ticket.id,
          title: task.title,
          sort_order: task.sort_order,
          assigned_to: task.assigned_to || null,
          status: 'offen'
        }));

        const { error: insertError } = await supabase
          .from('ticket_tasks')
          .insert(tasksToInsert);

        if (insertError) throw insertError;
      }
    }

    return Response.json({
      success: true,
      message: 'Ticket wurde erstellt.',
      ticket
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Fehler beim Erstellen des Tickets.'
      },
      { status: 500 }
    );
  }
}
