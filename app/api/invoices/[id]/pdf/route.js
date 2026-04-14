import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const { data: invoice, error } = await supabase
      .from('invoice_documents')
      .select('invoice_number, pdf_path')
      .eq('id', id)
      .single();

    if (error || !invoice || !invoice.pdf_path) {
      return new Response('PDF nicht gefunden.', { status: 404 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(invoice.pdf_path);

    if (downloadError || !fileData) {
      return new Response(downloadError?.message || 'PDF konnte nicht geladen werden.', { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number || 'rechnung'}.pdf"`
      }
    });
  } catch (error) {
    return new Response(error.message || 'PDF konnte nicht geladen werden.', { status: 500 });
  }
}
