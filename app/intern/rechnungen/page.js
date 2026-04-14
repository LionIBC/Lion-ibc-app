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
                Verwalte Rechnungen, Abschlagsrechnungen, Schlussrechnungen und Korrekturrechnungen zentral an einem Ort.
              </p>
            </div>

            <button type="button" onClick={openNewInvoice} style={saveButton}>
              + Neue Rechnung
            </button>
          </div>
        </section>

        <section style={card}>
          <div style={toolbar}>
            <div style={searchWrap}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Nummer, Kunde, Typ oder Status"
                style={input}
              />
            </div>

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

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={select}
            >
              <option value="">Alle Typen</option>
              <option value="standard">Rechnung</option>
              <option value="advance">Abschlag</option>
              <option value="final">Schlussrechnung</option>
              <option value="rectificativa">Korrekturrechnung</option>
              <option value="reminder">Mahnung</option>
            </select>

            <button type="button" onClick={loadInvoices} style={secondaryButton}>
              Aktualisieren
            </button>
          </div>
        </section>

        <section style={card}>
          {loading ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Rechnungen werden geladen ...</div>
              <div style={emptyText}>Bitte einen Moment warten.</div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Noch keine Rechnungen vorhanden</div>
              <div style={emptyText}>
                Lege die erste Rechnung an oder passe deine Filter an.
              </div>

              <button type="button" onClick={openNewInvoice} style={saveButton}>
                Erste Rechnung anlegen
              </button>
            </div>
          ) : (
            <div style={grid}>
              {filteredInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => openInvoice(invoice.id)}
                  style={invoiceCard}
                >
                  <div style={invoiceCardTop}>
                    <div>
                      <div style={invoiceNumber}>{invoice.invoice_number || '-'}</div>
                      <div style={customerName}>{invoice.kundenname || '-'}</div>
                      <div style={customerMeta}>Kundennummer: {invoice.kundennummer || '-'}</div>
                    </div>

                    <div style={{ ...statusPill, ...statusStyle(invoice) }}>
                      {statusLabel(invoice)}
                    </div>
                  </div>

                  <div style={invoiceBody}>
                    <div style={factRow}>
                      <span style={factLabel}>Typ</span>
                      <span style={factValue}>{typeLabel(invoice.invoice_type)}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>Rechnungsdatum</span>
                      <span style={factValue}>{formatDate(invoice.issue_date)}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>Fällig</span>
                      <span style={factValue}>{formatDate(invoice.due_date)}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>Finalisiert</span>
                      <span style={factValue}>{invoice.is_final ? 'Ja' : 'Nein'}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>PDF</span>
                      <span style={factValue}>{invoice.pdf_path ? 'Vorhanden' : 'Noch nicht erstellt'}</span>
                    </div>

                    <div style={factRow}>
                      <span style={factLabel}>Gesamt</span>
                      <span style={factValueStrong}>{euro(invoice.total)}</span>
                    </div>
                  </div>

                  <div style={openRow}>
                    <span style={openText}>Rechnung öffnen</span>
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

const select = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fff',
  fontSize: 14
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16
};

const invoiceCard = {
  width: '100%',
  textAlign: 'left',
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 18,
  padding: 18,
  cursor: 'pointer'
};

const invoiceCardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 14
};

const invoiceNumber = {
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

const invoiceBody = {
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
