import { sendNotification } from '../../../lib/email';

export async function POST(request) {
  try {
    const body = await request.json();

    const mail = await sendNotification({
      subject: 'Neue Unternehmensgründung',
      title: 'Neue Anfrage Unternehmensgründung',
      data: body
    });

    return Response.json({
      message: mail.skipped
        ? 'Die Gründungsdaten wurden übermittelt. Der E-Mail-Versand ist noch nicht konfiguriert.'
        : 'Die Gründungsdaten wurden erfolgreich übermittelt.'
    });
  } catch (error) {
    return Response.json(
      { message: 'Fehler beim Senden.' },
      { status: 500 }
    );
  }
}
