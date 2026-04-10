export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          border: '1px solid #e7e2d8',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
        }}
      >
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{ height: '90px', width: 'auto' }}
          />
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            borderRadius: '999px',
            border: '1px solid #d8d2c6',
            background: '#faf8f3',
            color: '#5f5a4f',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '18px'
          }}
        >
          Login
        </div>

        <h1
          style={{
            fontSize: '30px',
            fontWeight: '700',
            color: '#101828',
            margin: '0 0 10px'
          }}
        >
          Zugang zum Portal
        </h1>

        <p
          style={{
            color: '#667085',
            fontSize: '15px',
            lineHeight: 1.7,
            marginBottom: '24px'
          }}
        >
          Dieser Bereich wird aktuell aufgebaut. Der Login wird im nächsten Schritt
          mit Benutzerzugängen, Passwortvergabe und sicherem Zugriff ergänzt.
        </p>

        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>E-Mail</label>
            <input
              type="email"
              placeholder="name@unternehmen.de"
              style={inputStyle}
              disabled
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Passwort</label>
            <input
              type="password"
              placeholder="••••••••"
              style={inputStyle}
              disabled
            />
          </div>
        </div>

        <button style={buttonStyle} disabled>
          Login folgt
        </button>

        <p
          style={{
            marginTop: '16px',
            fontSize: '13px',
            color: '#98a2b3',
            lineHeight: 1.6
          }}
        >
          Hinweis: Diese Seite ist aktuell als Platzhalter angelegt und wird
          anschließend mit dem echten Login-System verbunden.
        </p>
      </div>
    </main>
  );
}


