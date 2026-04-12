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

export async function GET() {
  try {
    const { data: templates, error } = await supabase
      .from('ticket_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const result = [];

    for (const template of templates || []) {
      const { data: tasks, error: taskError } = await supabase
        .from('ticket_template_tasks')
        .select('*')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true });

      if (taskError) throw taskError;

      result.push({
        ...mapTemplate(template),
        tasks: tasks || []
      });
    }

    return Response.json({
      success: true,
      data: result
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlagen konnten nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const name = body.name || '';
    const description = body.description || '';
    const category = body.category || '';

    if (!name.trim()) {
      return Response.json(
        {
          success: false,
          message: 'Name der Vorlage fehlt.'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ticket_templates')
      .insert([
        {
          name,
          description,
          category
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Vorlage wurde erstellt.',
      data: mapTemplate(data)
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Vorlage konnte nicht erstellt werden.'
      },
      { status: 500 }
    );
  }
}
