import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
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

async function getDefaultBankConnection(bankAccountId) {
  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('bank_account_id', bankAccountId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function createSyncRun(bankConnectionId = null, runType = 'manual') {
  const { data, error } = await supabase
    .from('bank_sync_runs')
    .insert({
      bank_connection_id: bankConnectionId,
      run_type: runType,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Sync-Lauf konnte nicht angelegt werden.');
  }

  return data;
}

async function finishSyncRun(runId, status, message) {
  await supabase
    .from('bank_sync_runs')
    .update({
      status,
      message,
      finished_at: new Date().toISOString()
    })
    .eq('id', runId);
}

async function fetchTrueLayerTransactions() {
  const accessToken = process.env.TRUELAYER_ACCESS_TOKEN;
  const accountId = process.env.TRUELAYER_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error('TRUELAYER_ACCESS_TOKEN oder TRUELAYER_ACCOUNT_ID fehlt.');
  }

  const response = await fetch(
    `https://api.truelayer.com/data/v1/accounts/${accountId}/transactions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TrueLayer Fehler: ${text}`);
  }

  const json = await response.json();
  return json.results || [];
}

async function findMatchingInvoice(transaction) {
  const amount = Math.abs(toNumber(transaction.amount, 0));
  const remittance = normalizeText(transaction.description || transaction.remittance_information || '');
  const counterparty = normalizeText(transaction.merchant_name || transaction.counterparty_name || '');

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
    return { invoice: byInvoiceNumber, match_status: 'suggested_by_invoice_number' };
  }

  const byAmountAndCustomer = rows.find((invoice) => {
    const total = Math.abs(toNumber(invoice.total, 0));
    const customer = normalizeText(invoice.kundenname);
    return total === amount && customer && counterparty && counterparty.includes(customer);
  });

  if (byAmountAndCustomer) {
    return { invoice: byAmountAndCustomer, match_status: 'suggested_by_amount_and_customer' };
  }

  const byAmount = rows.find((invoice) => {
    const total = Math.abs(toNumber(invoice.total, 0));
    return total === amount;
  });

  if (byAmount) {
    return { invoice: byAmount, match_status: 'suggested_by_amount' };
  }

  return { invoice: null, match_status: 'unmatched' };
}

async function upsertTransaction(bankAccountId, syncRunId, transaction) {
  const externalTransactionId =
    String(transaction.transaction_id || transaction.id || transaction.provider_transaction_id || '').trim();

  const amount = toNumber(transaction.amount, 0);
  const description = String(transaction.description || transaction.remittance_information || '').trim();
  const counterpartyName = String(transaction.merchant_name || transaction.counterparty_name || '').trim();
  const bookingDate = transaction.timestamp
    ? new Date(transaction.timestamp).toISOString().slice(0, 10)
    : null;

  const match = await findMatchingInvoice({
    amount,
    description,
    counterparty_name: counterpartyName
  });

  const payload = {
    bank_account_id: bankAccountId,
    bank_sync_run_id: syncRunId,
    booking_date: bookingDate,
    value_date: bookingDate,
    amount,
    currency: transaction.currency || 'EUR',
    counterparty_name: counterpartyName,
    remittance_information: description,
    bank_reference: String(transaction.transaction_reference || transaction.reference || '').trim(),
    external_transaction_id: externalTransactionId || `${amount}-${description}-${bookingDate}`,
    matched_invoice_id: null,
    match_status: match.match_status,
    imported_at: new Date().toISOString(),
    suggested_invoice_id: match.invoice?.id || null,
    suggested_invoice_number: match.invoice?.invoice_number || null,
    suggested_customer_name: match.invoice?.kundenname || null
  };

  const { data: existing } = await supabase
    .from('bank_transactions')
    .select('id')
    .eq('external_transaction_id', payload.external_transaction_id)
    .limit(1);

  let transactionId = null;

  if (existing && existing.length > 0) {
    transactionId = existing[0].id;

    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update(payload)
      .eq('id', transactionId);

    if (updateError) {
      throw new Error(updateError.message || 'Banktransaktion konnte nicht aktualisiert werden.');
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('bank_transactions')
      .insert(payload)
      .select('*')
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message || 'Banktransaktion konnte nicht gespeichert werden.');
    }

    transactionId = inserted.id;
  }

  return {
    transaction_id: transactionId,
    matched_invoice_id: null,
    suggested_invoice_id: match.invoice?.id || null,
    match_status: match.match_status
  };
}

export async function GET() {
  try {
    const bankAccount = await getDefaultBankAccount();

    const { data: transactions, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', bankAccount.id)
      .order('booking_date', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({
      success: true,
      data: transactions || []
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Bankdaten konnten nicht geladen werden.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  let syncRunId = null;

  try {
    const body = await req.json().catch(() => ({}));
    const runType = body.run_type || 'manual';

    const bankAccount = await getDefaultBankAccount();
    const bankConnection = await getDefaultBankConnection(bankAccount.id);
    const syncRun = await createSyncRun(bankConnection?.id || null, runType);
    syncRunId = syncRun.id;

    const transactions = await fetchTrueLayerTransactions();

    const results = [];
    for (const transaction of transactions) {
      const result = await upsertTransaction(bankAccount.id, syncRun.id, transaction);
      results.push(result);
    }

    await finishSyncRun(syncRun.id, 'success', `Importiert: ${results.length}`);

    return Response.json({
      success: true,
      imported_count: results.length,
      data: results
    });
  } catch (error) {
    if (syncRunId) {
      await finishSyncRun(syncRunId, 'error', error.message || 'Bank-Sync fehlgeschlagen.');
    }

    return Response.json(
      { success: false, message: error.message || 'Bank-Sync fehlgeschlagen.' },
      { status: 500 }
    );
  }
}
