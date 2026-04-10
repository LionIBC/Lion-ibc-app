export default function VollmachtPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f5ef',
        padding: '40px 20px'
      }}
    >
      <div style={container}>
        <img
          src="/logo.png"
          alt="Logo"
          style={{ height: '120px', marginBottom: '20px' }}
        />

        <h1 style={title}>Vollmachten</h1>

        <p style={subtitle}>
          Je nach Leistungsbereich gelten unterschiedliche Vollmachten. Nachfolgend finden Sie alle relevanten Vollmachten im Überblick.
        </p>

        {/* ===================== */}
        {/* GRÜNDUNG */}
        {/* ===================== */}

        <Section title="Vollmacht Unternehmensgründung">
          <p>
            Diese Vollmacht gilt für die Durchführung von Unternehmensgründungen,
            insbesondere Notartermine, Gewerbeanmeldung, steuerliche Erfassung und
            weitere organisatorische Schritte.
          </p>
        </Section>

        {/* ===================== */}
        {/* BERATUNG */}
        {/* ===================== */}

        <Section title="Vollmacht Beratung / FiBu / Lohn">
          <p>
            Diese Vollmacht umfasst die Zusammenarbeit in den Bereichen
            Finanzbuchhaltung, Lohnabrechnung sowie Unternehmensberatung.
          </p>
        </Section>

        {/* ===================== */}
        {/* POST */}
        {/* ===================== */}

        <Section title="Post- und Empfangsvollmacht">
          <p>
            Diese Vollmacht berechtigt zur Entgegennahme, Bearbeitung und
            Weiterleitung von Post im Rahmen der Geschäftsadresse und des
            Virtual Office.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <div style={section}>
      <h2 style={sectionTitle}>{title}</h2>
      <div style={sectionText}>{children}</div>
    </div>
  );
}

const container = {
  maxWidth: '900px',
  margin: '0 auto',
  background: '#fff',
  borderRadius: '20px',
  padding: '40px',
  border: '1px solid #e5e7eb'
};

const title = {
  fontSize: '36px',
  fontWeight: '700',
  marginBottom: '10px'
};

const subtitle = {
  fontSize: '16px',
  color: '#667085',
  marginBottom: '30px'
};

const section = {
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #e5e7eb'
};

const sectionTitle = {
  fontSize: '22px',
  marginBottom: '10px'
};

const sectionText = {
  fontSize: '15px',
  color: '#475467',
  lineHeight: 1.7
};
