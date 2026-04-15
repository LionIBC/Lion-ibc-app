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

    for (const row of rows) {
      const payload = {
        bank_account_id: bankAccount.id,
        booking_date: row.booking_date || row.datum || row.buchungsdatum || null,
        value_date: row.value_date || row.valutadatum || null,
        amount: toNumber(row.amount || row.betrag || 0),
        currency: row.currency || row.waehrung || 'EUR',
        counterparty_name: row.counterparty_name || row.gegenpartei || row.empfaenger || row.auftraggeber || '',
        remittance_information: row.remittance_information || row.verwendungszweck || '',
        bank_reference: row.bank_reference || row.referenz || '',
        external_transaction_id: row.external_transaction_id || row.id || `${row.booking_date || row.datum || ''}-${row.amount || row.betrag || ''}-${row.bank_reference || row.referenz || ''}`,
        match_status: 'unmatched',
        is_manual: true,
        imported_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bank_transactions')
        .insert(payload);

      if (!error) imported += 1;
    }

    return Response.json({ success: true, imported_count: imported });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'CSV konnte nicht importiert werden.' },
      { status: 500 }
    );
  }
}
