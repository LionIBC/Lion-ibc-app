import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function createHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(req, { params }) {
  try {
    const id = params.id;

    const { data: invoice } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!invoice) {
      return Response.json({ message: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    if (invoice.is_final) {
      return Response.json({ message: 'Bereits finalisiert' }, { status: 400 });
    }

    const pdfContent = JSON.stringify(invoice);
    const hash = createHash(pdfContent);

    const { error } = await supabase
      .from('invoice_documents')
      .update({
        is_final: true,
        finalized_at: new Date().toISOString(),
        finalized_by: 'system',
        pdf_hash: hash,
        pdf_created_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('invoice_events').insert({
      invoice_id: id,
      event_type: 'finalized',
      event_data: { hash },
      created_by: 'system'
    });

    return Response.json({ success: true });

  } catch (err) {
    return Response.json({ message: err.message }, { status: 500 });
  }
}

