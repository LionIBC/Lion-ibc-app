import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const { data: invoice } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', id)
      .single();

    const { data: lines } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', id);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;

    page.drawText(`Rechnung`, { x: 50, y, size: 18, font });
    y -= 30;

    page.drawText(`Kunde: ${invoice.kundenname || ''}`, { x: 50, y, size: 12, font });
    y -= 20;

    page.drawText(`Datum: ${invoice.issue_date || ''}`, { x: 50, y, size: 12, font });
    y -= 20;

    page.drawText(`Zeitraum: ${invoice.period_start || ''} - ${invoice.period_end || ''}`, { x: 50, y, size: 12, font });
    y -= 30;

    for (const line of lines || []) {
      page.drawText(`${line.description} - ${line.quantity} x ${line.unit_price}`, { x: 50, y, size: 10, font });
      y -= 15;
    }

    y -= 20;
    page.drawText(`Gesamt: ${invoice.total || 0} €`, { x: 50, y, size: 14, font });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="rechnung.pdf"',
      },
    });

  } catch (err) {
    return Response.json({ success: false, message: err.message });
  }
}
