'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTicketPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    setSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/portal/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Fehler');
      }

      router.push('/portal/tickets');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={wrap}>
      <div style={container}>
        <h1 style={titleStyle}>Neue Anfrage</h1>

        {status?.type === 'error' && (
          <div style={errorBox}>{status.message}</div>
        )}

        <form onSubmit={handleSubmit} style={form}>
          <input
            placeholder="Titel der Anfrage"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
            required
          />

          <textarea
            placeholder="Beschreibung (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={textarea}
          />

          <button style={button} disabled={sending}>
            {sending ? 'Wird erstellt…' : 'Anfrage erstellen'}
          </button>
        </form>
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
  maxWidth: 600,
  margin: '0 auto'
};

const titleStyle = {
  fontSize: 28,
  marginBottom: 20
};

const form = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const input = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #d0d5dd'
};

const textarea = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #d0d5dd',
  minHeight: 120
};

const button = {
  padding: 14,
  borderRadius: 12,
  background: '#8c6b43',
  color: '#fff',
  border: 'none',
  fontWeight: '600'
};

const errorBox = {
  marginBottom: 10,
  padding: 12,
  background: '#fee4e2',
  color: '#b42318',
  borderRadius: 10
};

