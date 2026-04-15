'use client';

import { useState } from 'react';

export default function DatevExportPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');

  function startExport() {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (status) params.set('status', status);

    const url = `/api/datev-export${params.toString() ? `?${params.toString()}` : ''}`;
    window.open(url, '_blank');
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>DATEV Export</h1>
          <p style={heroText}>
            Exportiere Rechnungen als CSV-Datei für die Weiterverarbeitung in der Buchhaltung.
          </p>
        </section>

        <section style={card}>
          <div style={grid3}>
            <div style={field}>
              <label style={label}>Von</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={input} />
            </div>

            <div style={field}>
              <label style={label}>Bis</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={input} />
            </div>

            <div style={field}>
              <label style={label}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
                <option value="">Alle</option>
                <option value="draft">Entwurf</option>
                <option value="approved">Freigegeben</option>
                <option value="issued">Versendet</option>
                <option value="final">Final</option>
                <option value="part_paid">Teilbezahlt</option>
                <option value="paid">Bezahlt</option>
                <option value="overdue">Überfällig</option>
              </select>
            </div>
          </div>

          <div style={actionRow}>
            <button type="button" onClick={startExport} style={saveButton}>
              DATEV Export herunterladen
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Enthaltene Spalten</h2>
          <div style={listBox}>
            <div>Belegdatum</div>
            <div>Belegnummer</div>
            <div>Debitorenkonto</div>
            <div>Kundenname</div>
            <div>Belegart</div>
            <div>Leistungszeitraum von / bis</div>
            <div>Netto / Steuer / Brutto</div>
            <div>Währung</div>
            <div>Status</div>
            <div>Buchungstext</div>
          </div>
        </section>
      </div>
    </main>
  );
}

const wrap = {
  padding: 30,
  background: '#f7f5ef',
  minHeight: '100vh'
};

const container = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'grid',
  gap: 20
};

const heroCard = {
  background: '#fff',
  padding: 28,
  borderRadius: 20,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #ddd6c8',
  color: '#6b5b45',
  background: '#faf8f3',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 12
};

const mainTitle = {
  margin: 0,
  fontSize: 30,
  color: '#101828'
};

const heroText = {
  margin: '12px 0 0 0',
  fontSize: 16,
  color: '#475467',
  lineHeight: 1.6
};

const card = {
  background: '#fff',
  padding: 24,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 16
};

const field = {
  display: 'grid',
  gap: 8
};

const label = {
  fontSize: 14,
  fontWeight: 700,
  color: '#344054'
};

const input = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  boxSizing: 'border-box',
  background: '#fff',
  fontSize: 14
};

const actionRow = {
  display: 'flex',
  gap: 10,
  marginTop: 20,
  flexWrap: 'wrap'
};

const saveButton = {
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#8c6b43',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer'
};

const sectionTitle = {
  margin: '0 0 16px 0',
  fontSize: 22,
  color: '#101828'
};

const listBox = {
  display: 'grid',
  gap: 10,
  padding: 16,
  borderRadius: 14,
  background: '#faf8f3',
  border: '1px solid #ece7dc'
};
