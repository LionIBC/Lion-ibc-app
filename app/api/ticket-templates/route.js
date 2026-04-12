import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data: templates, error } = await supabase
      .from('ticket_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const results = [];

    for (const template of templates || []) {
      const { data: tasks } = await supabase
        .from('ticket_template_tasks')
        .select('*')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true });

      results.push({
        ...template,
        tasks: tasks || []
      });
    }

    return Response.json({
      success: true,
      data: results
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

