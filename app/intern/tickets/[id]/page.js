'use client';

import { useEffect, useState } from 'react'; import { useParams } from 'next/navigation';

export default function TicketDetailPage() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    loadTicket();
  }, []);

  async function loadTicket() {
    const res = await fetch(`/api/tickets/${id}`);
    const data = await res.json();

    if (res.ok) {
      setTicket(data.data.ticket);
      setMessages(data.data.messages);
      setTasks(data.data.tasks);
    }

    setLoading(false);
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

  async function addTask() {
    if (!newTask.trim()) return;

    await fetch('/api/ticket-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: id,
        title: newTask
      })
    });

    setNewTask('');
    loadTicket();
  }

  async function toggleTask(task) {
    await fetch(`/api/ticket-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_done: !task.is_done
      })
    });

    loadTicket();
  }

  if (loading) return <div style={wrap}>Lade Ticket...</div>;
  if (!ticket) return <div style={wrap}>Ticket nicht gefunden</div>;

  return (
    <main style={wrap}>
      <div style={container}>
        
        {/* HEADER */}
        <div style={card}>
          <h2>{ticket.title}</h2>
          <p><b>Ticket:</b> {ticket.ticket_number}</p>
          <p><b>Kunde:</b> {ticket.kundennummer}</p>
          <p><b>Status:</b> {ticket.internal_status}</p>
          <p><b>Zuständig:</b> {ticket.assigned_to || '-'}</p>
        </div>

        {/* BESCHREIBUNG */}
        <div style={card}>
          <h3>Beschreibung</h3>
          <p>{ticket.description || '-'}</p>
        </div>

        {/* AUFGABEN */}
        <div style={card}>
          <h3>Aufgaben</h3>

          {tasks.map((task) => (
            <div key={task.id} style={taskRow}>
              <input
                type="checkbox"
                checked={task.is_done}
                onChange={() => toggleTask(task)}
              />
              <span style={{
                textDecoration: task.is_done ? 'line-through' : 'none'
              }}>
                {task.title}
              </span>
            </div>
          ))}

          <div style={row}>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Neue Aufgabe..."
              style={input}
            />
            <button onClick={addTask}>+</button>
          </div>
        </div>

        {/* KOMMUNIKATION */}
        <div style={card}>
          <h3>Kommunikation</h3>

          {messages.map((msg) => (
            <div key={msg.id} style={{
              ...message,
              background: msg.is_internal ? '#fff4e5' : '#eef6ff'
            }}>
              <b>{msg.author}</b>
              <p>{msg.message}</p>
            </div>
          ))}

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nachricht schreiben..."
            style={textarea}
          />

          <div style={row}>
            <button onClick={() => sendMessage(false)}>
              Nachricht senden
            </button>

            <button onClick={() => sendMessage(true)}>
              Interne Notiz
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}

const wrap = {
  padding: 30,
  background: '#f5f5f5',
  minHeight: '100vh'
};

const container = {
  maxWidth: 900,
  margin: '0 auto',
  display: 'grid',
  gap: 20
};

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  border: '1px solid #ddd'
};

const row = {
  display: 'flex',
  gap: 10,
  marginTop: 10
};

const input = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ccc'
};

const textarea = {
  width: '100%',
  minHeight: 100,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ccc',
  marginTop: 10
};

const message = {
  padding: 10,
  borderRadius: 8,
  marginBottom: 10
};

const taskRow = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  marginBottom: 8
};

