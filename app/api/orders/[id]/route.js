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

function mapLine(row) {
  return {
    id: row.id,
    order_id: row.order_id || null,
    position: row.position || 1,
    description: row.description || '',
    quantity: toNumber(row.quantity, 1),
    unit_price: toNumber(row.unit_price, 0),
    discount_percent: toNumber(row.discount_percent, 0),
    tax_rate: toNumber(row.tax_rate, 21),
    line_net: toNumber(row.line_net, 0),
    line_tax: toNumber(row.line_tax, 0),
    line_total: toNumber(row.line_total, 0),
    created_at: row.created_at || null
  };
}

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !orderRow) {
      return Response.json(
        { success: false, message: 'Auftrag nicht gefunden.' },
        { status: 404 }
      );
    }

    const { data: lines, error: linesError } = await supabase
      .from('order_lines')
      .select('*')
      .eq('order_id', id)
      .order('position', { ascending: true });

    if (linesError) throw new Error(linesError.message);

    const { data: downPayments, error: downPaymentError } = await supabase
      .from('invoice_documents')
      .select('id, invoice_number, invoice_type, total, status')
      .eq('order_id', id)
      .eq('invoice_type', 'advance')
      .order('created_at', { ascending: true });

    if (downPaymentError) throw new Error(downPaymentError.message);

    const advanceTotal = (downPayments || []).reduce((sum, item) => sum + toNumber(item.total, 0), 0);
    const remainingTotal = toNumber(orderRow.total, 0) - advanceTotal;

    return Response.json({
      success: true,
      data: {
        order: mapOrder(orderRow),
        lines: (lines || []).map(mapLine),
        advance_invoices: downPayments || [],
        advance_total: Number(advanceTotal.toFixed(2)),
        remaining_total: Number(remainingTotal.toFixed(2))
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Auftrag konnte nicht geladen werden.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const { data: existingRow, error: existingError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existingRow) {
      return Response.json(
        { success: false, message: 'Auftrag nicht gefunden.' },
        { status: 404 }
      );
    }

    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) updatePayload.title = body.title || 'Auftragsbestätigung';
    if (body.status !== undefined) updatePayload.status = body.status || 'offen';
    if (body.issue_date !== undefined) updatePayload.issue_date = body.issue_date || null;
    if (body.valid_until !== undefined) updatePayload.valid_until = body.valid_until || null;
    if (body.notes !== undefined) updatePayload.notes = body.notes || '';
    if (body.internal_notes !== undefined) updatePayload.internal_notes = body.internal_notes || '';

    if (Array.isArray(body.lines)) {
      const lines = normalizeLines(body.lines);
      const totals = sumTotals(lines);

      updatePayload.subtotal = Number(totals.subtotal.toFixed(2));
      updatePayload.tax_total = Number(totals.tax_total.toFixed(2));
      updatePayload.total = Number(totals.total.toFixed(2));
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw new Error(updateError.message);

    if (Array.isArray(body.lines)) {
      const lines = normalizeLines(body.lines);

      const { error: deleteLinesError } = await supabase
        .from('order_lines')
        .delete()
        .eq('order_id', id);

      if (deleteLinesError) throw new Error(deleteLinesError.message);

      if (lines.length > 0) {
        const insertLines = lines.map((line) => ({
          order_id: id,
          ...line
        }));

        const { error: insertLinesError } = await supabase
          .from('order_lines')
          .insert(insertLines);

        if (insertLinesError) throw new Error(insertLinesError.message);
      }
    }

    return Response.json({
      success: true,
      data: mapOrder(updatedRow)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Auftrag konnte nicht aktualisiert werden.' },
      { status: 500 }
    );
  }
}
