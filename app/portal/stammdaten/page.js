'use client';

import { useState } from 'react';

const currentData = {
  kundennummer: 'K-10023',
  firmenname: 'Muster GmbH',
  rechtsform: 'GmbH',
  gruendungsdatum: '2024-01-15',
  unternehmenssitz: 'Köln',
  hrbNummer: 'HRB 123456',
  amtsgericht: 'Amtsgericht Köln',

  steuernummern: ['123/456/78901'],
  ustId: 'DE123456789',
  wirtschaftsId: 'DE123456789-00001',
  ustMeldung: 'monatlich',
  lohnsteuerMeldung: 'monatlich',
  dauerfristverlaengerung: 'Ja',

  gesellschafter: ['Max Mustermann', 'Mia Beispiel'],
  geschaeftsfuehrer: ['Max Mustermann'],
  inhaber: '',

  ansprechpartner: [
    { name: 'Max Mustermann', email: 'max@muster.de', telefon: '+49 221 123456' }
  ]
};

const emptyChangeState = {
  firmenname: '',
  rechtsform: '',
  gruendungsdatum: '',
  unternehmenssitz: '',
  hrbNummer: '',
  amtsgericht: '',
  steuernummern: '',
  ustId: '',
  wirtschaftsId: '',
  ustMeldung: '',
  lohnsteuerMeldung: '',
  dauerfristverlaengerung: '',
  gesellschafter: '',
  geschaeftsfuehrer: '',
  inhaber: '',
  ansprechpartner: '',
  begruendung: ''
};

