'use client';

import { useEffect, useState } from 'react';

function intervalLabel(value) {
  switch (String(value || '').toLowerCase()) {
    case 'monthly':
      return 'Monatlich';
    case 'quarterly':
      return 'Quartalsweise';
    case 'yearly':
      return 'Jährlich';
    default:
      return value || '-';
  }
}

function periodLabel(value) {
  switch (String(value || '').toLowerCase()) {
    case 'current_month':
      return 'Aktueller Monat';
    case 'previous_month':
      return 'Vergangener Monat';
    case 'next_month':
      return 'Nächster Monat';
    case 'current_quarter':
      return 'Aktuelles Quartal';
    case 'previous_quarter':
      return 'Vergangenes Quartal';
    default:
      return value || '-';
  }
}

export default function WiederkehrendeRechnungenPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      const res = await fetch('/api/recurring-invoices');
      const data = await res.json();

      if (res.ok) {
        setItems(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item) {
    await fetch(`/api/recurring-invoices/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !item.active })
    });

    loadItems();
  }

  async function deleteItem(item) {
    const confirmed = window.confirm('Wiederkehrende Rechnung wirklich löschen?');
    if (!confirmed) return;

    await fetch(`/api/recurring-invoices/${item.id}`, {
      method: 'DELETE'
    });

    loadItems();
  }

  async function runNow() {
    try {
      setRunning(true);
      const res = await fetch('/api/recurring-invoices/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_run_all: true })
      });

      const data = await res.json();
      alert(`Erstellt: ${data.created_count || 0} | Fehler: ${data.error_count || 0}`);
    } catch (error) {
      alert('Lauf konnte nicht gestartet werden.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>Wiederkehrende Rechnungen</h1>
              <p style={heroText}>
                Verwalte Vorlagen, Intervalle und Leistungszeiträume für automatische Rechnungen.
              </p>
            </div>

            <button type="button" onClick={runNow} style={saveButton} disabled={running}>
              {running ? 'Läuft...' : 'Jetzt ausführen'}
            </button>
          </div>
        </section>

        <section style={card}>
          {loading ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Wiederkehrende Rechnungen werden geladen ...</div>
            </div>
          ) : items.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Noch keine wiederkehrenden Rechnungen vorhanden</div>
              <div style={emptyText}>
                Lege sie direkt beim Erstellen einer Rechnung an.
              </div>
            </div>
          ) : (
            <div style={grid}>
              {items.map((item) => (
                <div key={item.id} style={itemCard}>
                  <div style={topRow}>
                    <div>
                      <div style={title}>Vorlage {item.template_invoice_id}</div>
                      <div style={meta}>Mandant: {item.customer_id}</div>
                    </div>

                    <div style={item.active ? activePill : inactivePill}>
                      {item.active ? 'Aktiv' : 'Inaktiv'}
                    </div>
                  </div>

                  <div style={facts}>
                    <div style={fact}><span>Intervall</span><strong>{intervalLabel(item.interval)}</strong></div>
                    <div style={fact}><span>Ausführungstag</span><strong>{item.execution_day}</strong></div>
                    <div style={fact}><span>Zeitraum</span><strong>{periodLabel(item.period_logic)}</strong></div>
                  </div>

                  <div style={actionRow}>
                    <button type="button" onClick={() => toggleActive(item)} style={secondaryButton}>
                      {item.active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>

                    <button type="button" onClick={() => deleteItem(item)} style={dangerButton}>
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  maxWidth: 1280,
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

const heroHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap'
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

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16
};

const itemCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 18,
  padding: 18
};

const topRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 14
};

const title = {
  fontSize: 16,
  fontWeight: 800,
  color: '#101828'
};

const meta = {
  marginTop: 4,
  fontSize: 12,
  color: '#667085'
};

const facts = {
  display: 'grid',
  gap: 10
};

const fact = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  borderTop: '1px solid #f2f4f7',
  paddingTop: 10,
  fontSize: 14,
  color: '#344054'
};

const activePill = {
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};

const inactivePill = {
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: '#f2f4f7',
  border: '1px solid #d0d5dd',
  color: '#344054'
};

const actionRow = {
  marginTop: 16,
  display: 'flex',
  gap: 10,
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

const secondaryButton = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#101828',
  fontWeight: 700,
  cursor: 'pointer'
};

const dangerButton = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #fecdca',
  background: '#fff',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer'
};

const emptyState = {
  padding: 30,
  borderRadius: 18,
  background: '#faf8f3',
  border: '1px dashed #d6d0c4',
  display: 'grid',
  gap: 10
};

const emptyTitle = {
  fontSize: 20,
  fontWeight: 800,
  color: '#101828'
};

const emptyText = {
  fontSize: 15,
  color: '#475467'
};
