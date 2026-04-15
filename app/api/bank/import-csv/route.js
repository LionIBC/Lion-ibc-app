import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value, fallback = 0) {
  const cleaned = String(value || '').replace(/\./g, '').replace(',', '.').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function parseCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];

  const headers = rows[0].split(';').map((h) => h.trim().toLowerCase());

  return rows.slice(1).map((line) => {
    const cols = line.split(';');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] || '').trim();
    });
    return row;
  });
}

async function getDefaultBankAccount() {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('Kein aktives Bankkonto gefunden.');
  }

  return data;
}

async function findMatchingInvoice(row) {
  const amount = Math.abs(
    toNumber(row.amount || row.betrag || 0)
  );

  const remittance = normalizeText(
    row.remittance_information || row.verwendungszweck || ''
  );

  const counterparty = normalizeText(
    row.counterparty_name || row.gegenpartei || row.empfaenger || row.auftraggeber || ''
  );

  const { data: invoices, error } = await supabase
    .from('invoice_documents')
    .select('*')
    .in('status', ['draft', 'approved', 'issued', 'final', 'part_paid', 'overdue']);

  if (error) {
    throw new Error(error.message);
  }

  const rows = invoices || [];

  const byInvoiceNumber = rows.find((invoice) => {
    const invoiceNumber = normalizeText(invoice.invoice_number);
    return invoiceNumber && remittance.includes(invoiceNumber);
  });

  if (byInvoiceNumber) {
    return {
      invoice: byInvoiceNumber,
      match_status: 'suggested_by_invoice_number',
      should_auto_match: true
    };
  }

  const byAmountAndCustomer = rows.find((invoice) => {
    const total = Math.abs(toNumber(invoice.total, 0));
    const customer = normalizeText(invoice.kundenname);
    return total === amount && customer && counterparty && counterparty.includes(customer);
  });

  if (byAmountAndCustomer) {
    return {
      invoice: byAmountAndCustomer,
      match_status: 'suggested_by_amount_and_customer',
      should_auto_match: false
    };
  }

  const byAmount = rows.find((invoice) => {
    const total = Math.abs(toNumber(invoice.total, 0));
    return total === amount;
  });

  if (byAmount) {
    return {
      invoice: byAmount,
      match_status: 'suggested_by_amount',
      should_auto_match: false
    };
  }

  return {
    invoice: null,
    match_status: 'unmatched',
    should_auto_match: false
  };
}

async function applyInvoicePayment(invoice, amount, bookingDate, currency, reference, bankTransactionId, isManual = false) {
  const absAmount = Math.abs(toNumber(amount, 0));

  const { data: existingPayment } = await supabase
    .from('invoice_payments')
    .select('id')
    .eq('bank_transaction_id', bankTransactionId)
    .limit(1)
    .maybeSingle();

  if (!existingPayment) {
    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoice.id,
        payment_date: bookingDate,
        amount: absAmount,
        currency: currency || 'EUR',
        payment_source: isManual ? 'manual_match' : 'csv_auto_match',
        reference,
        bank_transaction_id: bankTransactionId,
        is_manual: isManual
      });

    if (paymentError) {
      throw new Error(paymentError.message || 'Zahlung konnte nicht gespeichert werden.');
    }
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('invoice_payments')
    .select('*')
    .eq('invoice_id', invoice.id);

  if (paymentsError) {
    throw new Error(paymentsError.message || 'Zahlungen konnten nicht geladen werden.');
  }

  const paid = (payments || []).reduce(
    (sum, p) => sum + Math.abs(toNumber(p.amount)),
    0
  );

  const total = Math.abs(toNumber(invoice.total));

  let newStatus = 'part_paid';
  if (paid >= total) newStatus = 'paid';

  const { error: updateError } = await supabase
    .from('invoice_documents')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', invoice.id);

  if (updateError) {
    throw new Error(updateError.message || 'Rechnung konnte nicht aktualisiert werden.');
  }

  await supabase
    .from('invoice_events')
    .insert({
      invoice_id: invoice.id,
      event_type: isManual ? 'manual_payment_match' : 'csv_auto_payment_match',
      event_label: isManual ? 'Zahlung manuell zugewiesen' : 'Zahlung automatisch aus CSV erkannt',
      actor: 'system',
      actor_type: isManual ? 'user' : 'system',
      payload: {
        bank_transaction_id: bankTransactionId,
        amount: absAmount,
        new_status: newStatus
      }
    });

  return newStatus;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json(
        { success: false, message: 'CSV-Datei fehlt.' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCsv(text);
    const bankAccount = await getDefaultBankAccount();

    let imported = 0;
    let autoMatched = 0;
    let suggested = 0;
    let skipped = 0;

    for (const row of rows) {
      const bookingDate = row.booking_date || row.datum || row.buchungsdatum || null;
      const amount = toNumber(row.amount || row.betrag || 0);
      const currency = row.currency || row.waehrung || 'EUR';
      const counterpartyName =
        row.counterparty_name || row.gegenpartei || row.empfaenger || row.auftraggeber || '';
      const remittanceInformation =
        row.remittance_information || row.verwendungszweck || '';
      const bankReference = row.bank_reference || row.referenz || '';
      const externalTransactionId =
        row.external_transaction_id ||
        row.id ||
        `${bookingDate || ''}-${row.amount || row.betrag || ''}-${bankReference || ''}`;

      const { data: existing } = await supabase
        .from('bank_transactions')
        .select('id')
        .eq('external_transaction_id', externalTransactionId)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        skipped += 1;
        continue;
      }

      const match = await findMatchingInvoice(row);

      const payload = {
        bank_account_id: bankAccount.id,
        booking_date: bookingDate,
        value_date: row.value_date || row.valutadatum || null,
        amount,
        currency,
        counterparty_name: counterpartyName,
        remittance_information: remittanceInformation,
        bank_reference: bankReference,
        external_transaction_id: externalTransactionId,
        matched_invoice_id: match.should_auto_match ? match.invoice?.id || null : null,
        match_status: match.match_status,
        suggested_invoice_id: match.invoice?.id || null,
        suggested_invoice_number: match.invoice?.invoice_number || null,
        suggested_customer_name: match.invoice?.kundenname || null,
        is_manual: true,
        imported_at: new Date().toISOString()
      };

      const { data: inserted, error } = await supabase
        .from('bank_transactions')
        .insert(payload)
        .select('*')
        .single();

      if (error || !inserted) {
        continue;
      }

      imported += 1;

      if (match.invoice && match.should_auto_match) {
        await applyInvoicePayment(
          match.invoice,
          amount,
          bookingDate,
          currency,
          bankReference || remittanceInformation,
          inserted.id,
          false
        );

        await supabase
          .from('bank_transactions')
          .update({
            matched_invoice_id: match.invoice.id,
            match_status: 'auto_matched'
          })
          .eq('id', inserted.id);

        autoMatched += 1;
      } else if (match.invoice) {
        suggested += 1;
      }
    }

    return Response.json({
      success: true,
      imported_count: imported,
      auto_matched_count: autoMatched,
      suggested_count: suggested,
      skipped_count: skipped
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'CSV konnte nicht importiert werden.' },
      { status: 500 }
    );
  }
}