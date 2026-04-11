import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapCurrentRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    kundennummer: row.kundennummer || '',
    firma: row.firma || '',
    firmenname: row.firmenname || '',
    rechtsform: row.rechtsform || '',
    gruendungsdatum: row.gruendungsdatum || '',
    unternehmenssitz: row.unternehmenssitz || '',
    hrb_nummer: row.hrb_nummer || '',
    amtsgericht: row.amtsgericht || '',
    steuernummern: row.steuernummern || '',
    ust_id: row.ust_id || '',
    wirtschafts_id: row.wirtschafts_id || '',
    ust_meldung: row.ust_meldung || '',
    lohnsteuer_meldung: row.lohnsteuer_meldung || '',
    dauerfristverlaengerung: row.dauerfristverlaengerung || '',
    gesellschafter: row.gesellschafter || '',
    geschaeftsfuehrer: row.geschaeftsfuehrer || '',
    inhaber: row.inhaber || '',
    ansprechpartner: row.ansprechpartner || '',
    updated_at: row.updated_at || null
  };
}

function mapRequestRow(row) {
  return {
    id: row.id,
    kundennummer: row.kundennummer || '',
    firma: row.firma || '',
    changes: row.changes || {},
    begruendung: row.begruendung || '',
    status: row.status || 'offen',
    createdAt: row.created_at || null,
    decidedAt: row.decided_at || null
  };
}

function buildUpdatedCurrentData(oldData, changes) {
  const updated = { ...oldData };

  Object.entries(changes || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && 'new' in value) {
      updated[key] = value.new;
    } else {
      updated[key] = value;
    }
  });

  return updated;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const kundennummer = searchParams.get('kundennummer');

    // 1) Wenn Kundennummer vorhanden → aktuelle Stammdaten des Mandanten laden
    if (kundennummer) {
      const { data, error } = await supabase
        .from('stammdaten_current')
        .select('*')
        .eq('kundennummer', kundennummer)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return Response.json({
        success: true,
        data: mapCurrentRow(data)
      });
    }

    // 2) Ohne Kundennummer → Liste der Stammdatenanfragen für intern / Eingang
    const { data, error } = await supabase
      .from('stammdaten_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      data: (data || []).map(mapRequestRow)
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message || 'Stammdaten konnten nicht geladen werden.',
        error: err.message || 'Stammdaten konnten nicht geladen werden.'
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const kundennummer = body.kundennummer || '';
    const firma = body.firma || '';
    const changes = body.changes || {};
    const begruendung = body.begruendung || '';

    if (!kundennummer) {
      return Response.json(
        {
          success: false,
          message: 'Kundennummer fehlt.',
          error: 'Kundennummer fehlt.'
        },
        { status: 400 }
      );
    }

    if (!changes || Object.keys(changes).length === 0) {
      return Response.json(
        {
          success: false,
          message: 'Es wurden keine Änderungen übermittelt.',
          error: 'Es wurden keine Änderungen übermittelt.'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('stammdaten_requests')
      .insert([
        {
          kundennummer,
          firma,
          changes,
          begruendung,
          status: 'offen'
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      message: 'Stammdatenanfrage wurde gespeichert.',
      data: mapRequestRow(data)
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message || 'Stammdatenanfrage konnte nicht gespeichert werden.',
        error: err.message || 'Stammdatenanfrage konnte nicht gespeichert werden.'
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const requestId = body.requestId;
    const approve = Boolean(body.approve);

    if (!requestId) {
      return Response.json(
        {
          success: false,
          message: 'Request-ID fehlt.',
          error: 'Request-ID fehlt.'
        },
        { status: 400 }
      );
    }

    const { data: requestRow, error: requestError } = await supabase
      .from('stammdaten_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !requestRow) {
      return Response.json(
        {
          success: false,
          message: 'Stammdatenanfrage wurde nicht gefunden.',
          error: 'Stammdatenanfrage wurde nicht gefunden.'
        },
        { status: 404 }
      );
    }

    if (approve) {
      const { data: currentRow, error: currentError } = await supabase
        .from('stammdaten_current')
        .select('*')
        .eq('kundennummer', requestRow.kundennummer)
        .maybeSingle();

      if (currentError) {
        throw currentError;
      }

      const oldData = mapCurrentRow(currentRow) || {
        kundennummer: requestRow.kundennummer,
        firma: requestRow.firma || '',
        firmenname: '',
        rechtsform: '',
        gruendungsdatum: '',
        unternehmenssitz: '',
        hrb_nummer: '',
        amtsgericht: '',
        steuernummern: '',
        ust_id: '',
        wirtschafts_id: '',
        ust_meldung: '',
        lohnsteuer_meldung: '',
        dauerfristverlaengerung: '',
        gesellschafter: '',
        geschaeftsfuehrer: '',
        inhaber: '',
        ansprechpartner: ''
      };

      const newData = buildUpdatedCurrentData(oldData, requestRow.changes || {});

      const upsertPayload = {
        kundennummer: requestRow.kundennummer,
        firma: newData.firma || '',
        firmenname: newData.firmenname || '',
        rechtsform: newData.rechtsform || '',
        gruendungsdatum: newData.gruendungsdatum || null,
        unternehmenssitz: newData.unternehmenssitz || '',
        hrb_nummer: newData.hrb_nummer || '',
        amtsgericht: newData.amtsgericht || '',
        steuernummern: newData.steuernummern || '',
        ust_id: newData.ust_id || '',
        wirtschafts_id: newData.wirtschafts_id || '',
        ust_meldung: newData.ust_meldung || '',
        lohnsteuer_meldung: newData.lohnsteuer_meldung || '',
        dauerfristverlaengerung: newData.dauerfristverlaengerung || '',
        gesellschafter: newData.gesellschafter || '',
        geschaeftsfuehrer: newData.geschaeftsfuehrer || '',
        inhaber: newData.inhaber || '',
        ansprechpartner: newData.ansprechpartner || '',
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supabase
        .from('stammdaten_current')
        .upsert([upsertPayload], { onConflict: 'kundennummer' });

      if (upsertError) {
        throw upsertError;
      }

      const { error: historyError } = await supabase
        .from('stammdaten_history')
        .insert([
          {
            kundennummer: requestRow.kundennummer,
            request_id: requestRow.id,
            old_data: oldData,
            new_data: newData,
            decided_at: new Date().toISOString()
          }
        ]);

      if (historyError) {
        throw historyError;
      }
    }

    const { error: updateRequestError } = await supabase
      .from('stammdaten_requests')
      .update({
        status: approve ? 'freigegeben' : 'abgelehnt',
        decided_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateRequestError) {
      throw updateRequestError;
    }

    return Response.json({
      success: true,
      message: approve
        ? 'Stammdatenanfrage wurde freigegeben.'
        : 'Stammdatenanfrage wurde abgelehnt.'
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message || 'Stammdatenanfrage konnte nicht bearbeitet werden.',
        error: err.message || 'Stammdatenanfrage konnte nicht bearbeitet werden.'
      },
      { status: 500 }
    );
  }
}
