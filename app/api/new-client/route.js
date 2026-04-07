import { newClientSchema } from '@/lib/validation';
import { sendNotification } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = newClientSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]?.message;
      return Response.json({ message: firstIssue || 'Bitte alle Pflichtfelder korrekt ausfüllen.' }, { status: 400 });
    }

    const firmenname = parsed.data.firmenname;
    const mail = await sendNotification({
      subject: `Neuer Neukunde: ${firmenname}`,
      title: 'Neukundenaufnahme Unternehmen',
      data: parsed.data
    });

    return Response.json({
      message: mail.skipped
        ? 'Die Eingabe wurde validiert. Der E-Mail-Versand ist noch nicht konfiguriert.'
        : 'Der Neukunde wurde erfolgreich übermittelt.'
    });
  } catch {
    return Response.json({ message: 'Interner Serverfehler.' }, { status: 500 });
  }
}
