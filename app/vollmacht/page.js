export default function VollmachtPage() {
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
          background: '#ffffff',
          border: '1px solid #e7e2d8',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#8c6b43',
              letterSpacing: '0.4px'
            }}
          >
            LION INTERNATIONAL BUSINESS CONSULTING SLU
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#667085',
              marginTop: '6px',
              lineHeight: 1.6
            }}
          >
            Calle Clemente Jordan 6, 2C<br />
            35400 Arucas, Las Palmas<br />
            Spain
          </div>
        </div>

        <div
          style={{
            height: '1px',
            background: '#d6d0c4',
            margin: '24px 0 32px'
          }}
        />

        <h1
          style={{
            fontSize: '34px',
            fontWeight: '700',
            marginBottom: '22px',
            color: '#101828'
          }}
        >
          Vollmacht
        </h1>

        <p style={paragraph}>
          Hiermit bevollmächtige ich die Lion International Business Consulting SLU,
          Calle Clemente Jordan 6, 2C, 35400 Arucas, Las Palmas, Spain, mich bzw.
          mein Unternehmen im Rahmen der Unternehmensgründung sowie der damit
          zusammenhängenden organisatorischen, administrativen und behördlichen
          Prozesse zu unterstützen, zu vertreten und die hierfür erforderlichen
          Schritte vorzubereiten und zu begleiten.
        </p>

        <p style={paragraph}>
          Die Vollmacht umfasst insbesondere die Vorbereitung und Begleitung der
          Gründung, die Abstimmung mit dem Notar, die Vorbereitung und Begleitung
          der Gewerbeanmeldung, die steuerliche Erfassung, die Kommunikation mit
          Behörden und sonstigen beteiligten Stellen sowie weitere im Zusammenhang
          mit der Unternehmensgründung erforderliche organisatorische und
          behördliche Maßnahmen.
        </p>

        <p style={paragraph}>
          Die Bevollmächtigte ist berechtigt, die für die Bearbeitung erforderlichen
          Informationen entgegenzunehmen, weiterzugeben und vorbereitende
          Erklärungen sowie Unterlagen im Rahmen des Auftrags zu erstellen und zu
          übermitteln, soweit dies zur Durchführung der Gründung und der damit
          verbundenen Prozesse erforderlich ist.
        </p>

        <p style={paragraph}>
          Ich bestätige, dass die von mir gemachten Angaben vollständig und richtig
          sind. Mir ist bekannt, dass die Lion International Business Consulting SLU
          auf Grundlage dieser Angaben tätig wird. Diese Vollmacht dient der
          Durchführung der beauftragten Leistungen im Zusammenhang mit der
          Unternehmensgründung.
        </p>

        <div style={sectionBox}>
          <h2 style={sectionTitle}>Bevollmächtigte</h2>
          <p style={sectionText}>
            Lion International Business Consulting SLU<br />
            Calle Clemente Jordan 6, 2C<br />
            35400 Arucas, Las Palmas<br />
            Spain
          </p>
        </div>

        <div style={sectionBox}>
          <h2 style={sectionTitle}>Digitale Bestätigung</h2>
          <p style={sectionText}>
            Die Bestätigung dieser Vollmacht erfolgt im Rahmen des digitalen
            Formularprozesses zusätzlich durch Ihre Auswahl im Bestätigungsfeld
            sowie durch Ihre Unterschrift im vorgesehenen Unterschriftenfeld.
          </p>
        </div>

        <div style={noticeBox}>
          Bitte lesen Sie diese Vollmacht sorgfältig. Die verbindliche Bestätigung
          erfolgt erst im Formular zur Unternehmensgründung.
        </div>
      </div>
    </main>
  );
}

const paragraph = {
  lineHeight: 1.85,
  color: '#475467',
  fontSize: '16px',
  marginBottom: '18px'
};

const sectionBox = {
  marginTop: '30px',
  padding: '22px',
  borderRadius: '16px',
  background: '#faf8f3',
  border: '1px solid #e7e2d8'
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#101828',
  marginBottom: '10px'
};

const sectionText = {
  lineHeight: 1.8,
  color: '#475467',
  fontSize: '15px'
};

const noticeBox = {
  marginTop: '30px',
  padding: '14px 16px',
  borderRadius: '12px',
  background: '#f8f9fc',
  border: '1px solid #e4e7ec',
  color: '#475467',
  fontSize: '14px',
  lineHeight: 1.7
};
