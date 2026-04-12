'use client';

import { useEffect, useMemo, useState } from 'react'; import { useRouter } from 'next/navigation';

const employeeOptions = [
  'Erjon Godeni',
  'Silvana Sabellek',
  'Klaudia Junske',
  'Jana Junske',
  'Stefan Leiste',
  'Hasan Godeni'
];

const baseColumns = [
  { key: 'neu', label: 'Neu' },
  { key: 'zugewiesen', label: 'Zugewiesen' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung' },
  { key: 'wartet_auf_kunde', label: 'Wartet auf Kunde' },
  { key: 'erledigt', label: 'Erledigt' } ];

function formatDate(dateValue) {
  if (!dateValue) return '';
  try {
    return new Date(dateValue).toLocaleDateString('de-DE');
  } catch {
    return '';
  }
}

function formatDateTimeLocal(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase(); }

function getTicketColumnKey(ticket) {
  if (ticket?.custom_status) {
    return `custom:${ticket.custom_status}`;
  }

  return ticket?.internal_status || 'neu'; }

function getTicketCustomerLabel(ticket) {
  return (
    ticket?.customer_name ||
    ticket?.mandant_name ||
    ticket?.kundennummer ||
    'Ohne Mandant'
  );
}

export default function TicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusBox, setStatusBox] = useState(null);

  const [filterKundennummer, setFilterKundennummer] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');

  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    template_id: '',
    kundennummer: '',
    title: '',
    description: '',
    category: '',
    priority: 'normal',
    assigned_to: '',
    assigned_users: [],
    due_date: '',
    appointment_date: '',
    custom_status: ''
  });

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setStatusBox(null);

      const [ticketsRes, templatesRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/ticket-templates').catch(() => null)
      ]);

      const ticketsJson = await ticketsRes.json();

      if (!ticketsRes.ok) {
        throw new Error(ticketsJson?.message || 'Tickets konnten nicht geladen werden.');
      }

      setTickets(Array.isArray(ticketsJson?.data) ? ticketsJson.data : []);

      if (templatesRes) {
        try {
          const templatesJson = await templatesRes.json();
          if (templatesRes.ok) {
            setTemplates(Array.isArray(templatesJson?.data) ? templatesJson.data : []);
          }
        } catch {
          setTemplates([]);
        }
      }
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Seite konnte nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  function updateNewTicketField(key, value) {
    setNewTicket((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function toggleNewTicketAssignedUser(user) {
    setNewTicket((prev) => {
      const list = Array.isArray(prev.assigned_users) ? prev.assigned_users : [];
      const exists = list.includes(user);

      return {
        ...prev,
        assigned_users: exists
          ? list.filter((item) => item !== user)
          : [...list, user]
      };
    });
  }

  async function createTicket() {
    if (!newTicket.title.trim()) {
      setStatusBox({
        type: 'error',
        message: 'Bitte eine Überschrift eintragen.'
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
          template_id: newTicket.template_id || '',
          kundennummer: newTicket.kundennummer || '',
          title: newTicket.title || '',
          description: newTicket.description || '',
          category: newTicket.category || '',
          priority: newTicket.priority || 'normal',
          assigned_to: newTicket.assigned_to || '',
          assigned_users: newTicket.assigned_users || [],
          due_date: newTicket.due_date || null,
          appointment_date: newTicket.appointment_date || null,
          custom_status: newTicket.custom_status || '',
          created_by_type: 'employee',
          created_by: 'Mitarbeiter'
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
        template_id: '',
        kundennummer: '',
        title: '',
        description: '',
        category: '',
        priority: 'normal',
        assigned_to: '',
        assigned_users: [],
        due_date: '',
        appointment_date: '',
        custom_status: ''
      });

      const createdId = json?.data?.id || json?.ticket?.id || '';

      await loadPage();

      if (createdId) {
        router.push(`/intern/tickets/${createdId}`);
      }
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Ticket konnte nicht erstellt werden.'
      });
    } finally {
      setCreating(false);
    }
  }

  const visibleTickets = useMemo(() => {
    return (tickets || []).filter((ticket) => {
      const kundennummerOk = !filterKundennummer.trim()
        ? true
        : normalizeText(ticket.kundennummer).includes(normalizeText(filterKundennummer));

      const assignedToOk = !filterAssignedTo.trim()
        ? true
        : normalizeText(ticket.assigned_to).includes(normalizeText(filterAssignedTo));

      return kundennummerOk && assignedToOk;
    });
  }, [tickets, filterKundennummer, filterAssignedTo]);

  const customColumns = useMemo(() => {
    const labels = [];

    for (const ticket of visibleTickets) {
      const value = String(ticket?.custom_status || '').trim();
      if (value && !labels.includes(value)) {
        labels.push(value);
      }
    }

    return labels.map((label) => ({
      key: `custom:${label}`,
      label
    }));
  }, [visibleTickets]);

  const columns = useMemo(() => {
    return [
      baseColumns[0],
      baseColumns[1],
      baseColumns[2],
      ...customColumns,
      baseColumns[3],
      baseColumns[4]
    ];
  }, [customColumns]);

  const ticketCountByColumn = useMemo(() => {
    const result = {};

    for (const column of columns) {
      result[column.key] = visibleTickets.filter(
        (ticket) => getTicketColumnKey(ticket) === column.key
      ).length;
    }

    return result;
  }, [columns, visibleTickets]);

  const totalCount = visibleTickets.length;
  const neuCount = visibleTickets.filter((ticket) => getTicketColumnKey(ticket) === 'neu').length;
  const inBearbeitungCount = visibleTickets.filter((ticket) => getTicketColumnKey(ticket) === 'in_bearbeitung').length;

  if (loading) {
    return <main style={wrap}><div style={container}>Lade Tickets…</div></main>;
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Tickets</h1>
          <p style={heroText}>
            Interne Tafelansicht für alle Tickets. Oben können neue Tickets mit Hauptzuständigkeit,
            weiteren Beteiligten und optional einer Vorlage erstellt werden.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={card}>
          <h2 style={sectionTitle}>Neues Ticket erstellen</h2>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Vorlage auswählen</label>
              <select
                value={newTicket.template_id}
                onChange={(e) => updateNewTicketField('template_id', e.target.value)}
                style={input}
              >
                <option value="">Keine Vorlage</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name || template.title || 'Vorlage'}
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Kundennummer</label>
              <input
                value={newTicket.kundennummer}
                onChange={(e) => updateNewTicketField('kundennummer', e.target.value)}
                placeholder="z. B. K-10023"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Kategorie</label>
              <input
                value={newTicket.category}
                onChange={(e) => updateNewTicketField('category', e.target.value)}
                placeholder="z. B. Neukundenaufnahme"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Priorität</label>
              <select
                value={newTicket.priority}
                onChange={(e) => updateNewTicketField('priority', e.target.value)}
                style={input}
              >
                <option value="niedrig">niedrig</option>
                <option value="normal">normal</option>
                <option value="hoch">hoch</option>
                <option value="kritisch">kritisch</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Hauptzuständig</label>
              <select
                value={newTicket.assigned_to}
                onChange={(e) => updateNewTicketField('assigned_to', e.target.value)}
                style={input}
              >
                <option value="">Bitte wählen</option>
                {employeeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Fällig bis</label>
              <input
                type="date"
                value={newTicket.due_date}
                onChange={(e) => updateNewTicketField('due_date', e.target.value)}
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Termin</label>
              <input
                type="datetime-local"
                value={newTicket.appointment_date}
                onChange={(e) => updateNewTicketField('appointment_date', e.target.value)}
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Zusätzlicher Bearbeitungsstatus</label>
              <input
                value={newTicket.custom_status}
                onChange={(e) => updateNewTicketField('custom_status', e.target.value)}
                placeholder="leer lassen oder später z. B. Warten auf Behörden"
                style={input}
              />
            </div>

            <div style={{ ...field, gridColumn: 'span 3' }}>
              <label style={label}>Überschrift</label>
              <input
                value={newTicket.title}
                onChange={(e) => updateNewTicketField('title', e.target.value)}
                placeholder="Kurze Überschrift für das Ticket"
                style={input}
              />
            </div>
          </div>

          <div style={{ ...field, marginTop: 12 }}>
            <label style={label}>Weitere Beteiligte</label>
            <div style={chipWrap}>
              {employeeOptions.map((user) => {
                const selected = (newTicket.assigned_users || []).includes(user);
                return (
                  <button
                    key={user}
                    type="button"
                    onClick={() => toggleNewTicketAssignedUser(user)}
                    style={chipButton(selected)}
                  >
                    {user}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ ...field, marginTop: 16 }}>
            <label style={label}>Beschreibung</label>
            <textarea
              value={newTicket.description}
              onChange={(e) => updateNewTicketField('description', e.target.value)}
              placeholder="Problem, Anfrage oder Aufgabe beschreiben"
              style={textarea}
            />
          </div>

          <p style={hintText}>
            Intern erstellte Tickets werden im Kundenstatus direkt als <strong>In Bearbeitung</strong> angelegt.
            Wird eine Vorlage gewählt, werden Ticketdaten und Aufgaben automatisch erzeugt.
            Der zusätzliche Bearbeitungsstatus kann leer bleiben und später im Arbeitsalltag gesetzt werden.
          </p>

          <div style={row}>
            <button onClick={createTicket} style={saveButton} disabled={creating}>
              {creating ? 'Erstellt…' : 'Ticket erstellen'}
            </button>
          </div>
        </section>

        <section style={statsRow}>
          <div style={statCard}>
            <div style={statLabel}>Gesamt</div>
            <div style={statValue}>{totalCount}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Neu</div>
            <div style={statValue}>{neuCount}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>In Bearbeitung</div>
            <div style={statValue}>{inBearbeitungCount}</div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Filter</h2>

          <div style={filterGrid}>
            <div style={field}>
              <label style={label}>Kundennummer</label>
              <input
                value={filterKundennummer}
                onChange={(e) => setFilterKundennummer(e.target.value)}
                placeholder="z. B. K-10023"
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Zuständig</label>
              <input
                value={filterAssignedTo}
                onChange={(e) => setFilterAssignedTo(e.target.value)}
                placeholder="z. B. Erjon"
                style={input}
              />
            </div>
          </div>
        </section>

        <section style={boardWrap}>
          {columns.map((column) => {
            const columnTickets = visibleTickets.filter(
              (ticket) => getTicketColumnKey(ticket) === column.key
            );

            return (
              <div key={column.key} style={boardColumn}>
                <div style={columnHeader}>
                  <span style={columnTitle}>{column.label}</span>
                  <span style={columnCount}>{ticketCountByColumn[column.key] || 0}</span>
                </div>

                <div style={columnBody}>
                  {columnTickets.length === 0 ? (
                    <div style={emptyCard}>Keine Tickets</div>
                  ) : (
                    columnTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => router.push(`/intern/tickets/${ticket.id}`)}
                        style={ticketCardButton}
                      >
                        <div style={ticketCardCustomer}>
                          {getTicketCustomerLabel(ticket)}
                        </div>

                        <div style={ticketCardTitle}>
                          {ticket.title || 'Ohne Titel'}
                        </div>

                        {ticket.appointment_date ? (
                          <div style={ticketMiniMeta}>
                            Termin: {formatDate(ticket.appointment_date)}
                          </div>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
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
