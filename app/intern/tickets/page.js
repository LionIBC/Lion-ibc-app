'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_COLUMNS = [
  { key: 'neu', label: 'Neu' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung' },
  { key: 'rueckfrage', label: 'Rückfrage' },
  { key: 'erledigt', label: 'Erledigt' }
];

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

function normalizeStatus(value) {
  return String(value || 'neu').trim() || 'neu';
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('de-DE');
  } catch {
    return '';
  }
}

export default function InternTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusBox, setStatusBox] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('normal');

  useEffect(() => {
    loadCustomers();
    loadTickets();
  }, []);

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Kunden konnten nicht geladen werden.');
      }

      const rows = Array.isArray(data?.data) ? data.data : [];
      setCustomers(rows);

      if (rows.length > 0 && !customerId) {
        setCustomerId(rows[0].id);
      }
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Kunden konnten nicht geladen werden.'
      });
    }
  }

  async function loadTickets() {
    try {
      setLoading(true);

      const res = await fetch('/api/tickets');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Tickets konnten nicht geladen werden.');
      }

      setTickets(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Tickets konnten nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function createTicket() {
    if (!title.trim()) {
      setStatusBox({ type: 'error', message: 'Bitte einen Titel eingeben.' });
      return;
    }

    if (!customerId) {
      setStatusBox({ type: 'error', message: 'Bitte einen Mandanten auswählen.' });
      return;
    }

    try {
      setCreating(true);
      setStatusBox(null);

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          customer_id: customerId,
          category,
          priority,
          customer_status: 'neu',
          internal_status: 'neu',
          assigned_users: [],
          participants: [],
          created_by: 'Intern',
          created_by_type: 'internal'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Ticket konnte nicht erstellt werden.');
      }

      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('normal');
      setStatusBox({ type: 'success', message: 'Ticket wurde erstellt.' });

      await loadTickets();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Ticket konnte nicht erstellt werden.'
      });
    } finally {
      setCreating(false);
    }
  }

  const groupedTickets = useMemo(() => {
    const grouped = {
      neu: [],
      in_bearbeitung: [],
      rueckfrage: [],
      erledigt: []
    };

    for (const ticket of tickets || []) {
      const key = normalizeStatus(ticket.internal_status);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ticket);
    }

    return grouped;
  }, [tickets]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Tickets</h1>
          <p style={heroText}>
            Neue Tickets können direkt einem Mandanten zugeordnet und intern über das Board verwaltet werden.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={card}>
          <h2 style={sectionTitle}>Neues Ticket</h2>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Titel</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kurze Überschrift"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Mandant</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={input}>
                <option value="">Bitte wählen</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firmenname} ({c.kundennummer})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Kategorie</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="z. B. Behörden, Vertrag, Rückfrage"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Priorität</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={input}>
                <option value="niedrig">niedrig</option>
                <option value="normal">normal</option>
                <option value="hoch">hoch</option>
                <option value="kritisch">kritisch</option>
              </select>
            </div>
          </div>

          <div style={field}>
            <label style={label}>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze interne Beschreibung oder Aufgabenstellung"
              style={textarea}
            />
          </div>

          <div style={actionRow}>
            <button type="button" onClick={createTicket} style={saveButton} disabled={creating}>
              {creating ? 'Erstellt…' : 'Ticket erstellen'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Ticket-Board</h2>

          {loading ? (
            <div style={infoBox}>Tickets werden geladen…</div>
          ) : (
            <div style={boardGrid}>
              {STATUS_COLUMNS.map((column) => (
                <div key={column.key} style={columnCard}>
                  <div style={columnHeader}>{column.label}</div>

                  <div style={ticketList}>
                    {(groupedTickets[column.key] || []).length === 0 ? (
                      <div style={emptyTicket}>Keine Tickets</div>
                    ) : (
                      groupedTickets[column.key].map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => router.push(`/intern/tickets/${ticket.id}`)}
                          style={ticketCard}
                        >
                          <div style={ticketTitle}>{ticket.title}</div>
                          <div style={ticketMeta}>
                            {ticket.kundenname} ({ticket.kundennummer})
                          </div>
                          {ticket.due_date ? (
                            <div style={ticketMeta}>Fällig: {formatDate(ticket.due_date)}</div>
                          ) : null}
                        </button>
                      ))
                    )}
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
  gap: 16,
  marginBottom: 16
};

const field = {
  display: 'grid',
  gap: 8,
  marginBottom: 16
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
  background: '#fff'
};

const textarea = {
  width: '100%',
  minHeight: 110,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  boxSizing: 'border-box',
  resize: 'vertical',
  background: '#fff'
};

const actionRow = {
  display: 'flex',
  gap: 10,
  marginTop: 10,
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

const infoBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708'
};

const errorBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  padding: '14px 16px',
  borderRadius: 14,
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};

const boardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 16,
  alignItems: 'start'
};

const columnCard = {
  background: '#fcfcfd',
  border: '1px solid #eceff3',
  borderRadius: 16,
  padding: 16,
  minHeight: 300
};

const columnHeader = {
  fontSize: 18,
  fontWeight: 800,
  color: '#101828',
  marginBottom: 12
};

const ticketList = {
  display: 'grid',
  gap: 10
};

const ticketCard = {
  width: '100%',
  textAlign: 'left',
  border: '1px solid #eceff3',
  borderRadius: 14,
  padding: 14,
  background: '#fff',
  cursor: 'pointer'
};

const ticketTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: '#101828',
  marginBottom: 6
};

const ticketMeta = {
  fontSize: 12,
  color: '#667085',
  marginTop: 4
};

const emptyTicket = {
  padding: '14px 12px',
  borderRadius: 14,
  background: '#fff',
  border: '1px dashed #d6d0c4',
  color: '#98a2b3',
  textAlign: 'center',
  fontSize: 14
};
