import { NextResponse } from 'next/server'; import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();

    const data = {};
    for (let [key, value] of formData.entries()) {
      if (key !== 'weitereUnterlagen') {
        data[key] = value;
      }
    }

    const files = formData.getAll('weitereUnterlagen');

    const unterschrift = data.unterschrift;

    // 👉 Text für Mail
    const text = `
Neue Anfrage - Geschäftsadresse / Virtual Office

Firma: ${data.firmenname}
Ansprechpartner: ${data.ansprechpartnerVorname} ${data.ansprechpartnerNachname}
E-Mail: ${data.email}
Telefon: ${data.telefon}

Leistungen:
- Geschäftsadresse: ${data.leistungGeschaeftsadresse}
- Virtual Office: ${data.leistungVirtualOffice}

Start: ${data.gewuenschterStart}

Postweiterleitung: ${data.postWeiterleitung}
Scan-Service: ${data.scanService}
Telefonservice: ${data.telefonservice}

Nutzung: ${data.nutzungGeschaeftsadresse} Weitere Standorte: ${data.weitereStandorte} Postempfang für: ${data.postEmpfangFuer}

Hinweise:
${data.hinweise}
    `;

    const attachments = [];

    // 👉 Unterschrift als Datei anhängen
    if (unterschrift) {
      const base64Data = unterschrift.split(',')[1];
      attachments.push({
        filename: 'unterschrift.png',
        content: base64Data,
        encoding: 'base64'
      });
    }

    // 👉 Hochgeladene Dateien anhängen
    for (let file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({
        filename: file.name,
        content: buffer
      });
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'info@lion-ibc.com',
      subject: 'Neue Anfrage Geschäftsadresse / Virtual Office',
      text,
      attachments
    });

    return NextResponse.json({ message: 'Erfolgreich gesendet' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Fehler beim Senden' },
      { status: 500 }
    );
  }
}

