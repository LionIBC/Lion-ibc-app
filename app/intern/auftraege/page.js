'use client';

import { useEffect, useState } from 'react';

export default function AuftraegePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data.data || []);
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 40 }}>Lade Aufträge...</div>;

  return (
    <main style={{ padding: 30 }}>
      <h1>Aufträge</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => window.location.href='/intern/auftraege/new'}>
          Neuer Auftrag
        </button>
      </div>

      {orders.map((o) => (
        <div key={o.id} style={{
          border: '1px solid #ddd',
          padding: 15,
          marginBottom: 10,
          borderRadius: 8
        }}>
          <strong>{o.order_number}</strong>
          <div>{o.kundenname}</div>
          <div>{o.total} €</div>

          <button onClick={() => window.location.href=`/intern/auftraege/${o.id}`}>
            Öffnen
          </button>
        </div>
      ))}
    </main>
  );
}
