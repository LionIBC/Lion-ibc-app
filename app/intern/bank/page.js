''use client';

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

function statusStyle(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'connected' || s === 'active' || s === 'manual') {
    return { background: '#ecfdf3', border: '1px solid #abefc6', color: '#067647' };
  }
  if (s === 'pending') {
    return { background: '#fffaeb', border: '1px solid #fedf89', color: '#b54708' };
  }
  return { background: '#f2f4f7', border: '1px solid #d0d5dd', color: '#344054' };
}

function matchStyle(value) {
  const s = String(value || '').toLowerCase();
  if (s.includes('matched')) {
    return { background: '#ecfdf3', border: '1px solid #abefc6', color: '#067647' };
  }
  if (s.includes('partial')) {
    return { background: '#eff8ff', border: '1px solid #b2ddff', color: '#175cd3' };
  }
  if (s.includes('suggest')) {
    return { background: '#fffaeb', border: '1px solid #fedf89', color: '#b54708' };
  }
  return { background: '#fef3f2', border: '1px solid #fecdca', color: '#b42318' };
}

function bookingDirectionStyle(amount) {
  const n = Number(amount || 0);
  if (n >= 0) {
    return { color: '#067647', fontWeight: 800 };
  }
  return { color: '#b42318', fontWeight: 800 };
}

function getAssignmentState(item) {
  if (!item) return 'offen';

  const status = String(item.match_status || '').toLowerCase();
  if (status.includes('manual_matched') || status.includes('matched')) return 'zugeordnet';
  if (status.includes('partial')) return 'teilweise zugeordnet';
  if (status.includes('suggest')) return 'vorgeschlagen';
  return 'nicht zugeordnet';
}

function detectMatchCandidate(item) {
  if (!item) return false;

  const text = [
    item.counterparty_name,
    item.remittance_information,
    item.bank_reference,
    item.matched_invoice_id,
    item.suggested_invoice_number
  ]
    .join(' ')
    .toLowerCase();

  if (String(item.match_status || '').toLowerCase().includes('matched')) {
    return true;
  }

  if (text.includes('rechnung')) return true;
  if (text.includes('invoice')) return true;
  if (text.includes('factura')) return true;
  if (/\b\d{4,}\b/.test(text)) return true;

  return false;
}

function parseCsvPreviewName(file) {
  if (!file) return '';
  return `${file.name} (${Math.round((file.size || 0) / 1024) || 0} KB)`;
}

