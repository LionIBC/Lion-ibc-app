import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateVollmachtPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  function drawText(text, options = {}) {
    const {
      x = 50,
      size = 11,
      fontRef = font,
      color = rgb(0, 0, 0),
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

  drawText('Vollmacht', {
    x: 240,
    size: 18,
    fontRef: boldFont,
    lineGap: 28
  });

  drawText(`Ort / Datum: ${new Date().toLocaleDateString('de-DE')}`, {
    size: 11,
    lineGap: 24
  });

  drawText('Vollmachtgeber', {
    fontRef: boldFont,
    lineGap: 18
  });

  drawText(`Name: ${(data.vorname || '')} ${(data.nachname || '')}`.trim());
  drawText(`E-Mail: ${data.email || ''}`);
  drawText(`Telefon: ${data.telefon || ''}`);
  y -= 10;

  drawText('Unternehmensdaten', {
    fontRef: boldFont,
    lineGap: 18
  });

  drawText(`Firmenname: ${data.firmenname || ''}`);
  drawText(`Rechtsform: ${data.rechtsform || ''}`);
  drawText(`Unternehmenssitz: ${data.unternehmenssitz || ''}`);
  drawText(`Tätigkeit / Branche: ${data.taetigkeit || ''}`);
  y -= 10;

  const paragraphs = [
    'Hiermit bevollmächtige ich Lion IBC, mich bzw. mein Unternehmen im Rahmen der Unternehmensgründung und der damit zusammenhängenden organisatorischen und behördlichen Prozesse zu unterstützen und die hierfür erforderlichen Schritte vorzubereiten und zu begleiten.',
    'Dies umfasst insbesondere die Vorbereitung und Begleitung der Gründung, die Abstimmung mit dem Notar, die Gewerbeanmeldung, die steuerliche Erfassung sowie weitere im Zusammenhang mit der Unternehmensgründung erforderliche organisatorische Maßnahmen.',
    'Ich bestätige, dass die von mir gemachten Angaben vollständig und richtig sind. Mir ist bekannt, dass Lion IBC auf Grundlage dieser Angaben tätig wird.'
  ];

  paragraphs.forEach((paragraph) => {
    const wrappedLines = wrapText(paragraph, 85);
    wrappedLines.forEach((line) => drawText(line, { lineGap: 16 }));
    y -= 8;
  });

  y -= 10;
  drawText('Unterschrift', {
    fontRef: boldFont,
    lineGap: 20
  });

  if (data.unterschriftBase64) {
    const pngImage = await pdfDoc.embedPng(data.unterschriftBase64);
    const pngDims = pngImage.scale(0.4);

    page.drawImage(pngImage, {
      x: 50,
      y: y - 80,
      width: Math.min(pngDims.width, 220),
      height: Math.min(pngDims.height, 90)
    });

    y -= 95;
  } else {
    drawText('Keine Unterschrift vorhanden');
  }

  drawText(`Name in Druckschrift: ${(data.vorname || '')} ${(data.nachname || '')}`.trim(), {
    lineGap: 20
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text, maxCharsPerLine = 85) {
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
