import { newEmployeeSchema } from '../../../lib/validation';
import { sendNotification } from '../../../lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = newEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ message: 'Bitte alle Pflichtfelder korrekt ausfüllen.' }, { status: 400 });
    }

    const mail = await sendNotification({
      subject: `Neuer Mitarbeiter: ${parsed.data.vorname} ${parsed.data.nachname}`,
      title: 'Mitarbeiteranlage',
      data: parsed.data
    });

    return Response.json({
      message: mail.skipped
        ? 'Die Daten wurden validiert. E-Mail-Versand ist noch nicht konfiguriert.'
        : 'Der neue Mitarbeiter wurde erfolgreich übermittelt.'
    });
  } catch {
    return Response.json({ message: 'Interner Serverfehler.' }, { status: 500 });
  }
}
