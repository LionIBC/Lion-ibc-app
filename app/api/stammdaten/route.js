import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ GET → Stammdaten laden
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const kundennummer = searchParams.get('kundennummer');

    let query = supabase
      .from('stammdaten_current')
      .select('*');

    // 👉 Wenn Kundennummer vorhanden → einzelner Datensatz
    if (kundennummer) {
      query = query.eq('kundennummer', kundennummer).single();
    } else {
      // 👉 sonst Liste (für Eingang!)
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return Response.json({
      data: data || []
    });

  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// ✅ POST → Änderungswunsch speichern
export async function POST(req) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('stammdaten_requests')
      .insert([body])
      .select();

    if (error) throw error;

    return Response.json({ data });

  } catch (err) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

