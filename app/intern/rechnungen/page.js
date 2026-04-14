'use client';

import { useEffect, useState } from 'react';

export default function RechnungenPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadInvoices() {
    setLoading(true);

    const res = await fetch('/api/invoices');
    const data = await res.json();

    if (data.success) {
      setInvoices(data.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <main className="container">
      <div className="formCard">
        <h2>Rechnungen</h2>

        <button
          onClick={() => window.location.href = '/intern/rechnungen/new'}
          style={{ marginBottom: 20 }}
        >
          Neue Rechnung
        </button>

        {loading && <p>Lade Rechnungen...</p>}

        {!loading && invoices.length === 0 && (
          <p>Keine Rechnungen vorhanden</p>
        )}

        {!loading && invoices.length > 0 && (
          <div className="table">
            <div className="tableHeader">
              <div>Nr.</div>
              <div>Kunde</div>
              <div>Betrag</div>
              <div>Status</div>
            </div>

            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="tableRow"
                onClick={() =>
                  window.location.href = `/intern/rechnungen/${inv.id}`
                }
              >
                <div>{inv.invoice_number || '-'}</div>
                <div>{inv.kundenname}</div>
                <div>{inv.total} €</div>
                <div>{inv.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
