'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const BOARD_COLUMNS = [
  { key: 'neu', label: 'Neu' },
  { key: 'zugewiesen', label: 'Zugewiesen' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung' },
  { key: 'wartet_auf_kunde', label: 'Wartet auf Kunde' },
  { key: 'wartet_intern', label: 'Wartet intern' },
  { key: 'erledigt', label: 'Erledigt' }
];

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
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

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState('normal');

  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setStatusBox(null);

      const [ticketsRes, customersRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/customers')
      ]);

      const ticketsData = await ticketsRes.json();
      const customersData = await customersRes.json();

      if (!ticketsRes.ok) {
        throw new Error(ticketsData?.message || 'Tickets konnten nicht geladen werden.');
      }

      if (!customersRes.ok) {
        throw new Error(customersData?.message || customersData?.error || 'Kunden konnten nicht geladen werden.');
      }

      const customerList = Array.isArray(customersData?.data) ? customersData.data : [];
      const ticketList = Array.isArray(ticketsData?.data) ? ticketsData.data : [];

      setCustomers(customerList);
      setTickets(ticketList);

      if (!newCustomerId && customerList.length > 0) {
        setNewCustomerId(customerList[0].id);
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

  async function createTicket() {
    if (!newTitle.trim()) {
      setStatusBox({ type: 'error', message: 'Bitte einen Titel eingeben.' });
      return;
    }

    if (!newCustomerId) {
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
          title: newTitle,
          description: newDescription,
          customer_id: newCustomerId,
          category: newCategory,
          priority: newPriority,
          customer_status: 'neu',
          internal_status: 'neu',
          created_by: 'Intern',
          created_by_type: 'internal',
          assigned_users: [],
          participants: []
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Ticket konnte nicht erstellt werden.');
      }

      setNewTitle('');
      setNewDescription('');
      setNewCategory('');
      setNewPriority('normal');
      setStatusBox({ type: 'success', message: 'Ticket wurde erstellt.' });

      await loadPage();

      if (data?.data?.id) {
        router.push(`/intern/tickets/${data.data.id}`);
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

  const filteredTickets = useMemo(() => {
    return (tickets || []).filter((ticket) => {
      const customerOk = !filterCustomerId ? true : ticket.customer_id === filterCustomerId;
      const search = normalizeText(filterSearch);
      const searchOk = !search
        ? true
        : normalizeText(ticket.title).includes(search) ||
          normalizeText(ticket.kundenname).includes(search) ||
          normalizeText(ticket.kundennummer).includes(search);

      return customerOk && searchOk;
    });
  }, [tickets, filterCustomerId, filterSearch]);

  const groupedTickets = useMemo(() => {
    const map = {};

    for (const column of BOARD_COLUMNS) {
      map[column.key] = [];
    }

    for (const ticket of filteredTickets) {
      const key = ticket.internal_status || 'neu';
      if (!map[key]) map[key] = [];
      map[key].push(ticket);
    }

    return map;
  }, [filteredTickets]);

  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Tickets</h1>
          <p style={heroText}>
            Interne Ticketübersicht mit Mandantenbezug, Board-Ansicht und direktem Anlegen neuer Tickets.
          </p>
        </section>

        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={card}>
          <h2 style={sectionTitle}>Neues Ticket erstellen</h2>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Mandant</label>
              <select value={newCustomerId} onChange={(e) => setNewCustomerId(e.target.value)} style={input}>
                <option value="">Bitte wählen</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firmenname} ({customer.kundennummer})
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Kategorie</label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="z. B. Buchhaltung"
                style={input}
              />
            </div>

            <div style={{ ...field, gridColumn: 'span 2' }}>
              <label style={label}>Titel</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Kurze Überschrift"
                style={input}
              />
            </div>

            <div style={{ ...field, gridColumn: 'span 2' }}>
              <label style={label}>Beschreibung</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ticketbeschreibung"
                style={textarea}
              />
            </div>
          </div>

          <div style={actionRow}>
            <button type="button" onClick={createTicket} style={saveButton} disabled={creating}>
              {creating ? 'Erstellt…' : 'Ticket erstellen'}
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Filter</h2>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Mandant</label>
              <select value={filterCustomerId} onChange={(e) => setFilterCustomerId(e.target.value)} style={input}>
                <option value="">Alle</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firmenname} ({customer.kundennummer})
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Suche</label>
              <input
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Titel, Kundenname oder Kundennummer"
                style={input}
              />
            </div>
          </div>
        </section>

        <section style={boardWrap}>
          {loading ? (
            <div style={infoBox}>Tickets werden geladen…</div>
          ) : (
            BOARD_COLUMNS.map((column) => (
              <div key={column.key} style={boardColumn}>
                <div style={columnHeader}>
                  <span style={columnTitle}>{column.label}</span>
                  <span style={columnCount}>{(groupedTickets[column.key] || []).length}</span>
                </div>

                <div style={columnBody}>
                  {(groupedTickets[column.key] || []).length === 0 ? (
                    <div style={emptyCard}>Keine Tickets</div>
                  ) : (
                    (groupedTickets[column.key] || []).map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => router.push(`/intern/tickets/${ticket.id}`)}
                        style={ticketCardButton}
                      >
                        <div style={ticketCustomer}>
                          {ticket.kundenname || 'Ohne Mandant'}
                        </div>
                        <div style={ticketNumber}>{ticket.kundennummer || '—'}</div>
                        <div style={ticketTitle}>{ticket.title || 'Ohne Titel'}</div>
                        <div style={ticketMeta}>
                          {ticket.category || 'Ohne Kategorie'}
                          {ticket.due_date ? ` · Fällig ${formatDate(ticket.due_date)}` : ''}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

const wrap = { padding: 30, background: '#f7f5ef', minHeight: '100vh' };
const container = { maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 20 };
const heroCard = { background: '#fff', padding: 28, borderRadius: 20, border: '1px solid #e7e1d6', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)' };
const badge = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: 999, border: '1px solid #ddd6c8', color: '#6b5b45', background: '#faf8f3', fontSize: 13, fontWeight: 700, marginBottom: 12 };
const mainTitle = { margin: 0, fontSize: 30, color: '#101828' };
const heroText = { margin: '12px 0 0 0', fontSize: 16, color: '#475467', lineHeight: 1.6 };
const card = { background: '#fff', padding: 24, borderRadius: 18, border: '1px solid #e7e1d6', boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)' };
const sectionTitle = { margin: '0 0 16px 0', fontSize: 22, color: '#101828' };
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 };
const field = { display: 'grid', gap: 8 };
const label = { fontSize: 14, fontWeight: 700, color: '#344054' };
const input = { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d0d5dd', boxSizing: 'border-box', background: '#fff' };
const textarea = { width: '100%', minHeight: 110, padding: 12, borderRadius: 12, border: '1px solid #d0d5dd', boxSizing: 'border-box', resize: 'vertical', background: '#fff' };
const actionRow = { display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' };
const saveButton = { padding: '12px 16px', borderRadius: 12, border: 'none', background: '#8c6b43', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const infoBox = { padding: '14px 16px', borderRadius: 14, background: '#fffaeb', border: '1px solid #fedf89', color: '#b54708' };
const errorBox = { padding: '14px 16px', borderRadius: 14, background: '#fef3f2', border: '1px solid #fecdca', color: '#b42318' };
const successBox = { padding: '14px 16px', borderRadius: 14, background: '#ecfdf3', border: '1px solid #abefc6', color: '#067647' };
const boardWrap = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'start' };
const boardColumn = { background: '#f2efe8', borderRadius: 18, padding: 12, minHeight: 420, border: '1px solid #e5dfd2' };
const columnHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '4px 6px' };
const columnTitle = { fontSize: 18, fontWeight: 800, color: '#101828' };
const columnCount = { minWidth: 24, height: 24, borderRadius: 999, background: '#fff', border: '1px solid #ddd6c8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6b5b45', padding: '0 8px' };
const columnBody = { display: 'grid', gap: 10 };
const emptyCard = { padding: '14px 12px', borderRadius: 14, background: '#fff', border: '1px dashed #d6d0c4', color: '#98a2b3', textAlign: 'center', fontSize: 14 };
const ticketCardButton = { width: '100%', textAlign: 'left', border: '1px solid #eceff3', borderRadius: 14, padding: 12, background: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16, 24, 40, 0.04)' };
const ticketCustomer = { fontSize: 14, fontWeight: 800, color: '#101828', marginBottom: 2 };
const ticketNumber = { fontSize: 12, color: '#667085', marginBottom: 8 };
const ticketTitle = { fontSize: 14, color: '#475467', lineHeight: 1.4, fontWeight: 700 };
const ticketMeta = { marginTop: 8, fontSize: 12, color: '#667085' };

