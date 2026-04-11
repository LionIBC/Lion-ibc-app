'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const boardColumns = [
  { key: 'neu', label: 'Neu' },
  { key: 'zugewiesen', label: 'Zugewiesen' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung' },
  { key: 'wartet_auf_kunde', label: 'Wartet auf Kunde' },
  { key: 'wartet_intern', label: 'Wartet intern' },
  { key: 'erledigt', label: 'Erledigt' } ];

const priorityOptions = ['niedrig', 'normal', 'hoch', 'kritisch'];

export default function InternTicketsBoardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusBox, setStatusBox] = useState(null);
  const [creating, setCreating] = useState(false);

  const [kundennummerFilter, setKundennummerFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [newTicket, setNewTicket] = useState({
    kundennummer: '',
    title: '',
    description: '',
    category: '',
    priority: 'normal',
    assigned_to: '',
    due_date: ''
  });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);
      setStatusBox(null);

      const res = await fetch('/api/tickets');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Tickets konnten nicht geladen werden.');
      }

      setTickets(json.data || []);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Tickets konnten nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  function updateNewTicket(key, value) {
    setNewTicket((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function createTicket(e) {
    e.preventDefault();

    if (!newTicket.title.trim()) {
      setStatusBox({
        type: 'error',
        message: 'Bitte eine Überschrift für das Ticket eingeben.'
      });
      return;
    }

    try {
      setCreating(true);
      setStatusBox(null);

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundennummer: newTicket.kundennummer,
          title: newTicket.title,
          description: newTicket.description,
          category: newTicket.category || 'Allgemein',
          priority: newTicket.priority,
          created_by_type: 'employee',
          created_by: 'Mitarbeiter',
          assigned_to: newTicket.assigned_to,
          due_date: newTicket.due_date || null
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Ticket konnte nicht erstellt werden.');
      }

      setStatusBox({
        type: 'success',
        message: 'Ticket wurde erstellt.'
      });

      setNewTicket({
        kundennummer: '',
        title: '',
        description: '',
        category: '',
        priority: 'normal',
        assigned_to: '',
        due_date: ''
      });

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

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const kundennummerMatch =
        !kundennummerFilter.trim() ||
        String(ticket.kundennummer || '')
          .toLowerCase()
          .includes(kundennummerFilter.trim().toLowerCase());

      const assignedToMatch =
        !assignedToFilter.trim() ||
        String(ticket.assigned_to || '')
          .toLowerCase()
          .includes(assignedToFilter.trim().toLowerCase());

      const categoryMatch =
        !categoryFilter.trim() ||
        String(ticket.category || '')
          .toLowerCase()
          .includes(categoryFilter.trim().toLowerCase());

      return kundennummerMatch && assignedToMatch && categoryMatch;
    });
  }, [tickets, kundennummerFilter, assignedToFilter, categoryFilter]);

  const groupedTickets = useMemo(() => {
    const groups = {};
    boardColumns.forEach((column) => {
      groups[column.key] = [];
    });

    filteredTickets.forEach((ticket) => {
      const key = ticket.internal_status || 'neu';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ticket);
    });

    return groups;
  }, [filteredTickets]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      neu: tickets.filter((item) => item.internal_status === 'neu').length,
      inBearbeitung: tickets.filter((item) => item.internal_status === 'in_bearbeitung').length,
      wartet: tickets.filter((item) =>
        ['wartet_auf_kunde', 'wartet_intern'].includes(item.internal_status)
      ).length,
      erledigt: tickets.filter((item) => item.internal_status === 'erledigt').length
    };
  }, [tickets]);

  return (
    <main style={pageWrap}>
      <div style={pageInner}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={title}>Tickets</h1>
          <p style={subtitle}>
            Interne Tafelansicht für alle Tickets. Oben können neue Tickets erstellt werden.
            Klicken Sie auf eine Karte, um die vollständige Ticketansicht zu öffnen.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={createCard}>
          <h2 style={sectionTitleNoMargin}>Neues Ticket erstellen</h2>

          <form onSubmit={createTicket} style={createForm}>
            <div style={formGrid}>
              <div style={singleFieldWrap}>
                <label style={labelStyle}>Kundennummer</label>
                <input
                  type="text"
                  value={newTicket.kundennummer}
                  onChange={(e) => updateNewTicket('kundennummer', e.target.value)}
                  placeholder="z. B. K-10023"
                  style={inputStyle}
                />
              </div>

              <div style={singleFieldWrap}>
                <label style={labelStyle}>Kategorie</label>
                <input
                  type="text"
                  value={newTicket.category}
                  onChange={(e) => updateNewTicket('category', e.target.value)}
                  placeholder="z. B. Gründung, Lohn, Buchhaltung"
                  style={inputStyle}
                />
              </div>

              <div style={singleFieldWrap}>
                <label style={labelStyle}>Priorität</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => updateNewTicket('priority', e.target.value)}
                  style={inputStyle}
                >
                  {priorityOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div style={singleFieldWrap}>
                <label style={labelStyle}>Zuständig</label>
                <input
                  type="text"
                  value={newTicket.assigned_to}
                  onChange={(e) => updateNewTicket('assigned_to', e.target.value)}
                  placeholder="z. B. Erjon"
                  style={inputStyle}
                />
              </div>

              <div style={singleFieldWrap}>
                <label style={labelStyle}>Fällig bis</label>
                <input
                  type="date"
                  value={newTicket.due_date}
                  onChange={(e) => updateNewTicket('due_date', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={singleFieldWrapWide}>
                <label style={labelStyle}>Überschrift</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => updateNewTicket('title', e.target.value)}
                  placeholder="Kurze Überschrift für das Ticket"
                  style={inputStyle}
                />
              </div>

              <div style={singleFieldWrapFull}>
                <label style={labelStyle}>Beschreibung</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => updateNewTicket('description', e.target.value)}
                  placeholder="Problem, Anfrage oder Aufgabe beschreiben"
                  style={textareaStyle}
                />
              </div>
            </div>

            <div style={createFooter}>
              <div style={footerHint}>
                Intern erstellte Tickets werden im Kundenstatus direkt als
                <strong> In Bearbeitung</strong> angelegt.
              </div>

              <button type="submit" style={submitButton} disabled={creating}>
                {creating ? 'Ticket wird erstellt…' : 'Ticket erstellen'}
              </button>
            </div>
          </form>
        </section>

        <section style={statsGrid}>
          <div style={statCard}>
            <div style={statLabel}>Gesamt</div>
            <div style={statValue}>{stats.total}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Neu</div>
            <div style={statValue}>{stats.neu}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>In Bearbeitung</div>
            <div style={statValue}>{stats.inBearbeitung}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Wartend</div>
            <div style={statValue}>{stats.wartet}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Erledigt</div>
            <div style={statValue}>{stats.erledigt}</div>
          </div>
        </section>

        <section style={filterCard}>
          <div style={filterHeader}>
            <h2 style={sectionTitleNoMargin}>Filter</h2>
            <button type="button" onClick={loadTickets} style={secondaryButton}>
              Aktualisieren
            </button>
          </div>

          <div style={filterGrid}>
            <div style={singleFieldWrap}>
              <label style={labelStyle}>Kundennummer</label>
              <input
                type="text"
                value={kundennummerFilter}
                onChange={(e) => setKundennummerFilter(e.target.value)}
                placeholder="z. B. K-10023"
                style={inputStyle}
              />
            </div>

            <div style={singleFieldWrap}>
              <label style={labelStyle}>Zuständig</label>
              <input
                type="text"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                placeholder="z. B. Erjon"
                style={inputStyle}
              />
            </div>

            <div style={singleFieldWrap}>
              <label style={labelStyle}>Kategorie</label>
              <input
                type="text"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                placeholder="z. B. Lohn"
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div style={infoBox}>Tickets werden geladen…</div>
        ) : (
          <section style={boardSection}>
            <div style={boardWrap}>
              {boardColumns.map((column) => (
                <div key={column.key} style={columnCard}>
                  <div style={columnHeader}>
                    <div style={columnTitle}>{column.label}</div>
                    <div style={columnCount}>
                      {groupedTickets[column.key]?.length || 0}
                    </div>
                  </div>

                  <div style={columnBody}>
                    {(groupedTickets[column.key] || []).length === 0 ? (
                      <div style={emptyCard}>Keine Tickets</div>
                    ) : (
                      groupedTickets[column.key].map((ticket) => (
                        <Link
                          key={ticket.id}
                          href={`/intern/tickets/${ticket.id}`}
                          style={ticketCard}
                        >
                          <div style={ticketCardTop}>
                            <span style={ticketNumber}>{ticket.ticket_number || '—'}</span>
                            <span style={priorityBadge(ticket.priority)}>
                              {ticket.priority || 'normal'}
                            </span>
                          </div>

                          <div style={ticketTitle}>{ticket.title}</div>

                          <div style={ticketMeta}>Mandant: {ticket.kundennummer || '—'}</div>
                          <div style={ticketMeta}>Kategorie: {ticket.category || '—'}</div>
                          <div style={ticketMeta}>Zuständig: {ticket.assigned_to || '—'}</div>
                          <div style={ticketMeta}>
                            Fällig: {ticket.due_date ? formatDate(ticket.due_date) : '—'}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function priorityBadge(priority) {
  if (priority === 'kritisch') return badgeStyle('#fef3f2', '#b42318');
  if (priority === 'hoch') return badgeStyle('#fff7ed', '#c4320a');
  if (priority === 'niedrig') return badgeStyle('#f2f4f7', '#667085');
  return badgeStyle('#eff8ff', '#175cd3'); }

function badgeStyle(background, color) {
  return {
    padding: '5px 10px',
    borderRadius: '999px',
    background,
    color,
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase'
  };
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('de-DE');
}

const pageWrap = {
  minHeight: '100vh',
  background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
  padding: '32px 20px 60px'
};

const pageInner = {
  maxWidth: '1380px',
  margin: '0 auto'
};

const heroCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '24px',
  padding: '34px 36px',
  boxShadow: '0 10px 30px rgba(16, 24, 40, 0.05)',
  marginBottom: '22px'
};

const createCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '26px 28px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)',
  marginBottom: '18px'
};

const createForm = {
  marginTop: '18px',
  display: 'grid',
  gap: '18px'
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px'
};

const singleFieldWrap = {
  display: 'grid',
  gap: '8px'
};

const singleFieldWrapWide = {
  display: 'grid',
  gap: '8px',
  gridColumn: 'span 2'
};

const singleFieldWrapFull = {
  display: 'grid',
  gap: '8px',
  gridColumn: '1 / -1'
};

const createFooter = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap'
};

const filterCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '22px',
  padding: '26px 28px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)',
  marginBottom: '18px'
};

const boardSection = {
  marginBottom: '18px'
};

const boardWrap = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(220px, 1fr))',
  gap: '14px',
  alignItems: 'start',
  overflowX: 'auto'
};

const columnCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '20px',
  padding: '16px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)',
  minHeight: '420px'
};

const columnHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '14px'
};

