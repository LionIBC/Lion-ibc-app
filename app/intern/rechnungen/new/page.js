'use client';

import { useEffect, useMemo, useState } from 'react';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function emptyLine() {
  return {
    service_catalog_id: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    tax_rate: 21
  };
}

export default function NeueRechnungPage() {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [series, setSeries] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [seriesId, setSeriesId] = useState('');
  const [invoiceType, setInvoiceType] = useState('standard');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceDate, setServiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [statusBox, setStatusBox] = useState(null);

  useEffect(() => {
    loadCustomers();
    loadServices();
    loadSeries();
  }, []);

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadServices() {
    try {
      const res = await fetch('/api/services?active_only=true');
      const data = await res.json();
      if (res.ok) {
        setServices(data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadSeries() {
    try {
      const res = await fetch('/api/invoice-series');
      if (!res.ok) return;

      const data = await res.json();
      if (data.success) {
        setSeries(data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function updateLine(index, key, value) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [key]: value } : line))
    );
  }

  function applyServiceToLine(index, serviceId) {
    const service = services.find((item) => item.id === serviceId);

    if (!service) {
      updateLine(index, 'service_catalog_id', '');
      return;
    }

    setLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              service_catalog_id: service.id,
              description: service.description || service.name || '',
              unit_price: service.default_price || 0,
              tax_rate: service.default_tax_rate || 21,
              discount_percent: service.default_discount_percent || 0
            }
          : line
      )
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const calculatedLines = useMemo(() => {
    return lines.map((line) => {
      const quantity = toNumber(line.quantity, 1);
      const unitPrice = toNumber(line.unit_price, 0);
      const discountPercent = toNumber(line.discount_percent, 0);
      const taxRate = toNumber(line.tax_rate, 21);

      const grossBase = quantity * unitPrice;
      const discountAmount = grossBase * (discountPercent / 100);
      const net = grossBase - discountAmount;
      const tax = net * (taxRate / 100);
      const total = net + tax;

      return {
        ...line,
        quantity,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        tax_rate: taxRate,
        line_net: Number(net.toFixed(2)),
        line_tax: Number(tax.toFixed(2)),
        line_total: Number(total.toFixed(2))
      };
    });
  }, [lines]);

  const totals = useMemo(() => {
    return calculatedLines.reduce(
      (acc, line) => {
        acc.subtotal += line.line_net;
        acc.tax_total += line.line_tax;
        acc.total += line.line_total;
        return acc;
      },
      { subtotal: 0, tax_total: 0, total: 0 }
    );
  }, [calculatedLines]);

  async function saveInvoice() {
    if (!customerId) {
      setStatusBox({ type: 'error', message: 'Bitte einen Mandanten auswählen.' });
      return;
    }

    const validLines = calculatedLines
      .filter((line) => line.description.trim())
      .map((line) => ({
        service_catalog_id: line.service_catalog_id || null,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        tax_rate: line.tax_rate
      }));

    if (validLines.length === 0) {
      setStatusBox({ type: 'error', message: 'Bitte mindestens eine Position eintragen.' });
      return;
    }

    try {
      setSaving(true);
      setStatusBox(null);

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          series_id: seriesId || null,
          invoice_type: invoiceType,
          issue_date: issueDate || null,
          service_date: serviceDate || null,
          due_date: dueDate || null,
          payment_method: paymentMethod,
          payment_terms: paymentTerms,
          notes,
          internal_notes: internalNotes,
          created_by: 'Intern',
          created_by_type: 'internal',
          lines: validLines
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Rechnung konnte nicht erstellt werden.');
      }

      window.location.href = `/intern/rechnungen/${data.data.id}`;
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Rechnung konnte nicht erstellt werden.'
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Neue Rechnung</h1>
          <p style={heroText}>
            Rechnung erfassen, Leistungen übernehmen und direkt als Entwurf speichern.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}

        <section style={card}>
          <h2 style={sectionTitle}>Kopfbereich</h2>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Mandant</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={input}>
                <option value="">Bitte wählen</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firmenname} ({customer.kundennummer})
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Rechnungsart</label>
              <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} style={input}>
                <option value="standard">Rechnung</option>
                <option value="rectificativa">Rechnungskorrektur</option>
                <option value="advance">Abschlagsrechnung</option>
                <option value="final">Schlussrechnung</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Serie</label>
              <select value={seriesId} onChange={(e) => setSeriesId(e.target.value)} style={input}>
                <option value="">Automatisch / keine Auswahl</option>
                {series.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Rechnungsdatum</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={input} />
            </div>

            <div style={field}>
              <label style={label}>Leistungsdatum</label>
              <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} style={input} />
            </div>

            <div style={field}>
              <label style={label}>Fälligkeitsdatum</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={input} />
            </div>
          </div>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Zahlungsart</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={input}>
                <option value="transferencia">Überweisung</option>
                <option value="efectivo">Bar</option>
                <option value="tarjeta">Karte</option>
                <option value="domiciliacion">Lastschrift</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Zahlungsbedingungen</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} style={input} placeholder="z. B. 14 Tage netto" />
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={cardHeader}>
            <h2 style={sectionTitleNoMargin}>Positionen</h2>
            <button type="button" onClick={addLine} style={secondaryButton}>
              + Position
            </button>
          </div>

          <div style={lineHeader}>
            <div>Leistung</div>
            <div>Beschreibung</div>
            <div>Menge</div>
            <div>Preis</div>
            <div>Rabatt %</div>
            <div>Steuer %</div>
            <div>Netto</div>
            <div>Gesamt</div>
            <div></div>
          </div>

          {calculatedLines.map((line, index) => (
            <div key={index} style={lineRow}>
              <select
                value={line.service_catalog_id || ''}
                onChange={(e) => applyServiceToLine(index, e.target.value)}
                style={input}
              >
                <option value="">Leistung wählen</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>

              <input
                value={line.description}
                onChange={(e) => updateLine(index, 'description', e.target.value)}
                style={input}
                placeholder="Leistung / Beschreibung"
              />
              <input
                type="number"
                value={line.quantity}
                onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                style={input}
              />
              <input
                type="number"
                value={line.unit_price}
                onChange={(e) => updateLine(index, 'unit_price', e.target.value)}
                style={input}
              />
              <input
                type="number"
                value={line.discount_percent}
                onChange={(e) => updateLine(index, 'discount_percent', e.target.value)}
                style={input}
              />
              <input
                type="number"
                value={line.tax_rate}
                onChange={(e) => updateLine(index, 'tax_rate', e.target.value)}
                style={input}
              />
              <div style={calcBox}>{line.line_net.toFixed(2)} €</div>
              <div style={calcBox}>{line.line_total.toFixed(2)} €</div>
              <button type="button" onClick={() => removeLine(index)} style={dangerButton}>
                X
              </button>
            </div>
          ))}

          <div style={totalsBox}>
            <div>Netto: <strong>{totals.subtotal.toFixed(2)} €</strong></div>
            <div>Steuer: <strong>{totals.tax_total.toFixed(2)} €</strong></div>
            <div>Gesamt: <strong>{totals.total.toFixed(2)} €</strong></div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Notizen</h2>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Hinweis auf Rechnung</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={textarea} />
            </div>

            <div style={field}>
              <label style={label}>Interne Notizen</label>
              <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} style={textarea} />
            </div>
          </div>
        </section>

        <div style={actionRow}>
          <button type="button" onClick={saveInvoice} style={saveButton} disabled={saving}>
            {saving ? 'Speichert...' : 'Rechnung speichern'}
          </button>
        </div>
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
  maxWidth: 1380,
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

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 16
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
  gap: 16,
  marginBottom: 16
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

const textarea = {
  width: '100%',
  minHeight: 120,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  boxSizing: 'border-box',
  resize: 'vertical',
  background: '#fff',
  fontSize: 14
};

const lineHeader = {
  display: 'grid',
  gridTemplateColumns: '1.6fr 2.4fr repeat(4, 1fr) 1fr 1fr 64px',
  gap: 10,
  marginBottom: 10,
  fontSize: 12,
  fontWeight: 700,
  color: '#667085'
};

const lineRow = {
  display: 'grid',
  gridTemplateColumns: '1.6fr 2.4fr repeat(4, 1fr) 1fr 1fr 64px',
  gap: 10,
  alignItems: 'center',
  marginBottom: 10
};

const calcBox = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid #e4e7ec',
  background: '#f9fafb',
  fontSize: 14,
  textAlign: 'right'
};

const totalsBox = {
  marginTop: 16,
  padding: 16,
  borderRadius: 14,
  background: '#faf8f3',
  border: '1px solid #ece7dc',
  display: 'grid',
  gap: 6
};

const actionRow = {
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
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #fecdca',
  background: '#fff',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer'
};

const errorBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

