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
  begruendung: '',
  bestaetigt: false
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
      if (key === 'begruendung' || key === 'bestaetigt') return false;
      return String(value).trim() !== '';
    });

    if (!hasAnyChange) {
      setStatus({
        type: 'error',
        message: 'Bitte tragen Sie mindestens eine gewünschte Änderung ein.'
      });
      return;
    }

    if (!changes.bestaetigt) {
      setStatus({
        type: 'error',
        message: 'Bitte bestätigen Sie die Stammdatenanpassung vor dem Absenden.'
      });
      return;
    }

    setStatus({
      type: 'success',
      message:
        'Ihre Stammdatenanpassung wurde eingereicht und wird intern geprüft. Freigegebene Änderungen werden anschließend übernommen.'
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
            Hier sehen Sie Ihre aktuell hinterlegten Stammdaten. Änderungswünsche
            können direkt eingetragen und anschließend zur internen Prüfung
            eingereicht werden.
          </p>

          <div style={topInfoRow}>
            <div style={topInfoBox}>
              <span style={topInfoLabel}>Kundennummer</span>
              <span style={topInfoValue}>{currentData.kundennummer}</span>
            </div>
          </div>
        </section>

        {status?.type === 'error' && <div style={errorBox}>{status.message}</div>}
        {status?.type === 'success' && <div style={successBox}>{status.message}</div>}

        <form onSubmit={handleSubmit}>
          <Section title="Unternehmensdaten">
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

          <Section title="Steuerliche Daten">
            <ComparisonField
              label="Steuernummern"
              currentValue={currentData.steuernummern.join(', ')}
              newValue={changes.steuernummern}
              onChange={(v) => update('steuernummern', v)}
              placeholder="Neue oder zusätzliche Steuernummern"
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
              placeholder="Ja oder Nein"
            />
          </Section>

          <Section title="Gesellschafter / Geschäftsführer / Inhaber">
            <ComparisonField
              label="Gesellschafter"
              currentValue={formatList(currentData.gesellschafter)}
              newValue={changes.gesellschafter}
              onChange={(v) => update('gesellschafter', v)}
              placeholder="Änderungen oder Ergänzungen"
              textarea
            />
            <ComparisonField
              label="Geschäftsführer"
              currentValue={formatList(currentData.geschaeftsfuehrer)}
              newValue={changes.geschaeftsfuehrer}
              onChange={(v) => update('geschaeftsfuehrer', v)}
              placeholder="Änderungen oder Ergänzungen"
              textarea
            />
            <ComparisonField
              label="Inhaber"
              currentValue={currentData.inhaber || 'Nicht zutreffend'}
              newValue={changes.inhaber}
              onChange={(v) => update('inhaber', v)}
              placeholder="Nur bei Einzelunternehmen"
            />
          </Section>

          <Section title="Ansprechpartner / Kommunikation">
            <ComparisonField
              label="Ansprechpartner"
              currentValue={formatContacts(currentData.ansprechpartner)}
              newValue={changes.ansprechpartner}
              onChange={(v) => update('ansprechpartner', v)}
              placeholder="Neue Ansprechpartner, E-Mails oder Telefonnummern"
              textarea
            />
          </Section>

          <Section title="Hinweis">
            <div style={singleFieldWrap}>
              <label style={labelStyle}>Zusätzlicher Hinweis</label>
              <textarea
                value={changes.begruendung}
                onChange={(e) => update('begruendung', e.target.value)}
                placeholder="Optionaler Hinweis zur beantragten Änderung"
                style={textareaStyle}
              />
            </div>
          </Section>

          <section style={footerCard}>
            <label style={confirmRow}>
              <input
                type="checkbox"
                checked={changes.bestaetigt}
                onChange={(e) => update('bestaetigt', e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2 }}
              />
              <span>
                Ich bestätige, dass die eingetragenen Änderungswünsche korrekt sind.
                Die Anpassung soll zur internen Prüfung eingereicht werden.
              </span>
            </label>

            <div style={footerBottom}>
              <div style={footerHint}>
                Die aktuell gespeicherten Stammdaten bleiben bis zur internen
                Freigabe unverändert bestehen.
              </div>

              <button type="submit" style={submitButton}>
                Stammdaten anpassen
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={sectionCard}>
      <h2 style={sectionTitle}>{title}</h2>
      <div style={sectionGrid}>{children}</div>
    </section>
  );
}

function ComparisonField({
  label,
  currentValue,
  newValue,
  onChange,
  placeholder = 'Änderung eintragen',
  type = 'text',
  textarea = false
}) {
  const hasValue = String(newValue || '').trim() !== '';

  return (
    <div style={comparisonWrap}>
      <div style={rowLabel}>{label}</div>

      <div style={comparisonRow}>
        <div style={currentValuePlain}>{currentValue || '—'}</div>

        <div style={arrowBox}>→</div>

        {textarea ? (
          <textarea
            value={newValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              ...textareaStyle,
              ...(hasValue ? changedFieldStyle : {})
            }}
          />
        ) : (
          <input
            type={type}
            value={newValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              ...inputStyle,
              ...(hasValue ? changedFieldStyle : {})
            }}
          />
        )}
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
  border: '1px solid #eee7da',
  borderRadius: '24px',
  padding: '34px 36px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.05)',
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
  marginBottom: '18px'
};

const title = {
  fontSize: '38px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 10px'
};

const subtitle = {
  fontSize: '16px',
  lineHeight: 1.75,
  color: '#475467',
  maxWidth: '860px',
  margin: 0
};

const topInfoRow = {
  marginTop: '22px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
};

const topInfoBox = {
  padding: '12px 16px',
  borderRadius: '14px',
  background: '#faf8f3',
  border: '1px solid #eadfcd',
  display: 'flex',
  gap: '10px',
  alignItems: 'center'
};

const topInfoLabel = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#5d4a2f',
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
};

const topInfoValue = {
  fontSize: '14px',
  color: '#101828',
  fontWeight: '600'
};

const sectionCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '26px 28px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)',
  marginBottom: '18px'
};

const sectionTitle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 18px'
};

const sectionGrid = {
  display: 'grid',
  gap: '18px'
};

const comparisonWrap = {
  display: 'grid',
  gap: '8px'
};

const rowLabel = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#344054'
};

const comparisonRow = {
  display: 'grid',
  gridTemplateColumns: '1fr 40px 1fr',
  gap: '14px',
  alignItems: 'center'
};

const currentValuePlain = {
  padding: '12px 4px',
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#101828',
  whiteSpace: 'pre-wrap',
  borderBottom: '1px solid #eceff3',
  minHeight: '24px'
};

const arrowBox = {
  textAlign: 'center',
  fontSize: '20px',
  color: '#8c6b43',
  fontWeight: '700'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#344054'
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

const changedFieldStyle = {
  background: '#fff7ed',
  border: '1px solid #f5c27a'
};

const singleFieldWrap = {
  display: 'grid',
  gap: '8px'
};

const footerCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '24px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)',
  display: 'grid',
  gap: '20px'
};

const confirmRow = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  lineHeight: 1.7,
  color: '#344054',
  fontSize: '14px'
};

const footerBottom = {
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
