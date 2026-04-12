import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapTicket(row) {
  return {
    id: row.id,
    title: row.title || '',
    kundennummer: row.kundennummer || '',
    customer_status: row.customer_status || 'neu',
    appointment_date: row.appointment_date || null,
    updated_at: row.updated_at || null
  };
}

export async function GET(req) {
  try {
    // ⚠️ später ersetzen durch echten Login
    const kundennummer = 'TEST-KUNDE';

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('kundennummer', kundennummer)
      .order('updated_at', { ascending: false });

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

