import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const toEmail = process.env.NOTIFICATION_EMAIL;
const fromEmail = process.env.FROM_EMAIL || 'Kundenportal <onboarding@resend.dev>';

const clientFieldGroups = [
  {
    title: 'Firmendaten',
    fields: [
      ['Firmenname', 'firmenname'],
      ['Rechtsform', 'rechtsform'],
      ['Rechtsform Sonstige', 'rechtsformSonstige'],
      ['Gründungsdatum', 'gruendungsdatum'],
      ['Branche', 'branche'],
      ['Geschäftszweck / Tätigkeit', 'taetigkeit'],
      ['Website', 'website'],
      ['Straße / Hausnummer', 'strasse'],
      ['PLZ', 'plz'],
      ['Ort', 'ort'],
      ['Land', 'land'],
      ['Anzahl Mitarbeiter aktuell', 'mitarbeiterzahl']
    ]
  },
  {
    title: 'Ansprechpartner',
    fields: [
      ['Vorname', 'ansprechpartnerVorname'],
      ['Nachname', 'ansprechpartnerNachname'],
      ['Position', 'ansprechpartnerPosition'],
      ['E-Mail', 'email'],
      ['Telefon', 'telefon']
    ]
  },
  {
    title: 'Unternehmensnummern',
    fields: [
      ['Unternehmensnummer', 'unternehmensnummer'],
      ['Betriebsnummer', 'betriebsnummer'],
      ['BG-PIN', 'bgPin']
    ]
  },
  {
    title: 'Steuer & Register',
    fields: [
      ['Steuernummer', 'steuernummer'],
      ['USt-IdNr.', 'ustid'],
      ['Handelsregister vorhanden', 'handelsregisterVorhanden'],
      ['Handelsregisternummer', 'handelsregisternummer'],
      ['Registergericht', 'registergericht']
    ]
  },
  {
    title: 'Unternehmensstruktur',
    fields: [
      ['Inhaber 1', 'inhaber1'],
      ['Inhaber 2', 'inhaber2'],
      ['Gesellschafter 1', 'gesellschafter1'],
      ['Gesellschafter 2', 'gesellschafter2'],
      ['Geschäftsführer 1', 'geschaeftsfuehrer1'],
      ['Geschäftsführer 2', 'geschaeftsfuehrer2']
    ]
  },
  {
    title: 'Leistungen',
    fields: [
      ['Finanzbuchhaltung gewünscht', 'fibuGewuenscht'],
      ['Finanzbuchhaltung ab', 'fibuAb'],
      ['Lohnabrechnungen gewünscht', 'lohnGewuenscht'],
      ['Lohnabrechnungen ab', 'lohnAb'],
      ['Anzahl Mitarbeiter für Lohn', 'lohnMitarbeiterzahl'],
      ['Jahresabschluss gewünscht', 'jahresabschlussGewuenscht'],
      ['Steuererklärungen gewünscht', 'steuererklaerungenGewuenscht'],
      ['Sonstige Beratung gewünscht', 'sonstigeBeratungGewuenscht'],
      ['Beschreibung sonstige Beratung', 'sonstigeBeratungText'],
      ['Dringlichkeit', 'dringlichkeit']
    ]
  },
  {
    title: 'Steuerliche Meldungen',
    fields: [
      ['Umsatzsteuerpflichtig', 'ustPflichtig'],
      ['USt-Turnus', 'ustTurnus'],
      ['USt beim Finanzamt hinterlegt', 'ustFinanzamtStatus'],
      ['Lohn durch uns', 'lohnDurchUns'],
      ['Lohnsteuer-Turnus', 'lohnsteuerTurnus'],
      ['Lohnsteuer beim Finanzamt hinterlegt', 'lohnFinanzamtStatus']
    ]
  },
  {
    title: 'Hinweise',
    fields: [
      ['Notizen', 'notizen'],
      ['Datenschutz bestätigt', 'datenschutzBestaetigt']
    ]
  }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function htmlTable(title, entries) {
  const rows = entries
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .map(([label, value]) => `<tr><td style="width:40%;vertical-align:top;"><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  if (!rows) return '';

  return `
    <h2 style="margin:24px 0 8px; font-size:18px;">${escapeHtml(title)}</h2>
    <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; border-color:#d0d5dd;">
      ${rows}
    </table>
  `;
}

function buildClientEmail(data) {
  return clientFieldGroups
    .map((group) => htmlTable(group.title, group.fields.map(([label, key]) => [label, data[key]])))
    .join('');
}

export async function sendNotification({ subject, title, data }) {
  if (!resendApiKey || !toEmail) {
    return { skipped: true, reason: 'RESEND_API_KEY oder NOTIFICATION_EMAIL fehlt.' };
  }

  const resend = new Resend(resendApiKey);
  const html = title === 'Neukundenaufnahme Unternehmen'
    ? buildClientEmail(data)
    : htmlTable(title, Object.entries(data));

  const result = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: ['info@lion-ibc.com'],
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color:#101828;">
        <p>Es wurde eine neue Eingabe im Kundenportal gesendet.</p>
        ${html}
      </div>
    `
  });

  return { skipped: false, result };
}
