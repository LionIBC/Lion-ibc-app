import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const title = body.title || '';
    const description = body.description || '';

    // ⚠️ später Login ersetzen
    const kundennummer = 'TEST-KUNDE';

    if (!title.trim()) {
      return Response.json(
        { success: false, message: 'Titel fehlt.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          title,
          description,
          kundennummer,
          customer_status: 'neu',
          internal_status: 'neu',
          assigned_users: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select('*')
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data
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

