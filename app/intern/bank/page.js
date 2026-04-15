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

function matchLabel(value) {
  switch (String(value || '').toLowerCase()) {
    case 'matched_by_invoice_number':
      return 'Per Rechnungsnummer';
    case 'matched_by_amount_and_customer':
      return 'Per Betrag + Kunde';
    case 'matched_by_amount':
      return 'Per Betrag';
    default:
      return 'Nicht zugeordnet';
  }
}

function matchStyle(value) {
  const v = String(value || '').toLowerCase();

  if (v === 'matched_by_invoice_number' || v === 'matched_by_amount_and_customer' || v === 'matched_by_amount') {
    return {
      background: '#ecfdf3',
      border: '1px solid #abefc6',
      color: '#067647'
    };
  }

  return {
    background: '#fef3f2',
    border: '1px solid #fecdca',
    color: '#b42318'
  };
}

export default function BankPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      const res = await fetch('/api/bank/sync');
      const data = await res.json();

      if (res.ok) {
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function syncNow() {
    try {
      setSyncing(true);
      const res = await fetch('/api/bank/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_type: 'manual' })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Bank-Sync fehlgeschlagen.');
        return;
      }

      alert(`Importiert: ${data.imported_count || 0}`);
      await loadTransactions();
    } catch (error) {
      alert('Bank-Sync fehlgeschlagen.');
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;

    return transactions.filter((row) =>
      [
        row.counterparty_name,
        row.remittance_information,
        row.bank_reference,
        row.match_status
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [transactions, query]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>Bankabgleich</h1>
              <p style={heroText}>
                Kontobewegungen abrufen, automatisch Rechnungen zuordnen und Zahlungsstatus aktualisieren.
              </p>
            </div>

            <button type="button" onClick={syncNow} style={saveButton} disabled={syncing}>
              {syncing ? 'Synchronisiert...' : 'Bank jetzt synchronisieren'}
            </button>
          </div>
        </section>

        <section style={card}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Gegenpartei, Verwendungszweck oder Match-Status"
            style={input}
          />
        </section>

        <section style={card}>
          {loading ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Banktransaktionen werden geladen ...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Noch keine Banktransaktionen vorhanden</div>
              <div style={emptyText}>
                Starte zuerst einen manuellen Sync.
              </div>
            </div>
          ) : (
            <div style={grid}>
              {filtered.map((item) => (
                <div key={item.id} style={itemCard}>
                  <div style={topRow}>
                    <div>
                      <div style={title}>{item.counterparty_name || 'Unbekannt'}</div>
                      <div style={meta}>{formatDate(item.booking_date)} · {euro(item.amount)}</div>
                    </div>

                    <div style={{ ...pill, ...matchStyle(item.match_status) }}>
                      {matchLabel(item.match_status)}
                    </div>
                  </div>

                  <div style={facts}>
                    <div style={fact}><span>Verwendungszweck</span><strong>{item.remittance_information || '-'}</strong></div>
                    <div style={fact}><span>Referenz</span><strong>{item.bank_reference || '-'}</strong></div>
                    <div style={fact}><span>Rechnung</span><strong>{item.matched_invoice_id || '-'}</strong></div>
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

const pill = {
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700
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