export default function StammdatenPage() {
  const [changes, setChanges] = useState(emptyChangeState);
  const [status, setStatus] = useState(null);

  function update(key, value) {
    setChanges((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const hasAnyChange = Object.entries(changes).some(([key, value]) => {
      if (key === 'begruendung') return false;
      return String(value).trim() !== '';
    });

    if (!hasAnyChange) {
      setStatus({
        type: 'error',
        message: 'Bitte mindestens eine gewünschte Änderung eintragen.'
      });
      return;
    }

    setStatus({
      type: 'success',
      message:
        'Die Stammdatenanpassung wurde eingereicht. Nach interner Prüfung werden freigegebene Änderungen übernommen.'
    });

    setChanges(emptyChangeState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main style={pageWrap}>
      <div style={pageInner}>
        <section style={heroCard}>
          <div style={badge}>Kundenportal</div>
          <h1 style={title}>Stammdaten</h1>
          <p style={subtitle}>
            Hier sehen Sie die aktuell hinterlegten Stammdaten. Änderungen werden
            nicht direkt überschrieben, sondern als Anpassung eingereicht und nach
            interner Prüfung freigegeben.
          </p>

          <div style={infoStrip}>
            <span style={{ fontWeight: 700 }}>Kundennummer:</span>
            <span>{currentData.kundennummer}</span>
          </div>
        </section>

        {status?.type === 'error' && <div style={errorBox}>{status.message}</div>}
        {status?.type === 'success' && <div style={successBox}>{status.message}</div>}

        <form onSubmit={handleSubmit}>
          <Section
            title="Unternehmensdaten"
            description="Aktuell hinterlegte Daten und gewünschte Änderungen."
          >
            <ComparisonField
              label="Firmenname"
              currentValue={currentData.firmenname}
              newValue={changes.firmenname}
              onChange={(v) => update('firmenname', v)}
            />
            <ComparisonField
              label="Rechtsform"
              currentValue={currentData.rechtsform}
              newValue={changes.rechtsform}
              onChange={(v) => update('rechtsform', v)}
            />
            <ComparisonField
              label="Gründungsdatum"
              currentValue={formatDate(currentData.gruendungsdatum)}
              newValue={changes.gruendungsdatum}
              onChange={(v) => update('gruendungsdatum', v)}
              type="date"
            />
            <ComparisonField
              label="Unternehmenssitz"
              currentValue={currentData.unternehmenssitz}
              newValue={changes.unternehmenssitz}
              onChange={(v) => update('unternehmenssitz', v)}
            />
            <ComparisonField
              label="HRB Nummer"
              currentValue={currentData.hrbNummer}
              newValue={changes.hrbNummer}
              onChange={(v) => update('hrbNummer', v)}
            />
            <ComparisonField
              label="Amtsgericht"
              currentValue={currentData.amtsgericht}
              newValue={changes.amtsgericht}
              onChange={(v) => update('amtsgericht', v)}
            />
          </Section>

          <Section
            title="Steuerliche Daten"
            description="Steuerliche Änderungen werden erst nach Prüfung freigegeben."
          >
            <ComparisonField
              label="Steuernummern"
              currentValue={currentData.steuernummern.join(', ')}
              newValue={changes.steuernummern}
              onChange={(v) => update('steuernummern', v)}
              placeholder="Neue oder zusätzliche Steuernummern eintragen"
            />
            <ComparisonField
              label="USt-ID"
              currentValue={currentData.ustId}
              newValue={changes.ustId}
              onChange={(v) => update('ustId', v)}
            />
            <ComparisonField
              label="Wirtschafts-ID"
              currentValue={currentData.wirtschaftsId}
              newValue={changes.wirtschaftsId}
              onChange={(v) => update('wirtschaftsId', v)}
              placeholder="Nur eintragen, wenn abweichend oder neu vergeben"
            />
            <ComparisonField
              label="Umsatzsteuer-Voranmeldung"
              currentValue={currentData.ustMeldung}
              newValue={changes.ustMeldung}
              onChange={(v) => update('ustMeldung', v)}
            />
            <ComparisonField
              label="Lohnsteuer-Anmeldung"
              currentValue={currentData.lohnsteuerMeldung}
              newValue={changes.lohnsteuerMeldung}
              onChange={(v) => update('lohnsteuerMeldung', v)}
            />
            <ComparisonField
              label="Dauerfristverlängerung"
              currentValue={currentData.dauerfristverlaengerung}
              newValue={changes.dauerfristverlaengerung}
              onChange={(v) => update('dauerfristverlaengerung', v)}
              placeholder="z. B. Ja oder Nein"
            />
          </Section>

          <Section
            title="Gesellschafter / Geschäftsführer / Inhaber"
            description="Mehrere Änderungen können gesammelt in einem Feld eingetragen werden."
          >
            <ComparisonField
              label="Gesellschafter"
              currentValue={formatList(currentData.gesellschafter)}
              newValue={changes.gesellschafter}
              onChange={(v) => update('gesellschafter', v)}
              placeholder="Neue Gesellschafter oder Änderungen eintragen"
              textarea
            />
            <ComparisonField
              label="Geschäftsführer"
              currentValue={formatList(currentData.geschaeftsfuehrer)}
              newValue={changes.geschaeftsfuehrer}
              onChange={(v) => update('geschaeftsfuehrer', v)}
              placeholder="Neue Geschäftsführer oder Änderungen eintragen"
              textarea
            />
            <ComparisonField
              label="Inhaber"
              currentValue={currentData.inhaber || 'Nicht zutreffend'}
              newValue={changes.inhaber}
              onChange={(v) => update('inhaber', v)}
              placeholder="Nur bei Einzelunternehmen relevant"
            />
          </Section>

          <Section
            title="Ansprechpartner / Kommunikation"
            description="Mehrere Ansprechpartner, E-Mails und Telefonnummern können hier gesammelt gemeldet werden."
          >
            <ComparisonField
              label="Aktuelle Ansprechpartner"
              currentValue={formatContacts(currentData.ansprechpartner)}
              newValue={changes.ansprechpartner}
              onChange={(v) => update('ansprechpartner', v)}
              placeholder="Neue Ansprechpartner, E-Mails oder Telefonnummern eintragen"
              textarea
            />
          </Section>

          <Section
            title="Hinweis zur Änderung"
            description="Optional können Sie kurz erläutern, warum die Änderung erforderlich ist."
          >
            <div style={singleFieldWrap}>
              <label style={labelStyle}>Begründung / Hinweis</label>
              <textarea
                value={changes.begruendung}
                onChange={(e) => update('begruendung', e.target.value)}
                placeholder="Optionaler Hinweis zur Änderung"
                style={textareaStyle}
              />
            </div>
          </Section>

          <div style={footerBar}>
            <div style={footerHint}>
              Änderungen werden zunächst intern geprüft und erst danach in die
              gültigen Stammdaten übernommen.
            </div>
            <button type="submit" style={submitButton}>
              Stammdatenanpassung einreichen
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({ title, description, children }) {
  return (
    <section style={sectionCard}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={sectionTitle}>{title}</h2>
        <p style={sectionDescription}>{description}</p>
      </div>
      <div style={sectionGrid}>{children}</div>
    </section>
  );
}

function ComparisonField({
  label,
  currentValue,
  newValue,
  onChange,
  placeholder = 'Gewünschte Änderung eintragen',
  type = 'text',
  textarea = false
}) {
  return (
    <div style={comparisonWrap}>
      <label style={labelStyle}>{label}</label>

      <div style={comparisonCard}>
        <div style={currentBox}>
          <div style={miniLabel}>Aktuell hinterlegt</div>
          <div style={currentValueStyle}>{currentValue || '—'}</div>
        </div>

        <div style={arrowBox}>→</div>

        <div style={newBox}>
          <div style={miniLabel}>Neue gewünschte Angabe</div>
          {textarea ? (
            <textarea
              value={newValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={textareaStyle}
            />
          ) : (
            <input
              type={type}
              value={newValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={inputStyle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatList(items) {
  if (!items || !items.length) return '—';
  return items.join(', ');
}

function formatContacts(items) {
  if (!items || !items.length) return '—';
  return items
    .map((item) => `${item.name} | ${item.email} | ${item.telefon}`)
    .join('\n');
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('de-DE');
}

const pageWrap = {
  minHeight: '100vh',
  background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
  padding: '32px 20px 60px'
};

const pageInner = {
  maxWidth: '1120px',
  margin: '0 auto'
};

const heroCard = {
  background: '#ffffff',
  border: '1px solid #e7e2d8',
  borderRadius: '24px',
  padding: '34px 36px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)',
  marginBottom: '22px'
};

const badge = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: '999px',
  border: '1px solid #d8d2c6',
  background: '#faf8f3',
  color: '#5f5a4f',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '20px'
};

const title = {
  fontSize: '38px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 10px'
};

const subtitle = {
  fontSize: '16px',
  lineHeight: 1.8,
  color: '#475467',
  maxWidth: '850px',
  margin: 0
};

const infoStrip = {
  marginTop: '22px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  borderRadius: '14px',
  background: '#f8f4ec',
  border: '1px solid #eadfcd',
  color: '#5d4a2f'
};

const sectionCard = {
  background: '#ffffff',
  border: '1px solid #e7e2d8',
  borderRadius: '22px',
  padding: '28px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.04)',
  marginBottom: '18px'
};

const sectionTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 8px'
};

const sectionDescription = {
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#667085',
  margin: 0
};

const sectionGrid = {
  display: 'grid',
  gap: '18px'
};

const comparisonWrap = {
  display: 'grid',
  gap: '8px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#344054'
};

const comparisonCard = {
  display: 'grid',
  gridTemplateColumns: '1fr 60px 1fr',
  gap: '14px',
  alignItems: 'stretch'
};

const currentBox = {
  background: '#f9fafb',
  border: '1px solid #e4e7ec',
  borderRadius: '16px',
  padding: '16px'
};

const newBox = {
  background: '#fffdf8',
  border: '1px solid #eadfcd',
  borderRadius: '16px',
  padding: '16px'
};

const arrowBox = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
  color: '#8c6b43',
  fontWeight: '700'
};

const miniLabel = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#667085',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const currentValueStyle = {
  whiteSpace: 'pre-wrap',
  lineHeight: 1.7,
  color: '#101828',
  fontSize: '14px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  background: '#fff',
  color: '#101828',
  boxSizing: 'border-box'
};

const textareaStyle = {
  width: '100%',
  minHeight: '110px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  background: '#fff',
  color: '#101828',
  resize: 'vertical',
  boxSizing: 'border-box',
  lineHeight: 1.6
};

const singleFieldWrap = {
  display: 'grid',
  gap: '8px'
};

const footerBar = {
  marginTop: '24px',
  background: '#ffffff',
  border: '1px solid #e7e2d8',
  borderRadius: '22px',
  padding: '22px 24px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.04)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap'
};

const footerHint = {
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#667085',
  maxWidth: '700px'
};

const submitButton = {
  padding: '16px 22px',
  borderRadius: '14px',
  border: 'none',
  background: '#8c6b43',
  color: '#fff',
  fontWeight: '700',
  fontSize: '15px',
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(140, 107, 67, 0.18)'
};

const errorBox = {
  marginBottom: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  marginBottom: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};

