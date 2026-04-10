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
              Wählen Sie den passenden Bereich
            </div>
          </div>
        </div>

        {/* HERO TEXT */}
        <section className="card">
          <h1 className="hero-title">
            Starten Sie Ihre Zusammenarbeit
          </h1>

          <p className="hero-text">
            Wählen Sie den passenden Bereich für Ihr Anliegen. 
            Anschließend führen wir Sie Schritt für Schritt durch die digitale Aufnahme.
          </p>
        </section>

        {/* AUSWAHL */}
        <section className="features">

          <Card
            title="Unternehmensgründung"
            text="Sie möchten ein Unternehmen gründen? Starten Sie hier den vollständigen digitalen Gründungsprozess."
            link="/neukunde/gruendung"
            button="Gründung starten"
          />

          <Card
            title="Beratung & laufende Betreuung"
            text="Für bestehende Unternehmen: Buchhaltung, Lohnabrechnung und individuelle Beratung."
            link="/neukunde/beratung"
            button="Bereich auswählen"
          />

          <Card
            title="Geschäftsadresse & Virtual Office"
            text="Nutzen Sie unsere Geschäftsadresse inklusive Postempfang und Weiterleitung."
            link="/neukunde/geschaeftsadresse"
            button="Jetzt starten"
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
