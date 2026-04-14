import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function euro(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const { data: invoiceRow, error: invoiceError } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoiceRow) {
      return new Response('Rechnung nicht gefunden.', { status: 404 });
    }

    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true });

    if (linesError) {
      return new Response(linesError.message, { status: 500 });
    }

    const rows = (lines || []).map((line) => `
      <tr>
        <td>${escapeHtml(line.description)}</td>
        <td style="text-align:right;">${line.quantity ?? ''}</td>
        <td style="text-align:right;">${euro(line.unit_price)}</td>
        <td style="text-align:right;">${line.tax_rate ?? 0}%</td>
        <td style="text-align:right;">${euro(line.line_total)}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Rechnung ${escapeHtml(invoiceRow.invoice_number || '')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { margin-bottom: 8px; }
          .muted { color: #666; margin-bottom: 24px; }
          .box { margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px 8px; font-size: 14px; }
          th { text-align: left; background: #f7f7f7; }
          .totals { margin-top: 20px; width: 320px; margin-left: auto; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>Rechnung ${escapeHtml(invoiceRow.invoice_number || '')}</h1>
        <div class="muted">${escapeHtml(invoiceRow.kundenname || '')} (${escapeHtml(invoiceRow.kundennummer || '')})</div>

        <div class="box">
          <div><strong>Status:</strong> ${escapeHtml(invoiceRow.status || '')}</div>
          <div><strong>Rechnungsdatum:</strong> ${escapeHtml(invoiceRow.issue_date || '')}</div>
          <div><strong>Fälligkeitsdatum:</strong> ${escapeHtml(invoiceRow.due_date || '')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th style="text-align:right;">Menge</th>
              <th style="text-align:right;">Preis</th>
              <th style="text-align:right;">Steuer</th>
              <th style="text-align:right;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Netto</span><span>${euro(invoiceRow.subtotal)}</span></div>
          <div><span>Steuer</span><span>${euro(invoiceRow.tax_total)}</span></div>
          <div class="grand"><span>Gesamt</span><span>${euro(invoiceRow.total)}</span></div>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error) {
    return new Response(error.message || 'PDF konnte nicht vorbereitet werden.', { status: 500 });
  }
}

