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

function mapOrder(row) {
  if (!row) return null;

  return {
    id: row.id,
    customer_id: row.customer_id || null,
    kundennummer: row.kundennummer || '',
    kundenname: row.kundenname || '',
    order_number: row.order_number || '',
    title: row.title || '',
    status: row.status || 'offen',
    issue_date: row.issue_date || null,
    valid_until: row.valid_until || null,
    subtotal: toNumber(row.subtotal, 0),
    tax_total: toNumber(row.tax_total, 0),
    total: toNumber(row.total, 0),
    notes: row.notes || '',
    internal_notes: row.internal_notes || '',
    created_by: row.created_by || '',
    created_by_type: row.created_by_type || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
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

function buildOrderNumber() {
  const stamp = Date.now().toString().slice(-6);
  const year = new Date().getFullYear();
  return `AB-${year}-${stamp}`;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customer_id') || '';
    const status = url.searchParams.get('status') || '';

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return Response.json({
      success: true,
      data: (data || []).map(mapOrder)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Aufträge konnten nicht geladen werden.' },
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
      kundennummer: String(customer.kundennummer || ''),
      kundenname: String(customer.firmenname || ''),
      order_number: body.order_number || buildOrderNumber(),
      title: String(body.title || 'Auftragsbestätigung'),
      status: String(body.status || 'offen'),
      issue_date: body.issue_date || null,
      valid_until: body.valid_until || null,
      subtotal: Number(totals.subtotal.toFixed(2)),
      tax_total: Number(totals.tax_total.toFixed(2)),
      total: Number(totals.total.toFixed(2)),
      notes: body.notes || '',
      internal_notes: body.internal_notes || '',
      created_by: body.created_by || 'Intern',
      created_by_type: body.created_by_type || 'internal',
      updated_at: new Date().toISOString()
    };

    const { data: orderRow, error: insertError } = await supabase
      .from('orders')
      .insert(payload)
      .select('*')
      .single();

    if (insertError) throw new Error(insertError.message);

    if (lines.length > 0) {
      const insertLines = lines.map((line) => ({
        order_id: orderRow.id,
        ...line
      }));

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(insertLines);

      if (linesError) throw new Error(linesError.message);
    }

    return Response.json({
      success: true,
      data: mapOrder(orderRow)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Auftrag konnte nicht erstellt werden.' },
      { status: 500 }
    );
  }
}
