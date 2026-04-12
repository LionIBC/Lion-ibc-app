'use client';

import { useEffect, useState } from 'react'; import { useRouter } from 'next/navigation';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('de-DE');
  } catch {
    return '';
  }
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
      return status || 'Neu';
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
  const [statusBox, setStatusBox] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);
      setStatusBox(null);

      const res = await fetch('/api/portal/tickets');
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

  if (loading) {
    return (
      <main style={wrap}>
        <div style={container}>Lade Tickets…</div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Kundenportal</div>
          <h1 style={title}>Meine Anfragen</h1>
          <p style={heroText}>
            Hier sehen Sie alle Ihre Anfragen, den aktuellen Bearbeitungsstand und
            können einzelne Tickets öffnen.
          </p>

          <button
            onClick={() => router.push('/portal/tickets/new')}
            style={newButton}
            type="button"
          >
            + Neue Anfrage
          </button>
        </section>

        {statusBox?.type === 'error' && (
          <div style={errorBox}>{statusBox.message}</div>
        )}

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
                type="button"
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

                {ticket.appointment_date ? (
                  <div style={meta}>
                    Termin: {formatDate(ticket.appointment_date)}
                  </div>
                ) : null}

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

const title = {
  fontSize: 28,
  margin: 0,
  color: '#101828'
};

const heroText = {
  margin: '12px 0 0 0',
  fontSize: 16,
  color: '#475467',
  lineHeight: 1.6
};

const newButton = {
  marginTop: 18,
  padding: '12px 16px',
  borderRadius: 12,
  background: '#8c6b43',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer'
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
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(16, 24, 40, 0.04)'
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
  marginBottom: 10,
  color: '#101828'
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

const errorBox = {
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};
