import { sendNotification } from '../../../lib/email'; import { generateVollmachtPDF } from '../../../lib/vollmacht-pdf';

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



      attachments.push({
        filename: 'unterschrift.png',
        content: base64Signature
      });

      const vollmachtPdf = await generateVollmachtPDF(data);

      attachments.push({
        filename: `Vollmacht_${data.firmenname || 'Gruendung'}.pdf`,
        content: vollmachtPdf.toString('base64')
      });
    }

    const mail = await sendNotification({
      subject: 'Neue Unternehmensgründung',
      title: 'Neue Anfrage Unternehmensgründung',
      data,
      attachments
    });

    return Response.json({
      message: mail.skipped
        ? 'Die Gründungsdaten wurden übermittelt. Der E-Mail-Versand ist noch nicht vollständig eingerichtet.'
        : 'Die Gründungsdaten wurden erfolgreich übermittelt.'
    });
  } catch (error) {
    console.error('NEW GRUENDUNG ERROR:', error);

    return Response.json(
      { message: 'Fehler beim Senden.' },
      { status: 500 }
    );
  }
}
