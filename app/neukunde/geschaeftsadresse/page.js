import Link from 'next/link';

export default function GeschaeftsadresseLandingPage() {
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
            Geschäftsadresse & Virtuelles Office
          </div>

          <h1
            style={{
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#101828'
            }}
          >
            Digitale Aufnahme für Geschäftsadresse und Virtuelles Office
          </h1>

          <p
            style={{
              color: '#475467',
              marginBottom: '20px',
              fontSize: '16px',
              lineHeight: 1.6,
              maxWidth: '900px'
            }}
          >
            Über dieses Formular erfassen wir alle relevanten Daten für die Einrichtung
            einer Geschäftsadresse oder eines virtuellen Office. Zusätzlich wird die
            Postempfangsvollmacht digital bestätigt und unterschrieben.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginTop: '30px'
            }}
          >
            <div
              style={{
                background: '#fcfcfd',
                border: '1px solid #eaecf0',
                borderRadius: '18px',
                padding: '24px'
              }}
            >
              <h3 style={{ marginTop: 0, color: '#101828' }}>Geschäftsadresse</h3>
              <p style={{ color: '#667085', lineHeight: 1.6 }}>
                Für Unternehmen, die eine repräsentative Geschäftsadresse benötigen.
              </p>

              <Link
                href="/neukunde/geschaeftsadresse/formular?leistung=geschaeftsadresse"
                style={buttonStyle}
              >
                Angaben erfassen
              </Link>
            </div>

            <div
              style={{
                background: '#fcfcfd',
                border: '1px solid #eaecf0',
                borderRadius: '18px',
                padding: '24px'
              }}
            >
              <h3 style={{ marginTop: 0, color: '#101828' }}>Virtuelles Office</h3>
              <p style={{ color: '#667085', lineHeight: 1.6 }}>
                Für Unternehmen, die neben der Adresse auch organisatorische Leistungen
                rund um Post und Erreichbarkeit nutzen möchten.
              </p>

              <Link
                href="/neukunde/geschaeftsadresse/formular?leistung=virtuelles_office"
                style={buttonStyle}
              >
                Angaben erfassen
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const buttonStyle = {
  display: 'inline-block',
  marginTop: '20px',
  padding: '14px 20px',
  borderRadius: '12px',
  background: '#8c6b43',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: '600'
};
