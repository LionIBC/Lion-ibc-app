import Link from 'next/link';

export default function VollmachtOverviewPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        padding: '32px 20px 60px'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{ height: '120px', width: 'auto', display: 'block' }}
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
            Vollmachten
          </div>

          <h1
            style={{
              fontSize: '42px',
              lineHeight: 1.15,
              fontWeight: '700',
              letterSpacing: '-0.5px',
              marginBottom: '20px',
              color: '#101828'
            }}
          >
            Übersicht der Vollmachten
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#475467',
              maxWidth: '760px',
              marginBottom: '30px',
              lineHeight: 1.7
            }}
          >
            Bitte wählen Sie die passende Vollmacht. Je nach Leistungsbereich gelten
            unterschiedliche Bevollmächtigungen und Inhalte.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              alignItems: 'stretch'
            }}
          >
            <div style={card}>
              <h3 style={cardTitle}>Unternehmensgründung</h3>
              <p style={cardText}>
                Für Gründungsprozesse, Notar, Gewerbeanmeldung, steuerliche Erfassung
                und die damit verbundenen organisatorischen und behördlichen Schritte.
              </p>

              <Link href="/vollmacht/gruendung" style={primaryButton}>
                Vollmacht ansehen
              </Link>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Beratung / FiBu / Lohn</h3>
              <p style={cardText}>
                Für Finanzbuchhaltung, Lohnabrechnung, Unternehmensberatung und die
                laufende Zusammenarbeit mit Behörden und beteiligten Stellen.
              </p>

              <Link href="/vollmacht/beratung" style={secondaryButton}>
                Vollmacht ansehen
              </Link>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Post- und Empfangsvollmacht</h3>
              <p style={cardText}>
                Für Geschäftsadresse und Virtual Office, insbesondere zur Entgegennahme,
                Bearbeitung und Weiterleitung eingehender Postsendungen.
              </p>

              <Link href="/vollmacht/post-empfang" style={secondaryButton}>
                Vollmacht ansehen
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const card = {
  flex: '1',
  minWidth: '260px',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  height: '100%'
};

const cardTitle = {
  marginBottom: '10px',
  fontSize: '20px',
  color: '#101828'
};

const cardText = {
  fontSize: '14px',
  color: '#667085',
  marginBottom: '20px',
  lineHeight: 1.7
};

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 20px',
  borderRadius: '14px',
  background: '#8c6b43',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '15px',
  border: '1px solid #8c6b43',
  minWidth: '180px'
};

const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 20px',
  borderRadius: '14px',
  background: '#f9fafb',
  color: '#101828',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '15px',
  border: '1px solid #d0d5dd',
  minWidth: '180px'
};
