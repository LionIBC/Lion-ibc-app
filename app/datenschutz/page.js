export default function DatenschutzPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f5ef',
        padding: '40px 20px'
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e7e2d8',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
        }}
      >
        <h1 style={{ fontSize: '34px', marginBottom: '20px', color: '#101828' }}>
          Datenschutzerklärung
        </h1>

        <p style={{ lineHeight: 1.7, color: '#475467' }}>
          Wir verarbeiten Ihre personenbezogenen Daten ausschließlich zur Bearbeitung Ihrer Anfrage,
          zur Durchführung der Unternehmensgründung sowie zur Kommunikation mit Ihnen im Rahmen
          unserer Beratungs- und Gründungsleistungen.
        </p>

        <h2 style={{ marginTop: '28px', color: '#101828' }}>Verantwortlicher</h2>
        <p style={{ lineHeight: 1.7, color: '#475467' }}>
          Lion IBC
          <br />
          Business Consulting
          <br />
          E-Mail: info@lion-ibc.com
        </p>

        <h2 style={{ marginTop: '28px', color: '#101828' }}>Zweck der Verarbeitung</h2>
        <p style={{ lineHeight: 1.7, color: '#475467' }}>
          Die von Ihnen eingegebenen Daten werden verwendet, um Ihre Anfrage zu bearbeiten,
          Gründungsunterlagen vorzubereiten, behördliche Prozesse zu begleiten und die Kommunikation
          mit Ihnen durchzuführen.
        </p>

        <h2 style={{ marginTop: '28px', color: '#101828' }}>Empfänger der Daten</h2>
        <p style={{ lineHeight: 1.7, color: '#475467' }}>
          Ihre Daten werden nur an Stellen weitergegeben, soweit dies zur Durchführung der
          beauftragten Leistungen erforderlich ist, zum Beispiel an Notare, Behörden oder weitere
          beteiligte Stellen im Rahmen der Gründung.
        </p>

        <h2 style={{ marginTop: '28px', color: '#101828' }}>Speicherdauer</h2>
        <p style={{ lineHeight: 1.7, color: '#475467' }}>
          Ihre Daten werden nur so lange gespeichert, wie dies für die Bearbeitung Ihrer Anfrage und
          die Durchführung der beauftragten Leistungen erforderlich ist oder gesetzliche
          Aufbewahrungspflichten bestehen.
        </p>

        <h2 style={{ marginTop: '28px', color: '#101828' }}>Ihre Rechte</h2>
        <p style={{ lineHeight: 1.7, color: '#475467' }}>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung
          sowie auf Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten, soweit die
          gesetzlichen Voraussetzungen vorliegen.
        </p>
      </div>
    </main>
  );
}

