import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔹 Stammdaten laden
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const kundennummer = searchParams.get('kundennummer');

    const { data, error } = await supabase
      .from('stammdaten_current')
      .select('*')
      .eq('kundennummer', kundennummer)
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Änderungswunsch speichern
export async function POST(req) {
  try {
    const body = await req.json();

    const { kundennummer, changes } = body;

    const { error } = await supabase
      .from('stammdaten_requests')
      .insert([
        {
          kundennummer,
          changes
        }
      ]);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Intern: Freigabe
export async function PUT(req) {
  try {
    const body = await req.json();
    const { requestId, approve } = body;

    // Anfrage holen
    const { data: request } = await supabase
      .from('stammdaten_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) throw new Error('Request nicht gefunden');

    if (approve) {
      // aktuelle Daten holen
      const { data: current } = await supabase
        .from('stammdaten_current')
        .select('*')
        .eq('kundennummer', request.kundennummer)
        .single();

      const newData = {
        ...current,
        ...request.changes
      };

      // Update durchführen
      await supabase
        .from('stammdaten_current')
        .update(newData)
        .eq('kundennummer', request.kundennummer);

      // History speichern
      await supabase.from('stammdaten_history').insert([
        {
          kundennummer: request.kundennummer,
          request_id: request.id,
          old_data: current,
          new_data: newData
        }
      ]);
    }

    // Status ändern
    await supabase
      .from('stammdaten_requests')
      .update({
        status: approve ? 'freigegeben' : 'abgelehnt',
        decided_at: new Date()
      })
      .eq('id', requestId);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
