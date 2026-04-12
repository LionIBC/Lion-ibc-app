import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const templateId = body.template_id || '';
    const title = body.title || '';
    const assignedTo = body.assigned_to || '';

    if (!templateId) {
      return Response.json(
        {
          success: false,
          message: 'Vorlagen-ID fehlt.'
        },
        { status: 400 }
      );
    }

    if (!title.trim()) {
      return Response.json(
        {
          success: false,
          message: 'Aufgabentitel fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: lastTask, error: loadError } = await supabase
      .from('ticket_template_tasks')
      .select('sort_order')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (loadError) throw loadError;

    const nextSortOrder =
      typeof lastTask?.sort_order === 'number' ? lastTask.sort_order + 1 : 1;

    const { data, error } = await supabase
      .from('ticket_template_tasks')
      .insert([
        {
          template_id: templateId,
          title,
          assigned_to: assignedTo,
          sort_order: nextSortOrder
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Vorlagen-Aufgabe wurde erstellt.',
      data
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlagen-Aufgabe konnte nicht erstellt werden.'
      },
      { status: 500 }
    );
  }
}


