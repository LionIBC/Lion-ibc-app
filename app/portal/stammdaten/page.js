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
    {
      name: 'Max Mustermann',
      email: 'max@muster.de',
      telefon: '+49 221 123456'
    }
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
  const [sending, setSending] = useState(false);

  function update(key, value) {
    setChanges((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    const changesFiltered = {};

    Object.entries(changes).forEach(([key, value]) => {
      if (key === 'begruendung' || key === 'bestaetigt') return;
      if (String(value).trim() !== '') {
        changesFiltered[key] = value;
      }
    });

    if (Object.keys(changesFiltered).length === 0) {
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

    try {
      setSending(true);

      const res = await fetch('/api/stammdaten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundennummer: currentData.kundennummer,
          firma: currentData.firmenname,
          changes: buildStructuredChanges(changesFiltered),
          begruendung: changes.begruendung
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: 'error',
          message: data.message || 'Fehler beim Einreichen der Stammdatenanpassung.'
        });
        return;
      }

      setStatus({
        type: 'success',
        message:
          'Ihre Stammdatenanpassung wurde eingereicht und wird intern geprüft.'
      });

      setChanges(emptyChangeState);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Fehler beim Einreichen der Stammdatenanpassung.'
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-inner">
        <section className="hero-card">
          <div className="page-badge">Kundenportal</div>
          <h1 className="page-title">Stammdaten</h1>
          <p className="page-subtitle">
            Hier sehen Sie Ihre aktuell hinterlegten Stammdaten. Änderungen können
            direkt eingetragen und anschließend zur internen Prüfung eingereicht werden.
          </p>

          <div className="info-strip">
            <span className="info-strip-label">Kundennummer</span>
            <span className="info-strip-value">{currentData.kundennummer}</span>
          </div>
        </section>

        {status?.type === 'error' && (
          <div className="status-box error">{status.message}</div>
        )}

        {status?.type === 'success' && (
          <div className="status-box success">{status.message}</div>
        )}

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
            <div className="single-field-wrap">
              <label className="field-label">Zusätzlicher Hinweis</label>
              <textarea
                value={changes.begruendung}
                onChange={(e) => update('begruendung', e.target.value)}
                placeholder="Optionaler Hinweis zur beantragten Änderung"
                className="field-textarea"
              />
            </div>
          </Section>

          <section className="footer-card">
            <label className="confirm-row">
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

            <div className="footer-row" style={{ marginTop: 20 }}>
              <div className="footer-hint">
                Die aktuell gespeicherten Stammdaten bleiben bis zur internen
                Freigabe unverändert bestehen.
              </div>

              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? 'Wird eingereicht…' : 'Stammdaten anpassen'}
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
    <section className="section-card">
      <h2 className="section-title">{title}</h2>
      <div className="stack-18">{children}</div>
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
    <div className="comparison-wrap">
      <div className="field-label">{label}</div>

      <div className="comparison-row">
        <div className="current-value">{currentValue || '—'}</div>

        <div className="comparison-arrow">→</div>

        {textarea ? (
          <textarea
            value={newValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`field-textarea ${hasValue ? 'is-changed' : ''}`}
          />
        ) : (
          <input
            type={type}
            value={newValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`field-input ${hasValue ? 'is-changed' : ''}`}
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

function buildStructuredChanges(changesFiltered) {
  const result = {};

  Object.entries(changesFiltered).forEach(([key, value]) => {
    result[key] = {
      old: getOldValue(key),
      new: value
    };
  });

  return result;
}

function getOldValue(key) {
  switch (key) {
    case 'firmenname':
      return currentData.firmenname;
    case 'rechtsform':
      return currentData.rechtsform;
    case 'gruendungsdatum':
      return formatDate(currentData.gruendungsdatum);
    case 'unternehmenssitz':
      return currentData.unternehmenssitz;
    case 'hrbNummer':
      return currentData.hrbNummer;
    case 'amtsgericht':
      return currentData.amtsgericht;
    case 'steuernummern':
      return currentData.steuernummern.join(', ');
    case 'ustId':
      return currentData.ustId;
    case 'wirtschaftsId':
      return currentData.wirtschaftsId;
    case 'ustMeldung':
      return currentData.ustMeldung;
    case 'lohnsteuerMeldung':
      return currentData.lohnsteuerMeldung;
    case 'dauerfristverlaengerung':
      return currentData.dauerfristverlaengerung;
    case 'gesellschafter':
      return formatList(currentData.gesellschafter);
    case 'geschaeftsfuehrer':
      return formatList(currentData.geschaeftsfuehrer);
    case 'inhaber':
      return currentData.inhaber || 'Nicht zutreffend';
    case 'ansprechpartner':
      return formatContacts(currentData.ansprechpartner);
    default:
      return '';
  }
}
