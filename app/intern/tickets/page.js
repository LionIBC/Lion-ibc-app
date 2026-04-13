'use client';

import { useEffect, useState } from 'react';

const DEFAULT_COLUMNS = [
  'neu',
  'in Bearbeitung',
  'Rückfrage',
  'erledigt'
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTickets();
    loadCustomers();
  }, []);

  async function loadTickets() {
    const res = await fetch('/api/tickets');
    const data = await res.json();

    if (res.ok) {
      setTickets(data.data || []);
    }

    setLoading(false);
  }

  async function loadCustomers() {
    const res = await fetch('/api/customers');
    const data = await res.json();

    if (res.ok) {
      setCustomers(data.data || []);
    }
  }

  async function createTicket() {
    if (!title || !customerId) {
      alert('Titel und Mandant erforderlich');
      return;
    }

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        customer_id: customerId,
        created_by: 'Intern',
        created_by_type: 'internal'
      })
    });

    if (res.ok) {
      setTitle('');
      setDescription('');
      setCustomerId('');
      loadTickets();
    } else {
      alert('Fehler beim Erstellen');
    }
  }

  function groupTickets() {
    const grouped = {};

    DEFAULT_COLUMNS.forEach((col) => {
      grouped[col] = [];
    });

    tickets.forEach((t) => {
      const status = t.internal_status || 'neu';

      if (!grouped[status]) grouped[status] = [];

      grouped[status].push(t);
    });

    return grouped;
  }

  const grouped = groupTickets();

  return (
    <main style={{ padding: 30 }}>
      <h1>Tickets</h1>

      {/* Erstellung */}
      <div style={{ marginBottom: 30 }}>
        <h3>Neues Ticket</h3>

        <input
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <br /><br />

        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Mandant wählen</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firmenname} ({c.kundennummer})
            </option>
          ))}
        </select>

        <br /><br />

        <textarea
          placeholder="Beschreibung"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br /><br />

        <button onClick={createTicket}>
          Ticket erstellen
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <p>Lade...</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20
        }}>
          {Object.keys(grouped).map((status) => (
            <div key={status}>
              <h3>{status}</h3>

              {grouped[status].map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    border: '1px solid #ddd',
                    borderRadius: 10,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    window.location.href = `/intern/tickets/${t.id}`;
                  }}
                >
                  <strong>{t.title}</strong>
                  <br />
                  <small>
                    {t.kundenname} ({t.kundennummer})
                  </small>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


function chipButton(selected) {
  return {
    padding: '10px 12px',
    borderRadius: '999px',
    border: selected ? '1px solid #8c6b43' : '1px solid #d0d5dd',
    background: selected ? '#8c6b43' : '#fff',
    color: selected ? '#fff' : '#344054',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  };
}

const wrap = {
  padding: 30,
  background: '#f7f5ef',
  minHeight: '100vh'
};

const container = {
  maxWidth: 1240,
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
  fontSize: 17,
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
  margin: '0 0 18px 0',
  fontSize: 22,
  color: '#101828'
};

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16
};

const filterGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
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

const chipWrap = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const hintText = {
  marginTop: 16,
  fontSize: 14,
  color: '#667085',
  lineHeight: 1.6
};

const row = {
  display: 'flex',
  gap: 10,
  marginTop: 14,
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

const statsRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16
};

const statCard = {
  background: '#fff',
  padding: 20,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const statLabel = {
  fontSize: 15,
  color: '#667085',
  marginBottom: 10
};

const statValue = {
  fontSize: 42,
  lineHeight: 1,
  fontWeight: 800,
  color: '#101828'
};

const boardWrap = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
  alignItems: 'start'
};

const boardColumn = {
  background: '#f2efe8',
  borderRadius: 18,
  padding: 12,
  minHeight: 420,
  border: '1px solid #e5dfd2'
};

const columnHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  padding: '4px 6px'
};

const columnTitle = {
  fontSize: 18,
  fontWeight: 800,
  color: '#101828'
};

const columnCount = {
  minWidth: 24,
  height: 24,
  borderRadius: 999,
  background: '#fff',
  border: '1px solid #ddd6c8',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 700,
  color: '#6b5b45',
  padding: '0 8px'
};

const columnBody = {
  display: 'grid',
  gap: 10
};

const emptyCard = {
  padding: '14px 12px',
  borderRadius: 14,
  background: '#fff',
  border: '1px dashed #d6d0c4',
  color: '#98a2b3',
  textAlign: 'center',
  fontSize: 14
};

const ticketCardButton = {
  width: '100%',
  textAlign: 'left',
  border: '1px solid #eceff3',
  borderRadius: 14,
  padding: 12,
  background: '#fff',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(16, 24, 40, 0.04)'
};

const ticketCardCustomer = {
  fontSize: 14,
  fontWeight: 800,
  color: '#101828',
  marginBottom: 6
};

const ticketCardTitle = {
  fontSize: 14,
  color: '#475467',
  lineHeight: 1.4
};

const ticketMiniMeta = {
  marginTop: 8,
  fontSize: 12,
  color: '#667085'
};

const errorBox = {
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};
