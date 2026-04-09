import Link from 'next/link';

export default function NeukundePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        padding: '32px 20px 60px'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Logo */}
        <div style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{ height: '120px' }}
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
            Neukundenaufnahme
          </div>

          <h1
            style={{
              fontSize: '42px',
              lineHeight: 1.2,
              fontWeight: '700',
              letterSpacing: '-0.5px',
              marginBottom: '20px'
            }}
          >
            Starten Sie Ihre digitale Zusammenarbeit mit Lion IBC
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#475467',
              maxWidth: '700px',
              marginBottom: '30px'
            }}
          >
            Wählen Sie den passenden Bereich. Anschließend führen wir Sie
            strukturiert durch die digitale Aufnahme und alle erforderlichen Angaben.
          </p>

          {/* Auswahl */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              alignItems: 'stretch'
            }}
          >
            {/* Gründung */}
            <div
              style={{
                flex: '1',
                minWidth: '260px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                height: '100%'
              }}
            >
              <h3 style={{ marginBottom: '10px' }}>
                Unternehmensgründung
              </h3>

              <p
                style={{
                  fontSize: '14px',
                  color: '#667085',
                  marginBottom: '20px'
                }}
              >
                Sie gründen ein Unternehmen? Wir begleiten Sie strukturiert durch alle
                Schritte – von der Anmeldung bis zur vollständigen Einrichtung.
              </p>

              <Link href="/neukunde/gruendung" style={primaryButton}>
                Gründung starten
              </Link>
            </div>

            {/* Bestehendes Unternehmen */}
            <div
              style={{
                flex: '1',
                minWidth: '260px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                height: '100%'
              }}
            >
              <h3 style={{ marginBottom: '10px' }}>
                Bestehendes Unternehmen
              </h3>

              <p
                style={{
                  fontSize: '14px',
                  color: '#667085',
                  marginBottom: '20px'
                }}
              >
                Sie benötigen Unterstützung in der Buchhaltung, Lohnabrechnung
                oder Unternehmensberatung? Starten Sie hier die digitale Aufnahme.
              </p>

              <Link href="/neukunde/bestand" style={secondaryButton}>
                Bereich auswählen
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
