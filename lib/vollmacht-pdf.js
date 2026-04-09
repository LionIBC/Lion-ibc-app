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

  const today = new Date().toLocaleDateString('de-DE');
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim() || '-';
  const companyName = data.firmenname || '-';
  const ort = data.unternehmenssitz || '-';

  page.drawText('LION IBC', {
    x: 55,
    y,
    size: 22,
    font: boldFont,
    color: colors.accent
  });

  y -= 24;

  page.drawText('Business Consulting', {
    x: 55,
    y,
    size: 11,
    font,
    color: colors.muted
  });

  page.drawText(`Erstellt am: ${today}`, {
    x: width - 165,
    y,
    size: 10,
    font,
    color: colors.muted
  });

  y -= 20;
  drawLine(55, y, width - 55, y, colors.accent, 1.4);
  y -= 30;

  drawText('Vollmacht', {
    size: 20,
    fontRef: boldFont,
    lineGap: 28
  });

  drawWrapped(
    `Hiermit bevollmächtige ich, ${fullName}, Lion IBC, mich bzw. mein Unternehmen "${companyName}" im Rahmen der Unternehmensgründung sowie der damit zusammenhängenden organisatorischen und behördlichen Prozesse zu unterstützen und die hierfür erforderlichen Schritte vorzubereiten und zu begleiten.`
  );

  y -= 8;

  drawWrapped(
    'Die Vollmacht umfasst insbesondere die Vorbereitung und Begleitung der Gründung, die Abstimmung mit dem Notar, die Gewerbeanmeldung, die steuerliche Erfassung sowie weitere im Zusammenhang mit der Unternehmensgründung erforderliche organisatorische Maßnahmen.'
  );

  y -= 8;

  drawWrapped(
    'Ich bestätige, dass die von mir gemachten Angaben vollständig und richtig sind. Mir ist bekannt, dass Lion IBC auf Grundlage dieser Angaben tätig wird.'
  );

  y -= 30;

  drawText(`Vollmachtgeber: ${fullName}`, {
    fontRef: boldFont,
    lineGap: 20
  });

  drawText(`Unternehmen: ${companyName}`, {
    lineGap: 20
  });

  drawText(`Ort / Datum: ${ort}, ${today}`, {
    lineGap: 24
  });

  y -= 10;

  drawText('Unterschrift', {
    fontRef: boldFont,
    lineGap: 18
  });

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

  if (currentLine) lines.push(currentLine);
  return lines;
}
