import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generatePostEmpfangVollmachtPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    text: rgb(0.06, 0.09, 0.16),
    muted: rgb(0.35, 0.39, 0.45),
    line: rgb(0.82, 0.82, 0.82),
    accent: rgb(0.55, 0.42, 0.26)
  };

  const fullName =
    `${data.ansprechpartnerVorname || ''} ${data.ansprechpartnerNachname || ''}`.trim() || '-';
  const companyName = data.firmenname || '-';
  const ort = data.ort || '-';
  const today = new Date().toLocaleDateString('de-DE');

  let y = height - 60;

  function drawText(text, options = {}) {
    const {
      x = 55,
      size = 11,
      fontRef = font,
      color = colors.text,
      lineGap = 18
    } = options;

    page.drawText(String(text || ''), {
      x,
      y,
      size,
      font: fontRef,
      color
    });

    y -= lineGap;
  }

  function drawWrapped(text, options = {}) {
    const {
      x = 55,
      size = 11,
      fontRef = font,
      color = colors.text,
      lineGap = 16,
      maxChars = 84
    } = options;

    const lines = wrapText(text, maxChars);
    for (const line of lines) {
      page.drawText(line, {
        x,
        y,
        size,
        font: fontRef,
        color
      });
      y -= lineGap;
    }
  }

  function drawLine(x1, y1, x2, y2, color = colors.line, thickness = 1) {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color
    });
  }

  function drawSectionTitle(text) {
    y -= 6;
    page.drawText(text, {
      x: 55,
      y,
      size: 13,
      font: boldFont,
      color: colors.text
    });
    y -= 18;
    drawLine(55, y + 8, width - 55, y + 8);
    y -= 6;
  }

  page.drawText('LION INTERNATIONAL BUSINESS CONSULTING SLU', {
    x: 55,
    y,
    size: 15,
    font: boldFont,
    color: colors.accent
  });

  y -= 22;

  page.drawText('Calle Clemente Jordan 6, 2C • 35400 Arucas, Las Palmas • Spain', {
    x: 55,
    y,
    size: 9.5,
    font,
    color: colors.muted
  });

  page.drawText(`Erstellt am: ${today}`, {
    x: width - 145,
    y,
    size: 9.5,
    font,
    color: colors.muted
  });

  y -= 18;
  drawLine(55, y, width - 55, y, colors.accent, 1.2);
  y -= 24;

  page.drawText('Post- und Empfangsvollmacht', {
    x: 55,
    y,
    size: 18,
    font: boldFont,
    color: colors.text
  });

  y -= 24;

  drawWrapped(
    `Hiermit bevollmächtige ich, ${fullName}, die Lion International Business Consulting SLU, Calle Clemente Jordan 6, 2C, 35400 Arucas, Las Palmas, Spain, im Rahmen der Nutzung einer Geschäftsadresse bzw. eines Virtual Office, für mich bzw. mein Unternehmen "${companyName}" eingehende Postsendungen entgegenzunehmen, zu erfassen, zu bearbeiten und im Rahmen der vereinbarten Leistungen weiterzuleiten.`
  );

  y -= 6;

  drawWrapped(
    'Die Vollmacht umfasst insbesondere die Entgegennahme gewöhnlicher Post, geschäftlicher Korrespondenz sowie behördlicher Schreiben an der vereinbarten Geschäftsadresse. Soweit vereinbart, umfasst sie auch die digitale Erfassung, interne Dokumentation und Weiterleitung eingehender Sendungen.'
  );

  y -= 6;

  drawWrapped(
    'Ich bestätige, dass meine Angaben vollständig und richtig sind und dass die Lion International Business Consulting SLU auf Grundlage dieser Angaben im Rahmen der vereinbarten Leistungen tätig werden darf.'
  );

  y -= 18;

  drawSectionTitle('Vollmachtgeber');
  drawText(`Name: ${fullName}`, { lineGap: 16 });
  drawText(`Unternehmen: ${companyName}`, { lineGap: 16 });
  drawText(`E-Mail: ${data.email || '-'}`, { lineGap: 16 });
  drawText(`Telefon: ${data.telefon || '-'}`, { lineGap: 16 });
  drawText(`Ort / Datum: ${ort}, ${today}`, { lineGap: 18 });

  y -= 8;

  drawSectionTitle('Bevollmächtigte');
  drawText('Lion International Business Consulting SLU', { lineGap: 16 });
  drawText('Calle Clemente Jordan 6, 2C', { lineGap: 16 });
  drawText('35400 Arucas, Las Palmas, Spain', { lineGap: 18 });

  y -= 10;

  drawSectionTitle('Leistungsangaben');
  drawText(`Geschäftsadresse: ${data.leistungGeschaeftsadresse || '-'}`, { lineGap: 16 });
  drawText(`Virtual Office: ${data.leistungVirtualOffice || '-'}`, { lineGap: 16 });
  drawText(`Postweiterleitung: ${data.postWeiterleitung || '-'}`, { lineGap: 16 });
  drawText(`Scan-Service: ${data.scanService || '-'}`, { lineGap: 16 });
  drawText(`Telefonservice: ${data.telefonservice || '-'}`, { lineGap: 18 });

  y -= 10;

  drawSectionTitle('Unterschrift');

  const signatureBoxX = 55;
  const signatureBoxY = y - 78;
  const signatureBoxWidth = 220;
  const signatureBoxHeight = 72;

  page.drawRectangle({
    x: signatureBoxX,
    y: signatureBoxY,
    width: signatureBoxWidth,
    height: signatureBoxHeight,
    borderColor: colors.line,
    borderWidth: 1
  });

  if (data.unterschriftBase64) {
    try {
      const pngImage = await pdfDoc.embedPng(data.unterschriftBase64);
      const pngDims = pngImage.scale(0.38);

      page.drawImage(pngImage, {
        x: signatureBoxX + 8,
        y: signatureBoxY + 8,
        width: Math.min(pngDims.width, signatureBoxWidth - 16),
        height: Math.min(pngDims.height, signatureBoxHeight - 16)
      });
    } catch (error) {
      page.drawText('Unterschrift konnte nicht geladen werden', {
        x: signatureBoxX + 10,
        y: signatureBoxY + 30,
        size: 9,
        font,
        color: colors.muted
      });
    }
  }

  const nameLineY = signatureBoxY - 22;
  drawLine(signatureBoxX, nameLineY, signatureBoxX + 200, nameLineY, colors.line, 1);

  page.drawText(fullName, {
    x: signatureBoxX,
    y: nameLineY - 12,
    size: 9.5,
    font,
    color: colors.muted
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text, maxCharsPerLine = 84) {
  const words = String(text || '').split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

