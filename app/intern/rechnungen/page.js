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

function statusLabel(invoice) {
  if (invoice.cancelled) return 'Storniert';

  const status = String(invoice.status || '').toLowerCase();

  if (status === 'paid') return 'Bezahlt';
  if (status === 'part_paid') return 'Teilbezahlt';
  if (status === 'overdue') return 'Überfällig';
  if (status === 'final') return 'Final';
  if (status === 'issued') return 'Versendet';
  if (status === 'approved') return 'Freigegeben';
  if (status === 'draft') return 'Entwurf';

  return invoice.status || '-';
}

function statusStyle(invoice) {
  if (invoice.cancelled) {
    return {
      background: '#fef3f2',
      border: '1px solid #fecdca',
      color: '#b42318'
    };
  }

  const status = String(invoice.status || '').toLowerCase();

  if (status === 'paid') {
    return {
      background: '#ecfdf3',
      border: '1px solid #abefc6',
      color: '#067647'
    };
  }

  if (status === 'part_paid') {
    return {
      background: '#eff8ff',
      border: '1px solid #b2ddff',
      color: '#175cd3'
    };
  }

  if (status === 'overdue') {
    return {
      background: '#fff6ed',
      border: '1px solid #fddcab',
      color: '#c4320a'
    };
  }

  if (status === 'final' || status === 'issued' || status === 'approved') {
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

function typeLabel(type) {
  switch (String(type || '').toLowerCase()) {
    case 'standard':
      return 'Rechnung';
    case 'advance':
      return 'Abschlag';
    case 'final':
      return 'Schlussrechnung';
    case 'rectificativa':
      return 'Korrekturrechnung';
    case 'reminder':
      return 'Mahnung';
    default:
      return type || '-';
  }
}

export default function RechnungenPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      const data = await res.json();

      if (res.ok) {
        setInvoices(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openInvoice(id) {
    window.location.href = `/intern/rechnungen/${id}`;
  }

  function openNewInvoice() {
    window.location.href = '/intern/rechnungen/new';
  }

  // 🔥 NEU: Übersicht berechnen
  const stats = useMemo(() => {
    let offen = 0;
    let bezahlt = 0;

    invoices.forEach((inv) => {
      const status = String(inv.status || '').toLowerCase();
      if (status === 'paid') bezahlt += Number(inv.total || 0);
      else offen += Number(inv.total || 0);
    });

    return { offen, bezahlt };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesQuery =
        !q ||
        [
          invoice.invoice_number,
          invoice.kundenname,
          invoice.kundennummer,
          invoice.status,
          invoice.invoice_type
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'cancelled'
          ? Boolean(invoice.cancelled)
          : String(invoice.status || '').toLowerCase() === statusFilter);

      const matchesType =
        !typeFilter ||
        String(invoice.invoice_type || '').toLowerCase() === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [invoices, query, statusFilter, typeFilter]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>

          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>Rechnungen</h1>
              <p style={heroText}>
                Übersicht über alle Rechnungen inkl. Status und Beträge.
              </p>
            </div>

            <button onClick={openNewInvoice} style={saveButton}>
              + Neue Rechnung
            </button>
          </div>

          {/* 🔥 NEU: Übersicht */}
          <div style={statsRow}>
            <div style={statCard}>
              <div>Offen</div>
              <strong>{euro(stats.offen)}</strong>
            </div>

            <div style={statCard}>
              <div>Bezahlt</div>
              <strong>{euro(stats.bezahlt)}</strong>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={toolbar}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suche..."
              style={input}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={select}
            >
              <option value="">Alle Status</option>
              <option value="draft">Entwurf</option>
              <option value="approved">Freigegeben</option>
              <option value="issued">Versendet</option>
              <option value="final">Final</option>
              <option value="part_paid">Teilbezahlt</option>
              <option value="paid">Bezahlt</option>
              <option value="overdue">Überfällig</option>
              <option value="cancelled">Storniert</option>
            </select>

            <button onClick={loadInvoices} style={secondaryButton}>
              Aktualisieren
            </button>
          </div>
        </section>

        <section style={card}>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div style={grid}>
              {filteredInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => openInvoice(invoice.id)}
                  style={invoiceCard}
                >
                  <strong>{invoice.invoice_number}</strong>
                  <div>{invoice.kundenname}</div>
                  <div>{euro(invoice.total)}</div>

                  <div style={{ ...statusPill, ...statusStyle(invoice) }}>
                    {statusLabel(invoice)}
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

const wrap = { padding: 30 };
const container = { maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 20 };

const statsRow = {
  display: 'flex',
  gap: 20,
  marginTop: 20
};

const statCard = {
  padding: 15,
  background: '#fafafa',
  borderRadius: 10
};

const heroCard = { padding: 20, background: '#fff', borderRadius: 12 };
const badge = { marginBottom: 10 };
const heroHeader = { display: 'flex', justifyContent: 'space-between' };
const mainTitle = { margin: 0 };
const heroText = { color: '#666' };

const card = { padding: 20, background: '#fff', borderRadius: 12 };
const toolbar = { display: 'flex', gap: 10 };

const input = { padding: 10 };
const select = { padding: 10 };

const grid = { display: 'grid', gap: 10 };

const invoiceCard = {
  padding: 15,
  border: '1px solid #ddd',
  borderRadius: 10
};

const statusPill = { padding: 5, borderRadius: 5 };

const saveButton = {
  background: '#8c6b43',
  color: '#fff',
  padding: 10,
  border: 'none',
  borderRadius: 8
};

const secondaryButton = {
  padding: 10,
  border: '1px solid #ccc',
  borderRadius: 8
};