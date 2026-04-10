import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f8f5ef 0%, #f2ede4 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '40px'
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
          boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          
          <h1 style={{
            fontSize: '42px',
            fontWeight: '800',
            marginBottom: '20px'
          }}>
            Digitale Zusammenarbeit
          </h1>

          <p style={{
            fontSize: '18px',
            color: '#475467',
            marginBottom: '40px'
          }}>
            Starten Sie Ihre Zusammenarbeit oder greifen Sie auf Ihr Mandantenportal zu.
          </p>

          {/* BUTTONS */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <Link href="/neukunde" style={primaryButton}>
              Neukunde werden
            </Link>

            <Link href="/mitarbeiter" style={secondaryButton}>
              Login Mandantenportal
            </Link>
          </div>

        </section>

      </div>
    </main>
  );
}

const primaryButton = {
  padding: '18px 32px',
  borderRadius: '999px',
  background: '#8c6b43',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '16px',
  minWidth: '260px',
  textAlign: 'center'
};

const secondaryButton = {
  padding: '18px 32px',
  borderRadius: '999px',
  background: '#ffffff',
  border: '1px solid #d0d5dd',
  color: '#101828',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '16px',
  minWidth: '260px',
  textAlign: 'center'
};
