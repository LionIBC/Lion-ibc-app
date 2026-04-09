
import { sendNotification } from '../../../lib/email';

export async function POST(request) {
  try {
    const body = await request.json();

    const mail = await sendNotification({
      subject: 'Neue Unternehmensgründung',
      title: 'Neue Anfrage: Unternehmensgründung',
      data: body
    });

    return Response.json({
      message: 'Gründungsdaten erfolgreich übermittelt.'
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { message: 'Fehler beim Senden.' },
      { status: 500 }
    );
  }
}
