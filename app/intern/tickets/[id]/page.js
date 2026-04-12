'use client';

import { useEffect, useRef, useState } from 'react'; import { useParams } from 'next/navigation';

const employeeOptions = [
  'Erjon Godeni',
  'Silvana Sabellek',
  'Klaudia Junske',
  'Jana Junske',
  'Stefan Leiste',
  'Khaoula Sahel',
  'Jennifer Enter Pineker',
  'Hasan Godeni'
];

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
    if (id) loadTicket();
  }, [id]);

  async function loadTicket() {
    try {
      setLoading(true);

      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setTicket(data.data.ticket);
      setMessages(data.data.messages || []);
      setTasks(data.data.tasks || []);
      setAttachments(data.data.attachments || []);
    } catch (err) {
      setStatusBox({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  function updateTicketField(key, value) {
    setTicket((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAssignedUser(user) {
    setTicket((prev) => {
      const list = prev.assigned_users || [];
      return {
        ...prev,
        assigned_users: list.includes(user)
          ? list.filter((u) => u !== user)
          : [...list, user]
      };
    });
  }

  async function saveTicket() {
    setSavingTicket(true);

    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });

    setSavingTicket(false);

    if (res.ok) {
      setStatusBox({ type: 'success', message: 'Gespeichert' });
    }
  }

  async function deleteTicket() {
    if (!confirm('Ticket wirklich löschen?')) return;

    await fetch(`/api/tickets/${id}`, {
      method: 'DELETE'
    });

    window.location.href = '/intern/tickets';
  }

  async function addTask() {
    if (!newTask) return;

    await fetch('/api/ticket-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: id,
        title: newTask,
        assigned_to: newTaskAssignedTo,
        due_date: newTaskDueDate
      })
    });

    setNewTask('');
    setNewTaskAssignedTo('');
    setNewTaskDueDate('');
    loadTicket();
  }

  async function toggleTask(task) {
    await fetch(`/api/ticket-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: !task.is_done })
    });

    loadTicket();
  }

  async function sendMessage(internal = false) {
    if (!newMessage) return;

    await fetch('/api/ticket-messages', {
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

    setNewMessage('');
    loadTicket();
  }

  async function uploadFiles(fileList) {
    const formData = new FormData();
    formData.append('ticket_id', id);

    Array.from(fileList).forEach((file) => {
      formData.append('files', file);
    });

    await fetch('/api/ticket-attachments', {
      method: 'POST',
      body: formData
    });

    loadTicket();
  }

  if (loading) return <div style={{ padding: 40 }}>Lade...</div>;
  if (!ticket) return <div>Fehler</div>;

  return (
    <main style={{ padding: 40 }}>
      <h1>{ticket.title}</h1>

      <input
        value={ticket.title || ''}
        onChange={(e) =>
          updateTicketField('title', e.target.value)
        }
      />

      <textarea
        value={ticket.description || ''}
        onChange={(e) =>
          updateTicketField('description', e.target.value)
        }
      />

      <br /><br />

      <button onClick={saveTicket}>
        Speichern
      </button>

      <button onClick={deleteTicket} style={{ marginLeft: 10 }}>
        Löschen
      </button>

      <hr />

      <h3>Aufgaben</h3>

      {tasks.map((task) => (
        <div key={task.id}>
          <input
            type="checkbox"
            checked={task.is_done}
            onChange={() => toggleTask(task)}
          />
          {task.title} ({task.assigned_to})
        </div>
      ))}

      <input
        placeholder="Neue Aufgabe"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
      />

      <select
        value={newTaskAssignedTo}
        onChange={(e) => setNewTaskAssignedTo(e.target.value)}
      >
        <option value="">Zuständig</option>
        {employeeOptions.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>

      <input
        type="date"
        value={newTaskDueDate}
        onChange={(e) => setNewTaskDueDate(e.target.value)}
      />

      <button onClick={addTask}>
        Aufgabe hinzufügen
      </button>

      <hr />

      <h3>Dateien</h3>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => uploadFiles(e.target.files)}
      />

      {attachments.map((file) => (
        <div key={file.id}>{file.original_name}</div>
      ))}

      <hr />

      <h3>Nachrichten</h3>

      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.message} {msg.is_internal && '(intern)'}
        </div>
      ))}

      <textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />

      <button onClick={() => sendMessage(false)}>
        Nachricht senden
      </button>

      <button onClick={() => sendMessage(true)}>
        Intern
      </button>
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
