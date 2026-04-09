import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateVollmachtPDF(data) {
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

  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim() || '-';
  const companyName = data.firmenname || '-';
  const ort = data.unternehmenssitz || '-';
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
      lineGap = 17,
      maxChars = 82
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
    y -= 8;
    drawText(text, {
      size: 13,
      fontRef: boldFont,
      color: colors.text,
      lineGap: 18
    });
    drawLine(55, y + 8, width - 55, y + 8);
    y -= 8;
  }

  // Kopf
  page.drawText('LION INTERNATIONAL BUSINESS CONSULTING SLU', {
    x: 55,
    y,
    size: 16,
    font: boldFont,
    color: colors.accent
  });

  y -= 24;

  page.drawText('Calle Clemente Jordan 6, 2C • 35400 Arucas, Las Palmas • Spain', {
    x: 55,
    y,
    size: 10,
    font,
    color: colors.muted
  });

  page.drawText(`Erstellt am: ${today}`, {
    x: width - 145,
    y,
    size: 10,
    font,
    color: colors.muted
  });

  y -= 20;
  drawLine(55, y, width - 55, y, colors.accent, 1.4);
  y -= 30;

  // Titel
  drawText('Vollmacht', {
    size: 20,
    fontRef: boldFont,
    lineGap: 28
  });

  // Optimierter Vollmachttext
  drawWrapped(
    `Hiermit bevollmächtige ich, ${fullName}, die Lion International Business Consulting SLU, Calle Clemente Jordan 6, 2C, 35400 Arucas, Las Palmas, Spain, mich bzw. mein Unternehmen "${companyName}" im Rahmen der Unternehmensgründung sowie der damit zusammenhängenden organisatorischen, administrativen und behördlichen Prozesse zu unterstützen, zu vertreten und die hierfür erforderlichen Schritte vorzubereiten und zu begleiten.`
  );

  y -= 8;

  drawWrapped(
    'Die Vollmacht umfasst insbesondere die Vorbereitung und Begleitung der Gründung, die Abstimmung mit dem Notar, die Vorbereitung und Begleitung der Gewerbeanmeldung, die steuerliche Erfassung, die Kommunikation mit Behörden und sonstigen beteiligten Stellen sowie weitere im Zusammenhang mit der Unternehmensgründung erforderliche organisatorische und behördliche Maßnahmen.'
  );

  y -= 8;

  drawWrapped(
    'Die Bevollmächtigte ist berechtigt, die für die Bearbeitung erforderlichen Informationen entgegenzunehmen, weiterzugeben und vorbereitende Erklärungen sowie Unterlagen im Rahmen des Auftrags zu erstellen und zu übermitteln, soweit dies zur Durchführung der Gründung und der damit verbundenen Prozesse erforderlich ist.'
  );

  y -= 8;

  drawWrapped(
    'Ich bestätige, dass die von mir gemachten Angaben vollständig und richtig sind. Mir ist bekannt, dass Lion International Business Consulting SLU auf Grundlage dieser Angaben tätig wird. Diese Vollmacht dient der Durchführung der beauftragten Leistungen im Zusammenhang mit der Unternehmensgründung.'
  );

  y -= 24;

  drawSectionTitle('Vollmachtgeber');
  drawText(`Name: ${fullName}`, { lineGap: 17 });
  drawText(`Unternehmen: ${companyName}`, { lineGap: 17 });
  drawText(`E-Mail: ${data.email || '-'}`, { lineGap: 17 });
  drawText(`Telefon: ${data.telefon || '-'}`, { lineGap: 17 });
  drawText(`Ort / Datum: ${ort}, ${today}`, { lineGap: 20 });

  y -= 14;

  drawSectionTitle('Bevollmächtigte');
  drawText('Lion International Business Consulting SLU', { lineGap: 17 });
  drawText('Calle Clemente Jordan 6, 2C', { lineGap: 17 });
  drawText('35400 Arucas, Las Palmas', { lineGap: 17 });
  drawText('Spain', { lineGap: 20 });

  y -= 14;

  drawSectionTitle('Unterschrift');

  const signatureBoxX = 55;
  const signatureBoxY = y - 95;
  const signatureBoxWidth = 240;
  const signatureBoxHeight = 90;

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
      const pngDims = pngImage.scale(0.45);

      page.drawImage(pngImage, {
        x: signatureBoxX + 10,
        y: signatureBoxY + 10,
        width: Math.min(pngDims.width, signatureBoxWidth - 20),
        height: Math.min(pngDims.height, signatureBoxHeight - 20)
      });
    } catch (error) {
      page.drawText('Unterschrift konnte nicht geladen werden', {
        x: signatureBoxX + 10,
        y: signatureBoxY + 35,
        size: 10,
        font,
        color: colors.muted
      });
    }
  } else {
    page.drawText('Keine Unterschrift vorhanden', {
      x: signatureBoxX + 10,
      y: signatureBoxY + 35,
      size: 10,
      font,
      color: colors.muted
    });
  }

  const nameLineY = signatureBoxY - 28;
  drawLine(signatureBoxX, nameLineY, signatureBoxX + 220, nameLineY, colors.line, 1);

  page.drawText(fullName, {
    x: signatureBoxX,
    y: nameLineY - 14,
    size: 10,
    font,
    color: colors.muted
  });

  page.drawText('Bevollmächtigt: Lion International Business Consulting SLU', {
    x: 55,
    y: nameLineY - 36,
    size: 10,
    font,
    color: colors.muted
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text, maxCharsPerLine = 82) {
  const words = String(text || '').split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
