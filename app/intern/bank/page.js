'use client';

import { useEffect, useMemo, useState } from 'react';

export default function BankPage() {
  const [transactions, setTransactions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState('');

  const [bankName, setBankName] = useState('CaixaBank');
  const [providerName, setProviderName] = useState('truelayer');
  const [displayName, setDisplayName] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    loadTransactions();
    loadConnections();
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

  async function loadConnections() {
    try {
      const res = await fetch('/api/bank/connections');
      const data = await res.json();

      if (res.ok) {
        setConnections(data.data || []);
      }
    } catch (error) {
      console.error(error);
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

  async function connectBank() {
    try {
      setConnecting(true);

      const res = await fetch('/api/bank/connections', {
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

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Bank konnte nicht angelegt werden.');
        return;
      }

      if (data.data?.connect_url) {
        window.open(data.data.connect_url, '_blank');
      }

      alert('Bankverbindung wurde angelegt.');
      setDisplayName('');
      setIban('');
      setAccountHolder('');
      await loadConnections();
    } finally {
      setConnecting(false);
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
    } finally {
      setImporting(false);
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
      ].join(' ').toLowerCase().includes(q)
    );
  }, [transactions, query]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>Bank</h1>
              <p style={heroText}>
                Banken verbinden, CSV importieren und Transaktionen automatisch mit Rechnungen abgleichen.
              </p>
            </div>

            <button type="button" onClick={syncNow} style={saveButton} disabled={syncing}>
              {syncing ? 'Synchronisiert...' : 'Bank jetzt synchronisieren'}
            </button>
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
            <button type="button" onClick={connectBank} style={saveButton} disabled={connecting}>
              {connecting ? 'Verbindet...' : 'Bank anlegen und verbinden'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>CSV Import</h2>
          <p style={helperText}>
            Fallback für Banken ohne direkte Anbindung. Erwartet Spalten wie Datum, Betrag, Gegenpartei, Verwendungszweck und Referenz.
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
          </div>

          <div style={actionRow}>
            <button type="button" onClick={importCsv} style={secondaryButton} disabled={importing}>
              {importing ? 'Importiert...' : 'CSV importieren'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Verbundene Banken</h2>

          {connections.length === 0 ? (
            <div style={emptyBox}>Noch keine Bankverbindung vorhanden.</div>
          ) : (
            <div style={connectionGrid}>
              {connections.map((item) => (
                <div key={item.id} style={connectionCard}>
                  <div style={connectionTitle}>{item.bank_name || '-'}</div>
                  <div style={connectionMeta}>{item.display_name || '-'}</div>
                  <div style={connectionMeta}>{item.iban || '-'}</div>
                  <div style={connectionMeta}>Provider: {item.provider_name || '-'}</div>
                  <div style={connectionMeta}>Status: {item.status || '-'}</div>
                </div>
              ))}
            </div>
          )}
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
          <h2 style={sectionTitle}>Transaktionen</h2>

          {loading ? (
            <div style={emptyBox}>Banktransaktionen werden geladen ...</div>
          ) : filtered.length === 0 ? (
            <div style={emptyBox}>Noch keine Banktransaktionen vorhanden.</div>
          ) : (
            <div style={transactionGrid}>
              {filtered.map((item) => (
                <div key={item.id} style={transactionCard}>
                  <div style={transactionTitle}>{item.counterparty_name || 'Unbekannt'}</div>
                  <div style={transactionMeta}>{item.booking_date || '-'} · {item.amount || 0} €</div>
                  <div style={transactionMeta}>Verwendungszweck: {item.remittance_information || '-'}</div>
                  <div style={transactionMeta}>Referenz: {item.bank_reference || '-'}</div>
                  <div style={transactionMeta}>Match: {item.match_status || '-'}</div>
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

const sectionTitle = {
  margin: '0 0 16px 0',
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
};

const connectionCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 18,
  padding: 18
};

const connectionTitle = {
  fontSize: 16,
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16
};

const transactionCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 18,
  padding: 18
};

const transactionTitle = {
  fontSize: 16,
  fontWeight: 800,
  color: '#101828'
};

const transactionMeta = {
  marginTop: 6,
  fontSize: 13,
  color: '#667085'
};
