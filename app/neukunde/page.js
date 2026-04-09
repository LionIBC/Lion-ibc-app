export default function NeukundePage() {
  return (
    <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>
        Neukundenaufnahme
      </h1>

      <p style={{ color: '#555', marginBottom: '30px' }}>
        Bitte wählen Sie die passende Anfrage aus.
      </p>

      <div style={{ display: 'grid', gap: '20px' }}>
        
        <a
          href="/neukunde/beratung"
          style={{
            display: 'block',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            textDecoration: 'none',
            color: '#111'
          }}
        >
          <h2>Buchhaltung / Lohn / Beratung</h2>
          <p>Für bestehende Unternehmen</p>
        </a>

        <a
          href="/neukunde/gruendung"
          style={{
            display: 'block',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            textDecoration: 'none',
            color: '#111'
          }}
        >
          <h2>Unternehmensgründung</h2>
          <p>Für neue Unternehmen</p>
        </a>

      </div>
    </main>
  );
}
