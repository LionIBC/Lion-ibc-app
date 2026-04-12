import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapTemplateTask(row) {
  return {
    id: row.id,
    template_id: row.template_id || '',
    title: row.title || '',
    sort_order: row.sort_order || 0,
    assigned_to: row.assigned_to || '',
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
          message: 'Vorlagen-Aufgaben-ID fehlt.'
        },
        { status: 400 }
      );
    }

    const updatePayload = {};

    if (typeof body.title === 'string') {
      updatePayload.title = body.title;
    }

    if (typeof body.sort_order === 'number') {
      updatePayload.sort_order = body.sort_order;
    }

    if (typeof body.assigned_to === 'string') {
      updatePayload.assigned_to = body.assigned_to;
    }

    const { data, error } = await supabase
      .from('ticket_template_tasks')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      message: 'Vorlagen-Aufgabe wurde aktualisiert.',
      data: mapTemplateTask(data)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlagen-Aufgabe konnte nicht aktualisiert werden.'
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
          message: 'Vorlagen-Aufgaben-ID fehlt.'
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('ticket_template_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      message: 'Vorlagen-Aufgabe wurde gelöscht.'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlagen-Aufgabe konnte nicht gelöscht werden.'
      },
      { status: 500 }
    );
  }
}

