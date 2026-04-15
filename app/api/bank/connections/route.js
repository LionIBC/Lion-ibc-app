import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function buildConnectUrl(providerName) {
  const provider = String(providerName || '').toLowerCase();

  if (provider === 'truelayer') return 'https://console.truelayer.com/';
  if (provider === 'yapily') return 'https://dashboard.yapily.com/';

  return '';
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bank_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return Response.json({ success: true, data: data || [] });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Bankverbindungen konnten nicht geladen werden.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const bankName = String(body.bank_name || '').trim();
    const providerName = String(body.provider_name || '').trim();
    const displayName = String(body.display_name || '').trim();
    const iban = String(body.iban || '').trim();
    const accountHolder = String(body.account_holder || '').trim();
    const currency = String(body.currency || 'EUR').trim();

    if (!bankName) {
      return Response.json(
        { success: false, message: 'bank_name fehlt.' },
        { status: 400 }
      );
    }

    const { data: bankAccount, error: bankAccountError } = await supabase
      .from('bank_accounts')
      .insert({
        bank_name: bankName,
        display_name: displayName || bankName,
        iban: iban || null,
        account_holder: accountHolder || null,
        currency,
        is_active: true
      })
      .select('*')
      .single();

    if (bankAccountError || !bankAccount) {
      throw new Error(bankAccountError?.message || 'Bankkonto konnte nicht angelegt werden.');
    }

    const connectUrl = buildConnectUrl(providerName);

    const { data: connection, error: connectionError } = await supabase
      .from('bank_connections')
      .insert({
        bank_account_id: bankAccount.id,
        provider_name: providerName || 'manual',
        bank_name: bankName,
        display_name: displayName || bankName,
        iban: iban || null,
        status: providerName === 'manual' ? 'manual' : 'pending',
        is_active: true,
        connect_url: connectUrl || null
      })
      .select('*')
      .single();

    if (connectionError || !connection) {
      throw new Error(connectionError?.message || 'Bankverbindung konnte nicht angelegt werden.');
    }

    return Response.json({
      success: true,
      data: {
        ...connection,
        connect_url: connectUrl || null
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Bankverbindung konnte nicht angelegt werden.' },
      { status: 500 }
    );
  }
}
