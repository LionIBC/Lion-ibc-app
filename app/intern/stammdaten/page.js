'use client';

import { useEffect, useState } from 'react';

export default function InternStammdatenPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusBox, setStatusBox] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      setStatusBox(null);

      const res = await fetch('/api/intern/requests');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Anfragen konnten nicht geladen werden.');
      }

      setRequests(json || []);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Anfragen konnten nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function decide(requestId, approve) {
    try {
      setStatusBox(null);

      const res = await fetch('/api/stammdaten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approve })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Anfrage konnte nicht bearbeitet werden.');
      }

      setStatusBox({
        type: 'success',
        message: approve ? 'Änderung wurde freigegeben.' : 'Änderung wurde abgelehnt.'
      });

      loadRequests();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Anfrage konnte nicht bearbeitet werden.'
      });
    }
  }

  return (
    <main style={pageWrap}>
      <div style={pageInner}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={title}>Stammdaten Freigaben</h1>
          <p style={subtitle}>
            Hier prüfen Sie eingereichte Stammdatenanpassungen und entscheiden,
            ob diese freigegeben oder abgelehnt werden.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        {loading ? (
          <div style={infoBox}>Anfragen werden geladen…</div>
        ) : requests.length === 0 ? (
          <div style={infoBox}>Keine offenen Stammdatenanfragen vorhanden.</div>
        ) : (
          <div style={requestList}>
            {requests.map((request) => (
              <section key={request.id} style={sectionCard}>
                <div style={headerRow}>
                  <div>
                    <div style={requestTitle}>{request.kundennummer}</div>
                    <div style={requestMeta}>Anfrage-ID: {request.id}</div>
                  </div>

                  <div style={statusBadge(request.status)}>
                    {request.status}
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  {Object.entries(request.changes || {}).map(([field, value]) => (
                    <div key={field} style={comparisonWrap}>
                      <div style={rowLabel}>{field}</div>

                      <div style={comparisonRow}>
                        <div style={currentValuePlain}>
                          {value?.old || '-'}
                        </div>

                        <div style={arrowBox}>→</div>

                        <div style={newValueBox}>
                          {value?.new || '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {request.begruendung ? (
                  <div style={reasonCard}>
                    <div style={reasonTitle}>Begründung</div>
                    <div style={reasonText}>{request.begruendung}</div>
                  </div>
                ) : null}

                <div style={actionRow}>
                  <button
                    type="button"
                    style={approveButton}
                    onClick={() => decide(request.id, true)}
                  >
                    Freigeben
                  </button>

                  <button
                    type="button"
                    style={rejectButton}
                    onClick={() => decide(request.id, false)}
                  >
                    Ablehnen
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function statusBadge(status) {
  if (status === 'freigegeben') {
    return {
      padding: '8px 14px',
      borderRadius: '999px',
      background: '#ecfdf3',
      color: '#067647',
      fontSize: '13px',
      fontWeight: '700',
      textTransform: 'uppercase'
    };
  }

  if (status === 'abgelehnt') {
    return {
      padding: '8px 14px',
      borderRadius: '999px',
      background: '#fef3f2',
      color: '#b42318',
      fontSize: '13px',
      fontWeight: '700',
      textTransform: 'uppercase'
    };
  }

  return {
    padding: '8px 14px',
    borderRadius: '999px',
    background: '#fffaeb',
    color: '#b54708',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase'
  };
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

const requestList = {
  display: 'grid',
  gap: '18px'
};

const sectionCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '26px 28px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  flexWrap: 'wrap'
};

const requestTitle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#101828'
};

const requestMeta = {
  marginTop: '6px',
  fontSize: '14px',
  color: '#667085'
};

const comparisonWrap = {
  display: 'grid',
  gap: '8px',
  marginBottom: '18px'
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

const newValueBox = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #f5c27a',
  fontSize: '14px',
  background: '#fff7ed',
  color: '#101828',
  boxSizing: 'border-box',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap'
};

const reasonCard = {
  marginTop: '12px',
  background: '#faf8f3',
  border: '1px solid #eadfcd',
  borderRadius: '16px',
  padding: '16px'
};

const reasonTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#5d4a2f',
  marginBottom: '8px'
};

const reasonText = {
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#344054',
  whiteSpace: 'pre-wrap'
};

const actionRow = {
  marginTop: '20px',
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap'
};

const approveButton = {
  padding: '14px 18px',
  borderRadius: '12px',
  border: 'none',
  background: '#8c6b43',
  color: '#fff',
  fontWeight: '700',
  fontSize: '14px',
  cursor: 'pointer'
};

const rejectButton = {
  padding: '14px 18px',
  borderRadius: '12px',
  border: '1px solid #fecdca',
  background: '#fff',
  color: '#b42318',
  fontWeight: '700',
  fontSize: '14px',
  cursor: 'pointer'
};

const infoBox = {
  marginBottom: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708'
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
