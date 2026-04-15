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

// 🔥 NEU: Match-Erkennung
function detectMatch(item) {
  if (!item) return false;

  const text = `${item.remittance_information} ${item.counterparty_name}`.toLowerCase();

  if (text.includes('rechnung') || text.match(/\d{4,}/)) {
    return true;
  }

  return false;
}

export default function BankPage() {
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    const res = await fetch('/api/bank/sync');
    const data = await res.json();
    setTransactions(data.data || []);
  }

  async function importCsv() {
    const formData = new FormData();
    formData.append('file', csvFile);

    await fetch('/api/bank/import-csv', {
      method: 'POST',
      body: formData
    });

    loadTransactions();
  }

  // 🔥 NEU: Summen
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount || 0);
      if (amount > 0) income += amount;
      else expense += amount;
    });

    return { income, expense };
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) =>
      `${t.counterparty_name} ${t.remittance_information}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [transactions, query]);

  return (
    <main style={{ padding: 30 }}>
      <h1>Bank</h1>

      {/* 🔥 Übersicht */}
      <div style={{ display: 'flex', gap: 20 }}>
        <div>Einnahmen: {euro(stats.income)}</div>
        <div>Ausgaben: {euro(stats.expense)}</div>
      </div>

      <input
        placeholder="Suche..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <input type="file" onChange={(e) => setCsvFile(e.target.files[0])} />

      <button onClick={importCsv}>CSV importieren</button>

      <div>
        {filtered.map((t) => (
          <div key={t.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
            <div>{t.counterparty_name}</div>
            <div>{formatDate(t.booking_date)}</div>
            <div>{euro(t.amount)}</div>

            {/* 🔥 Match Anzeige */}
            <div>
              Status: {t.match_status || 'offen'}
            </div>

            {detectMatch(t) && (
              <div style={{ color: 'green' }}>
                Match möglich
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
