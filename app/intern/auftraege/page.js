'use client';

import { useEffect, useMemo, useState } from 'react';

function euro(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('de-DE');
  } catch {
    return value;
  }
}

function statusLabel(status) {
  switch (String(status || '').toLowerCase()) {
    case 'offen':
      return 'Offen';
    case 'bestaetigt':
      return 'Bestätigt';
    case 'in bearbeitung':
      return 'In Bearbeitung';
    case 'abgeschlossen':
      return 'Abgeschlossen';
    default:
      return status || '-';
  }
}

function statusStyle(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'abgeschlossen') {
    return {
      background: '#ecfdf3',
      border: '1px solid #abefc6',
      color: '#067647'
    };
  }

  if (value === 'bestaetigt') {
    return {
      background: '#eff8ff',
      border: '1px solid #b2ddff',
      color: '#175cd3'
    };
  }

  if (value === 'in bearbeitung') {
    return {
      background: '#fffaeb',
      border: '1px solid #fedf89',
      color: '#b54708'
    };
  }

  return {
    background: '#f2f4f7',
    border: '1px solid #d0d5dd',
    color: '#344054'
  };
}

export default function AuftraegePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (res.ok) {
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((order) => {
      return [
        order.order_number,
        order.kundenname,
        order.kundennummer,
        order.title,
        order.status
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [orders, query]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>Aufträge</h1>
              <p style={heroText}>
                Verwalte Auftragsbestätigungen als Grundlage für Abschlagsrechnungen und Schlussrechnungen.
              </p>
            </div>

            <button
              type="button"
              onClick={() => (window.location.href = '/intern/auftraege/new')}
              style={saveButton}
            >
              + Neuer Auftrag
            </button>
          </div>
        </section>

        <section style={card}>
          <div style={toolbar}>
            <div style={searchWrap}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Nummer, Kunde oder Status"
                style={input}
              />
            </div>

            <button type="button" onClick={loadOrders} style={secondaryButton}>
              Aktualisieren
            </button>
          </div>
        </section>

        <section style={card}>
          {loading ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Aufträge werden geladen ...</div>
              <div style={emptyText}>Bitte einen Moment warten.</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Noch keine Aufträge vorhanden</div>
              <div style={emptyText}>
                Lege den ersten Auftrag an. Danach erscheint er hier automatisch in der Übersicht.
              </div>

              <button
                type="button"
                onClick={() => (window.location.href = '/intern/auftraege/new')}
                style={saveButton}
              >
                Ersten Auftrag anlegen
              </button>
            </div>
          ) : (
            <div style={grid}>
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => (window.location.href = `/intern/auftraege/${order.id}`)}
                  style={orderCard}
                >
                  <div style={orderCardTop}>
                    <div>
                      <div style={orderNumber}>{order.order_number || '-'}</div>
                      <div style={customerName}>{order.kundenname || '-'}</div>
                      <div style={customerMeta}>Kundennummer: {order.kundennummer || '-'}</div>
                    </div>

                    <div style={{ ...statusPill, ...statusStyle(order.status) }}>
                      {statusLabel(order.status)}
                    </div>
                  </div>

                  <div style={orderBody}>
                    <div style={factRow}>
                      <span style={factLabel}>Titel</span>
                      <span style={factValue}>{order.title || '-'}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>Auftragsdatum</span>
                      <span style={factValue}>{formatDate(order.issue_date)}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>Gültig bis</span>
                      <span style={factValue}>{formatDate(order.valid_until)}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>Gesamt</span>
                      <span style={factValueStrong}>{euro(order.total)}</span>
                    </div>
                  </div>

                  <div style={openRow}>
                    <span style={openText}>Auftrag öffnen</span>
                    <span style={arrow}>→</span>
                  </div>
                </button>
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
  lineHeight: 1.6,
  maxWidth: 760
};

const card = {
  background: '#fff',
  padding: 24,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const toolbar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap'
};

const searchWrap = {
  flex: 1,
  minWidth: 280
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

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16
};

const orderCard = {
  width: '100%',
  textAlign: 'left',
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 18,
  padding: 18,
  cursor: 'pointer'
};

const orderCardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 14
};

const orderNumber = {
  fontSize: 18,
  fontWeight: 800,
  color: '#101828'
};

const customerName = {
  marginTop: 6,
  fontSize: 15,
  fontWeight: 700,
  color: '#344054'
};

const customerMeta = {
  marginTop: 4,
  fontSize: 12,
  color: '#667085'
};

const statusPill = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap'
};

const orderBody = {
  display: 'grid',
  gap: 10
};

const factRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  borderTop: '1px solid #f2f4f7',
  paddingTop: 10
};

const factLabel = {
  fontSize: 13,
  color: '#667085'
};

const factValue = {
  fontSize: 14,
  color: '#101828',
  textAlign: 'right'
};

const factValueStrong = {
  fontSize: 16,
  color: '#101828',
  textAlign: 'right',
  fontWeight: 800
};

const openRow = {
  marginTop: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTop: '1px solid #f2f4f7',
  paddingTop: 14
};

const openText = {
  color: '#8c6b43',
  fontWeight: 700
};

const arrow = {
  color: '#8c6b43',
  fontWeight: 700,
  fontSize: 18
};

const emptyState = {
  padding: 30,
  borderRadius: 18,
  background: '#faf8f3',
  border: '1px dashed #d6d0c4',
  display: 'grid',
  gap: 10,
  justifyItems: 'start'
};

const emptyTitle = {
  fontSize: 20,
  fontWeight: 800,
  color: '#101828'
};

const emptyText = {
  fontSize: 15,
  color: '#475467',
  maxWidth: 700,
  lineHeight: 1.6
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

