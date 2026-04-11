let requests = [];

export async function POST(req) {
  try {
    const body = await req.json();

    const newRequest = {
      id: 'REQ-' + Date.now(),
      kundennummer: body.kundennummer,
      changes: body.changes,
      begruendung: body.begruendung || '',
      status: 'offen',
      createdAt: new Date().toISOString()
    };

    requests.push(newRequest);

    return Response.json({
      success: true,
      message: 'Änderung gespeichert',
      data: newRequest
    });
  } catch (error) {
    return Response.json(
      { success: false, message: 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}

