import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8f5ef 0%, #f2ede4 100%)',
        padding: '32px 20px 64px'
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto'
        }}
      >
        {/* Header / Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '28px',
            flexWrap: 'wrap'
          }}
        >
          <img
            src="/logo.png"
            alt="Lion IBC Logo"
            style={{
              height: '84px',
              width: 'auto',
              display: 'block',
              objectFit: 'contain'
            }}
          />

          <div>
            <div
              style={{
                fontSize: '30px',
                lineHeight: 1.05,
                fontWeight: '800',
                letterSpacing: '0.5px',
                color: '#101828'
              }}
            >
              LION INTERNATIONAL
            </div>

            <div
              style={{
                fontSize: '15px',
                color: '#8c6b43',
                letterSpacing: '2.4px',
                marginTop: '6px'
              }}
            >
              BUSINESS CONSULTING
            </div>
          </div>
        </div>

        <div
          style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, #d8d2c6, transparent)',
            marginBottom: '26px'
          }}
        />

        {/* Hero */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e7e2d8',
            borderRadius: '28px',
            padding: '44px 34px',
            boxShadow: '0 16px 40px rgba(16, 24, 40, 0.06)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '8px 14px',
              borderRadius: '999px',
              border: '1px solid #d8d2c6',
              background: '#faf8f3',
              color: '#5f5a4f',
              fontSize: '13px',
              fontWeight: '700',
              letterSpacing: '0.04em',
              marginBottom: '20px'
            }}
          >
            LION IBC DIGITAL · MANDANTENPORTAL
          </div>

          <h1
            style={{
              fontSize: '54px',
              lineHeight: 1.05,
              color: '#101828',
              margin: '0 0 18px',
              fontWeight: '800',
              letterSpacing: '-1px',
              maxWidth: '920px'
            }}
          >
            Digitale Zusammenarbeit für Mandanten, Mitarbeiter und Prozesse.
          </h1>

          <p
            style={{
              fontSize: '19px',
              color: '#475467',
              maxWidth: '820px',
              margin: '0 0 22px',
              lineHeight: 1.75
            }}
          >
            Lion IBC Digital ist die zentrale Plattform für strukturierte
            Neukundenaufnahme, Datenaustausch, Dokumente, interne Abläufe und
            transparente Workflows. So entsteht Schritt für Schritt ein
            geschlossenes System für Mandantenkommunikation, Zusammenarbeit und
            operative Umsetzung.
          </p>

          <p
            style={{
              fontSize: '16px',
              color: '#667085',
              maxWidth: '820px',
              margin: '0 0 34px',
              lineHeight: 1.7
            }}
          >
            Bereits heute können neue Mandanten ihre Daten digital erfassen und
            Unterlagen sicher übermitteln. In den nächsten Schritten wird das
            Portal um Kundenakten, Statusanzeigen, interne Bearbeitung,
            Dokumentenerstellung, Chat, Dateispeicher und Workflow-Management
            erweitert.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '36px'
            }}
          >
            <Link href="/neukunde" style={primaryButton}>
              Neukunde starten
            </Link>

            <Link href="/mitarbeiter" style={secondaryButton}>
              Mitarbeiter anlegen
            </Link>

            <Link href="/vollmacht" style={secondaryButton}>
              Vollmachten ansehen
            </Link>
          </div>

          {/* Nutzen-Kacheln */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginTop: '10px'
            }}
          >
            <InfoCard
              title="Digitale Aufnahme"
              text="Mandanten erfassen Unternehmensdaten, Ansprechpartner, Unterlagen und Erklärungen strukturiert online."
            />
            <InfoCard
              title="Workflow & Status"
              text="Aufgaben, Bearbeitungsstände und Abläufe werden künftig zentral gesteuert – intern und kundenseitig sichtbar."
            />
            <InfoCard
              title="Dokumente & Austausch"
              text="Dateien, Vollmachten, Nachweise und Formulare werden sicher in einer zentralen Kundenakte gebündelt."
            />
            <InfoCard
              title="Skalierbares System"
              text="Die Plattform ist als Basis für CRM, Chat, Workflows, Speicher und interne Tools konzipiert."
            />
          </div>
        </section>

        {/* Bereiche */}
        <section
          style={{
            marginTop: '26px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}
        >
          <FeatureCard
            eyebrow="NEUKUNDEN"
            title="Digitale Aufnahme neuer Mandanten"
            text="Neue Mandanten können ihre Daten strukturiert erfassen, Unterlagen hochladen, Vollmachten bestätigen und die Zusammenarbeit digital starten."
            buttonText="Zum Neukundenbereich"
            href="/neukunde"
            primary
          />

          <FeatureCard
            eyebrow="BESTANDSKUNDEN"
            title="Mitarbeiter- und Prozessformulare"
            text="Bestehende Mandanten übermitteln Mitarbeiterdaten, Änderungsinformationen und weitere Angaben digital an Ihr Team."
            buttonText="Zum Mitarbeiterbereich"
            href="/mitarbeiter"
          />

          <FeatureCard
            eyebrow="AUSBLICK"
            title="Mandantenportal mit Workflow-Management"
            text="Als nächster Ausbau folgt ein geschlossenes Portal mit Kundenakte, Chat, Dokumentenerstellung, Speicher und internen Bearbeitungsprozessen."
            buttonText="Vollmachten ansehen"
            href="/vollmacht"
          />
        </section>

        {/* Vision */}
        <section
          style={{
            marginTop: '26px',
            background: '#fffdfa',
            border: '1px solid #e7e2d8',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 10px 30px rgba(16, 24, 40, 0.04)'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '8px 14px',
              borderRadius: '999px',
              border: '1px solid #e4d8c8',
              background: '#fff8ef',
              color: '#8c6b43',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '16px'
            }}
          >
            STRATEGIE & SYSTEMAUFBAU
          </div>

          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '32px',
              lineHeight: 1.15,
              color: '#101828'
            }}
          >
            Der nächste Entwicklungsschritt ist ein geschlossenes System statt einzelner Formulare.
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px',
              color: '#475467',
              fontSize: '15px',
              lineHeight: 1.75
            }}
          >
            <div>
              <strong style={{ color: '#101828' }}>Mandantenportal</strong>
              <br />
              Kundenlogin, Uploadbereich, Dokumente, Formulare, Statusanzeige,
              Kommunikation und Nachreichungen.
            </div>

            <div>
              <strong style={{ color: '#101828' }}>Interner Workspace</strong>
              <br />
              Bearbeitungsstände, Aufgaben, Notizen, interne Freigaben,
              Dienstleister-Kommunikation und Workflow-Steuerung.
            </div>

            <div>
              <strong style={{ color: '#101828' }}>Daten & Speicher</strong>
              <br />
              Langfristig Datenbank, Dateispeicher, Archivierung und bei Bedarf
              Anbindung an eigenen Server oder externe Storage-Lösungen.
            </div>

            <div>
              <strong style={{ color: '#101828' }}>Automatisierung</strong>
              <br />
              E-Mail-Versand an Dienstleister, Dokumentengenerierung,
              Statuswechsel, Aufgabenketten und saubere Übergaben.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ title, text }) {
  return (
    <div
      style={{
        background: '#fcfaf6',
        border: '1px solid #ece5d8',
        borderRadius: '18px',
        padding: '18px'
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#101828',
          marginBottom: '8px'
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: '14px',
          color: '#667085',
          lineHeight: 1.7
        }}
      >
        {text}
      </div>
    </div>
  );
}

function FeatureCard({ eyebrow, title, text, buttonText, href, primary = false }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e7e2d8',
        borderRadius: '22px',
        padding: '26px',
        boxShadow: '0 8px 24px rgba(16, 24, 40, 0.05)'
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          color: '#8c6b43',
          marginBottom: '12px'
        }}
      >
        {eyebrow}
      </div>

      <h3
        style={{
          margin: '0 0 12px',
          fontSize: '24px',
          lineHeight: 1.2,
          color: '#101828'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: '0 0 24px',
          fontSize: '15px',
          color: '#667085',
          lineHeight: 1.75
        }}
      >
        {text}
      </p>

      <Link href={href} style={primary ? primaryButton : secondaryButton}>
        {buttonText}
      </Link>
    </div>
  );
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px 24px',
  borderRadius: '999px',
  background: '#8c6b43',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '16px',
  border: '1px solid #8c6b43',
  minWidth: '220px'
};

const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px 24px',
  borderRadius: '999px',
  background: '#ffffff',
  color: '#101828',
  textDecoration: 'none',
  fontWeight: '700',
  fontSize: '16px',
  border: '1px solid #d0d5dd',
  minWidth: '220px'
};
