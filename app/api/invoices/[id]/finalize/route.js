import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function euro(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

function hashBytes(bytes) {
  return crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

function safeFileName(value) {
  return String(value || 'rechnung')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function buildInvoicePdf(invoice, lines) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const draw = (text, x, y, size = 11, bold = false) => {
    page.drawText(String(text || ''), {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1)
    });
  };

  let y = 800;
  draw(invoice.issuer_name || 'Rechnungsaussteller', 40, y, 18, true);
  y -= 20;
  draw(invoice.issuer_address || '', 40, y, 10, false);
  y -= 14;
  draw(invoice.issuer_tax_number || '', 40, y, 10, false);
  y -= 14;
  draw(invoice.issuer_vat_id || '', 40, y, 10, false);

  y -= 40;
  draw(`Rechnung ${invoice.invoice_number || ''}`, 40, y, 20, true);
  y -= 24;
  draw(`Kunde: ${invoice.recipient_name || invoice.kundenname || ''}`, 40, y, 11, false);
  y -= 14;
  draw(`Rechnungsdatum: ${invoice.issue_date || ''}`, 40, y, 11, false);
  y -= 14;
  draw(`Fälligkeit: ${invoice.due_date || ''}`, 40, y, 11, false);

  y -= 34;
  draw('Positionen', 40, y, 13, true);
  y -= 20;

  draw('Beschreibung', 40, y, 10, true);
  draw('Menge', 330, y, 10, true);
  draw('Preis', 390, y, 10, true);
  draw('Gesamt', 470, y, 10, true);
  y -= 12;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 18;

  for (const line of lines || []) {
    draw(line.description || '', 40, y, 10, false);
    draw(String(line.quantity || ''), 330, y, 10, false);
    draw(euro(line.unit_price), 390, y, 10, false);
    draw(euro(line.line_total), 470, y, 10, false);
    y -= 18;

    if (y < 120) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
      newPage.drawText('', { x: 0, y: 0, size: 1, font });
    }
  }

  y -= 20;
  page.drawLine({ start: { x: 320, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;
  draw(`Netto: ${euro(invoice.subtotal)}`, 360, y, 11, false);
  y -= 16;
  draw(`Steuer: ${euro(invoice.tax_total)}`, 360, y, 11, false);
  y -= 18;
  draw(`Gesamt: ${euro(invoice.total)}`, 360, y, 14, true);

  return await pdfDoc.save();
}

export async function POST(req, { params }) {
  try {
    const id = params.id;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return Response.json({ success: false, message: 'Rechnung nicht gefunden.' }, { status: 404 });
    }

    if (invoice.cancelled) {
      return Response.json({ success: false, message: 'Stornierte Rechnungen können nicht finalisiert werden.' }, { status: 400 });
    }

    if (invoice.is_final) {
      return Response.json({ success: false, message: 'Rechnung ist bereits finalisiert.' }, { status: 400 });
    }

    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true });

    if (linesError) {
      return Response.json({ success: false, message: linesError.message }, { status: 500 });
    }

    const pdfBytes = await buildInvoicePdf(invoice, lines || []);
    const pdfHash = hashBytes(pdfBytes);

    const fileName = `${safeFileName(invoice.invoice_number || id)}.pdf`;
    const filePath = `invoices/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      return Response.json({ success: false, message: uploadError.message }, { status: 500 });
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('invoice_documents')
      .update({
        is_final: true,
        status: 'final',
        finalized_at: now,
        finalized_by: 'system',
        pdf_path: filePath,
        pdf_hash: pdfHash,
        pdf_created_at: now,
        updated_at: now
      })
      .eq('id', id);

    if (updateError) {
      return Response.json({ success: false, message: updateError.message }, { status: 500 });
    }

    const { error: eventError } = await supabase
      .from('invoice_events')
      .insert({
        invoice_id: id,
        event_type: 'finalized',
        event_label: 'Rechnung finalisiert',
        event_data: { pdf_hash: pdfHash, pdf_path: filePath },
        created_by: 'system'
      });

    if (eventError) {
      return Response.json({ success: false, message: eventError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Rechnung wurde finalisiert.',
      data: {
        pdf_path: filePath,
        pdf_hash: pdfHash
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Rechnung konnte nicht finalisiert werden.' },
      { status: 500 }
    );
  }
}
