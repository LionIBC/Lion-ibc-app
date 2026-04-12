'use client';

import { useEffect, useRef, useState } from 'react'; import { useParams } from 'next/navigation';

const employeeOptions = [
  'Erjon Godeni',
  'Silvana Sabellek',
  'Klaudia Junske',
  'Jana Junske',
  'Stefan Leiste',
  'Hasan Godeni'
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
  return local.toISOString().slice(0, 16); }

export default function TicketDetailPage() {
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [statusBox, setStatusBox] = useState(null);
  const [savingTicket, setSavingTicket] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

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
      setAttachments(data.data.attachments || []);
      setTasks(
        (data.data.tasks || []).map((task) => ({
          ...task,
          isEditing: false
        }))
      );

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

  function updateTicketField(key, value) {
    setTicket((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function toggleAssignedUser(user) {
    setTicket((prev) => {
      const current = Array.isArray(prev.assigned_users) ? prev.assigned_users : [];
      const exists = current.includes(user);

      return {
        ...prev,
        assigned_users: exists
          ? current.filter((item) => item !== user)
          : [...current, user]
      };
    });
  }

  async function saveTicket() {
    try {
      setSavingTicket(true);

      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          internal_status: ticket.internal_status,
          customer_status: ticket.customer_status,
          assigned_to: ticket.assigned_to,
          assigned_users: ticket.assigned_users || [],
          due_date: ticket.due_date || null,
          appointment_date: ticket.appointment_date || null,
          custom_status: ticket.custom_status || '',
          internal_notes: ticket.internal_notes || ''
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Ticket konnte nicht gespeichert werden.');
      }

      setTicket(json.data);
      setStatusBox({
        type: 'success',
        message: 'Ticket wurde gespeichert.'
      });
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
    const confirmed = window.confirm(
      'Soll dieses Ticket wirklich gelöscht werden? Alle Aufgaben, Nachrichten und Anhänge zu diesem Ticket werden ebenfalls entfernt.'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE'
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Ticket konnte nicht gelöscht werden.');
      }

      window.location.href = '/intern/tickets';
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Ticket konnte nicht gelöscht werden.'
      });
    }
  }

  async function sendMessage(internal = false) {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch('/api/ticket-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: id,
          message: newMessage,
          author: 'Mitarbeiter',
          author_type: 'employee',
          is_internal: internal
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Nachricht konnte nicht gespeichert werden.');
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
          title: newTask,
          assigned_to: newTaskAssignedTo,
          due_date: newTaskDueDate || null
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Aufgabe konnte nicht erstellt werden.');
      }

      setNewTask('');
      setNewTaskAssignedTo('');
      setNewTaskDueDate('');
      await loadTicket();

      setStatusBox({
        type: 'success',
        message: 'Aufgabe wurde hinzugefügt.'
      });
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

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Aufgabe konnte nicht aktualisiert werden.');
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, is_done: !item.is_done } : item
        )
      );
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Aufgabe konnte nicht aktualisiert werden.'
      });
    }
  }

  function startEditTask(taskId) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, isEditing: true } : task
      )
    );
  }

  function cancelEditTask(taskId) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, isEditing: false } : task
      )
    );
    loadTicket();
  }

  function updateTaskField(taskId, key, value) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, [key]: value } : task
      )
    );
  }

  async function saveTask(task) {
    try {
      const res = await fetch(`/api/ticket-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          assigned_to: task.assigned_to || '',
          due_date: task.due_date || null,
          sort_order: Number(task.sort_order || 0),
          is_done: Boolean(task.is_done)
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Aufgabe konnte nicht gespeichert werden.');
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...json.data, isEditing: false } : item
        )
      );

      setStatusBox({
        type: 'success',
        message: 'Aufgabe wurde gespeichert.'
      });
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Aufgabe konnte nicht gespeichert werden.'
      });
    }
  }

  async function deleteTask(taskId) {
    const confirmed = window.confirm('Soll diese Aufgabe wirklich gelöscht werden?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/ticket-tasks/${taskId}`, {
        method: 'DELETE'
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Aufgabe konnte nicht gelöscht werden.');
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      setStatusBox({
        type: 'success',
        message: 'Aufgabe wurde gelöscht.'
      });
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Aufgabe konnte nicht gelöscht werden.'
      });
    }
  }

  async function moveTask(task, direction) {
    const sorted = [...tasks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const index = sorted.findIndex((item) => item.id === task.id);

    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    try {
      await fetch(`/api/ticket-tasks/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sort_order: Number(target.sort_order || 0)
        })
      });

      await fetch(`/api/ticket-tasks/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sort_order: Number(current.sort_order || 0)
        })
      });

      await loadTicket();

      setStatusBox({
        type: 'success',
        message: 'Reihenfolge wurde aktualisiert.'
      });
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Reihenfolge konnte nicht geändert werden.'
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
      formData.append('uploaded_by', 'Mitarbeiter');
      formData.append('uploaded_by_type', 'employee');

      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/ticket-attachments', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Dateien konnten nicht hochgeladen werden.');
      }

      setStatusBox({
        type: 'success',
        message: 'Datei(en) wurden hochgeladen.'
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadTicket();
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

  async function deleteAttachment(attachmentId, fileName) {
    const confirmed = window.confirm(
      `Soll die Datei "${fileName}" wirklich gelöscht werden?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/ticket-attachments?id=${encodeURIComponent(attachmentId)}`, {
        method: 'DELETE'
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Datei konnte nicht gelöscht werden.');
      }

      setStatusBox({
        type: 'success',
        message: 'Datei wurde gelöscht.'
      });

      await loadTicket();
    } catch (error) {
      setStatusBox({
        type: 'error',
        message: error.message || 'Datei konnte nicht gelöscht werden.'
      });
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

  if (loading) return <div style={wrap}>Lade Ticket…</div>;
  if (!ticket) return <div style={wrap}>Ticket nicht gefunden</div>;

  return (
    <main style={wrap}>
      <div style={container}>
        {statusBox?.type === 'error' && <div style={errorBox}>{statusBox.message}</div>}
        {statusBox?.type === 'success' && <div style={successBox}>{statusBox.message}</div>}

        <section style={card}>
          <div style={headerTop}>
            <div>
              <h1 style={mainTitle}>{ticket.title}</h1>
              <div style={metaText}>
                {ticket.ticket_number} · {ticket.customer_name || ticket.mandant_name || ticket.kundennummer || 'ohne Kundennummer'}
              </div>
            </div>

            <div style={headerActions}>
              <button onClick={saveTicket} style={saveButton} disabled={savingTicket}>
                {savingTicket ? 'Speichert…' : 'Ticket speichern'}
              </button>

              <button onClick={deleteTicket} style={deleteTicketButton}>
                Ticket löschen
              </button>
            </div>
          </div>

          <div style={grid3}>
            <div style={field}>
              <label style={label}>Überschrift</label>
              <input
                value={ticket.title || ''}
                onChange={(e) => updateTicketField('title', e.target.value)}
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Kategorie</label>
              <input
                value={ticket.category || ''}
                onChange={(e) => updateTicketField('category', e.target.value)}
                style={input}
              />
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

            <div style={field}>
              <label style={label}>Interner Status</label>
              <select
                value={ticket.internal_status || 'neu'}
                onChange={(e) => updateTicketField('internal_status', e.target.value)}
                style={input}
              >
                <option value="neu">Neu</option>
                <option value="zugewiesen">Zugewiesen</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="wartet_auf_kunde">Wartet auf Kunde</option>
                <option value="wartet_intern">Wartet intern</option>
                <option value="erledigt">Erledigt</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Kundenstatus</label>
              <select
                value={ticket.customer_status || 'neu'}
                onChange={(e) => updateTicketField('customer_status', e.target.value)}
                style={input}
              >
                <option value="neu">Neu</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="rueckfrage">Rückfrage</option>
                <option value="erledigt">Erledigt</option>
              </select>
            </div>

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
              <label style={label}>Zusätzlicher Status</label>
              <input
                value={ticket.custom_status || ''}
                onChange={(e) => updateTicketField('custom_status', e.target.value)}
                placeholder="z. B. Warten auf Behörden"
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

            <div style={field}>
              <label style={label}>Hauptzuständig</label>
              <select
                value={ticket.assigned_to || ''}
                onChange={(e) => updateTicketField('assigned_to', e.target.value)}
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

            <div style={{ ...field, gridColumn: 'span 2' }}>
              <label style={label}>Weitere Beteiligte</label>
              <div style={chipWrap}>
                {employeeOptions.map((user) => {
                  const selected = (ticket.assigned_users || []).includes(user);
                  return (
                    <button
                      key={user}
                      type="button"
                      onClick={() => toggleAssignedUser(user)}
                      style={chipButton(selected)}
                    >
                      {user}
                    </button>
                  );
                })}
              </div>
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
              placeholder="Nur intern sichtbar"
              style={textarea}
            />
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Dateien / Anhänge</h2>

          <div
            style={{
              ...dropzone,
              ...(isDragActive ? dropzoneActive : {})
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div style={dropzoneTitle}>Dateien hier hineinziehen</div>
            <div style={dropzoneText}>
              oder per Klick auswählen. Mehrere Dateien sind möglich.
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => uploadFiles(e.target.files)}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={secondaryButton}
              disabled={uploadingFiles}
            >
              {uploadingFiles ? 'Lädt hoch…' : 'Dateien auswählen'}
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
                    {formatFileSize(file.file_size)} ·{' '}
                    {file.created_at
                      ? new Date(file.created_at).toLocaleString('de-DE')
                      : '—'}
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

                    <button
                      type="button"
                      onClick={() => deleteAttachment(file.id, file.original_name || 'Datei')}
                      style={deleteButton}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Aufgaben / Checkliste</h2>

          {(tasks || []).length === 0 ? (
            <div style={infoBox}>Noch keine Aufgaben vorhanden.</div>
          ) : (
            <div style={taskList}>
              {tasks
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((task, index, arr) => (
                  <div key={task.id} style={taskCard}>
                    {!task.isEditing ? (
                      <>
                        <div style={taskRowTop}>
                          <div style={taskLeft}>
                            <input
                              type="checkbox"
                              checked={task.is_done}
                              onChange={() => toggleTask(task)}
                            />
                            <span
                              style={{
                                ...taskTitle,
                                textDecoration: task.is_done ? 'line-through' : 'none'
                              }}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div style={taskRight}>
                            <button
                              type="button"
                              onClick={() => moveTask(task, 'up')}
                              disabled={index === 0}
                              style={smallButton}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTask(task, 'down')}
                              disabled={index === arr.length - 1}
                              style={smallButton}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditTask(task.id)}
                              style={editButton}
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              style={deleteButton}
                            >
                              Löschen
                            </button>
                          </div>
                        </div>

                        <div style={taskMetaRow}>
                          <span><strong>Zuständig:</strong> {task.assigned_to || 'Nicht gesetzt'}</span>
                          <span><strong>Frist:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString('de-DE') : 'Keine Frist'}</span>
                          <span><strong>Reihenfolge:</strong> {task.sort_order || 0}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={editGrid}>
                          <div style={field}>
                            <label style={label}>Aufgabe</label>
                            <input
                              value={task.title || ''}
                              onChange={(e) => updateTaskField(task.id, 'title', e.target.value)}
                              style={input}
                            />
                          </div>

                          <div style={field}>
                            <label style={label}>Zuständig</label>
                            <select
                              value={task.assigned_to || ''}
                              onChange={(e) => updateTaskField(task.id, 'assigned_to', e.target.value)}
                              style={input}
                            >
                              <option value="">Nicht gesetzt</option>
                              {employeeOptions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={field}>
                            <label style={label}>Frist</label>
                            <input
                              type="date"
                              value={toDateInputValue(task.due_date)}
                              onChange={(e) => updateTaskField(task.id, 'due_date', e.target.value)}
                              style={input}
                            />
                          </div>

                          <div style={field}>
                            <label style={label}>Reihenfolge</label>
                            <input
                              type="number"
                              value={task.sort_order || 0}
                              onChange={(e) =>
                                updateTaskField(task.id, 'sort_order', Number(e.target.value || 0))
                              }
                              style={input}
                            />
                          </div>
                        </div>

                        <div style={taskEditActions}>
                          <button
                            type="button"
                            onClick={() => saveTask(task)}
                            style={saveButton}
                          >
                            Aufgabe speichern
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEditTask(task.id)}
                            style={secondaryButton}
                          >
                            Abbrechen
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}

          <div style={taskCreateBox}>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Neue Aufgabe..."
              style={input}
            />
            <select
              value={newTaskAssignedTo}
              onChange={(e) => setNewTaskAssignedTo(e.target.value)}
              style={input}
            >
              <option value="">Zuständig</option>
              {employeeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              style={input}
            />
            <button onClick={addTask} style={saveButton}>
              Aufgabe hinzufügen
            </button>
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Kommunikation</h2>

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...messageBox,
                background: msg.is_internal ? '#fff4e5' : '#eef6ff'
              }}
            >
              <div style={messageMeta}>
                <strong>{msg.author || 'Unbekannt'}</strong> ·{' '}
                {msg.created_at ? new Date(msg.created_at).toLocaleString('de-DE') : '—'}
                {msg.is_internal ? ' · interne Notiz' : ''}
              </div>
              <div>{msg.message}</div>
            </div>
          ))}

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nachricht oder interne Notiz schreiben..."
            style={textarea}
          />

          <div style={row}>
            <button onClick={() => sendMessage(false)} style={saveButton}>
              Nachricht senden
            </button>
            <button onClick={() => sendMessage(true)} style={secondaryButton}>
              Interne Notiz
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`; }

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
  maxWidth: 1180,
  margin: '0 auto',
  display: 'grid',
  gap: 20
};

const card = {
  background: '#fff',
  padding: 24,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const headerTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  marginBottom: 20
};

const headerActions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const mainTitle = {
  margin: 0,
  fontSize: 30,
  color: '#101828'
};

const metaText = {
  marginTop: 8,
  color: '#667085',
  fontSize: 14
};

const sectionTitle = {
  margin: '0 0 18px 0',
  fontSize: 22,
  color: '#101828'
};

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
  marginBottom: 16
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

const dropzone = {
  border: '2px dashed #d0d5dd',
  borderRadius: 18,
  padding: '26px 20px',
  background: '#fcfcfd',
  display: 'grid',
  gap: 10,
  justifyItems: 'center',
  textAlign: 'center',
  marginBottom: 18,
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
  color: '#667085',
  lineHeight: 1.6
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

const taskList = {
  display: 'grid',
  gap: 14
};

const taskCard = {
  border: '1px solid #eceff3',
  borderRadius: 16,
  padding: 16,
  background: '#fcfcfd'
};

const taskRowTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  flexWrap: 'wrap'
};

const taskLeft = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flex: 1
};

const taskTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: '#101828'
};

const taskRight = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const taskMetaRow = {
  marginTop: 12,
  display: 'flex',
  gap: 18,
  flexWrap: 'wrap',
  fontSize: 13,
  color: '#667085'
};

const editGrid = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 160px',
  gap: 14,
  alignItems: 'end'
};

const taskEditActions = {
  marginTop: 14,
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const taskCreateBox = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr auto',
  gap: 12,
  marginTop: 18
};

const messageBox = {
  padding: 14,
  borderRadius: 12,
  marginBottom: 12
};

const messageMeta = {
  marginBottom: 8,
  fontSize: 13,
  color: '#475467'
};

const row = {
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

const editButton = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#101828',
  fontWeight: 700,
  cursor: 'pointer'
};

const smallButton = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#101828',
  fontWeight: 700,
  cursor: 'pointer'
};

const deleteButton = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #fecdca',
  background: '#fff',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer'
};

const deleteTicketButton = {
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
  borderRadius: '14px',
  background: '#fffaeb',
  border: '1px solid #fedf89',
  color: '#b54708'
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