export default function BankPage() {
  const [connections, setConnections] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [query, setQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');

  const [bankName, setBankName] = useState('CaixaBank');
  const [providerName, setProviderName] = useState('truelayer');
  const [displayName, setDisplayName] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [csvFile, setCsvFile] = useState(null);

  const [assignInvoiceId, setAssignInvoiceId] = useState({});

  useEffect(() => {
    loadConnections();
    loadTransactions();
    loadInvoices();
  }, []);

  async function loadConnections() {
    try {
      setLoadingConnections(true);
      const res = await fetch('/api/bank/connections');
      const data = await res.json();
      if (res.ok) setConnections(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConnections(false);
    }
  }

  async function loadTransactions() {
    try {
      setLoadingTransactions(true);
      const res = await fetch('/api/bank/sync');
      const data = await res.json();
      if (res.ok) setTransactions(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTransactions(false);
    }
  }

  async function loadInvoices() {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (res.ok) setInvoiceOptions(data.data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function connectBankReal() {
    try {
      setConnecting(true);

      const createRes = await fetch('/api/bank/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: bankName,
          provider_name: providerName,
          display_name: displayName,
          iban,
          account_holder: accountHolder,
          currency
        })
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        alert(createData.message || 'Bankverbindung konnte nicht angelegt werden.');
        return;
      }

      const res = await fetch('/api/bank/connect');
      const data = await res.json();

      if (!res.ok || !data.url) {
        alert(data.message || 'TrueLayer Connect-Link konnte nicht erzeugt werden.');
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      alert('TrueLayer Verbindung konnte nicht gestartet werden.');
    } finally {
      setConnecting(false);
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
      await loadInvoices();
    } catch (error) {
      alert('Bank-Sync fehlgeschlagen.');
    } finally {
      setSyncing(false);
    }
  }

  async function importCsv() {
    if (!csvFile) {
      alert('Bitte zuerst eine CSV-Datei auswählen.');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', csvFile);

      const res = await fetch('/api/bank/import-csv', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'CSV konnte nicht importiert werden.');
        return;
      }

      alert(`CSV importiert: ${data.imported_count || 0}`);
      setCsvFile(null);
      await loadTransactions();
    } catch (error) {
      alert('CSV konnte nicht importiert werden.');
    } finally {
      setImporting(false);
    }
  }

  async function assignInvoice(transactionId) {
    const invoiceId = assignInvoiceId[transactionId];
    if (!invoiceId) {
      alert('Bitte zuerst eine Rechnung auswählen.');
      return;
    }

    try {
      setAssigningId(transactionId);
      const res = await fetch('/api/bank/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId, invoice_id: invoiceId })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Rechnung konnte nicht zugewiesen werden.');
        return;
      }

      await loadTransactions();
      await loadInvoices();
      alert('Rechnung erfolgreich zugewiesen.');
    } catch (error) {
      alert('Rechnung konnte nicht zugewiesen werden.');
    } finally {
      setAssigningId(null);
    }
  }

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let matched = 0;
    let unmatched = 0;
    let suggested = 0;

    for (const item of transactions) {
      const amount = Number(item.amount || 0);
      if (amount >= 0) income += amount;
      else expense += amount;

      const state = getAssignmentState(item);
      if (state === 'zugeordnet') matched += 1;
      else if (state === 'vorgeschlagen') suggested += 1;
      else unmatched += 1;
    }

    return {
      income,
      expense,
      matched,
      unmatched,
      suggested,
      total: transactions.length
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();

    return transactions.filter((row) => {
      const textMatch =
        !q ||
        [
          row.counterparty_name,
          row.remittance_information,
          row.bank_reference,
          row.match_status,
          row.matched_invoice_id,
          row.iban,
          row.account_iban,
          row.suggested_invoice_number,
          row.suggested_customer_name
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);

      const assignmentState = getAssignmentState(row);

      const assignmentMatch =
        !assignmentFilter ||
        (assignmentFilter === 'zugeordnet' && assignmentState === 'zugeordnet') ||
        (assignmentFilter === 'teilweise' && assignmentState === 'teilweise zugeordnet') ||
        (assignmentFilter === 'vorgeschlagen' && assignmentState === 'vorgeschlagen') ||
        (assignmentFilter === 'offen' &&
          (assignmentState === 'nicht zugeordnet' || assignmentState === 'offen'));

      const amount = Number(row.amount || 0);
      const directionMatch =
        !directionFilter ||
        (directionFilter === 'eingang' && amount >= 0) ||
        (directionFilter === 'ausgang' && amount < 0);

      return textMatch && assignmentMatch && directionMatch;
    });
  }, [transactions, query, assignmentFilter, directionFilter]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>Bank UI 2.0</h1>
              <p style={heroText}>
                Banken verbinden, CSV importieren, Transaktionen prüfen und den Abgleich mit Rechnungen steuern.
              </p>
            </div>

            <div style={actionRow}>
              <button type="button" onClick={syncNow} style={saveButton} disabled={syncing}>
                {syncing ? 'Synchronisiert...' : 'Jetzt synchronisieren'}
              </button>
            </div>
          </div>

          <div style={statsGrid}>
            <div style={statCard}>
              <div style={statLabel}>Transaktionen</div>
              <div style={statValue}>{stats.total}</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Einnahmen</div>
              <div style={{ ...statValue, color: '#067647' }}>{euro(stats.income)}</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Ausgaben</div>
              <div style={{ ...statValue, color: '#b42318' }}>{euro(Math.abs(stats.expense))}</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Zugeordnet</div>
              <div style={statValue}>{stats.matched}</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Vorgeschlagen</div>
              <div style={statValue}>{stats.suggested}</div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Nicht zugeordnet</div>
              <div style={statValue}>{stats.unmatched}</div>
            </div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Neue Bank verbinden</h2>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Bank</label>
              <select value={bankName} onChange={(e) => setBankName(e.target.value)} style={input}>
                <option value="CaixaBank">CaixaBank</option>
                <option value="Bankinter">Bankinter</option>
                <option value="Santander">Santander</option>
                <option value="Sonstige">Sonstige</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Provider</label>
              <select value={providerName} onChange={(e) => setProviderName(e.target.value)} style={input}>
                <option value="truelayer">TrueLayer</option>
                <option value="yapily">Yapily</option>
                <option value="manual">Manuell</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Anzeigename</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={input} placeholder="z. B. Hauptkonto" />
            </div>
          </div>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>IBAN</label>
              <input value={iban} onChange={(e) => setIban(e.target.value)} style={input} placeholder="ES..." />
            </div>

            <div style={field}>
              <label style={label}>Kontoinhaber</label>
              <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} style={input} />
            </div>

            <div style={field}>
              <label style={label}>Währung</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={input} />
            </div>
          </div>

          <div style={actionRow}>
            <button type="button" onClick={connectBankReal} style={saveButton} disabled={connecting}>
              {connecting ? 'Verbindet...' : 'TrueLayer Verbindung starten'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>CSV Import</h2>
          <p style={helperText}>
            Fallback für Banken ohne direkte Anbindung. CSV hochladen und Umsätze direkt einspielen.
          </p>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>CSV Datei</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Ausgewählte Datei</label>
              <div style={fileInfoBox}>{csvFile ? parseCsvPreviewName(csvFile) : 'Noch keine Datei ausgewählt.'}</div>
            </div>
          </div>

          <div style={actionRow}>
            <button type="button" onClick={importCsv} style={secondaryButton} disabled={importing}>
              {importing ? 'Importiert...' : 'CSV importieren'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Verbundene Banken</h2>

          {loadingConnections ? (
            <div style={emptyBox}>Bankverbindungen werden geladen ...</div>
          ) : connections.length === 0 ? (
            <div style={emptyBox}>Noch keine Bankverbindung vorhanden.</div>
          ) : (
            <div style={connectionGrid}>
              {connections.map((item) => (
                <div key={item.id} style={connectionCard}>
                  <div style={connectionTop}>
                    <div>
                      <div style={connectionTitle}>{item.bank_name || '-'}</div>
                      <div style={connectionMeta}>{item.display_name || '-'}</div>
                    </div>

                    <div style={{ ...pill, ...statusStyle(item.status) }}>
                      {item.status || '-'}
                    </div>
                  </div>

                  <div style={connectionMeta}>IBAN: {item.iban || '-'}</div>
                  <div style={connectionMeta}>Provider: {item.provider_name || '-'}</div>
                  <div style={connectionMeta}>Aktiv: {item.is_active ? 'Ja' : 'Nein'}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <div style={toolbar}>
            <h2 style={sectionTitleNoMargin}>Transaktionen</h2>

            <div style={filterWrap}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Gegenpartei, Verwendungszweck, Match oder Rechnung"
                style={searchInput}
              />

              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                style={filterSelect}
              >
                <option value="">Alle Zuordnungen</option>
                <option value="zugeordnet">Zugeordnet</option>
                <option value="teilweise">Teilweise zugeordnet</option>
                <option value="vorgeschlagen">Vorgeschlagen</option>
                <option value="offen">Nicht zugeordnet</option>
              </select>

              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                style={filterSelect}
              >
                <option value="">Alle Bewegungen</option>
                <option value="eingang">Eingänge</option>
                <option value="ausgang">Ausgänge</option>
              </select>
            </div>
          </div>

          {loadingTransactions ? (
            <div style={emptyBox}>Banktransaktionen werden geladen ...</div>
          ) : filteredTransactions.length === 0 ? (
            <div style={emptyBox}>Noch keine Banktransaktionen vorhanden.</div>
          ) : (
            <div style={transactionGrid}>
              {filteredTransactions.map((item) => {
                const assignmentState = getAssignmentState(item);
                const amount = Number(item.amount || 0);
                const hasCandidate = detectMatchCandidate(item);
                const suggestedInvoiceId = item.suggested_invoice_id || '';
                const selectValue = assignInvoiceId[item.id] || suggestedInvoiceId || '';

                return (
                  <div key={item.id} style={transactionCard}>
                    <div style={transactionTop}>
                      <div>
                        <div style={transactionTitle}>{item.counterparty_name || 'Unbekannt'}</div>
                        <div style={transactionMeta}>
                          {formatDate(item.booking_date)} · <span style={bookingDirectionStyle(amount)}>{euro(amount)}</span>
                        </div>
                      </div>

                      <div style={{ ...pill, ...matchStyle(item.match_status) }}>
                        {item.match_status || 'unmatched'}
                      </div>
                    </div>

                    <div style={metaGrid}>
                      <div style={metaRow}>
                        <span style={metaLabel}>Zuordnung</span>
                        <span style={metaValue}>{assignmentState}</span>
                      </div>

                      <div style={metaRow}>
                        <span style={metaLabel}>Verwendungszweck</span>
                        <span style={metaValue}>{item.remittance_information || '-'}</span>
                      </div>

                      <div style={metaRow}>
                        <span style={metaLabel}>Referenz</span>
                        <span style={metaValue}>{item.bank_reference || '-'}</span>
                      </div>

                      <div style={metaRow}>
                        <span style={metaLabel}>Vorgeschlagene Rechnung</span>
                        <span style={metaValue}>
                          {item.suggested_invoice_number || item.matched_invoice_id || '-'}
                        </span>
                      </div>

                      <div style={metaRow}>
                        <span style={metaLabel}>Kunde</span>
                        <span style={metaValue}>{item.suggested_customer_name || '-'}</span>
                      </div>

                      <div style={metaRow}>
                        <span style={metaLabel}>IBAN</span>
                        <span style={metaValue}>{item.iban || item.account_iban || '-'}</span>
                      </div>

                      <div style={metaRow}>
                        <span style={metaLabel}>Matching Hinweis</span>
                        <span style={metaValue}>{hasCandidate ? 'Match möglich' : 'Kein klarer Treffer'}</span>
                      </div>
                    </div>

                    <div style={assignBox}>
                      <div style={assignTitle}>Rechnung manuell zuweisen</div>

                      <div style={assignControls}>
                        <select
                          value={selectValue}
                          onChange={(e) =>
                            setAssignInvoiceId((prev) => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))
                          }
                          style={assignSelect}
                        >
                          <option value="">Bitte Rechnung wählen</option>
                          {invoiceOptions.map((invoice) => (
                            <option key={invoice.id} value={invoice.id}>
                              {invoice.invoice_number || '-'} · {invoice.kundenname || '-'} · {euro(invoice.total)}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => assignInvoice(item.id)}
                          style={saveButton}
                          disabled={assigningId === item.id}
                        >
                          {assigningId === item.id ? 'Weist zu...' : 'Rechnung zuweisen'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
  maxWidth: 1320,
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
  fontSize: 32,
  color: '#101828'
};

const heroText = {
  margin: '12px 0 0 0',
  fontSize: 16,
  color: '#475467',
  lineHeight: 1.6,
  maxWidth: 820
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginTop: 20
};

const statCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 16,
  padding: 16
};

const statLabel = {
  fontSize: 13,
  color: '#667085',
  marginBottom: 8
};

const statValue = {
  fontSize: 24,
  fontWeight: 800,
  color: '#101828'
};

const card = {
  background: '#fff',
  padding: 24,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const sectionTitle = {
  margin: '0 0 16px 0',
  fontSize: 22,
  color: '#101828'
};

const sectionTitleNoMargin = {
  margin: 0,
  fontSize: 22,
  color: '#101828'
};

const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16
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

const fileInfoBox = {
  minHeight: 46,
  display: 'flex',
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fcfcfd',
  fontSize: 14,
  color: '#475467'
};

const searchInput = {
  minWidth: 320,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fff',
  fontSize: 14
};

const filterSelect = {
  minWidth: 180,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fff',
  fontSize: 14
};

const toolbar = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 16
};

const filterWrap = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const actionRow = {
  display: 'flex',
  gap: 10,
  marginTop: 16,
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

const helperText = {
  marginTop: 0,
  color: '#475467'
};

const emptyBox = {
  padding: 18,
  borderRadius: 14,
  background: '#faf8f3',
  border: '1px dashed #d6d0c4',
  color: '#475467'
};

const connectionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16
};

const connectionCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 18,
  padding: 18
};

const connectionTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'flex-start',
  marginBottom: 12
};

const connectionTitle = {
  fontSize: 18,
  fontWeight: 800,
  color: '#101828'
};

const connectionMeta = {
  marginTop: 6,
  fontSize: 13,
  color: '#667085'
};

const transactionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 16
};

const transactionCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 18,
  padding: 18
};

const transactionTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'flex-start',
  marginBottom: 12
};

const transactionTitle = {
  fontSize: 16,
  fontWeight: 800,
  color: '#101828'
};

const transactionMeta = {
  marginTop: 6,
  fontSize: 13,
  color: '#667085',
  lineHeight: 1.5
};

const metaGrid = {
  display: 'grid',
  gap: 10,
  marginTop: 10
};

const metaRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
  borderTop: '1px solid #f2f4f7',
  paddingTop: 10
};

const metaLabel = {
  fontSize: 13,
  color: '#667085',
  minWidth: 120
};

const metaValue = {
  fontSize: 13,
  color: '#101828',
  textAlign: 'right',
  wordBreak: 'break-word'
};

const assignBox = {
  marginTop: 16,
  borderTop: '1px solid #f2f4f7',
  paddingTop: 16,
  display: 'grid',
  gap: 10
};

const assignTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: '#101828'
};

const assignControls = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const assignSelect = {
  flex: 1,
  minWidth: 240,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fff',
  fontSize: 14
};

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap'
};
