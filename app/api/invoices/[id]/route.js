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

function mapLine(row) {
  return {
    id: row.id,
    invoice_id: row.invoice_id,
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

function mapEvent(row) {
  return {
    id: row.id,
    invoice_id: row.invoice_id,
    event_type: row.event_type || '',
    event_label: row.event_label || '',
    actor: row.actor || '',
    actor_type: row.actor_type || '',
    payload: row.payload || {},
    created_at: row.created_at || null
  };
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
      return Response.json(
        { success: false, message: 'Rechnung nicht gefunden.' },
        { status: 404 }
      );
    }

    const [linesResult, eventsResult, paymentsResult, remindersResult] = await Promise.all([
      supabase.from('invoice_lines').select('*').eq('invoice_id', id).order('position', { ascending: true }),
      supabase.from('invoice_events').select('*').eq('invoice_id', id).order('created_at', { ascending: false }),
      supabase.from('invoice_payments').select('*').eq('invoice_id', id).order('payment_date', { ascending: false }),
      supabase.from('invoice_reminders').select('*').eq('invoice_id', id).order('level', { ascending: true })
    ]);

    if (linesResult.error) throw new Error(linesResult.error.message);
    if (eventsResult.error) throw new Error(eventsResult.error.message);
    if (paymentsResult.error) throw new Error(paymentsResult.error.message);
    if (remindersResult.error) throw new Error(remindersResult.error.message);

    return Response.json({
      success: true,
      data: {
        invoice: mapInvoice(invoiceRow),
        lines: (linesResult.data || []).map(mapLine),
        events: (eventsResult.data || []).map(mapEvent),
        payments: paymentsResult.data || [],
        reminders: remindersResult.data || []
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Rechnung konnte nicht geladen werden.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const { data: existingRow, error: existingError } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existingRow) {
      return Response.json(
        { success: false, message: 'Rechnung nicht gefunden.' },
        { status: 404 }
      );
    }

    if (existingRow.locked_at) {
      return Response.json(
        { success: false, message: 'Freigegebene Rechnungen dürfen nicht mehr direkt geändert werden.' },
        { status: 400 }
      );
    }

    const lines = normalizeLines(body.lines || []);
    const totals = sumTotals(lines);

    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (body.invoice_type !== undefined) updatePayload.invoice_type = body.invoice_type || 'standard';
    if (body.status !== undefined) updatePayload.status = body.status || 'draft';
    if (body.issue_date !== undefined) updatePayload.issue_date = body.issue_date || null;
    if (body.service_date !== undefined) updatePayload.service_date = body.service_date || null;
    if (body.due_date !== undefined) updatePayload.due_date = body.due_date || null;
    if (body.currency !== undefined) updatePayload.currency = body.currency || 'EUR';
    if (body.language_code !== undefined) updatePayload.language_code = body.language_code || 'es';
    if (body.payment_method !== undefined) updatePayload.payment_method = body.payment_method || '';
    if (body.payment_terms !== undefined) updatePayload.payment_terms = body.payment_terms || '';
    if (body.notes !== undefined) updatePayload.notes = body.notes || '';
    if (body.internal_notes !== undefined) updatePayload.internal_notes = body.internal_notes || '';

    if (Array.isArray(body.lines)) {
      updatePayload.subtotal = Number(totals.subtotal.toFixed(2));
      updatePayload.tax_total = Number(totals.tax_total.toFixed(2));
      updatePayload.total = Number(totals.total.toFixed(2));
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('invoice_documents')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw new Error(updateError.message);

    if (Array.isArray(body.lines)) {
      const { error: deleteLinesError } = await supabase
        .from('invoice_lines')
        .delete()
        .eq('invoice_id', id);

      if (deleteLinesError) throw new Error(deleteLinesError.message);

      if (lines.length > 0) {
        const insertLines = lines.map((line) => ({
          invoice_id: id,
          ...line
        }));

        const { error: insertLinesError } = await supabase
          .from('invoice_lines')
          .insert(insertLines);

        if (insertLinesError) throw new Error(insertLinesError.message);
      }
    }

    const { error: eventError } = await supabase
      .from('invoice_events')
      .insert({
        invoice_id: id,
        event_type: 'updated',
        event_label: 'Rechnung aktualisiert',
        actor: body.actor || 'Intern',
        actor_type: body.actor_type || 'internal',
        payload: { updated_fields: Object.keys(body || {}) }
      });

    if (eventError) throw new Error(eventError.message);

    return Response.json({
      success: true,
      data: mapInvoice(updatedRow)
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Rechnung konnte nicht aktualisiert werden.' },
      { status: 500 }
    );
  }
}

