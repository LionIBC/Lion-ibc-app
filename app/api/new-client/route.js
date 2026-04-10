import { sendNotification } from '../../../lib/email'; import { generateVollmachtBeratungPDF } from '../../../lib/vollmacht-beratung';

export async function POST(request) {
  try {
    const formData = await request.formData();

    const data = {};
    const attachments = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (value.size > 0) {
          const buffer = Buffer.from(await value.arrayBuffer());

          attachments.push({
            filename: value.name,
            content: buffer.toString('base64')
          });
        }
      } else {
        data[key] = value;
      }
    }

    if (data.unterschrift && data.unterschrift.startsWith('data:image/png;base64,')) {
      const base64Signature = data.unterschrift.replace('data:image/png;base64,', '');

      data.unterschriftBase64 = base64Signature;
      data.unterschrift = base64Signature;

      attachments.push({
        filename: 'unterschrift-beratung.png',
        content: base64Signature
      });

      const vollmachtPdf = await generateVollmachtBeratungPDF(data);

      attachments.push({
        filename: `Vollmacht_Beratung_${data.firmenname || 'Unternehmen'}.pdf`,
        content: vollmachtPdf.toString('base64')
      });
    }

    const mail = await sendNotification({
      subject: 'Neukundenaufnahme Unternehmen',
      title: 'Neukundenaufnahme Unternehmen',
      data,
      attachments
    });

    return Response.json({
      message: mail.skipped
        ? 'Die Daten wurden übermittelt. Der E-Mail-Versand ist noch nicht vollständig eingerichtet.'
        : 'Die Daten wurden erfolgreich übermittelt.'
    });
  } catch (error) {
    console.error('NEW CLIENT ERROR:', error);

    return Response.json(
      { message: 'Fehler beim Senden.' },
      { status: 500 }
    );
  }
}
