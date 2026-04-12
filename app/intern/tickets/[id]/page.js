'use client';

import { useEffect, useState } from 'react'; import { useParams } from 'next/navigation';

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

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusBox, setStatusBox] = useState(null);

  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskAssigned, setNewTaskAssigned] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  useEffect(() => {
    loadTicket();
  }, []);

  async function loadTicket() {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setTicket(data.data.ticket);
      setMessages(data.data.messages || []);
      setTasks(data.data.tasks || []);
    } catch (err) {
      setStatusBox({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  function updateTicket(key, value) {
    setTicket((prev) => ({ ...prev, [key]: value }));
  }

  function toggleUser(user) {
    const list = ticket.assigned_users || [];
    const exists = list.includes(user);

    updateTicket(
      'assigned_users',
      exists ? list.filter((u) => u !== user) : [...list, user]
    );
  }

  async function saveTicket() {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setStatusBox({ type: 'success', message: 'Gespeichert' });
      setTicket(json.data);
    } catch (err) {
      setStatusBox({ type: 'error', message: err.message });
    }
  }

  async function addTask() {
    if (!newTask.trim()) return;

    await fetch('/api/ticket-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: id,
        title: newTask,
        assigned_to: newTaskAssigned,
        due_date: newTaskDate || null
      })
    });

    setNewTask('');
    setNewTaskAssigned('');
    setNewTaskDate('');
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
    if (!newMessage.trim()) return;

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

  if (loading) return <div style={wrap}>Lade...</div>;
  if (!ticket) return <div style={wrap}>Nicht gefunden</div>;

  return (
    <main style={wrap}>
      <div style={container}>
        {statusBox && (
          <div style={statusBox.type === 'error' ? error : success}>
            {statusBox.message}
          </div>
        )}

        {/* HEADER */}
        <div style={card}>
          <h1>{ticket.title}</h1>

          <div style={grid}>
            <input value={ticket.title} onChange={(e) => updateTicket('title', e.target.value)} />
            <input value={ticket.category} onChange={(e) => updateTicket('category', e.target.value)} />

            <select value={ticket.assigned_to} onChange={(e) => updateTicket('assigned_to', e.target.value)}>
              <option value="">Zuständig</option>
              {employeeOptions.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>

            <input type="date" value={ticket.due_date || ''} onChange={(e) => updateTicket('due_date', e.target.value)} />
          </div>

          <textarea
            value={ticket.description || ''}
            onChange={(e) => updateTicket('description', e.target.value)}
            placeholder="Beschreibung"
          />

          {/* Beteiligte */}
          <div>
            <strong>Beteiligte:</strong>
            <div style={{ display: 'flex', gap: 10 }}>
              {employeeOptions.map((u) => (
                <button key={u} onClick={() => toggleUser(u)}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Interne Notizen */}
          <textarea
            placeholder="Interne Notizen (nur intern sichtbar)"
            value={ticket.internal_notes || ''}
            onChange={(e) => updateTicket('internal_notes', e.target.value)}
          />

          <button onClick={saveTicket}>Speichern</button>
        </div>

        {/* TASKS */}
        <div style={card}>
          <h2>Aufgaben</h2>

          {tasks.map((t) => (
            <div key={t.id}>
              <input type="checkbox" checked={t.is_done} onChange={() => toggleTask(t)} />
              {t.title} ({t.assigned_to || '-'})
            </div>
          ))}

          <div>
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Neue Aufgabe" />
            <select value={newTaskAssigned} onChange={(e) => setNewTaskAssigned(e.target.value)}>
              <option value="">Zuständig</option>
              {employeeOptions.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
            <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} />
            <button onClick={addTask}>+</button>
          </div>
        </div>

        {/* MESSAGES */}
        <div style={card}>
          <h2>Kommunikation</h2>

          {messages.map((m) => (
            <div key={m.id}>
              <b>{m.author}</b>: {m.message} {m.is_internal && '(intern)'}
            </div>
          ))}

          <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />

          <button onClick={() => sendMessage(false)}>Senden</button>
          <button onClick={() => sendMessage(true)}>Intern</button>
        </div>
      </div>
    </main>
  );
}

const wrap = { padding: 30 };
const container = { maxWidth: 900, margin: '0 auto', display: 'grid', gap: 20 }; const card = { background: '#fff', padding: 20, borderRadius: 12 }; const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }; const error = { background: '#fee', padding: 10 }; const success = { background: '#efe', padding: 10 };
