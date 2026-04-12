import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const ticketId = body.ticket_id || '';
    const message = body.message || '';

    // ⚠️ später durch echten Login/Kundenabgleich ersetzen
    const kundennummer = 'TEST-KUNDE';

    if (!ticketId || !message.trim()) {
      return Response.json(
        {
          success: false,
          message: 'Ticket oder Nachricht fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: ticketRow, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('kundennummer', kundennummer)
      .single();

    if (ticketError || !ticketRow) {
      return Response.json(
        {
          success: false,
          message: 'Ticket nicht gefunden.'
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert([
        {
          ticket_id: ticketId,
          message: message,
          author: 'Kunde',
          author_type: 'customer',
          is_internal: false
        }
      ])
      .select('*')
      .single();

    if (error) throw error;

    await supabase
      .from('tickets')
      .update({
        customer_status: 'rueckfrage',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return Response.json({
      success: true,
      data
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message || 'Nachricht konnte nicht gesendet werden.'
      },
      { status: 500 }
    );
  }
}

