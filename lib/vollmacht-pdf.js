import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateVollmachtPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    text: rgb(0.06, 0.09, 0.16),
    muted: rgb(0.29, 0.33, 0.4),
    line: rgb(0.86, 0.84, 0.8),
    accent: rgb(0.55, 0.42, 0.26)
  };

  let y = height - 55;

  function line(x1, y1, x2, y2, color = colors.line, thickness = 1) {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color
    });
  }

  function drawText(text, options = {}) {
    const {
      x = 50,
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
      x = 50,
      size = 11,
      fontRef = font,
      color = colors.text,
      lineGap = 16,
      maxChars = 92
    } = options;

    const lines = wrapText(text, maxChars);
    for (const item of lines) {
      page.drawText(item, {
        x,
        y,
        size,
        font: fontRef,
        color
      });
      y -= lineGap;
    }
  }

  function drawSectionTitle(text) {
    y -= 8;
    drawText(text, {
      size: 13,
      fontRef: boldFont,
      color: colors.text,
      lineGap: 18
    });
    line(50, y + 8, width - 50, y + 8);
    y -= 8;
  }

  function drawLabelValue(label, value) {
    drawText(`${label}: ${value || '-'}`, {
      size: 11,
      fontRef: font,
      color: colors.text,
      lineGap: 17
    });
  }

  page.drawText('LION IBC', {
    x: 50,
    y,
    size: 22,
    font: boldFont,
    color: colors.accent
  });

  y -= 24;

  page.drawText('Business Consulting', {
    x: 50,
    y,
    size: 11,
    font: font,
    color: colors.muted
  });

  page.drawText(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, {
    x: width - 180,
    y,
    size: 10,
    font: font,
    color: colors.muted
  });

  y -= 20;
  line(50, y, width - 50, y, colors.accent, 1.5);
  y -= 28;

  page.drawText('Vollmacht zur Unternehmensgründung', {
    x: 50,
    y,
    size: 18,
    font: boldFont,
    color: colors.text
  });

  y -= 28;

  drawWrapped(
    'Hiermit bevollmächtige ich Lion IBC, mich bzw. mein Unternehmen im Rahmen der Unternehmensgründung sowie der damit zusammenhängenden organisatorischen und behördlichen Prozesse zu unterstützen und die hierfür erforderlichen Schritte vorzubereiten und zu begleiten.'
  );

  y -= 6;

  drawWrapped(
    'Dies umfasst insbesondere die Vorbereitung und Begleitung der Gründung, die Abstimmung mit dem Notar, die Gewerbeanmeldung, die steuerliche Erfassung sowie weitere im Zusammenhang mit der Unternehmensgründung erforderliche organisatorische Maßnahmen.'
  );

  y -= 6;

  drawWrapped(
    'Ich bestätige, dass die von mir gemachten Angaben vollständig und richtig sind. Mir ist bekannt, dass Lion IBC auf Grundlage dieser Angaben tätig wird.'
  );

  y -= 16;

  drawSectionTitle('Ansprechpartner');
  drawLabelValue('Vorname', data.vorname);
  drawLabelValue('Nachname', data.nachname);
  drawLabelValue('Telefon', data.telefon);
  drawLabelValue('E-Mail', data.email);

  y -= 8;

  drawSectionTitle('Gründungsvorhaben');
  drawLabelValue('Firmenname', data.firmenname);
  drawLabelValue('Alternative Firmennamen', data.alternativeFirmennamen);
  drawLabelValue('Rechtsform', data.rechtsform);
  drawLabelValue('Unternehmenssitz', data.unternehmenssitz);
  drawLabelValue('Geschäftsadresse vorhanden', data.geschaeftsadresseVorhanden);
  drawLabelValue('Tätigkeit / Branche', data.taetigkeit);

  y -= 8;

  drawSectionTitle('Gesellschafter / Geschäftsführer');
  drawLabelValue('Gesellschafter 1', data.gesellschafter1);
  drawLabelValue('Beteiligung in %', data.beteiligung1);
  drawLabelValue('Geschäftsführer', data.geschaeftsfuehrerJaNein);
  drawLabelValue('Weitere Gesellschafter vorhanden', data.weitereGesellschafter);

  y -= 8;

  drawSectionTitle('Weitere Angaben');
  drawLabelValue('Stammkapital', data.stammkapital);
  drawLabelValue('Umsatz im 1. Jahr', data.umsatz1Jahr);
  drawLabelValue('Gewinn im 1. Jahr', data.gewinn1Jahr);
  drawLabelValue('Kleinunternehmerregelung', data.kleinunternehmerregelung);
  drawLabelValue('Mitarbeiter', data.mitarbeiter);
  drawLabelValue('Anzahl Mitarbeiter', data.anzahlMitarbeiter);
  drawLabelValue('Start der Beschäftigung', data.startBeschaeftigung);

  if (data.hinweise) {
    y -= 8;
    drawSectionTitle('Hinweise');
    drawWrapped(data.hinweise, { maxChars: 90 });
  }

  y -= 12;
  drawSectionTitle('Bestätigungen');
  drawLabelValue('DSGVO bestätigt', data.dsgvoAkzeptiert);
  drawLabelValue('Vollmacht bestätigt', data.vollmachtAkzeptiert);

  y -= 18;

  page.drawText('Unterschrift', {
    x: 50,
    y,
    size: 13,
    font: boldFont,
    color: colors.text
  });

  y -= 12;
  line(50, y, width - 50, y);

  if (data.unterschriftBase64) {
    const pngImage = await pdfDoc.embedPng(data.unterschriftBase64);
    const pngDims = pngImage.scale(0.4);

    page.drawImage(pngImage, {
      x: 55,
      y: y - 90,
      width: Math.min(pngDims.width, 220),
      height: Math.min(pngDims.height, 90)
    });

    y -= 105;
  } else {
    y -= 24;
    page.drawText('Keine Unterschrift vorhanden', {
      x: 55,
      y,
      size: 10,
      font,
      color: colors.muted
    });
    y -= 20;
  }

  line(50, y, 250, y, colors.line, 1);
  y -= 14;

  page.drawText(`${data.vorname || ''} ${data.nachname || ''}`.trim() || '-', {
    x: 50,
    y,
    size: 10,
    font,
    color: colors.muted
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
