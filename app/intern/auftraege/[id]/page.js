'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

function euro(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

export default function AuftragDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingAdvance, setCreatingAdvance] = useState(false);
  const [creatingFinal, setCreatingFinal] = useState(false);

  const [advanceMode, setAdvanceMode] = useState('percent');
  const [advanceValue, setAdvanceValue] = useState('');

  useEffect(() => {
    loadOrder();
  }, []);

  async function loadOrder() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      const json = await res.json();

      if (res.ok) {
        setData(json.data);
      } else {
        alert(json.message || 'Auftrag konnte nicht geladen werden.');
      }
    } catch (error) {
      console.error(error);
      alert('Auftrag konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  const order = data?.order;
  const lines = data?.lines || [];
  const advances = data?.advance_invoices || [];
  const advanceTotal = Number(data?.advance_total || 0);
  const remainingTotal = Number(data?.remaining_total || 0);

  const orderTaxRate = useMemo(() => {
    if (!lines.length) return 21;
    const taxRates = lines.map((line) => Number(line.tax_rate || 21));
    const first = taxRates[0];
    const same = taxRates.every((rate) => rate === first);
    return same ? first : 21;
  }, [lines]);

  async function createAdvanceInvoice() {
    if (!order) return;

    const raw = Number(advanceValue || 0);
    if (!raw || raw <= 0) {
      alert('Bitte einen gültigen Abschlagswert eingeben.');
      return;
    }

    let amount = raw;

    if (advanceMode === 'percent') {
      amount = Number(order.total || 0) * (raw / 100);
    }

    amount = Number(amount.toFixed(2));

    if (amount <= 0) {
      alert('Der Abschlagsbetrag ist ungültig.');
      return;
    }

    if (amount > remainingTotal && remainingTotal > 0) {
      const confirmed = window.confirm(
        `Der Abschlag (${euro(amount)}) ist höher als der aktuelle Restbetrag (${euro(remainingTotal)}). Trotzdem fortfahren?`
      );
      if (!confirmed) return;
    }

    try {
      setCreatingAdvance(true);

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: order.customer_id,
          order_id: order.id,
          invoice_type: 'advance',
          issue_date: new Date().toISOString().slice(0, 10),
          due_date: order.valid_until || null,
          payment_method: 'transferencia',
          payment_terms: 'gemäß Auftragsbestätigung',
          notes: `Abschlagsrechnung zu Auftrag ${order.order_number}`,
          internal_notes: `Automatisch aus Auftrag ${order.order_number} erstellt`,
          created_by: 'Intern',
          created_by_type: 'internal',
          lines: [
            {
              description: `Abschlagsrechnung zu Auftrag ${order.order_number} (${order.title || 'Auftragsbestätigung'})`,
              quantity: 1,
              unit_price: amount,
              discount_percent: 0,
              tax_rate: orderTaxRate
            }
          ]
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Abschlagsrechnung konnte nicht erstellt werden.');
      }

      setAdvanceValue('');
      await loadOrder();
      window.location.href = `/intern/rechnungen/${json.data.id}`;
    } catch (error) {
      alert(error.message || 'Abschlagsrechnung konnte nicht erstellt werden.');
    } finally {
      setCreatingAdvance(false);
    }
  }

  async function createFinalInvoice() {
    if (!order) return;

    if (remainingTotal <= 0) {
      alert('Es ist kein Restbetrag mehr offen.');
      return;
    }

    const confirmed = window.confirm(
      `Schlussrechnung über ${euro(remainingTotal)} erstellen?`
    );
    if (!confirmed) return;

    try {
      setCreatingFinal(true);

      const originalLines = lines.map((line) => ({
        description: line.description,
        quantity: Number(line.quantity || 1),
        unit_price: Number(line.unit_price || 0),
        discount_percent: Number(line.discount_percent || 0),
        tax_rate: Number(line.tax_rate || 21)
      }));

      const deductionLine = advanceTotal > 0
        ? [{
            description: `Abzug bereits berechneter Abschläge zu Auftrag ${order.order_number}`,
            quantity: 1,
            unit_price: Number((-1 * advanceTotal).toFixed(2)),
            discount_percent: 0,
            tax_rate: orderTaxRate
          }]
        : [];

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: order.customer_id,
          order_id: order.id,
          invoice_type: 'final',
          issue_date: new Date().toISOString().slice(0, 10),
          due_date: order.valid_until || null,
          payment_method: 'transferencia',
          payment_terms: 'gemäß Auftragsbestätigung',
          notes: `Schlussrechnung zu Auftrag ${order.order_number}`,
          internal_notes: `Automatisch aus Auftrag ${order.order_number} erstellt`,
          created_by: 'Intern',
          created_by_type: 'internal',
          lines: [...originalLines, ...deductionLine]
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Schlussrechnung konnte nicht erstellt werden.');
      }

      await loadOrder();
      window.location.href = `/intern/rechnungen/${json.data.id}`;
    } catch (error) {
      alert(error.message || 'Schlussrechnung konnte nicht erstellt werden.');
    } finally {
      setCreatingFinal(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Lade Auftrag...</div>;
  }

  if (!order) {
    return <div style={{ padding: 40 }}>Auftrag nicht gefunden.</div>;
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Auftrag {order.order_number}</h1>
          <p style={heroText}>
            {order.kundenname} ({order.kundennummer})
          </p>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Auftragsdaten</h2>

          <div style={grid3}>
            <div style={infoItem}>
              <div style={infoLabel}>Titel</div>
              <div style={infoValue}>{order.title || '-'}</div>
            </div>

            <div style={infoItem}>
              <div style={infoLabel}>Status</div>
              <div style={infoValue}>{order.status || '-'}</div>
            </div>

            <div style={infoItem}>
              <div style={infoLabel}>Auftragsdatum</div>
              <div style={infoValue}>{order.issue_date || '-'}</div>
            </div>
          </div>

          <div style={grid2}>
            <div style={infoItem}>
              <div style={infoLabel}>Gültig bis</div>
              <div style={infoValue}>{order.valid_until || '-'}</div>
            </div>

            <div style={infoItem}>
              <div style={infoLabel}>Notizen</div>
              <div style={infoValue}>{order.notes || '-'}</div>
            </div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Positionen</h2>

          <div style={lineHeader}>
            <div>Beschreibung</div>
            <div>Menge</div>
            <div>Preis</div>
            <div>Steuer %</div>
            <div>Gesamt</div>
          </div>

          {lines.map((line) => (
            <div key={line.id} style={lineRow}>
              <div>{line.description}</div>
              <div>{line.quantity}</div>
              <div>{euro(line.unit_price)}</div>
              <div>{line.tax_rate}%</div>
              <div>{euro(line.line_total)}</div>
            </div>
          ))}

          <div style={totalsBox}>
            <div>Netto: <strong>{euro(order.subtotal)}</strong></div>
            <div>Steuer: <strong>{euro(order.tax_total)}</strong></div>
            <div>Gesamt: <strong>{euro(order.total)}</strong></div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Abschlagsrechnungen</h2>

          {advances.length === 0 ? (
            <div style={infoBox}>Noch keine Abschlagsrechnungen vorhanden.</div>
          ) : (
            <div style={advanceList}>
              {advances.map((item) => (
                <div key={item.id} style={advanceCard}>
                  <div>
                    <div style={advanceTitle}>{item.invoice_number || '-'}</div>
                    <div style={advanceMeta}>{item.status || '-'} · {euro(item.total)}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => (window.location.href = `/intern/rechnungen/${item.id}`)}
                    style={secondaryButton}
                  >
                    Öffnen
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={summaryBar}>
            <div>Bereits berechnet: <strong>{euro(advanceTotal)}</strong></div>
            <div>Restbetrag: <strong>{euro(remainingTotal)}</strong></div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Abschlagsrechnung erstellen</h2>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Modus</label>
              <select
                value={advanceMode}
                onChange={(e) => setAdvanceMode(e.target.value)}
                style={input}
              >
                <option value="percent">Prozent</option>
                <option value="amount">Betrag</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>
                {advanceMode === 'percent' ? 'Prozentwert' : 'Betrag'}
              </label>
              <input
                type="number"
                value={advanceValue}
                onChange={(e) => setAdvanceValue(e.target.value)}
                style={input}
                placeholder={advanceMode === 'percent' ? 'z. B. 30' : 'z. B. 1500'}
              />
            </div>
          </div>

          <div style={actionRow}>
            <button
              type="button"
              onClick={createAdvanceInvoice}
              style={saveButton}
              disabled={creatingAdvance}
            >
              {creatingAdvance ? 'Erstellt...' : 'Abschlagsrechnung erzeugen'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Schlussrechnung</h2>

          <div style={infoBox}>
            Die Schlussrechnung übernimmt die Auftragspositionen und verrechnet bereits gestellte Abschlagsrechnungen automatisch.
          </div>

          <div style={actionRow}>
            <button
              type="button"
              onClick={createFinalInvoice}
              style={saveButton}
              disabled={creatingFinal || remainingTotal <= 0}
            >
              {creatingFinal ? 'Erstellt...' : 'Schlussrechnung erzeugen'}
            </button>
          </div>
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

const infoItem = {
  padding: 14,
  borderRadius: 14,
  border: '1px solid #eceff3',
  background: '#fcfcfd'
};

const infoLabel = {
  fontSize: 12,
  color: '#667085',
  marginBottom: 6
};

const infoValue = {
  fontSize: 15,
  color: '#101828',
  fontWeight: 700
};

const lineHeader = {
  display: 'grid',
  gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
  gap: 10,
  marginBottom: 10,
  fontSize: 12,
  fontWeight: 700,
  color: '#667085'
};

const lineRow = {
  display: 'grid',
  gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
  gap: 10,
  alignItems: 'center',
  marginBottom: 10,
  paddingBottom: 10,
  borderBottom: '1px solid #eee'
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

const advanceList = {
  display: 'grid',
  gap: 10
};

const advanceCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 14,
  background: '#fcfcfd',
  border: '1px solid #eceff3'
};

const advanceTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: '#101828'
};

const advanceMeta = {
  marginTop: 4,
  fontSize: 12,
  color: '#667085'
};

const summaryBar = {
  marginTop: 16,
  padding: 16,
  borderRadius: 14,
  background: '#fffaeb',
  border: '1px solid #fedf89',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap'
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

const infoBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708'
};
