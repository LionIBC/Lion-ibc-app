import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function esc(value) {
  const text = String(value ?? '');
  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function fmtNumber(value) {
  const n = Number(value || 0);
  return n.toFixed(2).replace('.', ',');
}

function mapInvoiceType(type) {
  switch (String(type || '').toLowerCase()) {
    case 'advance':
      return 'Abschlagsrechnung';
    case 'final':
      return 'Schlussrechnung';
    case 'rectificativa':
      return 'Korrekturrechnung';
    case 'reminder':
      return 'Mahnung';
    default:
      return 'Rechnung';
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get('date_from') || '';
    const dateTo = url.searchParams.get('date_to') || '';
    const status = url.searchParams.get('status') || '';

    let query = supabase
      .from('invoice_documents')
      .select('*')
      .order('issue_date', { ascending: true });

    if (dateFrom) query = query.gte('issue_date', dateFrom);
    if (dateTo) query = query.lte('issue_date', dateTo);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = data || [];

    const header = [
      'Belegdatum',
      'Belegnummer',
      'Debitorenkonto',
      'Kundenname',
      'Belegart',
      'Leistungszeitraum_von',
      'Leistungszeitraum_bis',
      'Netto',
      'Steuer',
      'Brutto',
      'Waehrung',
      'Status',
      'Buchungstext'
    ];

    const lines = [header.join(';')];

    for (const row of rows) {
      const bookingText = `${mapInvoiceType(row.invoice_type)} ${row.invoice_number || ''} ${row.kundenname || ''}`.trim();

      lines.push([
        esc(row.issue_date || ''),
        esc(row.invoice_number || ''),
        esc(row.kundennummer || ''),
        esc(row.kundenname || ''),
        esc(mapInvoiceType(row.invoice_type)),
        esc(row.period_start || ''),
        esc(row.period_end || ''),
        esc(fmtNumber(row.subtotal)),
        esc(fmtNumber(row.tax_total)),
        esc(fmtNumber(row.total)),
        esc(row.currency || 'EUR'),
        esc(row.cancelled ? 'storniert' : (row.status || '')),
        esc(bookingText)
      ].join(';'));
    }

    const csv = '\ufeff' + lines.join('\n');
    const fileName = `datev_export_${dateFrom || 'alle'}_${dateTo || 'offen'}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'DATEV Export konnte nicht erstellt werden.' },
      { status: 500 }
    );
  }
}
