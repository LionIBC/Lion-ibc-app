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
          maxWidth: '950px',
          margin: '0 auto',
          background: '#ffffff',
          border: '1px solid #e7e2d8',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{ height: '120px', width: 'auto', display: 'block' }}
          />
        </div>

        <h1
          style={{
            fontSize: '34px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#101828'
          }}
        >
          Vollmachten
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: '#475467',
            lineHeight: 1.8,
            marginBottom: '32px'
          }}
        >
          Nachfolgend finden Sie die Vollmachtstexte für die jeweiligen
          Leistungsbereiche. Die verbindliche Bestätigung erfolgt jeweils im
          entsprechenden Formular zusätzlich durch Auswahl des Bestätigungsfeldes
          und durch Ihre digitale Unterschrift.
        </p>

        <Section title="Vollmacht Unternehmensgründung">
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
        </Section>

        <Section title="Vollmacht Beratung / Finanzbuchhaltung / Lohn / Unternehmensberatung">
          <p style={paragraph}>
            Hiermit bevollmächtige ich die Lion International Business Consulting SLU,
            Calle Clemente Jordan 6, 2C, 35400 Arucas, Las Palmas, Spain, mich bzw.
            mein Unternehmen im Rahmen der beauftragten Dienstleistungen in den
            Bereichen Finanzbuchhaltung, Lohnabrechnung sowie Unternehmensberatung
            zu unterstützen und zu vertreten.
          </p>

          <p style={paragraph}>
            Die Vollmacht umfasst insbesondere die Kommunikation mit Behörden, die
            Vorbereitung und Übermittlung von Unterlagen und Meldungen sowie die
            Abstimmung mit Steuerberatern, Sozialversicherungsträgern und weiteren
            beteiligten Stellen, soweit dies für die Durchführung der beauftragten
            Leistungen erforderlich ist.
          </p>

          <p style={paragraph}>
            Die Bevollmächtigte ist berechtigt, die zur Bearbeitung erforderlichen
            Informationen entgegenzunehmen, weiterzugeben sowie vorbereitende
            Maßnahmen und organisatorische Schritte im Rahmen der beauftragten
            Leistungen durchzuführen.
          </p>

          <p style={paragraph}>
            Ich bestätige, dass meine Angaben vollständig und richtig sind und dass
            die Lion International Business Consulting SLU auf Grundlage dieser
            Angaben tätig werden darf.
          </p>
        </Section>

        <Section title="Post- und Empfangsvollmacht für Geschäftsadresse / Virtual Office">
          <p style={paragraph}>
            Hiermit bevollmächtige ich die Lion International Business Consulting SLU,
            Calle Clemente Jordan 6, 2C, 35400 Arucas, Las Palmas, Spain, im Rahmen
            der Nutzung einer Geschäftsadresse bzw. eines Virtual Office zur
            Entgegennahme, Bearbeitung und Weiterleitung eingehender Postsendungen
            für mich bzw. mein Unternehmen.
          </p>

          <p style={paragraph}>
            Die Vollmacht umfasst insbesondere die Annahme gewöhnlicher Post,
            behördlicher Schreiben sowie sonstiger geschäftlicher Korrespondenz an
            der zur Verfügung gestellten Geschäftsadresse sowie die organisatorische
            Weiterleitung im Rahmen der vereinbarten Leistungen.
          </p>

          <p style={paragraph}>
            Soweit erforderlich, ist die Bevollmächtigte berechtigt, Postsendungen
            intern zu erfassen, zu dokumentieren und im Rahmen der vereinbarten
            Leistungen digital oder physisch weiterzuleiten.
          </p>

          <p style={paragraph}>
            Ich bestätige, dass die Angaben zu meiner Person bzw. meinem Unternehmen
            vollständig und richtig sind und dass die Lion International Business
            Consulting SLU auf Grundlage dieser Angaben tätig werden darf.
          </p>
        </Section>

        <div
          style={{
            marginTop: '36px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#f8f9fc',
            border: '1px solid #e4e7ec',
            color: '#475467',
            fontSize: '14px',
            lineHeight: 1.7
          }}
        >
          Hinweis: Die rechtsverbindliche Bestätigung der jeweils einschlägigen
          Vollmacht erfolgt direkt im zugehörigen Formular durch Bestätigung und
          digitale Unterschrift.
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section
      style={{
        marginTop: '32px',
        paddingTop: '28px',
        borderTop: '1px solid #e5e7eb'
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '16px',
          color: '#101828'
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const paragraph = {
  lineHeight: 1.85,
  color: '#475467',
  fontSize: '15px',
  marginBottom: '16px'
};

