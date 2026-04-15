'use client';

import { useEffect, useMemo, useState } from 'react';

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('de-DE');
  } catch {
    return value;
  }
}

function euro(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

export default function MahnlaufPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    try {
      setLoading(true);
      const res = await fetch('/api/reminders/run');
      const data = await res.json();

      if (res.ok) {
        setReminders(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function runDunning(force = false) {
    try {
      setRunning(true);

      const res = await fetch('/api/reminders/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Mahnlauf fehlgeschlagen.');
        return;
      }

      alert(`Erstellt: ${data.created_count || 0} | Übersprungen: ${data.skipped_count || 0}`);
      await loadReminders();
    } catch (error) {
      alert('Mahnlauf fehlgeschlagen.');
    } finally {
      setRunning(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reminders;

    return reminders.filter((row) =>
      [
        row.invoice_id,
        row.status,
        row.channel,
        row.note,
        row.level
      ].join(' ').toLowerCase().includes(q)
    );
  }, [reminders, query]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>Mahnlauf</h1>
              <p style={heroText}>
                Überfällige Rechnungen automatisch erkennen, Mahnstufen anlegen und den Status aktualisieren.
              </p>
            </div>

            <div style={actionRow}>
              <button type="button" onClick={() => runDunning(false)} style={saveButton} disabled={running}>
                {running ? 'Läuft...' : 'Mahnlauf starten'}
              </button>

              <button type="button" onClick={() => runDunning(true)} style={secondaryButton} disabled={running}>
                Erzwungen ausführen
              </button>
            </div>
          </div>
        </section>

        <section style={card}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Invoice-ID, Status, Stufe oder Notiz"
            style={input}
          />
        </section>

        <section style={card}>
          {loading ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Mahnungen werden geladen ...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyTitle}>Noch keine Mahnungen vorhanden</div>
              <div style={emptyText}>
                Starte den Mahnlauf, damit automatisch Mahnstufen erzeugt werden.
              </div>
            </div>
          ) : (
            <div style={grid}>
              {filtered.map((item) => (
                <div key={item.id} style={itemCard}>
                  <div style={topRow}>
                    <div>
                      <div style={title}>Mahnung Stufe {item.level}</div>
                      <div style={meta}>Rechnung: {item.invoice_id}</div>
                    </div>

                    <div style={pill}>
                      {item.status || '-'}
                    </div>
                  </div>

                  <div style={facts}>
                    <div style={fact}><span>Datum</span><strong>{formatDate(item.reminder_date)}</strong></div>
                    <div style={fact}><span>Gebühr</span><strong>{euro(item.fee_amount)}</strong></div>
                    <div style={fact}><span>Kanal</span><strong>{item.channel || '-'}</strong></div>
                    <div style={fact}><span>Notiz</span><strong>{item.note || '-'}</strong></div>
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
  fontWeight: 700,
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708'
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
