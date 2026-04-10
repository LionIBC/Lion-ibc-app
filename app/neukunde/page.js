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

        {/* TEXT */}
        <section className="card">
          <h1 className="hero-title">
            Angaben zur Zusammenarbeit
          </h1>

          <p className="hero-text">
            Über dieses System erfassen wir alle relevanten Informationen für die Zusammenarbeit.
          </p>

          <p className="hero-subtext">
            Bitte wählen Sie den passenden Bereich.
          </p>
        </section>

        {/* KARTEN */}
        <section className="card-grid">

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
    <div className="card-item">

      <div>
        <h2 className="card-title">{title}</h2>

        <p className="card-text">
          {text}
        </p>
      </div>

      <Link href={link} className="btn-primary card-button">
        {button}
      </Link>

    </div>
  );
}
