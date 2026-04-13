import { NextResponse } from 'next/server'; import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapCustomer(row) {
  return {
    id: row.id,
    kundennummer: row.kundennummer || null,
    firmenname: row.firmenname || '',
    ansprechpartner: row.ansprechpartner || '',
    email: row.email || '',
    telefon: row.telefon || '',
    status: row.status || 'aktiv',
    created_at: row.created_at || null
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('kundennummer', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapCustomer)
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Kunden konnten nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

