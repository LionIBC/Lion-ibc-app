import Link from 'next/link';

export default function NeukundePage() {
  return (
    <main className="page-bg">
      <div className="container">

        {/* HEADER */}
        <div className="header">
          <img src="/logo.png" className="logo" />

          <div>
            <div className="brand-title">
              Neukundenaufnahme
            </div>

            <div className="brand-sub">
              Übermitteln Sie Ihre Angaben strukturiert und digital
            </div>
          </div>
        </div>

        {/* EINLEITUNG */}
        <section className="card">
          <h1 className="hero-title">
            Angaben zur Zusammenarbeit
          </h1>

          <p className="hero-text">
            Über dieses System erfassen wir alle relevanten Informationen für die Zusammenarbeit.
            Die Daten werden strukturiert übermittelt und bilden die Grundlage für die weitere Bearbeitung.
          </p>

          <p className="hero-subtext">
            Bitte wählen Sie den passenden Bereich und geben Sie die erforderlichen Informationen vollständig an.
          </p>
        </section>

        {/* AUSWAHL */}
        <section className="features">

          <Card
            title="Unternehmensgründung"
            text="Erfassung aller relevanten Angaben für die Vorbereitung und Umsetzung Ihrer Unternehmensgründung."
            link="/neukunde/gruendung"
            button="Angaben erfassen"
          />

          <Card
            title="Beratung & laufende Betreuung"
            text="Übermittlung Ihrer Unternehmensdaten für Buchhaltung, Lohnabrechnung und steuerliche Betreuung."
            link="/neukunde/beratung"
            button="Daten übermitteln"
          />

          <Card
            title="Geschäftsadresse & Virtual Office"
            text="Bereitstellung der erforderlichen Informationen für Geschäftsadresse, Postempfang und Weiterleitung."
            link="/neukunde/geschaeftsadresse"
            button="Informationen bereitstellen"
          />

        </section>

      </div>
    </main>
  );
}

function Card({ title, text, link, button }) {
  return (
    <div className="feature-card" style={{ padding: '30px' }}>
      
      <h2 style={{
        fontSize: '22px',
        marginBottom: '12px'
      }}>
        {title}
      </h2>

      <p style={{
        color: '#667085',
        marginBottom: '25px',
        lineHeight: 1.6
      }}>
        {text}
      </p>

      <Link href={link} className="btn-primary">
        {button}
      </Link>

    </div>
  );
}