const columnTitle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#101828'
};

const columnCount = {
  minWidth: '28px',
  height: '28px',
  borderRadius: '999px',
  background: '#f2f4f7',
  color: '#344054',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: '700'
};

const columnBody = {
  display: 'grid',
  gap: '12px'
};

const emptyCard = {
  border: '1px dashed #d0d5dd',
  borderRadius: '14px',
  padding: '16px',
  color: '#667085',
  fontSize: '14px',
  background: '#fcfcfd'
};

const ticketCard = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: '1px solid #eceff3',
  borderRadius: '16px',
  padding: '14px',
  background: '#fcfcfd',
  cursor: 'pointer',
  textDecoration: 'none'
};

const ticketCardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px'
};

const ticketNumber = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#667085'
};

const ticketTitle = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#101828',
  marginBottom: '10px',
  lineHeight: 1.5
};

const ticketMeta = {
  fontSize: '13px',
  color: '#667085',
  lineHeight: 1.6
};

const badge = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: '999px',
  border: '1px solid #d8d2c6',
  background: '#faf8f3',
  color: '#5f5a4f',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '18px'
};

const title = {
  fontSize: '38px',
  fontWeight: '700',
  color: '#101828',
  margin: '0 0 10px'
};

const subtitle = {
  fontSize: '16px',
  lineHeight: 1.75,
  color: '#475467',
  maxWidth: '900px',
  margin: 0
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '16px',
  marginBottom: '18px'
};

