import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapTemplate(row) {
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    category: row.category || '',
    created_at: row.created_at || null
  };
}

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const { data: template, error } = await supabase
      .from('ticket_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const { data: tasks, error: taskError } = await supabase
      .from('ticket_template_tasks')
      .select('*')
      .eq('template_id', id)
      .order('sort_order', { ascending: true });

    if (taskError) throw taskError;

    return Response.json({
      success: true,
      data: {
        ...mapTemplate(template),
        tasks: tasks || []
      }
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlage konnte nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const updatePayload = {};
    if (typeof body.name === 'string') updatePayload.name = body.name;
    if (typeof body.description === 'string') updatePayload.description = body.description;
    if (typeof body.category === 'string') updatePayload.category = body.category;

    const { data, error } = await supabase
      .from('ticket_templates')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Vorlage wurde aktualisiert.',
      data: mapTemplate(data)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlage konnte nicht aktualisiert werden.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = params.id;

    const { error } = await supabase
      .from('ticket_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Vorlage wurde gelöscht.'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlage konnte nicht gelöscht werden.'
      },
      { status: 500 }
    );
  }
}

