import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLines(lines) {
  if (!Array.isArray(lines)) return [];

  return lines.map((line, index) => {
    const quantity = toNumber(line.quantity, 1);
    const unitPrice = toNumber(line.unit_price, 0);
    const discountPercent = toNumber(line.discount_percent, 0);
    const taxRate = toNumber(line.tax_rate, 21);

    const grossBase = quantity * unitPrice;
    const discountAmount = grossBase * (discountPercent / 100);
    const net = grossBase - discountAmount;
    const tax = net * (taxRate / 100);
    const total = net + tax;

    return {
      position: index + 1,
      description: String(line.description || '').trim(),
      quantity,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      tax_rate: taxRate,
      line_net: Number(net.toFixed(2)),
      line_tax: Number(tax.toFixed(2)),
      line_total: Number(total.toFixed(2))
    };
  }).filter((line) => line.description);
}

function sumTotals(lines) {
  return lines.reduce(
    (acc, line) => {
      acc.subtotal += toNumber(line.line_net, 0);
      acc.tax_total += toNumber(line.line_tax, 0);
      acc.total += toNumber(line.line_total, 0);
      return acc;
    },
    { subtotal: 0, tax_total: 0, total: 0 }
  );
}

function mapInvoice(row) {
  if (!row) return null;

  return {
    id: row.id,
    customer_id: row.customer_id || null,
    parent_invoice_id: row.parent_invoice_id || null,
    series_id: row.series_id || null,
    invoice_number: row.invoice_number || '',
    invoice_type: row.invoice_type || 'standard',
    status: row.status || 'draft',
    issue_date: row.issue_date || null,
    service_date: row.service_date || null,
    due_date: row.due_date || null,
    currency: row.currency || 'EUR',
    language_code: row.language_code || 'es',
    kundennummer: row.kundennummer || '',
    kundenname: row.kundenname || '',
    subtotal: toNumber(row.subtotal, 0),
    tax_total: toNumber(row.tax_total, 0),
    total: toNumber(row.total, 0),
    payment_method: row.payment_method || '',
    payment_terms: row.payment_terms || '',
    notes: row.notes || '',
    internal_notes: row.internal_notes || '',
    facturae_version: row.facturae_version || '',
    facturae_status: row.facturae_status || '',
    locked_at: row.locked_at || null,
    approved_at: row.approved_at || null,
    issued_at: row.issued_at || null,
    content_hash: row.content_hash || '',
    pdf_path: row.pdf_path || '',
    xml_path: row.xml_path || '',
    created_by: row.created_by || '',
    created_by_type: row.created_by_type || '',
    updated_at: row.updated_at || null,
    created_at: row.created_at || null
  };
}

async function loadCustomer(customerId) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, kundennummer, firmenname')
    .eq('id', customerId)
    .single();

  if (error || !data) {
    throw new Error('Mandant wurde nicht gefunden.');
  }

  return data;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customer_id') || '';
    const status = url.searchParams.get('status') || '';
    const invoiceType = url.searchParams.get('invoice_type') || '';

    let query = supabase
      .from('invoice_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (status) query = query.eq('status', status);
    if (invoiceType) query = query.eq('invoice_type', invoiceType);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return Response.json({
      success: true,
      data: (data || []).map(mapInvoice)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Rechnungen konnten nicht geladen werden.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const customerId = String(body.customer_id || '').trim();
    if (!customerId) {
      return Response.json(
        { success: false, message: 'customer_id fehlt.' },
        { status: 400 }
      );
    }

    const customer = await loadCustomer(customerId);
    const lines = normalizeLines(body.lines || []);
    const totals = sumTotals(lines);

    const payload = {
      customer_id: customer.id,
      parent_invoice_id: body.parent_invoice_id || null,
      series_id: body.series_id || null,
      invoice_number: body.invoice_number || null,
      invoice_type: String(body.invoice_type || 'standard'),
      status: String(body.status || 'draft'),
      issue_date: body.issue_date || null,
      service_date: body.service_date || null,
      due_date: body.due_date || null,
      currency: String(body.currency || 'EUR'),
      language_code: String(body.language_code || 'es'),
      kundennummer: String(customer.kundennummer || ''),
      kundenname: String(customer.firmenname || ''),
      subtotal: Number(totals.subtotal.toFixed(2)),
      tax_total: Number(totals.tax_total.toFixed(2)),
      total: Number(totals.total.toFixed(2)),
      payment_method: body.payment_method || '',
      payment_terms: body.payment_terms || '',
      notes: body.notes || '',
      internal_notes: body.internal_notes || '',
      facturae_version: body.facturae_version || '',
      facturae_status: body.facturae_status || '',
      created_by: body.created_by || 'Intern',
      created_by_type: body.created_by_type || 'internal',
      updated_at: new Date().toISOString()
    };

    const { data: invoiceRow, error: insertError } = await supabase
      .from('invoice_documents')
      .insert(payload)
      .select('*')
      .single();

    if (insertError) throw new Error(insertError.message);

    if (lines.length > 0) {
      const insertLines = lines.map((line) => ({
        invoice_id: invoiceRow.id,
        ...line
      }));

      const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(insertLines);

      if (linesError) throw new Error(linesError.message);
    }

    const { error: eventError } = await supabase
      .from('invoice_events')
      .insert({
        invoice_id: invoiceRow.id,
        event_type: 'created',
        event_label: 'Rechnung erstellt',
        actor: body.created_by || 'Intern',
        actor_type: body.created_by_type || 'internal',
        payload: { status: payload.status, invoice_type: payload.invoice_type, lines_count: lines.length }
      });

    if (eventError) throw new Error(eventError.message);

    return Response.json({
      success: true,
      data: mapInvoice(invoiceRow)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Rechnung konnte nicht erstellt werden.' },
      { status: 500 }
    );
  }
}
