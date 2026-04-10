import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8f5ef 0%, #f2ede4 100%)',
        padding: '40px 20px'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <img src="/logo.png" style={{ height: '90px' }} />

          <div>
            <div style={{
              fontSize: '28px',
              fontWeight: '800',
              letterSpacing: '1px'
            }}>
              LION INTERNATIONAL
            </div>

            <div style={{
              fontSize: '14px',
              color: '#8c6b43',
              letterSpacing: '2px'
            }}>
              BUSINESS CONSULTING
            </div>
          </div>
        </div>

        {/* HERO */}
        <section style={{
          background: '#ffffff',
          border: '1px solid #e7e2d8',
          borderRadius: '28px',
          padding: '50px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.05)'
        }}>
          
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '20px',
            lineHeight: 1.1
          }}>
            Digitale Zusammenarbeit mit Lion IBC
          </h1>

          <p style={{
            fontSize: '18px',
            color: '#475467',
            maxWidth: '700px',
            marginBottom: '30px'
          }}>
            Starten Sie Ihre Zusammenarbeit einfach und strukturiert online. 
            Übermitteln Sie alle relevanten Informationen digital – wir kümmern uns um den Rest.
          </p>

          {/* BUTTONS */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <Link href="/neukunde" style={primaryButton}>
              Neukunde werden
            </Link>

            <Link href="/mitarbeiter" style={secondaryButton}>
              Mitarbeiter melden
            </Link>
          </div>
        </section>

        {/* LEISTUNGEN */}
        <section style={{
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          
          <Card
            title="Unternehmensgründung"
            text="Wir begleiten Sie vollständig durch den Gründungsprozess – von der Anmeldung bis zur finalen Einrichtung."
            button="Gründung starten"
            link="/neukunde/gruendung"
          />

          <Card
            title="Buchhaltung & Lohn"
            text="Digitale Zusammenarbeit für laufende Buchhaltung, Lohnabrechnung und steuerliche Betreuung."
            button="Bereich auswählen"
            link="/neukunde/beratung"
          />

          <Card
            title="Bestehende Mandanten"
            text="Übermitteln Sie Daten, Mitarbeiter oder Unterlagen schnell und sicher digital an unser Team."
            button="Zum Formular"
            link="/mitarbeiter"
          />

        </section>

        {/* FOOTER NOTE */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#667085'
        }}>
          Lion International Business Consulting
        </div>

      </div>
    </main>
  );
}

function Card({ title, text, button, link }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.04)'
    }}>
      <h3 style={{ marginBottom: '10px' }}>{title}</h3>

      <p style={{
        fontSize: '14px',
        color: '#667085',
        marginBottom: '20px'
      }}>
        {text}
      </p>

      <Link href={link} style={primarySmallButton}>
        {button}
      </Link>
    </div>
  );
}

const primaryButton = {
  padding: '16px 28px',
  borderRadius: '999px',
  background: '#8c6b43',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: '700'
};

const secondaryButton = {
  padding: '16px 28px',
  borderRadius: '999px',
  background: '#ffffff',
  border: '1px solid #d0d5dd',
  color: '#101828',
  textDecoration: 'none',
  fontWeight: '700'
};

const primarySmallButton = {
  padding: '12px 18px',
  borderRadius: '999px',
  background: '#8c6b43',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '14px'
};
