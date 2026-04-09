'use client';

import { useState } from 'react';

export default function GruendungPage() {
  const initialState = {
    vorname: '',
    nachname: '',
    telefon: '',
    email: '',

    firmenname: '',
    alternativeFirmennamen: '',
    rechtsform: '',
    unternehmenssitz: '',
    geschaeftsadresseVorhanden: '',
    taetigkeit: '',

    gesellschafter1: '',
    beteiligung1: '',
    geschaeftsfuehrerJaNein: '',
    weitereGesellschafter: '',

    stammkapital: '',

    umsatz1Jahr: '',
    gewinn1Jahr: '',
    kleinunternehmerregelung: '',

    mitarbeiter: '',
    anzahlMitarbeiter: '',
    startBeschaeftigung: '',

    hinweise: ''
  };

  const [form, setForm] = useState(initialState);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/new-gruendung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: 'success',
          message: data.message || 'Die Gründungsdaten wurden erfolgreich übermittelt.'
        });
        setForm(initialState);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Fehler beim Senden.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Fehler beim Senden.'
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        padding: '32px 20px 60px'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{ height: '120px', width: 'auto', display: 'block' }}
          />
        </div>

        <section style={card}>
          <div style={badge}>Unternehmensgründung</div>

          <h1 style={title}>Digitale Unternehmensgründung</h1>

          <p style={subtitle}>
            Übermitteln Sie uns alle relevanten Informationen. Wir übernehmen die
            vollständige Gründung inklusive Notar, Gewerbeanmeldung, steuerlicher
            Erfassung und weiterer Behörden.
          </p>

          {status && status.type === 'error' && (
            <div style={errorBox}>{status.message}</div>
          )}

          {status && status.type === 'success' && (
            <div style={successBox}>{status.message}</div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
            <h3 style={sectionTitle}>Ansprechpartner</h3>
            <div style={grid}>
              <InputField
                label="Vorname"
                value={form.vorname}
                onChange={(e) => update('vorname', e.target.value)}
                required
              />
              <InputField
                label="Nachname"
                value={form.nachname}
                onChange={(e) => update('nachname', e.target.value)}
                required
              />
              <InputField
                label="Telefon"
                value={form.telefon}
                onChange={(e) => update('telefon', e.target.value)}
                required
              />
              <InputField
                label="E-Mail"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>

            <h3 style={sectionTitle}>Gründungsvorhaben</h3>
            <div style={grid}>
              <InputField
                label="Gewünschter Firmenname"
                value={form.firmenname}
                onChange={(e) => update('firmenname', e.target.value)}
                required
              />
              <InputField
                label="Alternative Firmennamen"
                value={form.alternativeFirmennamen}
                onChange={(e) => update('alternativeFirmennamen', e.target.value)}
              />
              <InputField
                label="Rechtsform"
                placeholder="z. B. GmbH"
                value={form.rechtsform}
                onChange={(e) => update('rechtsform', e.target.value)}
                required
              />
              <InputField
                label="Unternehmenssitz"
                placeholder="Ort"
                value={form.unternehmenssitz}
                onChange={(e) => update('unternehmenssitz', e.target.value)}
                required
              />
              <InputField
                label="Geschäftsadresse vorhanden?"
                placeholder="ja / nein"
                value={form.geschaeftsadresseVorhanden}
                onChange={(e) => update('geschaeftsadresseVorhanden', e.target.value)}
              />
              <InputField
                label="Tätigkeit / Branche"
                value={form.taetigkeit}
                onChange={(e) => update('taetigkeit', e.target.value)}
                required
              />
            </div>

            <h3 style={sectionTitle}>Gesellschafter / Geschäftsführer</h3>
            <div style={grid}>
              <InputField
                label="Name Gesellschafter 1"
                value={form.gesellschafter1}
                onChange={(e) => update('gesellschafter1', e.target.value)}
                required
              />
              <InputField
                label="Beteiligung in %"
                value={form.beteiligung1}
                onChange={(e) => update('beteiligung1', e.target.value)}
                required
              />
              <InputField
                label="Geschäftsführer"
                placeholder="ja / nein"
                value={form.geschaeftsfuehrerJaNein}
                onChange={(e) => update('geschaeftsfuehrerJaNein', e.target.value)}
                required
              />
              <InputField
                label="Weitere Gesellschafter vorhanden?"
                placeholder="ja / nein"
                value={form.weitereGesellschafter}
                onChange={(e) => update('weitereGesellschafter', e.target.value)}
              />
            </div>

            <h3 style={sectionTitle}>Stammkapital</h3>
            <div style={grid}>
              <InputField
                label="Höhe des Stammkapitals"
                placeholder="z. B. 25.000 €"
                value={form.stammkapital}
                onChange={(e) => update('stammkapital', e.target.value)}
                required
              />
            </div>

            <h3 style={sectionTitle}>Steuer & Behörden</h3>
            <div style={grid}>
              <InputField
                label="Umsatz im 1. Jahr"
                placeholder="geschätzt"
                value={form.umsatz1Jahr}
                onChange={(e) => update('umsatz1Jahr', e.target.value)}
              />
              <InputField
                label="Gewinn im 1. Jahr"
                placeholder="geschätzt"
                value={form.gewinn1Jahr}
                onChange={(e) => update('gewinn1Jahr', e.target.value)}
              />
              <InputField
                label="Kleinunternehmerregelung"
                placeholder="ja / nein / unsicher"
                value={form.kleinunternehmerregelung}
                onChange={(e) => update('kleinunternehmerregelung', e.target.value)}
              />
            </div>

            <h3 style={sectionTitle}>Mitarbeiter</h3>
            <div style={grid}>
              <InputField
                label="Werden Mitarbeiter eingestellt?"
                placeholder="ja / nein"
                value={form.mitarbeiter}
                onChange={(e) => update('mitarbeiter', e.target.value)}
              />
              <InputField
                label="Anzahl Mitarbeiter"
                value={form.anzahlMitarbeiter}
                onChange={(e) => update('anzahlMitarbeiter', e.target.value)}
              />
              <InputField
                label="Start der Beschäftigung"
                value={form.startBeschaeftigung}
                onChange={(e) => update('startBeschaeftigung', e.target.value)}
              />
            </div>

            <h3 style={sectionTitle}>Hinweise</h3>
            <textarea
              placeholder="Zusätzliche Informationen oder Besonderheiten"
              value={form.hinweise}
              onChange={(e) => update('hinweise', e.target.value)}
              style={textarea}
            />

            <div style={infoBox}>
              DSGVO, Vollmacht und Unterschrift ergänzen wir im nächsten Schritt.
            </div>

            <button type="submit" style={button} disabled={sending}>
              {sending ? 'Wird gesendet...' : 'Gründung absenden'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={input}
      />
    </div>
  );
}

const card = {
  background: '#ffffff',
  border: '1px solid #e7e2d8',
  borderRadius: '24px',
  padding: '40px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
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
  fontSize: '36px',
  fontWeight: '700',
  marginBottom: '10px',
  color: '#101828'
};

const subtitle = {
  color: '#475467',
  marginBottom: '20px',
  fontSize: '16px',
  lineHeight: 1.6,
  maxWidth: '900px'
};

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '12px',
  fontWeight: '600',
  color: '#101828'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#344054'
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '14px'
};

const input = {
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #d0d5dd',
  fontSize: '14px'
};

const textarea = {
  width: '100%',
  minHeight: '110px',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  resize: 'vertical'
};

const button = {
  marginTop: '24px',
  padding: '16px',
  borderRadius: '12px',
  background: '#8c6b43',
  color: '#fff',
  border: 'none',
  fontWeight: '600',
  width: '100%',
  cursor: 'pointer'
};

const errorBox = {
  marginTop: '16px',
  marginBottom: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  marginTop: '16px',
  marginBottom: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};

const infoBox = {
  marginTop: '20px',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#f8f9fc',
  border: '1px solid #e4e7ec',
  color: '#475467',
  fontSize: '14px'
};
