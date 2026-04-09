import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        padding: '32px 20px 60px'
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{
              height: '120px',
              width: 'auto',
              display: 'block'
            }}
          />
        </div>

        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e7e2d8',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
          }}
        >
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
              marginBottom: '20px'
            }}
          >
            LION IBC DIGITAL · Mandantenportal
          </div>

          <h1
            style={{
              fontSize: '48px',
              lineHeight: 1.1,
              color: '#101828',
              margin: '0 0 20px',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}
          >
            Ihr Zugang zur digitalen Zusammenarbeit mit Lion IBC
          </h1>

          <div
            style={{
              fontSize: '18px',
              color: '#475467',
              maxWidth: '780px',
              marginBottom: '30px',
              lineHeight: 1.7
            }}
          >
            <p>
              Mit Lion IBC Digital steuern wir die Zusammenarbeit mit unseren
              Mandanten effizient, strukturiert und ortsunabhängig.
            </p>

            <p style={{ marginTop: '16px' }}>
              Durch unsere digitalen Prozesse können wir Anfragen schneller
              bearbeiten, Fehler reduzieren und eine einfache sowie klare
              Kommunikation gewährleisten.
            </p>

            <div style={{ marginTop: '24px' }}>
              <strong style={{ display: 'block', marginBottom: '6px' }}>
                Für neue Mandanten
              </strong>
              <span>
                Starten Sie die Zusammenarbeit mit uns digital und strukturiert.
                Übermitteln Sie alle relevanten Informationen einfach und
                vollständig – wir kümmern uns um den Rest.
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '6px' }}>
                Für bestehende Mandanten
              </strong>
              <span>
                Nutzen Sie unser Portal zur Erfassung von Mitarbeiterdaten und
                weiteren Prozessen. Unsere digitalen Systeme ermöglichen eine
                schnelle, fehlerarme und effiziente Bearbeitung.
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              marginTop: '30px',
              alignItems: 'stretch'
            }}
          >
            <div
              style={{
                flex: '1',
                minWidth: '260px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                height: '100%'
              }}
            >
              <h3 style={{ marginBottom: '10px' }}>Neukunde</h3>

              <p
                style={{
                  fontSize: '14px',
                  color: '#667085',
                  marginBottom: '20px'
                }}
              >
                Starten Sie die Zusammenarbeit digital und übermitteln Sie alle
                relevanten Informationen strukturiert.
              </p>

              <Link href="/neukunde" style={primaryButton}>
                Neukunde starten
              </Link>
            </div>

            <div
              style={{
                flex: '1',
                minWidth: '260px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                height: '100%'
              }}
            >
              <h3 style={{ marginBottom: '10px' }}>Bestandskunde</h3>

              <p
                style={{
                  fontSize: '14px',
                  color: '#667085',
                  marginBottom: '20px'
                }}
              >
                Mitarbeiter erfassen und laufende Prozesse digital und
                effizient abwickeln.
              </p>

              <Link href="/mitarbeiter" style={secondaryButton}>
                Zum Bereich
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px 24px',
  borderRadius: '14px',
  background: '#8c6b43',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  border: '1px solid #8c6b43',
  minWidth: '220px'
};

const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px 24px',
  borderRadius: '14px',
  background: '#f9fafb',
  color: '#101828',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  border: '1px solid #d0d5dd',
  minWidth: '220px'
};
