'use client';

import { useEffect, useState } from 'react'; import { useParams } from 'next/navigation';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('de-DE');
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('de-DE');
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`; }

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

export default function PortalTicketDetailPage() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusBox, setStatusBox] = useState(null);

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  async function loadTicket() {
    try {
      setLoading(true);

      const res = await fetch(`/api/portal/tickets/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Ticket konnte nicht geladen werden.');
      }

      setTicket(data.data.ticket);
      setMessages(data.data.messages || []);
      setAttachments(data.data.attachments || []);
      setStatusBox(null);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Ticket konnte nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      const res = await fetch('/api/portal/ticket-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: id,
          message: newMessage
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Nachricht konnte nicht gesendet werden.');
      }

      setNewMessage('');
      setStatusBox({
        type: 'success',
        message: 'Nachricht wurde gesendet.'
      });

      await loadTicket();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Nachricht konnte nicht gesendet werden.'
      });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <main style={wrap}><div style={container}>Lade Ticket…</div></main>;
  }

  if (!ticket) {
    return <main style={wrap}><div style={container}>Ticket nicht gefunden.</div></main>;
  }

  return (
    <main style={wrap}>
      <div style={container}>
        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={heroCard}>
          <div style={statusRow}>
            <span
              style={{
                ...statusBadge,
                color: getStatusColor(ticket.customer_status)
              }}
            >
              {getStatusLabel(ticket.customer_status)}
            </span>
          </div>

          <h1 style={title}>{ticket.title || 'Ohne Titel'}</h1>

          {ticket.description ? (
            <p style={description}>{ticket.description}</p>
          ) : null}

          <div style={metaGrid}>
            <div style={metaItem}>
              <div style={metaLabel}>Kundennummer</div>
              <div style={metaValue}>{ticket.kundennummer || '—'}</div>
            </div>

            <div style={metaItem}>
              <div style={metaLabel}>Termin</div>
              <div style={metaValue}>
                {ticket.appointment_date ? formatDateTime(ticket.appointment_date) : 'Kein Termin'}
              </div>
            </div>

            <div style={metaItem}>
              <div style={metaLabel}>Letzte Änderung</div>
              <div style={metaValue}>
                {ticket.updated_at ? formatDate(ticket.updated_at) : '—'}
              </div>
            </div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Dateien</h2>

          {attachments.length === 0 ? (
            <div style={emptyBox}>Aktuell sind keine Dateien freigegeben.</div>
          ) : (
            <div style={attachmentGrid}>
              {attachments.map((file) => (
                <div key={file.id} style={attachmentCard}>
                  <div style={attachmentName}>{file.original_name || 'Datei'}</div>
                  <div style={attachmentMeta}>
                    {formatFileSize(file.file_size)} · {file.created_at ? formatDate(file.created_at) : '—'}
                  </div>

                  <div style={attachmentActions}>
                    {file.signed_url ? (
                      <a
                        href={file.signed_url}
                        target="_blank"
                        rel="noreferrer"
                        style={openLink}
                      >
                        Öffnen
                      </a>
                    ) : null}

                    {file.download_url ? (
                      <a
                        href={file.download_url}
                        target="_blank"
                        rel="noreferrer"
                        style={downloadLink}
                      >
                        Download
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Nachrichten</h2>

          {messages.length === 0 ? (
            <div style={emptyBox}>Noch keine Nachrichten vorhanden.</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...messageCard,
                  alignSelf: msg.author_type === 'customer' ? 'flex-end' : 'flex-start',
                  background: msg.author_type === 'customer' ? '#eef6ff' : '#fff4e5'
                }}
              >
                <div style={messageMeta}>
                  <strong>{msg.author || 'Support'}</strong> · {formatDateTime(msg.created_at)}
                </div>
                <div>{msg.message}</div>
              </div>
            ))
          )}

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ihre Nachricht an uns…"
            style={textarea}
          />

          <div style={row}>
            <button onClick={sendMessage} style={saveButton} disabled={sending}>
              {sending ? 'Sendet…' : 'Nachricht senden'}
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
  maxWidth: 980,
  margin: '0 auto',
  display: 'grid',
  gap: 20
};

const heroCard = {
  background: '#fff',
  padding: 24,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const card = {
  background: '#fff',
  padding: 24,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const statusRow = {
  display: 'flex',
  justifyContent: 'flex-start',
  marginBottom: 10
};

const statusBadge = {
  fontSize: 13,
  fontWeight: 800
};

const title = {
  margin: 0,
  fontSize: 30,
  color: '#101828'
};

const description = {
  marginTop: 12,
  fontSize: 16,
  lineHeight: 1.6,
  color: '#475467'
};

const metaGrid = {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 14
};

const metaItem = {
  background: '#faf8f3',
  border: '1px solid #ece7dc',
  borderRadius: 14,
  padding: 14
};

const metaLabel = {
  fontSize: 12,
  color: '#667085',
  marginBottom: 6
};

const metaValue = {
  fontSize: 14,
  fontWeight: 700,
  color: '#101828'
};

const sectionTitle = {
  margin: '0 0 16px 0',
  fontSize: 22,
  color: '#101828'
};

const emptyBox = {
  padding: 16,
  borderRadius: 14,
  background: '#faf8f3',
  border: '1px dashed #ddd6c8',
  color: '#667085'
};

const attachmentGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const attachmentCard = {
  border: '1px solid #eceff3',
  borderRadius: 16,
  padding: 16,
  background: '#fcfcfd'
};

const attachmentName = {
  fontSize: 15,
  fontWeight: 700,
  color: '#101828',
  wordBreak: 'break-word'
};

const attachmentMeta = {
  marginTop: 8,
  fontSize: 13,
  color: '#667085'
};

const attachmentActions = {
  marginTop: 14,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const openLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 12px',
  borderRadius: 10,
  background: '#8c6b43',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14
};

const downloadLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 12px',
  borderRadius: 10,
  background: '#fff',
  color: '#101828',
  border: '1px solid #d0d5dd',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14
};

const messageCard = {
  padding: 14,
  borderRadius: 12,
  marginBottom: 12,
  maxWidth: '80%'
};

const messageMeta = {
  marginBottom: 8,
  fontSize: 13,
  color: '#475467'
};

const textarea = {
  width: '100%',
  minHeight: 110,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  boxSizing: 'border-box',
  resize: 'vertical',
  background: '#fff',
  marginTop: 10
};

const row = {
  display: 'flex',
  gap: 10,
  marginTop: 12,
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

