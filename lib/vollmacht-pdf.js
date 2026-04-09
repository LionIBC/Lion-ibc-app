import PDFDocument from 'pdfkit';

export function generateVollmachtPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.fontSize(18).text('Vollmacht', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(11).text(`Ort / Datum: ${new Date().toLocaleDateString('de-DE')}`);
      doc.moveDown();

      doc.text('Vollmachtgeber');
      doc.moveDown(0.5);
      doc.text(`Name: ${data.vorname || ''} ${data.nachname || ''}`.trim());
      doc.text(`E-Mail: ${data.email || ''}`);
      doc.text(`Telefon: ${data.telefon || ''}`);
      doc.moveDown();

      doc.text('Unternehmensdaten');
      doc.moveDown(0.5);
      doc.text(`Firmenname: ${data.firmenname || ''}`);
      doc.text(`Rechtsform: ${data.rechtsform || ''}`);
      doc.text(`Unternehmenssitz: ${data.unternehmenssitz || ''}`);
      doc.text(`Tätigkeit / Branche: ${data.taetigkeit || ''}`);
      doc.moveDown(1.5);

      doc.text(
        'Hiermit bevollmächtige ich Lion IBC, mich bzw. mein Unternehmen im Rahmen der Unternehmensgründung und der damit zusammenhängenden organisatorischen und behördlichen Prozesse zu unterstützen und die hierfür erforderlichen Schritte vorzubereiten und zu begleiten.'
      );

      doc.moveDown();
      doc.text(
        'Dies umfasst insbesondere die Vorbereitung und Begleitung der Gründung, die Abstimmung mit dem Notar, die Gewerbeanmeldung, die steuerliche Erfassung sowie weitere im Zusammenhang mit der Unternehmensgründung erforderliche organisatorische Maßnahmen.'
      );

      doc.moveDown();
      doc.text(
        'Ich bestätige, dass die von mir gemachten Angaben vollständig und richtig sind. Mir ist bekannt, dass Lion IBC auf Grundlage dieser Angaben tätig wird.'
      );

      doc.moveDown(2);

      doc.text('Unterschrift');
      doc.moveDown(0.5);

      if (data.unterschriftBuffer) {
        doc.image(data.unterschriftBuffer, {
          fit: [220, 90],
          align: 'left'
        });
      } else {
        doc.text('Keine Unterschrift vorhanden');
      }

      doc.moveDown(2);
      doc.text(`Name in Druckschrift: ${data.vorname || ''} ${data.nachname || ''}`.trim());

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

