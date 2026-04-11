'use client';

import { useState } from 'react';

const mockRequests = [
  {
    id: 'REQ-001',
    kundennummer: 'K-10023',
    firma: 'Muster GmbH',
    changes: {
      firmenname: { old: 'Muster GmbH', new: 'Muster Holding GmbH' },
      ustId: { old: 'DE123456789', new: 'DE999999999' }
    },
    begruendung: 'Umfirmierung und neue steuerliche Registrierung',
    status: 'offen',
    createdAt: '2026-04-10'
  }
];

export default function InternalStammdatenPage() {
  const [requests, setRequests] = useState(mockRequests);

  function handleAction(id, action) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: action } : r
      )
    );
  }

  return (
    <main className="page-shell">
      <div className="page-inner">
        <section className="hero-card">
          <div className="page-badge">Intern</div>
          <h1 className="page-title">Stammdaten Freigaben</h1>
          <p className="page-subtitle">
            Prüfen und bestätigen Sie Änderungen von Mandanten. Änderungen werden erst nach Freigabe aktiv übernommen.
          </p>
        </section>

        {requests.length === 0 && (
          <div className="status-box warning">
            Keine offenen Änderungsanfragen vorhanden.
          </div>
        )}

        <div className="stack-18">
          {requests.map((req) => (
            <div key={req.id} className="section-card">
              
              {/* Header */}
              <div style={headerRow}>
                <div>
                  <strong>{req.firma}</strong><br />
                  <span style={{ color: '#667085' }}>
                    Kundennummer: {req.kundennummer}
                  </span>
                </div>

                <StatusBadge status={req.status} />
              </div>

              {/* Änderungen */}
              <div className="stack-14" style={{ marginTop: 20 }}>
                {Object.entries(req.changes).map(([key, value]) => (
                  <div key={key} className="comparison-row">
                    <div className="current-value">{value.old}</div>
                    <div className="comparison-arrow">→</div>
                    <div style={newValueBox}>{value.new}</div>
                  </div>
                ))}
              </div>

              {/* Begründung */}
              {req.begruendung && (
                <div style={infoBox}>
                  <strong>Begründung:</strong><br />
                  {req.begruendung}
                </div>
              )}

              {/* Aktionen */}
              {req.status === 'offen' && (
                <div style={actionRow}>
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
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }) {
  let color = '#667085';
  let bg = '#f2f4f7';

  if (status === 'offen') {
    color = '#b54708';
    bg = '#fffaeb';
  }

  if (status === 'freigegeben') {
    color = '#067647';
    bg = '#ecfdf3';
  }

  if (status === 'abgelehnt') {
    color = '#b42318';
    bg = '#fef3f2';
  }

  return (
    <div
      style={{
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: '600',
        background: bg,
        color: color
      }}
    >
      {status}
    </div>
  );
}

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const actionRow = {
  marginTop: 20,
  display: 'flex',
  gap: 10
};

const infoBox = {
  marginTop: 16,
  padding: '12px',
  borderRadius: '12px',
  background: '#f9fafb',
  border: '1px solid #e4e7ec',
  fontSize: '14px'
};

const newValueBox = {
  padding: '10px',
  borderRadius: '10px',
  background: '#fff7ed',
  border: '1px solid #f5c27a',
  fontSize: '14px'
};
