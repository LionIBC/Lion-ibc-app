import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f8f5ef 0%, #f2ede4 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

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
            fontSize: '44px',
            fontWeight: '800',
            marginBottom: '18px',
            lineHeight: 1.1
          }}>
            Digitale Mandantenaufnahme & Zusammenarbeit
          </h1>

          <p style={{
            fontSize: '18px',
            color: '#475467',
            maxWidth: '700px',
            marginBottom: '25px'
          }}>
            Lion IBC bietet Ihnen eine strukturierte und digitale Möglichkeit,
            Ihre Zusammenarbeit mit uns zu starten. Alle relevanten Daten,
            Unterlagen und Informationen werden sicher und effizient übermittelt.
          </p>

          <p style={{
            fontSize: '16px',
            color: '#667085',
            maxWidth: '700px',
            marginBottom: '35px'
          }}>
            Unser System ermöglicht eine schnelle Bearbeitung, klare Prozesse
            und eine transparente Kommunikation – von der ersten Anfrage bis
            zur laufenden Betreuung.
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
              Login Mandantenportal
            </Link>
          </div>

        </section>

        {/* VORTEILE */}
        <section style={{
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>

          <Feature
            title="Strukturierte Prozesse"
            text="Alle notwendigen Angaben werden systematisch erfasst, sodass eine schnelle und fehlerfreie Bearbeitung möglich ist."
          />

          <Feature
            title="Digitale Übermittlung"
            text="Dokumente, Daten und Unterschriften werden vollständig digital übermittelt und verarbeitet."
          />

          <Feature
            title="Persönliche Betreuung"
            text="Trotz digitaler Prozesse bleibt die persönliche Beratung und individuelle Betreuung im Mittelpunkt."
          />

        </section>

        {/* FOOTER */}
        <div style={{
          marginTop: '40px',
          fontSize: '14px',
          color: '#667085'
        }}>
          Lion International Business Consulting SLU
        </div>

      </div>
    </main>
  );
}

function Feature({ title, text }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '18px',
      padding: '20px'
    }}>
      <div style={{
        fontWeight: '700',
        marginBottom: '8px'
      }}>
        {title}
      </div>

      <div style={{
        fontSize: '14px',
        color: '#667085'
      }}>
        {text}
      </div>
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
