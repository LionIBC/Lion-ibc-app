'use client';

import { useEffect, useState } from 'react'; import { useRouter } from 'next/navigation';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('de-DE');
}

function getStatusLabel(status) {
  switch (status) {
    case 'neu':
      return 'Neu';
    case 'in_bearbeitung':
      return 'In Bearbeitung';
    case 'rueckfrage':
      return 'Rückfrage';
    case 'erledigt':
      return 'Erledigt';
    default:
      return status;
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'neu':
      return '#667085';
    case 'in_bearbeitung':
      return '#b54708';
    case 'rueckfrage':
      return '#b42318';
    case 'erledigt':
      return '#067647';
    default:
      return '#667085';
  }
}

export default function PortalTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    const res = await fetch('/api/portal/tickets');
    const data = await res.json();

    if (data.success) {
      setTickets(data.data);
    }

    setLoading(false);
  }

  if (loading) {
    return <div style={wrap}>Lade Tickets…</div>;
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <h1 style={title}>Meine Anfragen</h1>

        {tickets.length === 0 ? (
          <div style={emptyBox}>
            Sie haben aktuell keine offenen oder abgeschlossenen Anfragen.
          </div>
        ) : (
          <div style={grid}>
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => router.push(`/portal/tickets/${ticket.id}`)}
                style={card}
              >
                <div style={cardHeader}>
                  <span
                    style={{
                      ...statusBadge,
                      color: getStatusColor(ticket.customer_status)
                    }}
                  >
                    {getStatusLabel(ticket.customer_status)}
                  </span>
                </div>

                <div style={cardTitle}>
                  {ticket.title || 'Ohne Titel'}
                </div>

                {ticket.appointment_date && (
                  <div style={meta}>
                    Termin: {formatDate(ticket.appointment_date)}
                  </div>
                )}

                <div style={metaSmall}>
                  Letzte Änderung: {formatDate(ticket.updated_at)}
                </div>
              </button>
            ))}
          </div>
        )}
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
  maxWidth: 900,
  margin: '0 auto'
};

const title = {
  fontSize: 28,
  marginBottom: 20
};

const grid = {
  display: 'grid',
  gap: 16
};

const card = {
  background: '#fff',
  borderRadius: 14,
  padding: 16,
  border: '1px solid #e5e7eb',
  textAlign: 'left',
  cursor: 'pointer'
};

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 10
};

const statusBadge = {
  fontSize: 12,
  fontWeight: 700
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 10
};

const meta = {
  fontSize: 14,
  color: '#475467'
};

const metaSmall = {
  fontSize: 12,
  color: '#98a2b3',
  marginTop: 6
};

const emptyBox = {
  padding: 20,
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #e5e7eb'
};
