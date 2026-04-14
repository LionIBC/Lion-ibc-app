import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const { reason, user } = body;

    // Rechnung laden
    const { data: invoice } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!invoice) {
      return Response.json({ message: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    if (!invoice.is_final) {
      return Response.json({ message: 'Nur finale Rechnungen können storniert werden' }, { status: 400 });
    }

    // Storno setzen
    const { error } = await supabase
      .from('invoice_documents')
      .update({
        cancelled: true,
        cancelled_at: new Date().toISOString(),
        cancelled_by: user || 'system',
        cancel_reason: reason || 'Storno'
      })
      .eq('id', id);

    if (error) throw error;

    // Audit Log
    await supabase.from('invoice_events').insert({
      invoice_id: id,
      event_type: 'cancelled',
      event_data: { reason },
      created_by: user || 'system'
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}

