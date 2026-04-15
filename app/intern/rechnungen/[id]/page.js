'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function RechnungDetailPage() {
  const { id } = useParams();

  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [generatingFacturae, setGeneratingFacturae] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, []);

  async function loadInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();

      if (res.ok) {
        setInvoiceData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function cancelInvoice() {
    const reason = prompt('Grund für Storno:');
    if (!reason) return;

    await fetch(`/api/invoices/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, user: 'Intern' })
    });

    loadInvoice();
  }

  async function finalizeInvoice() {
    const confirmed = window.confirm('Rechnung finalisieren und sperren?');
    if (!confirmed) return;

    try {
      setFinalizing(true);

      const res = await fetch(`/api/invoices/${id}/finalize`, {
        method: 'POST'
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Finalisieren fehlgeschlagen.');
        return;
      }

      await loadInvoice();
      window.open(`/api/invoices/pdf/${id}`, '_blank');
    } finally {
      setFinalizing(false);
    }
  }

  async function generateFacturae() {
    try {
      setGeneratingFacturae(true);
      const res = await fetch(`/api/invoices/${id}/facturae`, {
        method: 'POST'
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Facturae konnte nicht erzeugt werden.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturae_${id}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      await loadInvoice();
    } finally {
      setGeneratingFacturae(false);
    }
  }

  function downloadPdf() {
    window.open(`/api/invoices/pdf/${id}`, '_blank');
  }

  if (loading) return <div style={{ padding: 40 }}>Lädt...</div>;
  if (!invoiceData?.invoice) return <div style={{ padding: 40 }}>Keine Daten gefunden</div>;

  const invoice = invoiceData.invoice;
  const lines = invoiceData.lines || [];

  return (
    <main style={{ padding: 30, background: '#f7f5ef', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 20 }}>
        <section style={card}>
          <h1>Rechnung {invoice.invoice_number || '-'}</h1>
          <p><strong>Kunde:</strong> {invoice.kundenname} ({invoice.kundennummer})</p>
          <p><strong>Status:</strong> {invoice.status}</p>
          <p><strong>Final:</strong> {invoice.is_final ? 'Ja' : 'Nein'}</p>
          <p><strong>Facturae:</strong> {invoice.facturae_status || 'draft'}</p>
          {invoice.cancelled && <p style={{ color: '#b42318', fontWeight: 700 }}>STORNIERT</p>}
        </section>

        <section style={card}>
          <h2>Leistungszeitraum</h2>
          <p><strong>Von:</strong> {invoice.period_start || '-'}</p>
          <p><strong>Bis:</strong> {invoice.period_end || '-'}</p>
          <p><strong>Typ:</strong> {invoice.period_type || '-'}</p>
        </section>

        <section style={card}>
          <h2>Positionen</h2>
          {lines.map((line, i) => (
            <div key={i} style={row}>
              <div>{line.description}</div>
              <div>{line.quantity}</div>
              <div>{line.unit_price} €</div>
              <div>{line.line_total} €</div>
            </div>
          ))}
        </section>

        <section style={card}>
          <h2>Summen</h2>
          <p>Netto: {invoice.subtotal} €</p>
          <p>Steuer: {invoice.tax_total} €</p>
          <p><strong>Gesamt: {invoice.total} €</strong></p>
          {invoice.pdf_hash ? <p><strong>PDF-Hash:</strong> {invoice.pdf_hash}</p> : null}
          {invoice.facturae_hash ? <p><strong>Facturae-Hash:</strong> {invoice.facturae_hash}</p> : null}
        </section>

        <section style={card}>
          <button style={button} onClick={downloadPdf}>
            PDF herunterladen
          </button>

          <button style={button} onClick={generateFacturae} disabled={generatingFacturae}>
            {generatingFacturae ? 'Erzeugt...' : 'Facturae XML erzeugen'}
          </button>

          {!invoice.is_final && !invoice.cancelled ? (
            <button style={button} onClick={finalizeInvoice} disabled={finalizing}>
              {finalizing ? 'Finalisiert...' : 'Finalisieren + PDF'}
            </button>
          ) : null}

          {!invoice.cancelled ? (
            <button style={dangerButton} onClick={cancelInvoice}>
              Rechnung stornieren
            </button>
          ) : null}
        </section>
      </div>
    </main>
  );
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 12
};

const row = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  gap: 10,
  padding: 10,
  borderBottom: '1px solid #eee'
};

const button = {
  padding: 10,
  marginRight: 10,
  borderRadius: 8,
  border: 'none',
  background: '#8c6b43',
  color: '#fff',
  cursor: 'pointer'
};

const dangerButton = {
  padding: 10,
  borderRadius: 8,
  border: 'none',
  background: '#b42318',
  color: '#fff',
  cursor: 'pointer'
};
