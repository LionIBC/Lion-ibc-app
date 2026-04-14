'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: 'neu', label: 'Neu' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung' },
  { value: 'rueckfrage', label: 'Rückfrage' },
  { value: 'erledigt', label: 'Erledigt' }
];

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toDateTimeLocalValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('de-DE');
  } catch {
    return '';
  }
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingTicket, setSavingTicket] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [statusBox, setStatusBox] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (id) {
      loadCustomers();
      loadTicket();
    }
  }, [id]);

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (res.ok) {
        setCustomers(Array.isArray(data?.data) ? data.data : []);
      }
    } catch {
      // still continue
    }
  }

  async function loadTicket() {
    try {
      setLoading(true);

      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Ticket konnte nicht geladen werden.');
      }

      setTicket(data.data.ticket);
      setMessages(data.data.messages || []);
      setTasks(data.data.tasks || []);
      setAttachments(data.data.attachments || []);
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Ticket konnte nicht geladen werden.'
      });
    } finally {
      setLoading(false);
    }
  }

  function updateTicketField(key, value) {
    setTicket((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function saveTicket() {
    try {
      setSavingTicket(true);

      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: ticket.customer_id,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          internal_status: ticket.internal_status,
          customer_status: ticket.customer_status,
          due_date: ticket.due_date || null,
          appointment_date: ticket.appointment_date || null,
          custom_status: ticket.custom_status || '',
          internal_notes: ticket.internal_notes || ''
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Ticket konnte nicht gespeichert werden.');
      }

      setTicket(data.data);
      setStatusBox({ type: 'success', message: 'Ticket wurde gespeichert.' });
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Ticket konnte nicht gespeichert werden.'
      });
    } finally {
      setSavingTicket(false);
    }
  }

  async function deleteTicket() {
    const confirmed = window.confirm('Soll dieses Ticket wirklich gelöscht werden?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Ticket konnte nicht gelöscht werden.');
      }

      router.push('/intern/tickets');
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Ticket konnte nicht gelöscht werden.'
      });
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch('/api/ticket-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: id,
          message: newMessage,
          author: 'Intern',
          author_type: 'internal',
          is_internal: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Nachricht konnte nicht gespeichert werden.');
      }

      setNewMessage('');
      await loadTicket();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Nachricht konnte nicht gespeichert werden.'
      });
    }
  }

  async function addTask() {
    if (!newTask.trim()) return;

    try {
      const res = await fetch('/api/ticket-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: id,
          title: newTask
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Aufgabe konnte nicht erstellt werden.');
      }

      setNewTask('');
      await loadTicket();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Aufgabe konnte nicht erstellt werden.'
      });
    }
  }

  async function toggleTask(task) {
    try {
      const res = await fetch(`/api/ticket-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_done: !task.is_done
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Aufgabe konnte nicht aktualisiert werden.');
      }

      await loadTicket();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Aufgabe konnte nicht aktualisiert werden.'
      });
    }
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    try {
      setUploadingFiles(true);

      const formData = new FormData();
      formData.append('ticket_id', id);
      formData.append('uploaded_by', 'Intern');
      formData.append('uploaded_by_type', 'internal');

      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/ticket-attachments', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Dateien konnten nicht hochgeladen werden.');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadTicket();
      setStatusBox({ type: 'success', message: 'Datei(en) wurden hochgeladen.' });
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Dateien konnten nicht hochgeladen werden.'
      });
    } finally {
      setUploadingFiles(false);
      setIsDragActive(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    if (event.dataTransfer?.files?.length) {
      uploadFiles(event.dataTransfer.files);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
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
          <div style={badge}>Intern</div>
          <div style={heroHeader}>
            <div>
              <h1 style={mainTitle}>{ticket.title}</h1>
              <p style={heroText}>
                {ticket.kundenname} ({ticket.kundennummer})
              </p>
            </div>

            <div style={actionRow}>
              <button type="button" onClick={saveTicket} style={saveButton} disabled={savingTicket}>
                {savingTicket ? 'Speichert…' : 'Speichern'}
              </button>
              <button type="button" onClick={deleteTicket} style={deleteButton}>
                Löschen
              </button>
            </div>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Ticketdaten</h2>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Titel</label>
              <input value={ticket.title || ''} onChange={(e) => updateTicketField('title', e.target.value)} style={input} />
            </div>

            <div style={field}>
              <label style={label}>Mandant</label>
              <select value={ticket.customer_id || ''} onChange={(e) => updateTicketField('customer_id', e.target.value)} style={input}>
                <option value="">Bitte wählen</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firmenname} ({c.kundennummer})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Interner Status</label>
              <select
                value={ticket.internal_status || 'neu'}
                onChange={(e) => updateTicketField('internal_status', e.target.value)}
                style={input}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Kundenstatus</label>
              <select
                value={ticket.customer_status || 'neu'}
                onChange={(e) => updateTicketField('customer_status', e.target.value)}
                style={input}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={field}>
              <label style={label}>Priorität</label>
              <select
                value={ticket.priority || 'normal'}
                onChange={(e) => updateTicketField('priority', e.target.value)}
                style={input}
              >
                <option value="niedrig">niedrig</option>
                <option value="normal">normal</option>
                <option value="hoch">hoch</option>
                <option value="kritisch">kritisch</option>
              </select>
            </div>
          </div>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Kategorie</label>
              <input
                value={ticket.category || ''}
                onChange={(e) => updateTicketField('category', e.target.value)}
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Zusatzstatus</label>
              <input
                value={ticket.custom_status || ''}
                onChange={(e) => updateTicketField('custom_status', e.target.value)}
                style={input}
              />
            </div>
          </div>

          <div style={grid2}>
            <div style={field}>
              <label style={label}>Fällig bis</label>
              <input
                type="date"
                value={toDateInputValue(ticket.due_date)}
                onChange={(e) => updateTicketField('due_date', e.target.value || null)}
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Termin</label>
              <input
                type="datetime-local"
                value={toDateTimeLocalValue(ticket.appointment_date)}
                onChange={(e) => updateTicketField('appointment_date', e.target.value || null)}
                style={input}
              />
            </div>
          </div>

          <div style={field}>
            <label style={label}>Beschreibung</label>
            <textarea
              value={ticket.description || ''}
              onChange={(e) => updateTicketField('description', e.target.value)}
              style={textarea}
            />
          </div>

          <div style={field}>
            <label style={label}>Interne Notizen</label>
            <textarea
              value={ticket.internal_notes || ''}
              onChange={(e) => updateTicketField('internal_notes', e.target.value)}
              style={textarea}
            />
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Anhänge</h2>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              ...dropzone,
              ...(isDragActive ? dropzoneActive : {})
            }}
          >
            <div style={dropzoneTitle}>Dateien hier hineinziehen</div>
            <div style={dropzoneText}>oder per Klick auswählen.</div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => uploadFiles(e.target.files)}
            />

            <button type="button" onClick={() => fileInputRef.current?.click()} style={secondaryButton}>
              Dateien auswählen
            </button>
          </div>

          {attachments.length === 0 ? (
            <div style={infoBox}>Noch keine Anhänge vorhanden.</div>
          ) : (
            <div style={attachmentGrid}>
              {attachments.map((file) => (
                <div key={file.id} style={attachmentCard}>
                  <div style={attachmentName}>{file.original_name || 'Datei'}</div>
                  <div style={attachmentMeta}>
                    {formatFileSize(file.file_size)} · {formatDateTime(file.created_at)}
                  </div>

                  <div style={documentActions}>
                    {file.signed_url ? (
                      <a href={file.signed_url} target="_blank" rel="noreferrer" style={openLink}>
                        Öffnen
                      </a>
                    ) : null}
                    {file.download_url ? (
                      <a href={file.download_url} target="_blank" rel="noreferrer" style={downloadLink}>
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
          <h2 style={sectionTitle}>Aufgaben</h2>

          {tasks.length === 0 ? (
            <div style={infoBox}>Noch keine Aufgaben vorhanden.</div>
          ) : (
            <div style={taskList}>
              {tasks.map((task) => (
                <label key={task.id} style={taskRow}>
                  <input type="checkbox" checked={Boolean(task.is_done)} onChange={() => toggleTask(task)} />
                  <span style={{ textDecoration: task.is_done ? 'line-through' : 'none' }}>{task.title}</span>
                </label>
              ))}
            </div>
          )}

          <div style={actionRow}>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Neue Aufgabe"
              style={{ ...input, maxWidth: 360 }}
            />
            <button type="button" onClick={addTask} style={saveButton}>
              Aufgabe hinzufügen
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Interne Kommunikation</h2>

          {messages.length === 0 ? (
            <div style={infoBox}>Noch keine Nachrichten vorhanden.</div>
          ) : (
            <div style={messageList}>
              {messages.map((msg) => (
                <div key={msg.id} style={messageCard}>
                  <div style={messageMeta}>
                    <strong>{msg.author || 'Intern'}</strong> · {formatDateTime(msg.created_at)}
                  </div>
                  <div>{msg.message}</div>
                </div>
              ))}
            </div>
          )}

          <div style={field}>
            <label style={label}>Neue Nachricht</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={textarea}
              placeholder="Interne Nachricht oder Bearbeitungsnotiz"
            />
          </div>

          <div style={actionRow}>
            <button type="button" onClick={sendMessage} style={saveButton}>
              Nachricht speichern
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
  maxWidth: 1180,
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
  justifyContent: 'space-between',
  alignItems: 'flex-start',
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

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
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

const secondaryButton = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#101828',
  fontWeight: 700,
  cursor: 'pointer'
};

const deleteButton = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #fecdca',
  background: '#fff',
  color: '#b42318',
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

const dropzone = {
  border: '2px dashed #d0d5dd',
  borderRadius: 18,
  padding: '26px 20px',
  background: '#fcfcfd',
  display: 'grid',
  gap: 10,
  justifyItems: 'center',
  textAlign: 'center',
  transition: 'all 0.15s ease'
};

const dropzoneActive = {
  border: '2px dashed #8c6b43',
  background: '#faf8f3'
};

const dropzoneTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#101828'
};

const dropzoneText = {
  fontSize: 14,
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

const documentActions = {
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

const taskList = {
  display: 'grid',
  gap: 10
};

const taskRow = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: 12,
  borderRadius: 12,
  background: '#fcfcfd',
  border: '1px solid #eceff3'
};

const messageList = {
  display: 'grid',
  gap: 10
};

const messageCard = {
  padding: 14,
  borderRadius: 12,
  background: '#fcfcfd',
  border: '1px solid #eceff3'
};

const messageMeta = {
  marginBottom: 8,
  fontSize: 13,
  color: '#475467'
};
