import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateVollmachtBeratungPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);

  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fullName = `${data.ansprechpartnerVorname || ''} ${data.ansprechpartnerNachname || ''}`.trim() || '-';
  const companyName = data.firmenname || '-';
  const ort = data.ort || '-';
  const today = new Date().toLocaleDateString('de-DE');

  let y = height - 60;

  function draw(text, size = 11, isBold = false) {
    page.drawText(text, {
      x: 55,
      y,
      size,
      font: isBold ? boldFont : font
    });
    y -= size + 6;
  }

  function wrap(text, max = 90) {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    words.forEach((word) => {
      if ((line + word).length > max) {
        lines.push(line);
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    });

    if (line) lines.push(line);
    return lines;
  }

  function drawWrapped(text) {
    wrap(text).forEach((line) => draw(line));
    y -= 4;
  }

  draw('LION INTERNATIONAL BUSINESS CONSULTING SLU', 14, true);
  draw('Calle Clemente Jordan 6, 2C');
  draw('35400 Arucas, Las Palmas, Spain');

  y -= 10;

  draw('Vollmacht', 18, true);

  y -= 10;

  drawWrapped(
    `Hiermit bevollmächtige ich, ${fullName}, die Lion International Business Consulting SLU, mich bzw. mein Unternehmen "${companyName}" im Rahmen der beauftragten Dienstleistungen in den Bereichen Finanzbuchhaltung, Lohnabrechnung sowie Unternehmensberatung zu unterstützen und zu vertreten.`
  );

  drawWrapped(
    'Die Vollmacht umfasst insbesondere die Kommunikation mit Behörden, die Vorbereitung und Übermittlung von Unterlagen und Meldungen sowie die Abstimmung mit Steuerberatern, Sozialversicherungsträgern und weiteren beteiligten Stellen.'
  );

  drawWrapped(
    'Ich bestätige, dass meine Angaben vollständig und richtig sind und dass die Lion International Business Consulting SLU auf Grundlage dieser Angaben tätig werden darf.'
  );

  y -= 20;

  draw(`Ort / Datum: ${ort}, ${today}`);

  y -= 40;

  page.drawRectangle({
    x: 55,
    y,
    width: 200,
    height: 60,
    borderWidth: 1,
    color: rgb(0.8, 0.8, 0.8)
  });

  if (data.unterschrift) {
    try {
      const image = await pdfDoc.embedPng(data.unterschrift);
      page.drawImage(image, {
        x: 60,
        y: y + 5,
        width: 180,
        height: 50
      });
    } catch (e) {}
  }

  y -= 30;

  draw(fullName);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

