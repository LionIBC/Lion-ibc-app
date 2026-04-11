'use client';

import { useEffect, useState } from 'react';

const kundennummer = 'K-10023';

export default function StammdatenPortalPage() {
  const [data, setData] = useState(null);
  const [changes, setChanges] = useState({});
  const [begruendung, setBegruendung] = useState('');
  const [bestaetigt, setBestaetigt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadCurrentData();
  }, []);

  async function loadCurrentData() {
    try {
      setLoading(true);
      setStatus(null);

      const res = await fetch(`/api/stammdaten?kundennummer=${encodeURIComponent(kundennummer)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Stammdaten konnten nicht geladen werden.');
      }

      setData(json);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Stammdaten konnten nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setChanges((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  async function submitChanges(e) {
    e.preventDefault();
    setStatus(null);

    const filteredChanges = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => String(value || '').trim() !== '')
    );

    if (Object.keys(filteredChanges).length === 0) {
      setStatus({
        type: 'error',
        message: 'Bitte mindestens eine Änderung eintragen.'
      });
      return;
    }

    if (!bestaetigt) {
      setStatus({
        type: 'error',
        message: 'Bitte bestätigen Sie die Änderung vor dem Absenden.'
      });
      return;
    }

    try {
      setSending(true);

      const res = await fetch('/api/stammdaten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundennummer,
          changes: filteredChanges,
          begruendung
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Änderung konnte nicht gespeichert werden.');
      }

      setStatus({
        type: 'success',
        message: 'Die Stammdatenanpassung wurde erfolgreich eingereicht.'
      });

      setChanges({});
      setBegruendung('');
      setBestaetigt(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Änderung konnte nicht gespeichert werden.'
      });
    } finally {
      setSending(false);
    }
  }

  function renderRow(label, field) {
    const currentValue = data?.[field] ?? '-';
    const newValue = changes[field] || '';
    const changed = String(newValue).trim() !== '';

    return (
      <div style={comparisonWrap} key={field}>
        <div style={rowLabel}>{label}</div>

        <div style={comparisonRow}>
          <div style={currentValuePlain}>
            {currentValue || '-'}
          </div>

          <div style={arrowBox}>→</div>

          <input
            type="text"
            placeholder="Änderung eintragen"
            value={newValue}
            onChange={(e) => handleChange(field, e.target.value)}
            style={{
              ...inputStyle,
              ...(changed ? changedFieldStyle : {})
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main style={pageWrap}>
        <div style={pageInner}>
          <section style={heroCard}>
            <div style={badge}>Kundenportal</div>
            <h1 style={title}>Stammdaten</h1>
            <p style={subtitle}>Stammdaten werden geladen…</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={pageWrap}>
      <div style={pageInner}>
        <section style={heroCard}>
          <div style={badge}>Kundenportal</div>
          <h1 style={title}>Stammdaten</h1>
          <p style={subtitle}>
            Hier sehen Sie Ihre aktuell gespeicherten Stammdaten. Änderungen können
            direkt eingetragen und anschließend zur internen Prüfung eingereicht werden.
          </p>

          <div style={topInfoRow}>
            <div style={topInfoBox}>
              <span style={topInfoLabel}>Kundennummer</span>
              <span style={topInfoValue}>{kundennummer}</span>
            </div>
          </div>
        </section>

        {status?.type === 'error' && <div style={errorBox}>{status.message}</div>}
        {status?.type === 'success' && <div style={successBox}>{status.message}</div>}

        <form onSubmit={submitChanges}>
          <section style={sectionCard}>
            <h2 style={sectionTitle}>Unternehmensdaten</h2>
            <div style={sectionGrid}>
              {renderRow('Firma', 'firma')}
              {renderRow('Firmenname', 'firmenname')}
              {renderRow('Rechtsform', 'rechtsform')}
              {renderRow('Gründungsdatum', 'gruendungsdatum')}
              {renderRow('Unternehmenssitz', 'unternehmenssitz')}
              {renderRow('HRB Nummer', 'hrb_nummer')}
              {renderRow('Amtsgericht', 'amtsgericht')}
            </div>
          </section>

          <section style={sectionCard}>
            <h2 style={sectionTitle}>Steuerliche Daten</h2>
            <div style={sectionGrid}>
              {renderRow('Steuernummern', 'steuernummern')}
              {renderRow('USt-ID', 'ust_id')}
              {renderRow('Wirtschafts-ID', 'wirtschafts_id')}
              {renderRow('Umsatzsteuer-Voranmeldung', 'ust_meldung')}
              {renderRow('Lohnsteuer-Anmeldung', 'lohnsteuer_meldung')}
              {renderRow('Dauerfristverlängerung', 'dauerfristverlaengerung')}
            </div>
          </section>

          <section style={sectionCard}>
            <h2 style={sectionTitle}>Gesellschafter / Geschäftsführer / Inhaber</h2>
            <div style={sectionGrid}>
              {renderRow('Gesellschafter', 'gesellschafter')}
              {renderRow('Geschäftsführer', 'geschaeftsfuehrer')}
              {renderRow('Inhaber', 'inhaber')}
            </div>
          </section>

          <section style={sectionCard}>
            <h2 style={sectionTitle}>Ansprechpartner / Kommunikation</h2>
            <div style={sectionGrid}>
              {renderRow('Ansprechpartner', 'ansprechpartner')}
            </div>
          </section>

          <section style={sectionCard}>
            <h2 style={sectionTitle}>Hinweis</h2>
            <div style={singleFieldWrap}>
              <label style={labelStyle}>Zusätzlicher Hinweis</label>
              <textarea
                value={begruendung}
                onChange={(e) => setBegruendung(e.target.value)}
                placeholder="Optionaler Hinweis zur beantragten Änderung"
                style={textareaStyle}
              />
            </div>
          </section>

          <section style={footerCard}>
            <label style={confirmRow}>
              <input
                type="checkbox"
                checked={bestaetigt}
                onChange={(e) => setBestaetigt(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2 }}
              />
              <span>
                Ich bestätige, dass die eingetragenen Änderungswünsche korrekt sind.
                Die Anpassung soll zur internen Prüfung eingereicht werden.
              </span>
            </label>

            <div style={footerBottom}>
              <div style={footerHint}>
                Die aktuell gespeicherten Stammdaten bleiben bis zur internen Freigabe unverändert bestehen.
              </div>

              <button type="submit" style={submitButton} disabled={sending}>
                {sending ? 'Wird eingereicht…' : 'Stammdaten anpassen'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
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
