import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        padding: '48px 20px 80px'
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        <div style={{ marginBottom: '36px' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{
              height: '140px',
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
            LION IBC · Digitales Mandantenportal
          </div>

          <h1
            style={{
              fontSize: '52px',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#101828',
              margin: '0 0 18px'
            }}
          >
            Digitale Unternehmensaufnahme
            <br />
            für neue und bestehende Mandanten
          </h1>

          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.7,
              color: '#475467',
              maxWidth: '780px',
              margin: '0 0 34px'
            }}
          >
            Bitte wählen Sie den passenden Bereich. Neukunden gelangen zur
            digitalen Erstaufnahme. Bestandskunden können direkt den
            Mitarbeiterfragebogen aufrufen.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <Link href="/neukunde" style={primaryButton}>
              Neukunde starten
            </Link>

            <Link href="/mitarbeiter" style={secondaryButton}>
              Bestandskunde / Mitarbeiterformular
            </Link>
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
  background: '#ffffff',
  color: '#101828',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  border: '1px solid #d0d5dd',
  minWidth: '320px'
};

