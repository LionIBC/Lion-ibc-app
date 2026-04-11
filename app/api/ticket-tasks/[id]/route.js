import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    if (!id) {
      return Response.json(
        {
          success: false,
          message: 'Task-ID fehlt.'
        },
        { status: 400 }
      );
    }

    const updatePayload = {};

    if (typeof body.title === 'string') updatePayload.title = body.title;
    if (typeof body.is_done === 'boolean') updatePayload.is_done = body.is_done;
    if (typeof body.assigned_to === 'string') updatePayload.assigned_to = body.assigned_to;
    if (body.due_date !== undefined) updatePayload.due_date = body.due_date || null;
    if (typeof body.sort_order === 'number') updatePayload.sort_order = body.sort_order;

    const { data, error } = await supabase
      .from('ticket_tasks')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data?.ticket_id) {
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', data.ticket_id);

      if (ticketUpdateError) {
        throw ticketUpdateError;
      }
    }

    return Response.json({
      success: true,
      message: 'Aufgabe wurde aktualisiert.',
      data: mapTask(data)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Aufgabe konnte nicht aktualisiert werden.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = params.id;

    if (!id) {
      return Response.json(
        {
          success: false,
          message: 'Task-ID fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: existingTask, error: loadError } = await supabase
      .from('ticket_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (loadError || !existingTask) {
      return Response.json(
        {
          success: false,
          message: 'Aufgabe wurde nicht gefunden.'
        },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('ticket_tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    if (existingTask.ticket_id) {
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTask.ticket_id);

      if (ticketUpdateError) {
        throw ticketUpdateError;
      }
    }

    return Response.json({
      success: true,
      message: 'Aufgabe wurde gelöscht.'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Aufgabe konnte nicht gelöscht werden.'
      },
      { status: 500 }
    );
  }
}