const statCard = {
  background: '#ffffff',
  border: '1px solid #eee7da',
  borderRadius: '18px',
  padding: '20px',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const statLabel = {
  fontSize: '14px',
  color: '#667085',
  marginBottom: '8px'
};

const statValue = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#101828'
};

const filterHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '18px'
};

const sectionTitleNoMargin = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#101828',
  margin: 0
};

const filterGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#344054'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  background: '#fff',
  color: '#101828',
  boxSizing: 'border-box'
};

const textareaStyle = {
  width: '100%',
  minHeight: '120px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontSize: '14px',
  background: '#fff',
  color: '#101828',
  resize: 'vertical',
  boxSizing: 'border-box',
  lineHeight: 1.6
};

const secondaryButton = {
  padding: '11px 14px',
  background: '#ffffff',
  color: '#101828',
  borderRadius: '12px',
  border: '1px solid #d0d5dd',
  fontWeight: '600',
  fontSize: '14px',
  cursor: 'pointer'
};

const submitButton = {
  padding: '16px 22px',
  borderRadius: '14px',
  border: 'none',
  background: '#8c6b43',
  color: '#fff',
  fontWeight: '700',
  fontSize: '15px',
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(140, 107, 67, 0.18)'
};

const footerHint = {
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#667085',
  maxWidth: '760px'
};

const infoBox = {
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708'
};

const errorBox = {
  marginBottom: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#fef3f2',
  border: '1px solid #fecdca',
  color: '#b42318'
};

const successBox = {
  marginBottom: '16px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: '#ecfdf3',
  border: '1px solid #abefc6',
  color: '#067647'
};
