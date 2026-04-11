'use client';

import { useEffect, useState } from 'react';

export default function InternStammdatenPage() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/stammdaten');
      const data = await res.json();
      setRequests(data.data || []);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Fehler beim Laden der Stammdatenanfragen.'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(id, newStatus) {
    try {
      const res = await fetch('/api/stammdaten', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: 'error',
          message: data.message || 'Fehler bei der Bearbeitung.'
        });
        return;
      }

      setStatus({
        type: 'success',
        message:
          newStatus === 'freigegeben'
            ? 'Änderung wurde freigegeben.'
            : 'Änderung wurde abgelehnt.'
      });

      loadData();
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Fehler bei der Bearbeitung.'
      });
    }
  }

  return (
    <main className="page-shell">
      <div className="page-inner">
        <section className="hero-card">
          <div className="page-badge">Intern</div>
          <h1 className="page-title">Stammdaten Freigaben</h1>
          <p className="page-subtitle">
            Prüfen Sie eingereichte Stammdatenanpassungen und geben Sie diese frei
            oder lehnen Sie sie ab.
          </p>
        </section>

        {status?.type === 'error' && (
          <div className="status-box error">{status.message}</div>
        )}

        {status?.type === 'success' && (
          <div className="status-box success">{status.message}</div>
        )}

        {loading ? (
          <div className="status-box warning">Anfragen werden geladen…</div>
        ) : requests.length === 0 ? (
          <div className="status-box warning">
            Keine offenen oder gespeicherten Stammdatenanfragen vorhanden.
          </div>
        ) : (
          <div className="stack-18">
            {requests.map((req) => (
              <section key={req.id} className="section-card">
                <div style={headerRow}>
                  <div>
                    <div style={requestTitle}>
                      {req.firma || 'Unbekannter Mandant'}
                    </div>
                    <div style={requestMeta}>
                      Kundennummer: {req.kundennummer} · Anfrage: {req.id}
                    </div>
                    <div style={requestMeta}>
                      Eingereicht am: {formatDateTime(req.createdAt)}
                    </div>
                  </div>

                  <StatusBadge status={req.status} />
                </div>

                <div className="stack-18" style={{ marginTop: 22 }}>
                  {Object.entries(req.changes || {}).map(([field, value]) => (
                    <div key={field} className="comparison-wrap">
                      <div className="field-label">{fieldLabel(field)}</div>

                      <div className="comparison-row">
                        <div className="current-value">{value.old || '—'}</div>
                        <div className="comparison-arrow">→</div>
                        <div className="field-input is-changed" style={newValueBox}>
                          {value.new || '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {req.begruendung ? (
                  <div className="footer-card" style={{ marginTop: 20 }}>
                    <div className="field-label" style={{ marginBottom: 8 }}>
                      Begründung
                    </div>
                    <div style={reasonText}>{req.begruendung}</div>
                  </div>
                ) : null}

                {req.status === 'offen' && (
                  <div className="footer-row" style={{ marginTop: 22 }}>
                    <div className="footer-hint">
                      Erst nach Freigabe sollen die neuen Werte in die aktiven
                      Stammdaten übernommen werden.
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleAction(req.id, 'freigegeben')}
                      >
                        Freigeben
                      </button>

                      <button
                        className="btn-danger"
                        onClick={() => handleAction(req.id, 'abgelehnt')}
                      >
                        Ablehnen
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }) {
  let bg = '#f2f4f7';
  let color = '#667085';
  let label = status;

  if (status === 'offen') {
    bg = '#fffaeb';
    color = '#b54708';
    label = 'offen';
  }

  if (status === 'freigegeben') {
    bg = '#ecfdf3';
    color = '#067647';
    label = 'freigegeben';
  }

  if (status === 'abgelehnt') {
    bg = '#fef3f2';
    color = '#b42318';
    label = 'abgelehnt';
  }

  return (
    <div
      style={{
        padding: '8px 14px',
        borderRadius: '999px',
        background: bg,
        color,
        fontSize: '13px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.03em'
      }}
    >
      {label}
    </div>
  );
}

function fieldLabel(field) {
  const labels = {
    firmenname: 'Firmenname',
    rechtsform: 'Rechtsform',
    gruendungsdatum: 'Gründungsdatum',
    unternehmenssitz: 'Unternehmenssitz',
    hrbNummer: 'HRB Nummer',
    amtsgericht: 'Amtsgericht',
    steuernummern: 'Steuernummern',
    ustId: 'USt-ID',
    wirtschaftsId: 'Wirtschafts-ID',
    ustMeldung: 'Umsatzsteuer-Voranmeldung',
    lohnsteuerMeldung: 'Lohnsteuer-Anmeldung',
    dauerfristverlaengerung: 'Dauerfristverlängerung',
    gesellschafter: 'Gesellschafter',
    geschaeftsfuehrer: 'Geschäftsführer',
    inhaber: 'Inhaber',
    ansprechpartner: 'Ansprechpartner'
  };

  return labels[field] || field;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('de-DE');
}

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '18px',
  flexWrap: 'wrap'
};

const requestTitle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#101828'
};

const requestMeta = {
  fontSize: '14px',
  color: '#667085',
  marginTop: 4
};

const newValueBox = {
  minHeight: 46,
  display: 'flex',
  alignItems: 'center',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap'
};

const reasonText = {
  fontSize: '14px',
  color: '#101828',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap'
};
