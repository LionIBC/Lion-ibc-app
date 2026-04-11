'use client';

import { useEffect, useState } from 'react';

export default function InternalStammdatenPage() {
  const [requests, setRequests] = useState([]);

  async function loadData() {
    const res = await fetch('/api/stammdaten');
    const data = await res.json();
    setRequests(data.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(id, status) {
    await fetch('/api/stammdaten', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });

    loadData();
  }

  return (
    <main className="page-shell">
      <div className="page-inner">
        <section className="hero-card">
          <h1 className="page-title">Stammdaten Freigaben</h1>
        </section>

        <div className="stack-18">
          {requests.map((req) => (
            <div key={req.id} className="section-card">

              <strong>Kunde: {req.kundennummer}</strong>

              <div className="stack-10" style={{ marginTop: 10 }}>
                {Object.entries(req.changes).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}</strong>: {value}
                  </div>
                ))}
              </div>

              {req.status === 'offen' && (
                <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
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

              <div style={{ marginTop: 10 }}>
                Status: {req.status}
              </div>
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
