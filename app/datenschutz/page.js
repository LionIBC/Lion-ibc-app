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
          maxWidth: '920px',
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
            Calle Clemente Jordan 6, 2C
            <br />
            35400 Arucas, Las Palmas
            <br />
            Spain
            <br />
            E-Mail: info@lion-ibc.com
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
          Datenschutzerklärung
        </h1>

        <p style={paragraph}>
          Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Wir verarbeiten
          Ihre Daten ausschließlich im Rahmen der gesetzlichen Vorgaben und nur
          soweit dies für die Bearbeitung Ihrer Anfrage, die Durchführung der
          beauftragten Leistungen sowie die Kommunikation mit Ihnen erforderlich ist.
        </p>

        <Section title="1. Verantwortlicher">
          <p style={sectionText}>
            Lion International Business Consulting SLU
            <br />
            Calle Clemente Jordan 6, 2C
            <br />
            35400 Arucas, Las Palmas
            <br />
            Spain
            <br />
            E-Mail: info@lion-ibc.com
          </p>
        </Section>

        <Section title="2. Zweck der Verarbeitung">
          <p style={sectionText}>
            Wir verarbeiten Ihre personenbezogenen Daten insbesondere zu folgenden
            Zwecken:
          </p>
          <ul style={listStyle}>
            <li>Bearbeitung Ihrer Anfrage und Kontaktaufnahme</li>
            <li>Vorbereitung und Durchführung von Unternehmensgründungen</li>
            <li>Abstimmung mit Notaren, Behörden und weiteren beteiligten Stellen</li>
            <li>Erstellung, Verwaltung und Dokumentation von Unterlagen</li>
            <li>interne Ablage, Nachverfolgung und Kommunikation im Mandatsverhältnis</li>
          </ul>
        </Section>

        <Section title="3. Verarbeitete Daten">
          <p style={sectionText}>
            Je nach Anfrage und Formular verarbeiten wir insbesondere folgende Daten:
          </p>
          <ul style={listStyle}>
            <li>Vor- und Nachname</li>
            <li>Telefonnummer und E-Mail-Adresse</li>
            <li>Angaben zum Unternehmen oder Gründungsvorhaben</li>
            <li>Adress- und Registrierungsdaten</li>
            <li>hochgeladene Dokumente und Nachweise</li>
            <li>digitale Bestätigungen und Unterschriften</li>
          </ul>
        </Section>

        <Section title="4. Rechtsgrundlagen">
          <p style={sectionText}>
            Die Verarbeitung erfolgt insbesondere zur Durchführung vorvertraglicher
            Maßnahmen und zur Erfüllung eines Vertrags, soweit Sie uns mit der
            Bearbeitung Ihrer Anfrage oder mit Gründungs- und Beratungsleistungen
            beauftragen. Soweit erforderlich, kann eine Verarbeitung auch auf Ihrer
            Einwilligung beruhen. Die DSGVO sieht hierfür entsprechende
            Rechtsgrundlagen vor.  [oai_citation:1‡Eur-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng?utm_source=chatgpt.com)
          </p>
        </Section>

        <Section title="5. Empfänger der Daten">
          <p style={sectionText}>
            Ihre Daten werden nur an Empfänger weitergegeben, soweit dies zur
            Durchführung der beauftragten Leistungen erforderlich ist. Dazu können
            insbesondere Notare, Behörden, Steuerberater, Buchhaltungsstellen,
            Sozialversicherungsträger oder sonstige im Einzelfall beteiligte Stellen
            gehören.
          </p>
        </Section>

        <Section title="6. Speicherdauer">
          <p style={sectionText}>
            Wir speichern personenbezogene Daten nur so lange, wie dies für die
            Bearbeitung Ihrer Anfrage, die Durchführung der beauftragten Leistungen
            oder aufgrund gesetzlicher Aufbewahrungspflichten erforderlich ist.
          </p>
        </Section>

        <Section title="7. Ihre Rechte">
          <p style={sectionText}>
            Sie haben nach den geltenden Datenschutzvorschriften insbesondere das
            Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Widerspruch sowie – soweit anwendbar – auf
            Datenübertragbarkeit. Außerdem können Sie eine erteilte Einwilligung
            jederzeit mit Wirkung für die Zukunft widerrufen.  [oai_citation:2‡aepd.es](https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos?utm_source=chatgpt.com)
          </p>
        </Section>

        <Section title="8. Beschwerderecht">
          <p style={sectionText}>
            Sie haben zudem das Recht, sich bei einer zuständigen
            Datenschutzaufsichtsbehörde zu beschweren, wenn Sie der Auffassung sind,
            dass die Verarbeitung Ihrer personenbezogenen Daten nicht rechtmäßig
            erfolgt.  [oai_citation:3‡aepd.es](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion?utm_source=chatgpt.com)
          </p>
        </Section>

        <Section title="9. Pflichtangaben im Formular">
          <p style={sectionText}>
            Bestimmte Angaben in unseren Formularen sind erforderlich, damit wir
            Ihre Anfrage bearbeiten oder die gewünschten Leistungen durchführen
            können. Pflichtfelder sind entsprechend gekennzeichnet.
          </p>
        </Section>

        <Section title="10. Digitale Bestätigung">
          <p style={sectionText}>
            Soweit in unseren Formularen eine digitale Bestätigung,
            Datenschutzerklärung, Vollmacht oder Unterschrift vorgesehen ist, dient
            dies der ordnungsgemäßen Dokumentation und der Durchführung des
            beauftragten Vorgangs.
          </p>
        </Section>

        <div style={noticeBox}>
          Stand: {new Date().toLocaleDateString('de-DE')}
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={sectionBox}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

const paragraph = {
  lineHeight: 1.85,
  color: '#475467',
  fontSize: '16px',
  marginBottom: '18px'
};

const sectionBox = {
  marginTop: '28px'
};

const sectionTitle = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#101828',
  marginBottom: '10px'
};

const sectionText = {
  lineHeight: 1.8,
  color: '#475467',
  fontSize: '15px'
};

const listStyle = {
  marginTop: '10px',
  paddingLeft: '22px',
  color: '#475467',
  lineHeight: 1.8,
  fontSize: '15px'
};

const noticeBox = {
  marginTop: '34px',
  padding: '14px 16px',
  borderRadius: '12px',
  background: '#f8f9fc',
  border: '1px solid #e4e7ec',
  color: '#475467',
  fontSize: '14px',
  lineHeight: 1.7
};
