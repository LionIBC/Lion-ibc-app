let requests = [];

/**
 * POST → neue Stammdatenänderung speichern  */ export async function POST(req) {
  try {
    const body = await req.json();

    const newRequest = {
      id: 'REQ-' + Date.now(),
      kundennummer: body.kundennummer,
      firma: body.firma || '',
      changes: body.changes || {},
      begruendung: body.begruendung || '',
      status: 'offen',
      createdAt: new Date().toISOString()
    };

    requests.unshift(newRequest);

    return Response.json({
      success: true,
      message: 'Änderung erfolgreich gespeichert',
      data: newRequest
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'Fehler beim Speichern der Anfrage'
      },
      { status: 500 }
    );
  }
}

/**
 * GET → alle Anfragen laden
 */
export async function GET() {
  return Response.json({
    success: true,
    data: requests
  });
}

/**
 * PATCH → Status ändern (freigeben / ablehnen)  */ export async function PATCH(req) {
  try {
    const body = await req.json();

    const { id, status } = body;

    if (!id || !status) {
      return Response.json(
        { success: false, message: 'Ungültige Daten' },
        { status: 400 }
      );
    }

    requests = requests.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status,
          decidedAt: new Date().toISOString()
        };
      }
      return r;
    });

    return Response.json({
      success: true,
      message: 'Status aktualisiert'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'Fehler beim Aktualisieren'
      },
      { status: 500 }
    );
  }
}
