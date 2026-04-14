import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function calculatePeriodFromLogic(logic, baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  if (logic === 'next_month') {
    const start = new Date(year, month + 1, 1);
    const end = endOfMonth(start);
    return { period_start: formatDateInput(start), period_end: formatDateInput(end), period_type: 'next_month' };
  }

  if (logic === 'previous_month') {
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(start);
    return { period_start: formatDateInput(start), period_end: formatDateInput(end), period_type: 'previous_month' };
  }

  if (logic === 'current_month') {
    const start = new Date(year, month, 1);
    const end = endOfMonth(start);
    return { period_start: formatDateInput(start), period_end: formatDateInput(end), period_type: 'current_month' };
  }

  if (logic === 'previous_quarter') {
    const quarter = Math.floor(month / 3);
    const startMonth = quarter * 3 - 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return { period_start: formatDateInput(start), period_end: formatDateInput(end), period_type: 'previous_quarter' };
  }

  if (logic === 'current_quarter') {
    const quarter = Math.floor(month / 3);
    const startMonth = quarter * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return { period_start: formatDateInput(start), period_end: formatDateInput(end), period_type: 'current_quarter' };
  }

  return { period_start: null, period_end: null, period_type: null };
}

async function createInvoiceFromTemplate(recurringRow) {
  const { data: templateInvoice, error: templateError } = await supabase
    .from('invoice_documents')
    .select('*')
    .eq('id', recurringRow.template_invoice_id)
    .single();

  if (templateError || !templateInvoice) {
    throw new Error(`Vorlagenrechnung ${recurringRow.template_invoice_id} nicht gefunden.`);
  }

  const { data: templateLines, error: linesError } = await supabase
    .from('invoice_lines')
    .select('*')
    .eq('invoice_id', recurringRow.template_invoice_id)
    .order('position', { ascending: true });

  if (linesError) {
    throw new Error(linesError.message);
  }

  const period = calculatePeriodFromLogic(recurringRow.period_logic, new Date());

  const now = new Date().toISOString();
  const invoicePayload = {
    customer_id: templateInvoice.customer_id,
    order_id: templateInvoice.order_id || null,
    recurring_template_id: recurringRow.id,
    series_id: templateInvoice.series_id || null,
    invoice_type: templateInvoice.invoice_type || 'standard',
    status: 'draft',
    issue_date: formatDateInput(new Date()),
    service_date: templateInvoice.service_date || null,
    due_date: templateInvoice.due_date || null,
    period_start: period.period_start,
    period_end: period.period_end,
    period_type: period.period_type,
    currency: templateInvoice.currency || 'EUR',
    language_code: templateInvoice.language_code || 'es',
    kundennummer: templateInvoice.kundennummer || '',
    kundenname: templateInvoice.kundenname || '',
    payment_method: templateInvoice.payment_method || '',
    payment_terms: templateInvoice.payment_terms || '',
    notes: templateInvoice.notes || '',
    internal_notes: templateInvoice.internal_notes || '',
    issuer_name: templateInvoice.issuer_name || '',
    issuer_address: templateInvoice.issuer_address || '',
    issuer_tax_number: templateInvoice.issuer_tax_number || '',
    issuer_vat_id: templateInvoice.issuer_vat_id || '',
    issuer_iban: templateInvoice.issuer_iban || '',
    issuer_bic: templateInvoice.issuer_bic || '',
    recipient_name: templateInvoice.recipient_name || '',
    recipient_address: templateInvoice.recipient_address || '',
    recipient_tax_number: templateInvoice.recipient_tax_number || '',
    recipient_vat_id: templateInvoice.recipient_vat_id || '',
    created_by: 'system',
    created_by_type: 'system',
    updated_at: now
  };

  const { data: newInvoice, error: insertError } = await supabase
    .from('invoice_documents')
    .insert(invoicePayload)
    .select('*')
    .single();

  if (insertError || !newInvoice) {
    throw new Error(insertError?.message || 'Rechnung konnte nicht erstellt werden.');
  }

  if (templateLines && templateLines.length > 0) {
    const newLines = templateLines.map((line, index) => ({
      invoice_id: newInvoice.id,
      service_catalog_id: line.service_catalog_id || null,
      position: index + 1,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent,
      tax_rate: line.tax_rate,
      line_net: line.line_net,
      line_tax: line.line_tax,
      line_total: line.line_total
    }));

    const { error: insertLinesError } = await supabase
      .from('invoice_lines')
      .insert(newLines);

    if (insertLinesError) {
      throw new Error(insertLinesError.message);
    }

    const subtotal = newLines.reduce((sum, line) => sum + Number(line.line_net || 0), 0);
    const taxTotal = newLines.reduce((sum, line) => sum + Number(line.line_tax || 0), 0);
    const total = newLines.reduce((sum, line) => sum + Number(line.line_total || 0), 0);

    const { error: totalUpdateError } = await supabase
      .from('invoice_documents')
      .update({
        subtotal: Number(subtotal.toFixed(2)),
        tax_total: Number(taxTotal.toFixed(2)),
        total: Number(total.toFixed(2))
      })
      .eq('id', newInvoice.id);

    if (totalUpdateError) {
      throw new Error(totalUpdateError.message);
    }
  }

  const { error: eventError } = await supabase
    .from('invoice_events')
    .insert({
      invoice_id: newInvoice.id,
      event_type: 'created_from_recurring',
      event_label: 'Rechnung aus wiederkehrender Vorlage erstellt',
      actor: 'system',
      actor_type: 'system',
      payload: {
        recurring_invoice_id: recurringRow.id,
        template_invoice_id: recurringRow.template_invoice_id,
        period_logic: recurringRow.period_logic
      }
    });

  if (eventError) {
    throw new Error(eventError.message);
  }

  return newInvoice;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceRunAll = Boolean(body.force_run_all);

    const { data: recurringRows, error } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    const today = new Date();
    const todayDay = today.getDate();

    const dueRows = (recurringRows || []).filter((row) => {
      if (forceRunAll) return true;
      return Number(row.execution_day || 0) === todayDay;
    });

    const created = [];
    const errors = [];

    for (const row of dueRows) {
      try {
        const invoice = await createInvoiceFromTemplate(row);
        created.push({
          recurring_invoice_id: row.id,
          invoice_id: invoice.id
        });
      } catch (err) {
        errors.push({
          recurring_invoice_id: row.id,
          message: err.message || 'Unbekannter Fehler'
        });
      }
    }

    return Response.json({
      success: true,
      created_count: created.length,
      error_count: errors.length,
      created,
      errors
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Wiederkehrender Lauf fehlgeschlagen.' },
      { status: 500 }
    );
  }
}

